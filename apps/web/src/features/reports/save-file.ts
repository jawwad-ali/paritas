import type { DownloadedFile } from '@/lib/api/api-client';

/** Hands a fetched file to the browser's download, under the name the server gave it. */
export const saveFile = ({ blob, fileName }: DownloadedFile): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
