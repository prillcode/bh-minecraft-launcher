import got from 'got';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { logger } from './logger';

export interface DownloadTask {
  url: string;
  dest: string;
  sha1?: string;
  size?: number;
}

export interface DownloadBatchProgress {
  completed: number;
  total: number;
  currentFile: string;
  bytesDownloaded: number;
  bytesTotal: number;
  bytesPerSecond: number;
}

/**
 * Streaming file download with progress — used for large files
 * like the client JAR where we want real-time byte progress.
 */
export async function downloadWithProgress(
  url: string,
  dest: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<void> {
  await fs.mkdir(path.dirname(dest), { recursive: true });

  const downloadStream = got.stream(url);
  const fileStream = createWriteStream(dest);

  let downloaded = 0;

  downloadStream.on('downloadProgress', (progress) => {
    downloaded = progress.transferred;
    onProgress?.(progress.transferred, progress.total ?? 0);
  });

  await pipeline(downloadStream, fileStream);
  logger.debug(`Downloaded ${url} → ${dest} (${downloaded} bytes)`);
}

/**
 * Simple GET-to-buffer download for smaller files.
 */
export async function downloadToBuffer(url: string): Promise<Buffer> {
  return got.get(url).buffer();
}
