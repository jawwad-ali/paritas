'use client';

import {
  type MatchingConfigDto,
  type UpdateMatchingConfigRequest,
  updateMatchingConfigRequestSchema,
} from '@paritas/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState } from '@/components/layout/error-state';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { errorMessage } from '@/lib/api/api-error';
import { updateMatchingRules } from '@/lib/api/endpoints/admin';
import { hasRole } from '@/lib/auth/roles';
import { useAuth } from '@/lib/auth/use-auth';
import { formatDateTime } from '@/lib/format/time';
import { queryKeys } from '@/lib/query/keys';
import { useMatchingRules } from '../use-admin-queries';
import { RULES, type RuleKey } from './rules.config';

type Draft = Record<RuleKey, string>;

const toDraft = (config: MatchingConfigDto): Draft =>
  Object.fromEntries(
    RULES.map((rule) => [rule.key, String(rule.toDisplay(config[rule.key]))]),
  ) as Draft;

/** The rules the engine applies to the next decision. Everyone sees them; admins change them. */
export const MatchingRulesView = () => {
  const query = useMatchingRules();
  return query.isPending ? (
    <Skeleton className="h-96" aria-label="Loading the rules" />
  ) : query.isError ? (
    <ErrorState
      title="The rules could not load"
      error={query.error}
      onRetry={() => void query.refetch()}
    />
  ) : (
    <RulesForm key={query.data.updatedAt} config={query.data} />
  );
};

const RulesForm = ({ config }: { config: MatchingConfigDto }) => {
  const queryClient = useQueryClient();
  const editable = hasRole(useAuth().user, ['ADMIN']);
  const [draft, setDraft] = useState<Draft>(() => toDraft(config));
  const [errors, setErrors] = useState<Partial<Record<RuleKey | 'form', string>>>({});

  const changes: UpdateMatchingConfigRequest = Object.fromEntries(
    RULES.map((rule) => [rule.key, rule.fromDisplay(Number(draft[rule.key]))] as const).filter(
      ([key, value]) => value !== config[key],
    ),
  );
  const dirty = Object.keys(changes).length > 0;

  const save = useMutation({
    mutationFn: updateMatchingRules,
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.matchingRules, updated);
      toast.success('Matching rules saved', {
        description: 'They apply to the next evaluation; past decisions stay as they are.',
      });
    },
    onError: (error) => setErrors({ form: errorMessage(error, 'The rules could not be saved.') }),
  });

  const submit = (): void => {
    const parsed = updateMatchingConfigRequestSchema.safeParse(changes);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RULES.map((rule) => (
          <Field
            key={rule.key}
            data-invalid={Boolean(errors[rule.key])}
            className="rounded-md border bg-card p-4"
          >
            <FieldLabel htmlFor={rule.key}>{rule.label}</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id={rule.key}
                type="number"
                inputMode="decimal"
                step={rule.step}
                value={draft[rule.key]}
                readOnly={!editable}
                aria-invalid={Boolean(errors[rule.key])}
                onChange={(event) => setDraft({ ...draft, [rule.key]: event.target.value })}
                className="w-32 text-right tabular-nums read-only:bg-muted"
              />
              <span className="text-sm text-muted-foreground">{rule.unit}</span>
            </div>
            <FieldDescription>{rule.help}</FieldDescription>
            <FieldError>{errors[rule.key]}</FieldError>
          </Field>
        ))}
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Last changed {formatDateTime(config.updatedAt)}
          {config.updatedBy ? ` by ${config.updatedBy.name}` : ' (initial setup)'}.
          {!editable && ' Only administrators can change the rules.'}
        </p>
        {editable && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty || save.isPending}
              onClick={() => {
                setDraft(toDraft(config));
                setErrors({});
              }}
            >
              Discard changes
            </Button>
            <Button type="submit" disabled={!dirty || save.isPending}>
              {save.isPending && <Spinner data-icon="inline-start" />}
              Save rules
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};
