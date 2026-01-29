import { err, ok } from '@aria/core';
import type { Result } from '@aria/core';
import { spawn } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  DoclingConvertError,
  DoclingConvertInput,
  DoclingConvertResult,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BRIDGE_SCRIPT = join(__dirname, '..', 'scripts', 'docling_bridge.py');

type BridgeResponse =
  | { ok: true; markdownPath: string; assetsDir?: string }
  | { ok: false; code: string; message: string };

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function convertPdfToMarkdown(
  input: DoclingConvertInput,
): Promise<Result<DoclingConvertResult, DoclingConvertError>> {
  if (!input.pdfPath) {
    return err({ code: 'INVALID_INPUT', message: 'pdfPath is required' });
  }

  const pdfPath = resolve(input.pdfPath);

  if (!(await fileExists(pdfPath))) {
    return err({
      code: 'INVALID_INPUT',
      message: `PDF file not found: ${pdfPath}`,
    });
  }

  const pythonCmd = process.env.DOCLING_PYTHON ?? 'python3';
  const args = [BRIDGE_SCRIPT, pdfPath];

  if (input.outputDir) {
    args.push(resolve(input.outputDir));
  }

  return new Promise((resolvePromise) => {
    const child = spawn(pythonCmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        resolvePromise(
          err({
            code: 'NOT_INSTALLED',
            message: `Python not found: ${pythonCmd}`,
            details: { pythonCmd },
          }),
        );
      } else {
        resolvePromise(
          err({
            code: 'UNKNOWN',
            message: error.message,
            details: { stderr },
          }),
        );
      }
    });

    child.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        resolvePromise(
          err({
            code: 'CONVERSION_FAILED',
            message: `Python bridge exited with code ${code}`,
            details: { stderr, exitCode: code },
          }),
        );
        return;
      }

      try {
        const response = JSON.parse(stdout.trim()) as BridgeResponse;

        if (response.ok) {
          resolvePromise(
            ok({
              markdownPath: response.markdownPath,
              ...(response.assetsDir ? { assetsDir: response.assetsDir } : {}),
            }),
          );
        } else {
          resolvePromise(
            err({
              code: (response.code as DoclingConvertError['code']) ?? 'UNKNOWN',
              message: response.message,
            }),
          );
        }
      } catch (parseError) {
        resolvePromise(
          err({
            code: 'UNKNOWN',
            message: 'Failed to parse Python bridge output',
            details: { stdout, stderr },
          }),
        );
      }
    });
  });
}

