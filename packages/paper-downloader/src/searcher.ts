/**
 * Semantic Scholar API Client
 * 
 * API Documentation: https://api.semanticscholar.org/api-docs/
 * 
 * Rate Limits:
 * - Without API Key: 100 requests per 5 minutes
 * - With API Key: Higher limits
 */

import { ok, err, type Result } from '@aria/core';
import type {
  Paper,
  PaperSearchRequest,
  PaperSearchResult,
  PaperSearchError,
  PaperDownloadErrorCode,
} from './types.js';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';

// 返却するフィールド（カンマ区切り）
const PAPER_FIELDS = [
  'paperId',
  'title',
  'abstract',
  'year',
  'venue',
  'authors',
  'authors.authorId',
  'authors.name',
  'authors.affiliations',
  'citationCount',
  'referenceCount',
  'influentialCitationCount',
  'isOpenAccess',
  'openAccessPdf',
  'fieldsOfStudy',
  'publicationTypes',
  'publicationDate',
  'journal',
  'externalIds',
  'url',
  'tldr',
].join(',');

export interface SemanticScholarClientOptions {
  apiKey?: string;
  userAgent?: string;
  timeoutMs?: number;
}

/**
 * Semantic Scholar API クライアント
 */
export class SemanticScholarClient {
  private apiKey: string | undefined;
  private userAgent: string;
  private timeoutMs: number;

  constructor(options?: SemanticScholarClientOptions) {
    this.apiKey = options?.apiKey ?? process.env.SEMANTIC_SCHOLAR_API_KEY;
    this.userAgent = options?.userAgent ?? 'ARIA-Research-Assistant/0.1.0';
    this.timeoutMs = options?.timeoutMs ?? 30000;
  }

  /**
   * HTTP リクエストを送信
   */
  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<Result<T, PaperSearchError>> {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`);
      
      // クエリパラメータを追加
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            url.searchParams.set(key, String(value));
          }
        }
      }

      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.handleHttpError(response);
      }

      const data = await response.json() as T;
      return ok(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return err({
          code: 'NETWORK',
          message: 'Request timed out',
        });
      }
      return err({
        code: 'NETWORK',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * HTTP エラーをハンドリング
   */
  private async handleHttpError(response: Response): Promise<Result<never, PaperSearchError>> {
    let code: PaperDownloadErrorCode = 'UNKNOWN';
    let message = `HTTP ${response.status}`;

    if (response.status === 404) {
      code = 'NOT_FOUND';
      message = 'Resource not found';
    } else if (response.status === 429) {
      code = 'RATE_LIMITED';
      message = 'Rate limit exceeded. Please try again later.';
    } else if (response.status >= 400 && response.status < 500) {
      code = 'INVALID_REQUEST';
      try {
        const body = await response.json() as { error?: string; message?: string };
        message = body.error ?? body.message ?? message;
      } catch {
        // ignore JSON parse error
      }
    } else if (response.status >= 500) {
      code = 'NETWORK';
      message = 'Server error. Please try again later.';
    }

    return err({ code, message });
  }

  /**
   * 論文を検索
   */
  async search(request: PaperSearchRequest): Promise<Result<PaperSearchResult, PaperSearchError>> {
    const limit = Math.min(request.limit ?? 10, 100);
    const offset = request.offset ?? 0;

    // クエリパラメータを構築
    const params: Record<string, string | number | boolean> = {
      query: request.query,
      limit,
      offset,
      fields: PAPER_FIELDS,
    };

    // 年フィルター
    if (request.year) {
      params.year = request.year;
    }

    // 分野フィルター
    if (request.fieldsOfStudy && request.fieldsOfStudy.length > 0) {
      params.fieldsOfStudy = request.fieldsOfStudy.join(',');
    }

    // OA フィルター
    if (request.openAccessPdf !== undefined) {
      params.openAccessPdf = request.openAccessPdf;
    }

    // 引用数フィルター
    if (request.minCitationCount !== undefined) {
      params.minCitationCount = request.minCitationCount;
    }

    // 出版タイプフィルター
    if (request.publicationTypes && request.publicationTypes.length > 0) {
      params.publicationTypes = request.publicationTypes.join(',');
    }

    // 会議/ジャーナルフィルター
    if (request.venue && request.venue.length > 0) {
      params.venue = request.venue.join(',');
    }

    interface SearchResponse {
      total: number;
      offset: number;
      next?: number;
      data: Paper[];
    }

    const result = await this.fetch<SearchResponse>('/paper/search', params);

    if (!result.ok) {
      return result;
    }

    const searchResult: PaperSearchResult = {
      total: result.value.total,
      offset: result.value.offset,
      papers: result.value.data,
    };
    
    if (result.value.next !== undefined) {
      searchResult.next = result.value.next;
    }

    return ok(searchResult);
  }

  /**
   * 論文詳細を取得
   */
  async getPaper(paperId: string): Promise<Result<Paper, PaperSearchError>> {
    return this.fetch<Paper>(`/paper/${encodeURIComponent(paperId)}`, {
      fields: PAPER_FIELDS,
    });
  }

  /**
   * DOI で論文を取得
   */
  async getPaperByDoi(doi: string): Promise<Result<Paper, PaperSearchError>> {
    return this.getPaper(`DOI:${doi}`);
  }

  /**
   * arXiv ID で論文を取得
   */
  async getPaperByArxiv(arxivId: string): Promise<Result<Paper, PaperSearchError>> {
    return this.getPaper(`ARXIV:${arxivId}`);
  }

  /**
   * 複数の論文を一括取得
   */
  async getPapers(paperIds: string[]): Promise<Result<Paper[], PaperSearchError>> {
    if (paperIds.length === 0) {
      return ok([]);
    }

    if (paperIds.length > 500) {
      return err({
        code: 'INVALID_REQUEST',
        message: 'Maximum 500 papers can be fetched at once',
      });
    }

    try {
      const url = `${BASE_URL}/paper/batch`;
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${url}?fields=${PAPER_FIELDS}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids: paperIds }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.handleHttpError(response);
      }

      const data = await response.json() as Paper[];
      return ok(data.filter((p): p is Paper => p !== null));
    } catch (error) {
      return err({
        code: 'NETWORK',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 著者の論文を取得
   */
  async getAuthorPapers(
    authorId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Result<{ papers: Paper[]; total: number }, PaperSearchError>> {
    interface AuthorPapersResponse {
      data: Array<{ paper: Paper }>;
      offset: number;
      next?: number;
    }

    const result = await this.fetch<AuthorPapersResponse>(
      `/author/${encodeURIComponent(authorId)}/papers`,
      {
        limit: Math.min(limit, 1000),
        offset,
        fields: PAPER_FIELDS,
      },
    );

    if (!result.ok) {
      return result;
    }

    return ok({
      papers: result.value.data.map(d => d.paper),
      total: result.value.data.length + offset + (result.value.next ? 1 : 0),
    });
  }

  /**
   * 論文の引用を取得
   */
  async getCitations(
    paperId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Result<{ papers: Paper[]; total: number }, PaperSearchError>> {
    interface CitationsResponse {
      data: Array<{ citingPaper: Paper }>;
      offset: number;
      next?: number;
    }

    const result = await this.fetch<CitationsResponse>(
      `/paper/${encodeURIComponent(paperId)}/citations`,
      {
        limit: Math.min(limit, 1000),
        offset,
        fields: PAPER_FIELDS,
      },
    );

    if (!result.ok) {
      return result;
    }

    return ok({
      papers: result.value.data.map(d => d.citingPaper).filter((p): p is Paper => p !== null),
      total: result.value.data.length + offset + (result.value.next ? 1 : 0),
    });
  }

  /**
   * 論文の参照を取得
   */
  async getReferences(
    paperId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Result<{ papers: Paper[]; total: number }, PaperSearchError>> {
    interface ReferencesResponse {
      data: Array<{ citedPaper: Paper }>;
      offset: number;
      next?: number;
    }

    const result = await this.fetch<ReferencesResponse>(
      `/paper/${encodeURIComponent(paperId)}/references`,
      {
        limit: Math.min(limit, 1000),
        offset,
        fields: PAPER_FIELDS,
      },
    );

    if (!result.ok) {
      return result;
    }

    return ok({
      papers: result.value.data.map(d => d.citedPaper).filter((p): p is Paper => p !== null),
      total: result.value.data.length + offset + (result.value.next ? 1 : 0),
    });
  }

  /**
   * おすすめ論文を取得（指定した論文に類似した論文）
   */
  async getRecommendations(
    paperId: string,
    limit: number = 10,
  ): Promise<Result<Paper[], PaperSearchError>> {
    interface RecommendationsResponse {
      recommendedPapers: Paper[];
    }

    const result = await this.fetch<RecommendationsResponse>(
      `/recommendations/v1/papers/forpaper/${encodeURIComponent(paperId)}`,
      {
        limit: Math.min(limit, 500),
        fields: PAPER_FIELDS,
      },
    );

    if (!result.ok) {
      return result;
    }

    return ok(result.value.recommendedPapers);
  }
}

/**
 * デフォルトのクライアントインスタンス
 */
export const semanticScholar = new SemanticScholarClient();

/**
 * 論文検索（便利関数）
 */
export async function searchPapers(
  request: PaperSearchRequest,
): Promise<Result<PaperSearchResult, PaperSearchError>> {
  return semanticScholar.search(request);
}

/**
 * 論文詳細取得（便利関数）
 */
export async function getPaper(
  paperId: string,
): Promise<Result<Paper, PaperSearchError>> {
  return semanticScholar.getPaper(paperId);
}
