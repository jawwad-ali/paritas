'use client';

import { useMutation } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { DownloadedFile } from '@/lib/api/api-client';
import { errorMessage } from '@/lib/api/api-error';
import { saveFile } from '../save-file';

type Format = 'csv' | 'pdf';

interface DownloadButtonsProps {
  download: (format: Format) => Promise<DownloadedFile>;
  disabled: boolean;
}

const LABELS: Record<Format, string> = { csv: 'Download CSV', pdf: 'Download PDF' };

/** CSV for spreadsheets, PDF for people and auditors; each shows its own progress. */
export const DownloadButtons = ({ download, disabled }: DownloadButtonsProps) => {
  const mutation = useMutation({
    mutationFn: download,
    onSuccess: (file) => {
      saveFile(file);
      toast.success(`${file.fileName} downloaded`);
    },
    onError: (error) =>
      toast.error('The report could not be generated', {
        description: errorMessage(error, 'Try again in a moment.'),
      }),
  });

  return (
    <div className="flex flex-wrap gap-2">
      {(['csv', 'pdf'] as const).map((format) => {
        const busy = mutation.isPending && mutation.variables === format;
        return (
          <Button
            key={format}
            variant={format === 'pdf' ? 'default' : 'outline'}
            disabled={disabled || mutation.isPending}
            onClick={() => mutation.mutate(format)}
          >
            {busy ? <Spinner data-icon="inline-start" /> : <FileDown data-icon="inline-start" />}
            {LABELS[format]}
          </Button>
        );
      })}
    </div>
  );
};
