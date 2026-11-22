import { Injectable } from '@nestjs/common';
import { RawEventSweeper } from '../ingestion/raw-event-sweeper.service.js';
import { ReconciliationSweeper } from '../reconciliation/reconciliation-sweeper.service.js';
import { SWEEP_ON_TRAFFIC_EVERY_MS } from './sweeps.constants.js';

export interface SweepResult {
  /** Stuck raw events processed again. */
  rawEvents: number;
  /** Unmatched transactions re-evaluated (time-based checks: MISSING, DELAYED, EXCLUDED). */
  transactions: number;
}

/**
 * The periodic sweeps, for the inline job runner, which has no BullMQ scheduler:
 * started by app traffic (at most once a minute per instance) and by a daily
 * cron. Running them twice at once is safe (the engine locks per currency and is
 * idempotent), but one instance never starts a second run while one is in flight.
 */
@Injectable()
export class SweepRunner {
  private inFlight: Promise<SweepResult> | null = null;
  private lastStartedAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly rawEvents: RawEventSweeper,
    private readonly reconciliation: ReconciliationSweeper,
  ) {}

  /** Runs both sweeps now, or joins the run already in flight on this instance. */
  run(): Promise<SweepResult> {
    if (!this.inFlight) {
      this.lastStartedAt = Date.now();
      this.inFlight = this.sweepAll().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  /** Starts a run when the last one began long enough ago; null when it is not due. */
  runIfDue(): Promise<SweepResult> | null {
    const due = !this.inFlight && Date.now() - this.lastStartedAt >= SWEEP_ON_TRAFFIC_EVERY_MS;
    return due ? this.run() : null;
  }

  /** Raw events first: a recovered event can create the counterpart a sweep is waiting for. */
  private async sweepAll(): Promise<SweepResult> {
    const rawEvents = await this.rawEvents.sweep();
    const transactions = await this.reconciliation.sweep();
    return { rawEvents, transactions };
  }
}
