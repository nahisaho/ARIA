import type { Result } from '@aria/core';

export type PaperIdentifier = {
  doi?: string;
  arxivId?: string;
  pmcId?: string;
  url?: string;
};

export type PaperDownloadRequest = {
  identifier: PaperIdentifier;
  preferredSources?: string[];
  userAgent?: string;
  timeoutMs?: number;
};

export type PaperDownloadResult = {
  pdfUrl: string;
  source: string;
  license?: string;
};

export type PaperDownloadErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'BLOCKED'
  | 'NETWORK'
  | 'UNKNOWN';

export type PaperDownloadError = {
  code: PaperDownloadErrorCode;
  message: string;
  retryAfterMs?: number;
  details?: Record<string, unknown>;
};

export interface PaperDownloader {
  resolveOpenAccessPdf(
    request: PaperDownloadRequest,
  ): Promise<Result<PaperDownloadResult, PaperDownloadError>>;
}

// ============================================
// Paper Search Types (Semantic Scholar API)
// ============================================

/**
 * 著者情報
 */
export interface PaperAuthor {
  authorId?: string;
  name: string;
  affiliations?: string[];
}

/**
 * 論文情報
 */
export interface Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  venue?: string;
  authors: PaperAuthor[];
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
    status?: string;
  };
  fieldsOfStudy?: string[];
  publicationTypes?: string[];
  publicationDate?: string;
  journal?: {
    name?: string;
    volume?: string;
    pages?: string;
  };
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
    PubMedCentral?: string;
    DBLP?: string;
    CorpusId?: number;
  };
  url?: string;
  tldr?: {
    model: string;
    text: string;
  };
}

/**
 * 検索リクエスト
 */
export interface PaperSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  year?: string;           // "2020" or "2018-2022" or "2015-"
  fieldsOfStudy?: string[];
  openAccessPdf?: boolean;
  minCitationCount?: number;
  publicationTypes?: string[];
  venue?: string[];
}

/**
 * 検索結果
 */
export interface PaperSearchResult {
  total: number;
  offset: number;
  papers: Paper[];
  next?: number;
}

/**
 * 検索エラー
 */
export interface PaperSearchError {
  code: PaperDownloadErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
