import { err, ok } from '@aria/core';
import type { Result } from '@aria/core';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { PaperDownloadError } from './types.js';

type DownloadResult = {
  outputPath: string;
  bytesWritten: number;
  contentType?: string;
};

type DownloadOptions = {
  userAgent?: string;
  timeoutMs?: number;
};

export async function downloadPdfToPath(
  pdfUrl: string,
  outputPath: string,
  options: DownloadOptions = {},
): Promise<Result<DownloadResult, PaperDownloadError>> {
  if (!pdfUrl || !outputPath) {
    return err({
      code: 'INVALID_REQUEST',
      message: 'pdfUrl and outputPath are required',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30000,
  );

  try {
    await mkdir(dirname(outputPath), { recursive: true });

    const response = await fetch(pdfUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1',
        'User-Agent': options.userAgent ?? 'aria-paper-downloader/0.1.0',
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
      return err({
        code: 'RATE_LIMITED',
        message: 'Rate limited while downloading PDF',
        ...(Number.isFinite(retryAfterMs) ? { retryAfterMs: retryAfterMs! } : {}),
        details: { status: response.status },
      });
    }

    if (response.status === 403) {
      return err({
        code: 'BLOCKED',
        message: 'Access blocked while downloading PDF',
        details: { status: response.status },
      });
    }

    if (!response.ok || !response.body) {
      return err({
        code: 'NETWORK',
        message: `Failed to download PDF (${response.status})`,
        details: { status: response.status },
      });
    }

    const contentType = response.headers.get('content-type') ?? undefined;

    const fileStream = createWriteStream(outputPath);
    let bytesWritten = 0;

    await new Promise<void>((resolve, reject) => {
      // Node.js ReadableStream -> Node stream
      const reader = response.body!.getReader();

      const pump = async (): Promise<void> => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              bytesWritten += value.byteLength;
              fileStream.write(Buffer.from(value));
            }
          }
          fileStream.end();
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      fileStream.on('error', reject);
      void pump();
    });

    return ok({
      outputPath,
      bytesWritten,
      ...(contentType ? { contentType } : {}),
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return err({
        code: 'NETWORK',
        message: 'Download timed out',
      });
    }

    return err({
      code: 'UNKNOWN',
      message: e instanceof Error ? e.message : 'Unknown download error',
    });
  } finally {
    clearTimeout(timeout);
  }
}
