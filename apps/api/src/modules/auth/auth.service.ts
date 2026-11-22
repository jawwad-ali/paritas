import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ChangePasswordRequest, LoginRequest, UserDto } from '@paritas/shared';
import { RefreshTokenRevokeReason, type User } from '../../generated/prisma/client.js';
import { RequestValidationException } from '../../common/errors/request-validation.exception.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../audit/audit.constants.js';
import { AuditService } from '../audit/audit.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { toRequestActor, toUserDto } from '../users/users.mapper.js';
import { UsersService } from '../users/users.service.js';
import { AUTH_ERRORS } from './auth.constants.js';
import type { IssuedSession } from './auth.types.js';
import { PasswordHasher } from './password/password-hasher.service.js';
import { AccessTokenService } from './tokens/access-token.service.js';

type LoginFailureReason = 'unknown_email' | 'wrong_password' | 'account_disabled';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
  ) {}

  async login({ email, password }: LoginRequest): Promise<IssuedSession> {
    const user = await this.users.findByEmailWithCredentials(email);
    if (!user) {
      await this.passwords.verifyAgainstDummy(password);
      await this.recordFailedLogin(email, 'unknown_email');
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
    if (!(await this.passwords.verify(user.passwordHash, password))) {
      await this.recordFailedLogin(email, 'wrong_password', user.id);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
    // Checked only after the password, so a disabled account is not revealed to guessers.
    if (!user.isActive) {
      await this.recordFailedLogin(email, 'account_disabled', user.id);
      throw new ForbiddenException(AUTH_ERRORS.ACCOUNT_DISABLED);
    }

    const { loggedIn, refreshToken } = await this.prisma.$transaction(async (tx) => {
      const token = await this.sessions.create(user.id, tx);
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.AUTH_LOGIN,
          entityType: AUDIT_ENTITY_TYPES.USER,
          entityId: user.id,
          actor: toRequestActor(user),
        },
        tx,
      );
      return { loggedIn: updated, refreshToken: token };
    });

    return this.issue(loggedIn, refreshToken);
  }

  async refresh(rawToken: string | undefined): Promise<IssuedSession> {
    if (!rawToken) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const result = await this.sessions.rotate(rawToken);
    if (result.outcome === 'reuse_detected') {
      await this.audit.record({
        action: AUDIT_ACTIONS.AUTH_REFRESH_REUSE_DETECTED,
        entityType: AUDIT_ENTITY_TYPES.USER,
        entityId: result.userId,
      });
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }
    if (result.outcome === 'invalid') {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const user = await this.users.findById(result.userId);
    if (!user?.isActive) {
      await this.sessions.revokeFamilyOf(result.token, RefreshTokenRevokeReason.USER_DEACTIVATED);
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }
    return this.issue(user, result.token);
  }

  /** Idempotent: logging out without a (valid) session is not an error. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) {
      return;
    }
    const userId = await this.sessions.revokeFamilyOf(rawToken, RefreshTokenRevokeReason.LOGOUT);
    if (!userId) {
      return;
    }
    const user = await this.users.findById(userId);
    await this.audit.record({
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      entityType: AUDIT_ENTITY_TYPES.USER,
      entityId: userId,
      actor: user ? toRequestActor(user) : undefined,
    });
  }

  /** Changes the password and signs out every other session. */
  async changePassword(
    actor: RequestActor,
    request: ChangePasswordRequest,
  ): Promise<IssuedSession> {
    const user = await this.requireActiveUser(actor.id);
    if (!(await this.passwords.verify(user.passwordHash, request.currentPassword))) {
      throw new RequestValidationException([
        { path: 'currentPassword', message: AUTH_ERRORS.CURRENT_PASSWORD_INCORRECT },
      ]);
    }
    const passwordHash = await this.passwords.hash(request.newPassword);

    const { updated, refreshToken } = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await this.sessions.revokeAllForUser(user.id, RefreshTokenRevokeReason.PASSWORD_CHANGED, tx);
      const token = await this.sessions.create(user.id, tx);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
          entityType: AUDIT_ENTITY_TYPES.USER,
          entityId: user.id,
        },
        tx,
      );
      return { updated: changed, refreshToken: token };
    });

    return this.issue(updated, refreshToken);
  }

  async me(actor: RequestActor): Promise<UserDto> {
    return toUserDto(await this.requireActiveUser(actor.id));
  }

  private async requireActiveUser(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user?.isActive) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }
    return user;
  }

  private async issue(user: User, refreshToken: string): Promise<IssuedSession> {
    const { token, expiresIn } = await this.accessTokens.sign(toRequestActor(user));
    return {
      refreshToken,
      response: { accessToken: token, expiresIn, user: toUserDto(user) },
    };
  }

  private async recordFailedLogin(
    email: string,
    reason: LoginFailureReason,
    userId?: string,
  ): Promise<void> {
    await this.audit.record({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      entityType: userId ? AUDIT_ENTITY_TYPES.USER : undefined,
      entityId: userId,
      details: { attemptedEmail: email, reason },
    });
  }
}
