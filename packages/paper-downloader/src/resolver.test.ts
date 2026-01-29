/**
 * OpenAccess PDF Resolver Tests
 * 
 * Note: These tests make real API calls.
 * Set SKIP_API_TESTS=1 to skip these tests in CI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveOpenAccessPdf } from './resolver.js';

const SKIP_API_TESTS = process.env.SKIP_API_TESTS === '1';

describe.skipIf(SKIP_API_TESTS)('resolveOpenAccessPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('arXiv identifier', () => {
    it('should resolve arXiv PDF URL', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: { arxivId: '1706.03762' },
        timeoutMs: 10000,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.pdfUrl).toContain('arxiv.org');
      expect(result.value.source).toBe('arxiv');
    });

    it('should handle arXiv ID with version', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: { arxivId: '1706.03762v7' },
        timeoutMs: 10000,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.pdfUrl).toContain('arxiv.org');
    });
  });

  describe('PMC identifier', () => {
    it('should resolve PMC PDF URL', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: { pmcId: 'PMC7614570' },
        timeoutMs: 10000,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.pdfUrl).toContain('ncbi.nlm.nih.gov');
      expect(result.value.source).toBe('pmc');
    });
  });

  describe('error handling', () => {
    it('should return error for empty identifier', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: {},
        timeoutMs: 5000,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('INVALID_REQUEST');
    });

    it('should handle non-existent arXiv ID', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: { arxivId: 'invalid.99999999' },
        timeoutMs: 10000,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(['NOT_FOUND', 'NETWORK', 'UNKNOWN']).toContain(result.error.code);
    });
  });

  describe('preferred sources', () => {
    it('should respect preferred source order', async () => {
      const result = await resolveOpenAccessPdf({
        identifier: { arxivId: '1706.03762' },
        preferredSources: ['arxiv'],
        timeoutMs: 10000,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.source).toBe('arxiv');
    });
  });
});
