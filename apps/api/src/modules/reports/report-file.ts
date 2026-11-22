import { StreamableFile } from '@nestjs/common';
import type { Readable } from 'node:stream';

/** A download: the browser saves it under `fileName` (built only from validated parts). */
export const toReportFile = (stream: Readable, type: string, fileName: string): StreamableFile =>
  new StreamableFile(stream, { type, disposition: `attachment; filename="${fileName}"` });
