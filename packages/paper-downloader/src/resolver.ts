import { err, ok } from '@aria/core';
import type { Result } from '@aria/core';

import type {
  PaperDownloadError,
  PaperDownloadRequest,
  PaperDownloadResult,
} from './types.js';

export async function resolveOpenAccessPdf(
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  if (
    !request.identifier.doi &&
    !request.identifier.arxivId &&
    !request.identifier.pmcId &&
    !request.identifier.url
  ) {
    return err({
      code: 'INVALID_REQUEST',
      message: 'No identifier provided (doi/arxivId/pmcId/url)',
    });
  }

  const preferredSources = request.preferredSources ?? [
    'arxiv',
    'pmc',
    'unpaywall',
    'direct',
  ];

  for (const source of preferredSources) {
    const result = await tryResolveBySource(source, request);
    if (result.ok) return result;
  }

  return err({
    code: 'NOT_FOUND',
    message: 'No open access PDF URL could be resolved from the provided identifiers',
    details: {
      identifiers: {
        doi: request.identifier.doi ? true : false,
        arxivId: request.identifier.arxivId ? true : false,
        pmcId: request.identifier.pmcId ? true : false,
        url: request.identifier.url ? true : false,
      },
    },
  });
}

async function tryResolveBySource(
  source: string,
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  switch (source) {
    case 'arxiv':
      return resolveArxiv(request);
    case 'pmc':
      return resolvePmc(request);
    case 'unpaywall':
      return resolveUnpaywall(request);
    case 'direct':
      return resolveDirectUrl(request);
    default:
      return err({
        code: 'INVALID_REQUEST',
        message: `Unknown resolver source: ${source}`,
      });
  }
}

function normalizeDoi(input: string): string {
  const trimmed = input.trim();
  return trimmed
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
}

function normalizeArxivId(input: string): string {
  return input.trim().replace(/^arxiv:\s*/i, '');
}

function normalizePmcId(input: string): string {
  const trimmed = input.trim();
  if (/^pmc\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

async function resolveArxiv(
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  if (!request.identifier.arxivId) {
    return err({ code: 'NOT_FOUND', message: 'No arXiv ID provided' });
  }

  const arxivId = normalizeArxivId(request.identifier.arxivId);
  const pdfUrl = `https://arxiv.org/pdf/${encodeURIComponent(arxivId)}.pdf`;
  return ok({ pdfUrl, source: 'arxiv' });
}

async function resolvePmc(
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  if (!request.identifier.pmcId) {
    return err({ code: 'NOT_FOUND', message: 'No PMC ID provided' });
  }

  const pmcId = normalizePmcId(request.identifier.pmcId);
  // PMC provides a PDF endpoint for articles.
  const pdfUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${encodeURIComponent(pmcId)}/pdf/`;
  return ok({ pdfUrl, source: 'pmc' });
}

async function resolveDirectUrl(
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  const url = request.identifier.url;
  if (!url) {
    return err({ code: 'NOT_FOUND', message: 'No URL provided' });
  }

  try {
    const parsed = new URL(url);
    const isPdf = parsed.pathname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return err({
        code: 'NOT_FOUND',
        message: 'Provided URL does not look like a direct PDF link',
      });
    }

    return ok({ pdfUrl: parsed.toString(), source: 'direct' });
  } catch {
    return err({ code: 'INVALID_REQUEST', message: 'Invalid URL' });
  }
}

type UnpaywallResponse = {
  best_oa_location?: {
    url_for_pdf?: string | null;
    url?: string | null;
    license?: string | null;
  } | null;
  oa_locations?: Array<{
    url_for_pdf?: string | null;
    url?: string | null;
    license?: string | null;
  }>;
};

async function resolveUnpaywall(
  request: PaperDownloadRequest,
): Promise<Result<PaperDownloadResult, PaperDownloadError>> {
  if (!request.identifier.doi) {
    return err({ code: 'NOT_FOUND', message: 'No DOI provided' });
  }

  const email = process.env.UNPAYWALL_EMAIL;
  if (!email) {
    return err({
      code: 'INVALID_REQUEST',
      message: 'UNPAYWALL_EMAIL is required to use Unpaywall resolver',
    });
  }

  const doi = normalizeDoi(request.identifier.doi);
  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    request.timeoutMs ?? 15000,
  );

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': request.userAgent ?? 'aria-paper-downloader/0.1.0',
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : undefined;
      return err({
        code: 'RATE_LIMITED',
        message: 'Rate limited by Unpaywall',
        ...(Number.isFinite(retryAfterMs) ? { retryAfterMs: retryAfterMs! } : {}),
        details: { status: response.status },
      });
    }

    if (response.status === 403) {
      return err({
        code: 'BLOCKED',
        message: 'Blocked by Unpaywall',
        details: { status: response.status },
      });
    }

    if (response.status === 404) {
      return err({
        code: 'NOT_FOUND',
        message: 'DOI not found in Unpaywall',
        details: { status: response.status },
      });
    }

    if (!response.ok) {
      return err({
        code: 'NETWORK',
        message: `Unpaywall request failed (${response.status})`,
        details: { status: response.status },
      });
    }

    const data = (await response.json()) as UnpaywallResponse;
    const best = data.best_oa_location ?? undefined;

    const pdfUrl =
      best?.url_for_pdf ||
      best?.url ||
      data.oa_locations?.find((loc) => loc.url_for_pdf)?.url_for_pdf ||
      data.oa_locations?.find((loc) => loc.url)?.url ||
      undefined;

    if (!pdfUrl) {
      return err({
        code: 'NOT_FOUND',
        message: 'No OA location found in Unpaywall response',
      });
    }

    const license = best?.license ?? undefined;
    return ok({ pdfUrl, source: 'unpaywall', ...(license ? { license } : {}) });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return err({
        code: 'NETWORK',
        message: 'Unpaywall request timed out',
      });
    }

    return err({
      code: 'UNKNOWN',
      message: e instanceof Error ? e.message : 'Unknown Unpaywall error',
    });
  } finally {
    clearTimeout(timeout);
  }
}

