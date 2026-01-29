export type GraphRagDocument = {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
};

export type GraphRagIndexInput = {
  documents: GraphRagDocument[];
  workDir?: string;
  config?: GraphRagConfig;
};

export type GraphRagConfig = {
  llmModel?: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  communityLevel?: number;
};

export type GraphRagQueryInput = {
  query: string;
  mode?: 'local' | 'global' | 'drift';
  workDir?: string;
  topK?: number;
  communityLevel?: number;
};

export type GraphRagQueryResult = {
  answer: string;
  mode: 'local' | 'global' | 'drift';
  citations?: Array<{ documentId: string; snippet?: string }>;
  entities?: Array<{ name: string; type?: string; description?: string }>;
  communities?: Array<{ id: string; summary?: string }>;
};

export type GraphRagErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_READY'
  | 'NOT_INSTALLED'
  | 'INDEX_NOT_FOUND'
  | 'QUERY_FAILED'
  | 'UNKNOWN';

export type GraphRagError = {
  code: GraphRagErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

