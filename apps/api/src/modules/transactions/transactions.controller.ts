import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type MatchCandidateDto,
  type Paginated,
  type TransactionDetailDto,
  type TransactionDto,
} from '@paritas/shared';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { MatchCandidatesService } from '../reconciliation/match-candidates.service.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactions: TransactionsService,
    private readonly candidates: MatchCandidatesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Normalised transactions from every source (newest first)' })
  list(
    @Query({ schema: listTransactionsQuerySchema }) query: ListTransactionsQuery,
  ): Promise<Paginated<TransactionDto>> {
    return this.transactions.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One transaction with its latest raw source event' })
  get(@Param('id', { schema: uuidSchema }) id: string): Promise<TransactionDetailDto> {
    return this.transactions.getById(id);
  }

  @Get(':id/match-candidates')
  @ApiOperation({
    summary: 'Unmatched records on the other side that could be the same payment, best first',
  })
  matchCandidates(@Param('id', { schema: uuidSchema }) id: string): Promise<MatchCandidateDto[]> {
    return this.candidates.forTransaction(id);
  }
}
