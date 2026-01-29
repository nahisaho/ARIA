import { z } from 'zod';

/**
 * 著者情報
 */
export const AuthorSchema = z.object({
  name: z.string(),
  affiliation: z.string().optional(),
  email: z.string().email().optional(),
  orcid: z.string().optional(),
});

export type Author = z.infer<typeof AuthorSchema>;

/**
 * セクション情報
 */
export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().int().min(1).max(6),
  content: z.string().optional(),
  startLine: z.number().int().optional(),
  endLine: z.number().int().optional(),
  summary: z.string().optional(),
});

export type Section = z.infer<typeof SectionSchema>;

/**
 * 図情報
 */
export const FigureSchema = z.object({
  id: z.string(),
  caption: z.string(),
  path: z.string().optional(),
  pageNumber: z.number().int().optional(),
});

export type Figure = z.infer<typeof FigureSchema>;

/**
 * テーブル情報
 */
export const TableSchema = z.object({
  id: z.string(),
  caption: z.string(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  pageNumber: z.number().int().optional(),
});

export type Table = z.infer<typeof TableSchema>;

/**
 * 数式情報
 */
export const EquationSchema = z.object({
  id: z.string(),
  latex: z.string(),
  description: z.string().optional(),
  inline: z.boolean(),
});

export type Equation = z.infer<typeof EquationSchema>;

/**
 * 参考文献情報
 */
export const ReferenceSchema = z.object({
  id: z.string(),
  citation: z.string(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  title: z.string().optional(),
  authors: z.array(z.string()).optional(),
  year: z.number().int().optional(),
});

export type Reference = z.infer<typeof ReferenceSchema>;

/**
 * 処理ステータス
 */
export const ProcessingStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);

export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;

/**
 * 論文データ
 */
export const PaperSchema = z.object({
  id: z.string().uuid(),
  paperId: z.string(), // DOI or arXiv ID

  // 基本メタデータ
  title: z.string(),
  authors: z.array(AuthorSchema),
  abstract: z.string(),
  publishedDate: z.string().optional(),
  venue: z.string().optional(),

  // 分類
  categories: z.array(z.string()),
  keywords: z.array(z.string()),

  // 文書構造
  sections: z.array(SectionSchema),
  figures: z.array(FigureSchema),
  tables: z.array(TableSchema),
  equations: z.array(EquationSchema),

  // 引用関係
  references: z.array(ReferenceSchema),
  citedBy: z.array(z.string()).optional(),

  // ファイル情報
  originalPath: z.string(),
  markdownPath: z.string(),

  // 処理情報
  processedAt: z.string().datetime(),
  processingStatus: ProcessingStatusSchema,

  // GraphRAG用
  embeddingId: z.string().optional(),
  graphNodeId: z.string().optional(),
});

export type Paper = z.infer<typeof PaperSchema>;

/**
 * 論文インポート入力
 */
export const ImportPaperInputSchema = z.object({
  pdfPath: z.string(),
  paperId: z.string().optional(), // DOI or arXiv ID
  categories: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export type ImportPaperInput = z.infer<typeof ImportPaperInputSchema>;

/**
 * 論文検索入力
 */
export const SearchPaperInputSchema = z.object({
  query: z.string(),
  filters: z
    .object({
      categories: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['relevance', 'date', 'citations']).default('relevance'),
});

export type SearchPaperInput = z.infer<typeof SearchPaperInputSchema>;
