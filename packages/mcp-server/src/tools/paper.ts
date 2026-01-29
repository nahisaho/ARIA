/**
 * ARIA MCP Tools - Paper
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ZodIssue } from 'zod';
import { convertPdfToMarkdown } from '@aria/docling-adapter';
import {
  downloadPdfToPath,
  resolveOpenAccessPdf,
  searchPapers,
} from '@aria/paper-downloader';
import type {
  PaperDownloadError,
  PaperDownloadRequest,
  PaperDownloadResult,
} from '@aria/paper-downloader';
import { ExperimentStorageService } from '@aria/core';
import { join } from 'node:path';

// 実験ストレージインスタンス（遅延初期化）
let experimentStorage: ExperimentStorageService | null = null;

function getExperimentStorage(): ExperimentStorageService {
  if (!experimentStorage) {
    const basePath = process.env.ARIA_STORAGE_PATH ?? process.cwd();
    experimentStorage = new ExperimentStorageService({
      basePath: join(basePath, 'storage', 'experiments'),
    });
  }
  return experimentStorage;
}

export const paperTools: Tool[] = [
  {
    name: 'paper_check_oa',
    description:
      'Check open-access availability and resolve a PDF URL from DOI/arXiv/PMC/URL (no download)',
    inputSchema: {
      type: 'object',
      properties: {
        doi: {
          type: 'string',
          description: 'DOI of the paper (e.g., 10.xxxx/xxxxx)',
        },
        arxivId: {
          type: 'string',
          description: 'arXiv identifier (e.g., 2312.12345)',
        },
        pmcId: {
          type: 'string',
          description: 'PubMed Central ID (e.g., PMC1234567)',
        },
        url: {
          type: 'string',
          description: 'A landing page URL (used as a fallback identifier)',
        },
        preferredSources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Preferred resolver sources in priority order',
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 15000,
        },
      },
    },
  },
  {
    name: 'paper_download',
    description:
      'Resolve an open-access PDF URL and download it. Can optionally associate with an experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        doi: {
          type: 'string',
          description: 'DOI of the paper (e.g., 10.xxxx/xxxxx)',
        },
        arxivId: {
          type: 'string',
          description: 'arXiv identifier (e.g., 2312.12345)',
        },
        pmcId: {
          type: 'string',
          description: 'PubMed Central ID (e.g., PMC1234567)',
        },
        url: {
          type: 'string',
          description: 'A landing page URL (used as a fallback identifier)',
        },
        outputPath: {
          type: 'string',
          description: 'Local path to save the PDF (optional)',
        },
        experimentId: {
          type: 'string',
          description: 'Optional experiment ID to associate this paper with (e.g., EXP-2026-01-30-001). Papers will be stored in a directory specific to this experiment.',
        },
        preferredSources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Preferred resolver sources in priority order',
        },
        timeoutMs: {
          type: 'number',
          description: 'Timeout in milliseconds',
          default: 30000,
        },
      },
    },
  },
  {
    name: 'paper_import',
    description: 'Import a PDF paper and convert it to Markdown using docling. Can optionally associate with an experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        pdfPath: {
          type: 'string',
          description: 'Path to the PDF file to import',
        },
        paperId: {
          type: 'string',
          description: 'Optional DOI or arXiv ID of the paper',
        },
        experimentId: {
          type: 'string',
          description: 'Optional experiment ID to associate this paper with (e.g., EXP-2026-01-30-001). Papers will be stored in a directory specific to this experiment.',
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Categories to assign to the paper',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords to assign to the paper',
        },
      },
      required: ['pdfPath'],
    },
  },
  {
    name: 'paper_analyze',
    description: 'Analyze a paper to extract detailed metadata, sections, and references',
    inputSchema: {
      type: 'object',
      properties: {
        paperId: {
          type: 'string',
          description: 'ID of the paper to analyze',
        },
        extractFigures: {
          type: 'boolean',
          description: 'Whether to extract figures from the paper',
          default: true,
        },
        extractTables: {
          type: 'boolean',
          description: 'Whether to extract tables from the paper',
          default: true,
        },
        extractEquations: {
          type: 'boolean',
          description: 'Whether to extract equations from the paper',
          default: true,
        },
      },
      required: ['paperId'],
    },
  },
  {
    name: 'paper_search',
    description: 'Search for papers in the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by categories',
        },
        authors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by authors',
        },
        dateFrom: {
          type: 'string',
          description: 'Filter by publication date from (YYYY-MM-DD)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter by publication date to (YYYY-MM-DD)',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by keywords',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
        sortBy: {
          type: 'string',
          enum: ['relevance', 'date', 'citations'],
          description: 'Sort order for results',
          default: 'relevance',
        },
      },
      required: ['query'],
    },
  },
];

export async function handlePaperTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const IdentifierBaseSchema = z.object({
    doi: z.string().min(1).optional(),
    arxivId: z.string().min(1).optional(),
    pmcId: z.string().min(1).optional(),
    url: z.string().url().optional(),
  });

  const CheckOaSchema = IdentifierBaseSchema.extend({
    preferredSources: z.array(z.string()).optional(),
    timeoutMs: z.number().int().positive().optional(),
  }).refine((v) => !!(v.doi || v.arxivId || v.pmcId || v.url), {
    message: 'One of doi/arxivId/pmcId/url is required',
  });

  const DownloadSchema = IdentifierBaseSchema.extend({
    preferredSources: z.array(z.string()).optional(),
    timeoutMs: z.number().int().positive().optional(),
    outputPath: z.string().min(1).optional(),
    experimentId: z.string().min(1).optional(),
  }).refine((v) => !!(v.doi || v.arxivId || v.pmcId || v.url), {
    message: 'One of doi/arxivId/pmcId/url is required',
  });

  const resolve = async (
    request: PaperDownloadRequest,
  ): Promise<
    | { ok: true; value: PaperDownloadResult }
    | { ok: false; error: PaperDownloadError }
  > => {
    const result = await resolveOpenAccessPdf(request);
    return result;
  };

  switch (name) {
    case 'paper_check_oa': {
      const parsed = CheckOaSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: 'INVALID_REQUEST',
                    message: parsed.error.issues
                      .map((issue: ZodIssue) => issue.message)
                      .join('; '),
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const identifier = {
        ...(parsed.data.doi ? { doi: parsed.data.doi } : {}),
        ...(parsed.data.arxivId ? { arxivId: parsed.data.arxivId } : {}),
        ...(parsed.data.pmcId ? { pmcId: parsed.data.pmcId } : {}),
        ...(parsed.data.url ? { url: parsed.data.url } : {}),
      };

      const request: PaperDownloadRequest = {
        identifier,
        ...(parsed.data.preferredSources
          ? { preferredSources: parsed.data.preferredSources }
          : {}),
        ...(parsed.data.timeoutMs ? { timeoutMs: parsed.data.timeoutMs } : {}),
      };

      const resolved = await resolve(request);

      if (resolved.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  openAccess: true,
                  result: resolved.value,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                openAccess: false,
                error: resolved.error,
                note: 'Resolver returned an error (may be unimplemented or not found)',
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'paper_download': {
      const parsed = DownloadSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: {
                    code: 'INVALID_REQUEST',
                    message: parsed.error.issues
                      .map((issue: ZodIssue) => issue.message)
                      .join('; '),
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const identifier = {
        ...(parsed.data.doi ? { doi: parsed.data.doi } : {}),
        ...(parsed.data.arxivId ? { arxivId: parsed.data.arxivId } : {}),
        ...(parsed.data.pmcId ? { pmcId: parsed.data.pmcId } : {}),
        ...(parsed.data.url ? { url: parsed.data.url } : {}),
      };

      const request: PaperDownloadRequest = {
        identifier,
        ...(parsed.data.preferredSources
          ? { preferredSources: parsed.data.preferredSources }
          : {}),
        ...(parsed.data.timeoutMs ? { timeoutMs: parsed.data.timeoutMs } : {}),
      };

      const resolved = await resolve(request);

      if (!resolved.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: resolved.error,
                  note: 'PDF resolution failed (download step not executed)',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // 実験IDが指定された場合、自動的に出力パスを決定
      const path = await import('node:path');
      const fs = await import('node:fs/promises');
      let finalOutputPath = parsed.data.outputPath;
      
      if (parsed.data.experimentId && !finalOutputPath) {
        // 実験IDから実験データディレクトリのpapersフォルダを使用
        const storage = getExperimentStorage();
        const papersDir = storage.getExperimentPapersDir(parsed.data.experimentId);
        await fs.mkdir(papersDir, { recursive: true });
        
        // ファイル名を生成（DOI/arXiv ID/PMC IDから）
        const fileName = parsed.data.arxivId 
          ? `arxiv-${parsed.data.arxivId.replace(/[/:]/g, '-')}.pdf`
          : parsed.data.doi
            ? `doi-${parsed.data.doi.replace(/[/:]/g, '-')}.pdf`
            : parsed.data.pmcId
              ? `${parsed.data.pmcId}.pdf`
              : `paper-${Date.now()}.pdf`;
        
        finalOutputPath = path.join(papersDir, fileName);
      }

      if (finalOutputPath) {
        const downloaded = await downloadPdfToPath(
          resolved.value.pdfUrl,
          finalOutputPath,
          {
            ...(parsed.data.timeoutMs ? { timeoutMs: parsed.data.timeoutMs } : {}),
          },
        );

        if (!downloaded.ok) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: downloaded.error,
                    resolved: resolved.value,
                    note: 'PDF URL resolved but download failed',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  result: resolved.value,
                  download: downloaded.value,
                  ...(parsed.data.experimentId ? { experimentId: parsed.data.experimentId } : {}),
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                result: resolved.value,
                outputPath: finalOutputPath,
                note: finalOutputPath ? undefined : 'Resolved PDF URL only (no download requested)',
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'paper_import': {
      const pdfPath = args.pdfPath;
      if (typeof pdfPath !== 'string' || !pdfPath) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: { code: 'INVALID_REQUEST', message: 'pdfPath is required' } },
                null,
                2,
              ),
            },
          ],
        };
      }

      // 実験IDが指定された場合、実験ごとのディレクトリに出力
      const experimentId = typeof args.experimentId === 'string' ? args.experimentId : undefined;
      const fs = await import('node:fs/promises');
      
      let outputDir = typeof args.outputDir === 'string' ? args.outputDir : undefined;
      
      if (experimentId) {
        // 実験IDから実験データディレクトリのpapersフォルダを使用
        const storage = getExperimentStorage();
        outputDir = storage.getExperimentPapersDir(experimentId);
        
        // ディレクトリを作成（通常は実験作成時に作成済み）
        await fs.mkdir(outputDir, { recursive: true });
      }
      
      const converted = await convertPdfToMarkdown({
        pdfPath,
        ...(outputDir ? { outputDir } : {}),
      });

      if (!converted.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: converted.error,
                  note: converted.error.code === 'NOT_INSTALLED'
                    ? 'Install docling: pip install docling'
                    : undefined,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                pdfPath,
                markdownPath: converted.value.markdownPath,
                ...(converted.value.assetsDir ? { assetsDir: converted.value.assetsDir } : {}),
                ...(experimentId ? { experimentId, outputDir } : {}),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'paper_analyze': {
      // TODO: 実際の論文分析を実装
      const result = {
        success: true,
        paperId: args.paperId,
        message: 'Paper analysis will be implemented',
        analysis: {
          extractFigures: args.extractFigures ?? true,
          extractTables: args.extractTables ?? true,
          extractEquations: args.extractEquations ?? true,
        },
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }

    case 'paper_search': {
      const query = args.query as string;
      const limit = (args.limit as number) ?? 10;
      const sortBy = (args.sortBy as string) ?? 'relevance';

      // 年フィルターを構築
      let yearFilter: string | undefined;
      const dateFrom = args.dateFrom as string | undefined;
      const dateTo = args.dateTo as string | undefined;
      if (dateFrom && dateTo) {
        const yearFrom = dateFrom.split('-')[0];
        const yearTo = dateTo.split('-')[0];
        yearFilter = `${yearFrom}-${yearTo}`;
      } else if (dateFrom) {
        const yearFrom = dateFrom.split('-')[0];
        yearFilter = `${yearFrom}-`;
      } else if (dateTo) {
        const yearTo = dateTo.split('-')[0];
        yearFilter = `-${yearTo}`;
      }

      // Semantic Scholar で検索
      const searchRequest: { 
        query: string; 
        limit: number; 
        year?: string; 
        fieldsOfStudy?: string[];
      } = {
        query,
        limit,
      };
      
      if (yearFilter) {
        searchRequest.year = yearFilter;
      }
      
      if (args.categories) {
        searchRequest.fieldsOfStudy = args.categories as string[];
      }

      const searchResult = await searchPapers(searchRequest);

      if (!searchResult.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: searchResult.error,
              query,
            }, null, 2),
          }],
        };
      }

      // ソート（Semantic Scholar はデフォルトで relevance）
      let papers = searchResult.value.papers;
      if (sortBy === 'date') {
        papers = papers.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      } else if (sortBy === 'citations') {
        papers = papers.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0));
      }

      // 著者フィルタ（クライアント側でフィルタリング）
      const authorFilter = args.authors as string[] | undefined;
      if (authorFilter && authorFilter.length > 0) {
        const lowerAuthors = authorFilter.map(a => a.toLowerCase());
        papers = papers.filter(p =>
          p.authors.some(a => 
            lowerAuthors.some(f => a.name.toLowerCase().includes(f))
          )
        );
      }

      // キーワードフィルタ（タイトル・アブストラクトで検索）
      const keywordFilter = args.keywords as string[] | undefined;
      if (keywordFilter && keywordFilter.length > 0) {
        const lowerKeywords = keywordFilter.map(k => k.toLowerCase());
        papers = papers.filter(p => {
          const text = `${p.title} ${p.abstract ?? ''}`.toLowerCase();
          return lowerKeywords.every(k => text.includes(k));
        });
      }

      // 結果をサマリー化
      const results = papers.map(p => ({
        paperId: p.paperId,
        title: p.title,
        authors: p.authors.map(a => a.name).join(', '),
        year: p.year,
        venue: p.venue,
        citationCount: p.citationCount,
        isOpenAccess: p.isOpenAccess,
        openAccessPdfUrl: p.openAccessPdf?.url,
        abstract: p.abstract ? (p.abstract.length > 200 ? p.abstract.substring(0, 200) + '...' : p.abstract) : undefined,
        tldr: p.tldr?.text,
        fieldsOfStudy: p.fieldsOfStudy,
        externalIds: p.externalIds,
        url: p.url,
      }));

      const response = {
        success: true,
        query,
        filters: {
          categories: args.categories,
          authors: args.authors,
          dateFrom: args.dateFrom,
          dateTo: args.dateTo,
          keywords: args.keywords,
        },
        sortBy,
        results,
        returned: results.length,
        total: searchResult.value.total,
        source: 'Semantic Scholar',
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown paper tool: ${name}`);
  }
}
