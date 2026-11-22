import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ListTransactionsQuery,
  Paginated,
  TransactionDetailDto,
  TransactionDto,
} from '@paritas/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { toPaginated, toSkipTake } from '../../common/pagination/pagination.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { toTransactionDetailDto, toTransactionDto } from './transactions.mapper.js';

const buildWhere = (query: ListTransactionsQuery): Prisma.TransactionWhereInput => ({
  source: query.source ? { code: query.source } : undefined,
  status: query.status,
  reconciliationStatus: query.reconciliationStatus,
  occurredAt: { gte: query.from, lte: query.to },
  ...(query.search && {
    OR: [
      { reference: { contains: query.search, mode: 'insensitive' } },
      { externalId: { contains: query.search, mode: 'insensitive' } },
      { customerRef: { contains: query.search, mode: 'insensitive' } },
    ],
  }),
});

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTransactionsQuery): Promise<Paginated<TransactionDto>> {
    const where = buildWhere(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { source: true },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(query),
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return toPaginated(rows.map(toTransactionDto), total, query);
  }

  async getById(id: string): Promise<TransactionDetailDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { source: true, rawEvent: true },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found.`);
    }
    return toTransactionDetailDto(transaction);
  }
}
