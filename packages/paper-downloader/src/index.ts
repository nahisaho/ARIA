export type {
  PaperIdentifier,
  PaperDownloadRequest,
  PaperDownloadResult,
  PaperDownloadError,
  PaperDownloader,
  // Search types
  Paper,
  PaperAuthor,
  PaperSearchRequest,
  PaperSearchResult,
  PaperSearchError,
} from './types.js';

export { resolveOpenAccessPdf } from './resolver.js';
export { downloadPdfToPath } from './downloader.js';
export {
  SemanticScholarClient,
  semanticScholar,
  searchPapers,
  getPaper,
} from './searcher.js';
