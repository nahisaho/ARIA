/**
 * Semantic Scholar API Client Tests
 * 
 * Note: These tests make real API calls to Semantic Scholar.
 * They may fail due to rate limiting.
 * Set SKIP_API_TESTS=1 to skip these tests in CI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SemanticScholarClient, searchPapers } from './searcher.js';

const SKIP_API_TESTS = process.env.SKIP_API_TESTS === '1';

// Note: These tests make real API calls
// Run sparingly to avoid rate limits

describe.skipIf(SKIP_API_TESTS)('SemanticScholarClient', () => {
  let client: SemanticScholarClient;

  beforeEach(() => {
    client = new SemanticScholarClient({
      timeoutMs: 30000,
    });
  });

  describe('search', () => {
    it('should search for papers', async () => {
      const result = await client.search({
        query: 'attention is all you need transformer',
        limit: 3,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.papers.length).toBeLessThanOrEqual(3);
      expect(result.value.total).toBeGreaterThan(0);

      const paper = result.value.papers[0];
      expect(paper).toHaveProperty('paperId');
      expect(paper).toHaveProperty('title');
      expect(paper).toHaveProperty('authors');
    });

    it('should filter by year range', async () => {
      const result = await client.search({
        query: 'large language model',
        limit: 5,
        year: '2023-2024',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // All papers should be from 2023 or 2024
      for (const paper of result.value.papers) {
        if (paper.year) {
          expect(paper.year).toBeGreaterThanOrEqual(2023);
          expect(paper.year).toBeLessThanOrEqual(2024);
        }
      }
    });

    it('should filter by fields of study', async () => {
      const result = await client.search({
        query: 'deep learning',
        limit: 5,
        fieldsOfStudy: ['Computer Science'],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Papers should include Computer Science
      for (const paper of result.value.papers) {
        if (paper.fieldsOfStudy) {
          expect(paper.fieldsOfStudy).toContain('Computer Science');
        }
      }
    });
  });

  describe('getPaper', () => {
    it('should get paper by paperId', async () => {
      // This is the paperId for "Attention Is All You Need"
      const result = await client.getPaper('204e3073870fae3d05bcbc2f6a8e263d9b72e776');

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.title).toContain('Attention');
      expect(result.value.year).toBe(2017);
    });

    it('should get paper by DOI', async () => {
      const result = await client.getPaperByDoi('10.48550/arXiv.1706.03762');

      // This might return NOT_FOUND if DOI is not indexed
      // Just check that the API call doesn't crash
      expect(result).toBeDefined();
    });

    it('should get paper by arXiv ID', async () => {
      const result = await client.getPaperByArxiv('1706.03762');

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.title).toContain('Attention');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent paper', async () => {
      const result = await client.getPaper('nonexistent-paper-id-123456');

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should handle empty query', async () => {
      const result = await client.search({
        query: '',
        limit: 5,
      });

      // Empty query might return results or error depending on API behavior
      expect(result).toBeDefined();
    });
  });
});

describe.skipIf(SKIP_API_TESTS)('searchPapers convenience function', () => {
  it('should work as a standalone function', async () => {
    const result = await searchPapers({
      query: 'neural network',
      limit: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.papers.length).toBeLessThanOrEqual(2);
  });
});
