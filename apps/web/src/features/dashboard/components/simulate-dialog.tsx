'use client';

import { MAX_SIMULATED_PAYMENTS } from '@paritas/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/api/api-error';
import { runSimulation } from '@/lib/api/endpoints/insights';

const ANOMALY_OPTIONS = [0.1, 0.3, 0.5] as const;
const DEFAULTS = { count: 50, anomalyRate: 0.3, spreadHours: 6 };

/** Admin-only, demo data: payments on both sides, some deliberately wrong, so every exception type appears. */
export const SimulateDialog = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(DEFAULTS.count);
  const [anomalyRate, setAnomalyRate] = useState<number>(DEFAULTS.anomalyRate);
  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_SIMULATED_PAYMENTS;

  const run = useMutation({
    mutationFn: () =>
      runSimulation({
        count,
        anomalyRate,
        spreadHours: DEFAULTS.spreadHours,
        gateway: 'synthetic',
      }),
    onSuccess: (result) => {
      setOpen(false);
      toast.success(`Simulated ${result.payments} payments`, {
        description: 'Matching runs in the background; the dashboard updates within a minute.',
      });
      void queryClient.invalidateQueries();
    },
    onError: (error) =>
      toast.error('Simulation did not run', { description: errorMessage(error, 'Try again.') }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FlaskConical data-icon="inline-start" />
          Simulate payments
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simulate payments</DialogTitle>
          <DialogDescription>
            Generates test-mode Stripe events and matching ledger entries over the last 6 hours. A
            share of them carry realistic problems: missing, duplicated, mismatched or conflicting
            records.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="sim-count">Payments</FieldLabel>
            <Input
              id="sim-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SIMULATED_PAYMENTS}
              value={Number.isNaN(count) ? '' : count}
              onChange={(event) => setCount(event.target.valueAsNumber)}
              className="tabular-nums"
            />
            <FieldDescription>1 to {MAX_SIMULATED_PAYMENTS}.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel id="sim-anomaly">Share with a problem</FieldLabel>
            <div role="radiogroup" aria-labelledby="sim-anomaly" className="flex gap-2">
              {ANOMALY_OPTIONS.map((rate) => (
                <Button
                  key={rate}
                  type="button"
                  role="radio"
                  aria-checked={anomalyRate === rate}
                  variant={anomalyRate === rate ? 'default' : 'outline'}
                  onClick={() => setAnomalyRate(rate)}
                >
                  {rate * 100}%
                </Button>
              ))}
            </div>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => run.mutate()} disabled={!valid || run.isPending}>
            {run.isPending && <Spinner data-icon="inline-start" />}
            Run simulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
