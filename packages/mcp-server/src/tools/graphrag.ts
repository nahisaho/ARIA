/**
 * ARIA MCP Tools - GraphRAG
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  buildGraphRagIndex,
  queryGraphRag,
  queryGraphRagLocal,
  queryGraphRagGlobal,
} from '@aria/graphrag';
import type { GraphRagDocument } from '@aria/graphrag';

export const graphragTools: Tool[] = [
  {
    name: 'graphrag_index',
    description: 'Index documents into the GraphRAG knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        documentPaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to documents to index',
        },
        paperIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of papers to index',
        },
        experimentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of experiments to index',
        },
        rebuildIndex: {
          type: 'boolean',
          description: 'Whether to rebuild the entire index',
          default: false,
        },
      },
    },
  },
  {
    name: 'graphrag_query',
    description: 'Query the knowledge graph with automatic mode selection',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The question to answer',
        },
        mode: {
          type: 'string',
          enum: ['auto', 'local', 'global', 'drift'],
          description: 'Query mode (auto will select based on query type)',
          default: 'auto',
        },
        contextTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to filter the search context',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'graphrag_local',
    description: 'Perform a local search for specific entity or concept details',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query for detailed information',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
        similarityThreshold: {
          type: 'number',
          description: 'Minimum similarity score (0-1)',
          default: 0.7,
        },
        includeTextUnits: {
          type: 'boolean',
          description: 'Whether to include source text units',
          default: true,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'graphrag_global',
    description: 'Perform a global search for broad topic summaries using community structure',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The query for overview/summary information',
        },
        communityLevel: {
          type: 'number',
          description: 'Level of community granularity (1-5)',
          default: 2,
        },
        maxSummaries: {
          type: 'number',
          description: 'Maximum number of community summaries to use',
          default: 5,
        },
        useCached: {
          type: 'boolean',
          description: 'Whether to use cached summaries',
          default: true,
        },
      },
      required: ['query'],
    },
  },
];

export async function handleGraphRAGTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    case 'graphrag_index': {
      const documentPaths = args.documentPaths as string[] | undefined;
      const workDir = args.workDir as string | undefined;

      if (!documentPaths || documentPaths.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: { code: 'INVALID_INPUT', message: 'documentPaths is required' },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Read documents and build index
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const documents: GraphRagDocument[] = [];

      for (const docPath of documentPaths) {
        try {
          const content = await fs.readFile(docPath, 'utf-8');
          documents.push({
            id: path.basename(docPath, path.extname(docPath)),
            text: content,
            metadata: { path: docPath },
          });
        } catch (e) {
          // Skip files that can't be read
        }
      }

      if (documents.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: { code: 'INVALID_INPUT', message: 'No readable documents found' },
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const result = await buildGraphRagIndex({
        documents,
        ...(workDir ? { workDir } : {}),
      });

      if (!result.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: result.error,
                  note: result.error.code === 'NOT_INSTALLED'
                    ? 'Install graphrag: pip install graphrag'
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
                indexId: result.value.indexId,
                outputDir: result.value.outputDir,
                documentsProcessed: result.value.documentsProcessed,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'graphrag_query': {
      const query = args.query as string | undefined;
      const mode = (args.mode as 'local' | 'global' | 'drift' | 'auto') ?? 'auto';
      const workDir = args.workDir as string | undefined;
      const communityLevel = args.communityLevel as number | undefined;

      if (!query) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: { code: 'INVALID_INPUT', message: 'query is required' } },
                null,
                2,
              ),
            },
          ],
        };
      }

      // Auto mode: use local for specific queries, global for broad queries
      const effectiveMode = mode === 'auto' ? 'local' : mode;

      const result = await queryGraphRag({
        query,
        mode: effectiveMode,
        ...(workDir ? { workDir } : {}),
        ...(communityLevel ? { communityLevel } : {}),
      });

      if (!result.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: result.error,
                  note: result.error.code === 'NOT_INSTALLED'
                    ? 'Install graphrag: pip install graphrag'
                    : result.error.code === 'INDEX_NOT_FOUND'
                      ? 'Run graphrag_index first to build the knowledge graph'
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
                query,
                mode: effectiveMode,
                answer: result.value.answer,
                ...(result.value.entities ? { entities: result.value.entities } : {}),
                ...(result.value.communities ? { communities: result.value.communities } : {}),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'graphrag_local': {
      const query = args.query as string | undefined;
      const workDir = args.workDir as string | undefined;
      const communityLevel = args.communityLevel as number | undefined;

      if (!query) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: { code: 'INVALID_INPUT', message: 'query is required' } },
                null,
                2,
              ),
            },
          ],
        };
      }

      const result = await queryGraphRagLocal({
        query,
        ...(workDir ? { workDir } : {}),
        ...(communityLevel ? { communityLevel } : {}),
      });

      if (!result.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: result.error,
                  note: result.error.code === 'NOT_INSTALLED'
                    ? 'Install graphrag: pip install graphrag'
                    : result.error.code === 'INDEX_NOT_FOUND'
                      ? 'Run graphrag_index first to build the knowledge graph'
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
                query,
                mode: 'local',
                answer: result.value.answer,
                ...(result.value.entities ? { entities: result.value.entities } : {}),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'graphrag_global': {
      const query = args.query as string | undefined;
      const workDir = args.workDir as string | undefined;
      const communityLevel = args.communityLevel as number | undefined;

      if (!query) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: false, error: { code: 'INVALID_INPUT', message: 'query is required' } },
                null,
                2,
              ),
            },
          ],
        };
      }

      const result = await queryGraphRagGlobal({
        query,
        ...(workDir ? { workDir } : {}),
        ...(communityLevel ? { communityLevel } : {}),
      });

      if (!result.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: result.error,
                  note: result.error.code === 'NOT_INSTALLED'
                    ? 'Install graphrag: pip install graphrag'
                    : result.error.code === 'INDEX_NOT_FOUND'
                      ? 'Run graphrag_index first to build the knowledge graph'
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
                query,
                mode: 'global',
                answer: result.value.answer,
                ...(result.value.communities ? { communities: result.value.communities } : {}),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown graphrag tool: ${name}`);
  }
}
