import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateUserRequest,
  ListUsersQuery,
  Paginated,
  UpdateUserRequest,
  UserDto,
} from '@paritas/shared';
import { type Prisma, RefreshTokenRevokeReason, type User } from '../../generated/prisma/client.js';
import { isUniqueConstraintViolation } from '../../common/database/prisma-errors.js';
import { toPaginated, toSkipTake } from '../../common/pagination/pagination.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { PasswordHasher } from '../auth/password/password-hasher.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { toUserDto } from './users.mapper.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordHasher,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
  ) {}

  /** Includes the password hash: for authentication only, never return it to a client. */
  findByEmailWithCredentials(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getById(id: string): Promise<UserDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    return toUserDto(user);
  }

  async list(query: ListUsersQuery): Promise<Paginated<UserDto>> {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      isActive: query.isActive,
      ...(query.search && {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Rows and count run in parallel on separate connections: under READ COMMITTED a
    // batch transaction would add no consistency, only serialise them on one.
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...toSkipTake(query),
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginated(users.map(toUserDto), total, query);
  }

  async create(request: CreateUserRequest): Promise<UserDto> {
    const passwordHash = await this.passwords.hash(request.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: request.email,
            name: request.name,
            role: request.role,
            passwordHash,
          },
        });
        const dto = toUserDto(user);
        await this.audit.record(
          {
            action: AUDIT_ACTIONS.USER_CREATED,
            entityType: AUDIT_ENTITY_TYPES.USER,
            entityId: user.id,
            changes: { after: { ...dto } },
          },
          tx,
        );
        return dto;
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new ConflictException(`A user with email ${request.email} already exists.`);
      }
      throw error;
    }
  }

  async update(id: string, request: UpdateUserRequest, actor: RequestActor): Promise<UserDto> {
    if (id === actor.id && (request.role !== undefined || request.isActive === false)) {
      // Prevents an admin from locking themselves (and possibly everyone) out.
      throw new ForbiddenException('You cannot change your own role or deactivate yourself.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`User ${id} not found.`);
      }

      const updated = await tx.user.update({
        where: { id },
        data: { name: request.name, role: request.role, isActive: request.isActive },
      });

      if (existing.isActive && !updated.isActive) {
        await this.sessions.revokeAllForUser(id, RefreshTokenRevokeReason.USER_DEACTIVATED, tx);
      }

      const before = toUserDto(existing);
      const after = toUserDto(updated);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.USER_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.USER,
          entityId: id,
          changes: { before: { ...before }, after: { ...after } },
        },
        tx,
      );
      return after;
    });
  }
}
