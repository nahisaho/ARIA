import { err, ok } from '@aria/core';
import type { Result } from '@aria/core';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  GraphRagError,
  GraphRagIndexInput,
  GraphRagQueryInput,
  GraphRagQueryResult,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BRIDGE_SCRIPT = join(__dirname, '..', 'scripts', 'graphrag_bridge.py');

type BridgeIndexResponse =
  | { ok: true; indexId: string; outputDir: string; documentsProcessed: number }
  | { ok: false; code: string; message: string };

type BridgeQueryResponse =
  | { ok: true; answer: string; mode: string; entities?: unknown[]; communities?: unknown[] }
  | { ok: false; code: string; message: string };

function runPythonBridge<T>(
  args: string[],
  timeoutMs: number = 300000,
): Promise<Result<T, GraphRagError>> {
  return new Promise((resolvePromise) => {
    const pythonCmd = process.env.GRAPHRAG_PYTHON ?? 'python3';

    const child = spawn(pythonCmd, [BRIDGE_SCRIPT, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolvePromise(
        err({
          code: 'UNKNOWN',
          message: 'GraphRAG operation timed out',
          details: { timeoutMs },
        }),
      );
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
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
      clearTimeout(timeout);

      if (code !== 0 && !stdout.trim()) {
        resolvePromise(
          err({
            code: 'UNKNOWN',
            message: `Python bridge exited with code ${code}`,
            details: { stderr, exitCode: code },
          }),
        );
        return;
      }

      try {
        const response = JSON.parse(stdout.trim());

        if (response.ok) {
          resolvePromise(ok(response as T));
        } else {
          resolvePromise(
            err({
              code: (response.code as GraphRagError['code']) ?? 'UNKNOWN',
              message: response.message,
            }),
          );
        }
      } catch {
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

export async function buildGraphRagIndex(
  input: GraphRagIndexInput,
): Promise<Result<{ indexId: string; outputDir: string; documentsProcessed: number }, GraphRagError>> {
  if (!input.documents || input.documents.length === 0) {
    return err({ code: 'INVALID_INPUT', message: 'documents is required' });
  }

  const workDir = input.workDir ?? join(process.cwd(), 'graphrag_index');
  const inputDir = join(workDir, 'input');

  // Create input directory and write documents
  await mkdir(inputDir, { recursive: true });

  for (const doc of input.documents) {
    const filename = `${doc.id}.txt`;
    const content = doc.metadata
      ? `---\n${JSON.stringify(doc.metadata, null, 2)}\n---\n\n${doc.text}`
      : doc.text;
    await writeFile(join(inputDir, filename), content, 'utf-8');
  }

  // Write config if provided
  const args = ['index', workDir];
  if (input.config) {
    const configPath = join(workDir, 'custom_config.json');
    await writeFile(configPath, JSON.stringify(input.config), 'utf-8');
    args.push('--config', configPath);
  }

  const result = await runPythonBridge<BridgeIndexResponse>(args);

  if (!result.ok) {
    return result;
  }

  const successResult = result.value as { ok: true; indexId: string; outputDir: string; documentsProcessed: number };
  return ok({
    indexId: successResult.indexId,
    outputDir: successResult.outputDir,
    documentsProcessed: successResult.documentsProcessed,
  });
}

export async function queryGraphRag(
  input: GraphRagQueryInput,
): Promise<Result<GraphRagQueryResult, GraphRagError>> {
  if (!input.query) {
    return err({ code: 'INVALID_INPUT', message: 'query is required' });
  }

  const workDir = input.workDir ?? join(process.cwd(), 'graphrag_index');
  const mode = input.mode ?? 'local';
  const communityLevel = input.communityLevel ?? 2;

  const args = [
    'query',
    workDir,
    input.query,
    '--mode', mode,
    '--community-level', String(communityLevel),
  ];

  const result = await runPythonBridge<BridgeQueryResponse>(args);

  if (!result.ok) {
    return result;
  }

  const successResult = result.value as { ok: true; answer: string; mode: string; entities?: unknown[]; communities?: unknown[] };
  const queryResult: GraphRagQueryResult = {
    answer: successResult.answer,
    mode: mode,
  };
  if (successResult.entities && Array.isArray(successResult.entities) && successResult.entities.length > 0) {
    (queryResult as { entities: GraphRagQueryResult['entities'] }).entities = successResult.entities as NonNullable<GraphRagQueryResult['entities']>;
  }
  if (successResult.communities && Array.isArray(successResult.communities) && successResult.communities.length > 0) {
    (queryResult as { communities: GraphRagQueryResult['communities'] }).communities = successResult.communities as NonNullable<GraphRagQueryResult['communities']>;
  }
  return ok(queryResult);
}

export async function queryGraphRagLocal(
  input: GraphRagQueryInput,
): Promise<Result<GraphRagQueryResult, GraphRagError>> {
  return queryGraphRag({ ...input, mode: 'local' });
}

export async function queryGraphRagGlobal(
  input: GraphRagQueryInput,
): Promise<Result<GraphRagQueryResult, GraphRagError>> {
  return queryGraphRag({ ...input, mode: 'global' });
}

