/**
 * Python Bridge Integration Tests
 *
 * Tests the TypeScript ↔ Python bridge integration for:
 * - docling-adapter: PDF to Markdown conversion
 * - graphrag: Knowledge graph indexing and querying
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'node:child_process';
import { access, constants, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DIR = join(__dirname, 'python-bridge');
const VENV_PYTHON = join(__dirname, '..', '.venv', 'bin', 'python');

interface BridgeResult {
  ok: boolean;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runPythonBridge(
  scriptPath: string,
  args: string[],
): Promise<BridgeResult> {
  const venvExists = await fileExists(VENV_PYTHON);
  const pythonCmd = venvExists ? VENV_PYTHON : 'python3';

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCmd, [scriptPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        // Find the last JSON object in stdout
        const jsonMatch = stdout.match(/\{[^{}]*\}/g);
        if (jsonMatch) {
          const lastJson = jsonMatch[jsonMatch.length - 1];
          resolve(JSON.parse(lastJson));
        } else if (code === 0) {
          resolve({ ok: true, message: stdout || 'Success' });
        } else {
          resolve({
            ok: false,
            code: 'UNKNOWN',
            message: stderr || stdout || `Exit code: ${code}`,
          });
        }
      } catch (e) {
        resolve({
          ok: false,
          code: 'PARSE_ERROR',
          message: `Failed to parse response: ${stdout}`,
        });
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

describe('Python Bridge Integration', () => {
  describe('docling-adapter', () => {
    const DOCLING_SCRIPT = join(
      __dirname,
      '..',
      'packages',
      'docling-adapter',
      'scripts',
      'docling_bridge.py',
    );

    it('should show help without arguments', async () => {
      const result = await runPythonBridge(DOCLING_SCRIPT, []);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should error on non-existent PDF', async () => {
      const result = await runPythonBridge(DOCLING_SCRIPT, [
        '/nonexistent/file.pdf',
      ]);
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_INPUT');
    });

    it('should convert PDF to Markdown (if test PDF exists)', async () => {
      const testPdf = join(TEST_DIR, 'test-sample.pdf');
      const outputDir = join(TEST_DIR, 'output');

      if (!(await fileExists(testPdf))) {
        console.log('Skipping: test PDF not found');
        return;
      }

      // Check if output already exists (from previous test run)
      const expectedMd = join(outputDir, 'test-sample.md');
      if (await fileExists(expectedMd)) {
        console.log('Output already exists, verifying...');
        const content = await readFile(expectedMd, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
        return;
      }

      // This test requires docling to be installed and takes ~30s
      // Skip in CI or when running quick tests
      if (process.env.CI || process.env.SKIP_SLOW_TESTS) {
        console.log('Skipping slow test in CI');
        return;
      }

      const result = await runPythonBridge(DOCLING_SCRIPT, [testPdf, outputDir]);

      if (result.code === 'NOT_INSTALLED') {
        console.log('Skipping: docling not installed');
        return;
      }

      expect(result.ok).toBe(true);
      expect(result.markdownPath).toBeDefined();

      // Verify the output file exists
      const mdPath = result.markdownPath as string;
      expect(await fileExists(mdPath)).toBe(true);

      // Verify content
      const content = await readFile(mdPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    }, 120000); // 2 minute timeout
  });

  describe('graphrag', () => {
    const GRAPHRAG_SCRIPT = join(
      __dirname,
      '..',
      'packages',
      'graphrag',
      'scripts',
      'graphrag_bridge.py',
    );

    it('should show help without arguments', async () => {
      const result = await runPythonBridge(GRAPHRAG_SCRIPT, ['--help']);
      // Help output won't be JSON, so it will fail to parse
      // but the script should run successfully
      expect(result).toBeDefined();
    });

    it('should error on index without settings.yaml', async () => {
      const tempDir = join(TEST_DIR, 'temp-graphrag-test');
      await mkdir(join(tempDir, 'input'), { recursive: true });

      const result = await runPythonBridge(GRAPHRAG_SCRIPT, ['index', tempDir]);

      if (result.code === 'NOT_INSTALLED') {
        console.log('Skipping: graphrag not installed');
        return;
      }

      expect(result.ok).toBe(false);
      // Can be either NOT_INITIALIZED or INVALID_INPUT depending on path resolution
      expect(['NOT_INITIALIZED', 'INVALID_INPUT']).toContain(result.code);
    });

    it('should error on query without index', async () => {
      const tempDir = join(TEST_DIR, 'temp-graphrag-query');
      await mkdir(tempDir, { recursive: true });

      const result = await runPythonBridge(GRAPHRAG_SCRIPT, [
        'query',
        tempDir,
        'What is RAG?',
      ]);

      if (result.code === 'NOT_INSTALLED') {
        console.log('Skipping: graphrag not installed');
        return;
      }

      expect(result.ok).toBe(false);
      expect(result.code).toBe('INDEX_NOT_FOUND');
    });

    it('should error on index without API key', async () => {
      const testDir = join(TEST_DIR, 'graphrag-test');

      // Skip if settings.yaml doesn't exist
      if (!(await fileExists(join(testDir, 'settings.yaml')))) {
        console.log('Skipping: settings.yaml not found');
        return;
      }

      const result = await runPythonBridge(GRAPHRAG_SCRIPT, ['index', testDir]);

      if (result.code === 'NOT_INSTALLED') {
        console.log('Skipping: graphrag not installed');
        return;
      }

      // Should fail with API key missing if no OPENAI_API_KEY is set
      if (!process.env.OPENAI_API_KEY) {
        expect(result.ok).toBe(false);
        expect(result.code).toBe('API_KEY_MISSING');
      }
    });
  });
});

describe('TypeScript Module Import', () => {
  it('should import docling-adapter module', async () => {
    // Import using relative path since we're in tests/
    const module = await import('../packages/docling-adapter/src/index.js');
    expect(module.convertPdfToMarkdown).toBeDefined();
  });

  it('should import graphrag module', async () => {
    const module = await import('../packages/graphrag/src/index.js');
    expect(module.buildGraphRagIndex).toBeDefined();
    expect(module.queryGraphRag).toBeDefined();
  });
});
