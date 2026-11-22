import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type AddExceptionNoteRequest,
  addExceptionNoteRequestSchema,
  type AssignExceptionRequest,
  assignExceptionRequestSchema,
  type ChangeExceptionSeverityRequest,
  changeExceptionSeverityRequestSchema,
  type CloseExceptionRequest,
  closeExceptionRequestSchema,
  type ExceptionDetailDto,
  type ManualMatchRequest,
  manualMatchRequestSchema,
  type ReopenExceptionRequest,
  reopenExceptionRequestSchema,
} from '@paritas/shared';
import type { RequestActor } from '../../common/request-context/request-context.types.js';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ExceptionManualMatchService } from './exception-manual-match.service.js';
import { ExceptionTransitionsService } from './exception-transitions.service.js';
import { ExceptionWorkflowService } from './exception-workflow.service.js';

/** Every action returns the updated exception, so a client re-renders from one response. */
@ApiTags('Exceptions')
@ApiBearerAuth()
@Controller('exceptions/:id')
export class ExceptionActionsController {
  constructor(
    private readonly workflow: ExceptionWorkflowService,
    private readonly transitions: ExceptionTransitionsService,
    private readonly manualMatch: ExceptionManualMatchService,
  ) {}

  @Post('notes')
  @ApiOperation({ summary: 'Add an investigation note' })
  addNote(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: addExceptionNoteRequestSchema }) body: AddExceptionNoteRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.workflow.addNote(id, body, actor);
  }

  @Patch('assignee')
  @ApiOperation({ summary: 'Assign or unassign (officers: take unassigned or release own)' })
  assign(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: assignExceptionRequestSchema }) body: AssignExceptionRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.workflow.assign(id, body, actor);
  }

  @Patch('severity')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Change severity, with a reason' })
  changeSeverity(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: changeExceptionSeverityRequestSchema }) body: ChangeExceptionSeverityRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.workflow.changeSeverity(id, body, actor);
  }

  @Post('investigate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start investigating (self-assigns when unassigned)' })
  investigate(
    @Param('id', { schema: uuidSchema }) id: string,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.transitions.transition(id, 'investigate', {}, actor);
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve with a reason and optional notes' })
  resolve(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: closeExceptionRequestSchema }) body: CloseExceptionRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.transitions.transition(id, 'resolve', body, actor);
  }

  @Post('ignore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ignore with a reason (critical ones need a manager or admin)' })
  ignore(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: closeExceptionRequestSchema }) body: CloseExceptionRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.transitions.transition(id, 'ignore', body, actor);
  }

  @Post('reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reopen a resolved or ignored exception, with a reason' })
  reopen(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: reopenExceptionRequestSchema }) body: ReopenExceptionRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.transitions.transition(id, 'reopen', body, actor);
  }

  @Post('match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually match a gateway and a ledger record, closing the exception' })
  match(
    @Param('id', { schema: uuidSchema }) id: string,
    @Body({ schema: manualMatchRequestSchema }) body: ManualMatchRequest,
    @CurrentUser() actor: RequestActor,
  ): Promise<ExceptionDetailDto> {
    return this.manualMatch.match(id, body, actor);
  }
}
