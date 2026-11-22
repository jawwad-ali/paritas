import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type Paginated,
  type TransactionDetailDto,
  type TransactionDto,
} from '@paritas/shared';
import { uuidSchema } from '../../common/validation/common.schemas.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

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
}
