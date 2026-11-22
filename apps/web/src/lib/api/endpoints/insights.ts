import type {
  DashboardOverviewDto,
  DashboardPeriod,
  ReconciliationSummaryDto,
  SimulatorRunRequest,
  SimulatorRunResult,
} from '@paritas/shared';
import { apiDownload, apiRequest, type DownloadedFile } from '../api-client';
import type { ExceptionReportParams, ReportRangeParams } from './params';

export const getDashboard = (
  period: DashboardPeriod,
  timeZone: string,
  signal?: AbortSignal,
): Promise<DashboardOverviewDto> =>
  apiRequest('/dashboard/overview', { query: { period, timeZone }, signal });

export const getSummaryReport = (
  params: ReportRangeParams,
  signal?: AbortSignal,
): Promise<ReconciliationSummaryDto> =>
  apiRequest('/reports/reconciliation-summary', { query: { ...params, format: 'json' }, signal });

export const downloadSummaryReport = (
  params: ReportRangeParams,
  format: 'csv' | 'pdf',
): Promise<DownloadedFile> =>
  apiDownload(
    '/reports/reconciliation-summary',
    { query: { ...params, format } },
    `paritas-reconciliation-summary.${format}`,
  );

export const downloadExceptionReport = (
  params: ExceptionReportParams,
  format: 'csv' | 'pdf',
): Promise<DownloadedFile> =>
  apiDownload(
    '/reports/exceptions',
    { query: { ...params, format } },
    `paritas-exceptions.${format}`,
  );

export const runSimulation = (body: SimulatorRunRequest): Promise<SimulatorRunResult> =>
  apiRequest('/simulator/runs', { method: 'POST', body });
