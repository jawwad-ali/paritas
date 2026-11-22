import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type CreateUserRequest,
  createUserRequestSchema,
  type ListUsersQuery,
  listUsersQuerySchema,
  type Paginated,
  type UpdateUserRequest,
  updateUserRequestSchema,
  type UserDto,
} from '@paritas/shared';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  list(
    @Query({ schema: listUsersQuerySchema }) query: ListUsersQuery,
  ): Promise<Paginated<UserDto>> {
    return this.users.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user' })
  get(@Param('id', { schema: uuidSchema }) id: string): Promise<UserDto> {
    return this.users.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  create(@Body({ schema: createUserRequestSchema }) body: CreateUserRequest): Promise<UserDto> {
    return this.users.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, role or active status' })
  update(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: updateUserRequestSchema }) body: UpdateUserRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<UserDto> {
    return this.users.update(id, body, actor);
  }
}
