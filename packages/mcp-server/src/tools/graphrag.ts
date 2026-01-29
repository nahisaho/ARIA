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
import { ExperimentStorageService, type ExperimentLog } from '@aria/core';
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

/**
 * 実験ログをGraphRAGドキュメント形式に変換
 */
function experimentToDocument(experiment: ExperimentLog): GraphRagDocument {
  const sections: string[] = [];
  
  sections.push(`# ${experiment.title}`);
  sections.push(`実験ID: ${experiment.experimentId}`);
  sections.push(`カテゴリ: ${experiment.category}`);
  sections.push(`日付: ${experiment.date}`);
  
  if (experiment.tags && experiment.tags.length > 0) {
    sections.push(`タグ: ${experiment.tags.join(', ')}`);
  }
  
  if (experiment.description) {
    sections.push(`\n## 説明\n${experiment.description}`);
  }
  
  if (experiment.hypothesis) {
    sections.push(`\n## 仮説\n${experiment.hypothesis}`);
  }
  
  if (experiment.methodology) {
    sections.push(`\n## 方法論\n${experiment.methodology}`);
  }
  
  if (experiment.inputs && experiment.inputs.length > 0) {
    sections.push('\n## 入力');
    for (const input of experiment.inputs) {
      sections.push(`- ${input.name} (${input.type}): ${JSON.stringify(input.value)}`);
    }
  }
  
  if (experiment.outputs && experiment.outputs.length > 0) {
    sections.push('\n## 出力');
    for (const output of experiment.outputs) {
      sections.push(`- ${output.name} (${output.type}): ${JSON.stringify(output.value)}`);
    }
  }
  
  if (experiment.observations && experiment.observations.length > 0) {
    sections.push('\n## 観察');
    for (const obs of experiment.observations) {
      sections.push(`- ${obs}`);
    }
  }
  
  if (experiment.conclusions) {
    sections.push(`\n## 結論\n${experiment.conclusions}`);
  }
  
  return {
    id: experiment.experimentId,
    text: sections.join('\n'),
    metadata: {
      type: 'experiment',
      experimentId: experiment.experimentId,
      category: experiment.category,
      tags: experiment.tags,
      date: experiment.date,
    },
  };
}

export const graphragTools: Tool[] = [
  {
    name: 'graphrag_index',
    description: 'Index documents or experiment logs into the GraphRAG knowledge graph. You can index document files, experiment logs, or both.',
    inputSchema: {
      type: 'object',
      properties: {
        documentPaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Paths to documents to index (e.g., paper markdown files)',
        },
        paperIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of papers to index',
        },
        experimentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of experiments to index (e.g., EXP-2026-01-30-001). Each experiment will be converted to a document for indexing.',
        },
        workDir: {
          type: 'string',
          description: 'Working directory for the index (optional, default: ./graphrag_index)',
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
      const experimentIds = args.experimentIds as string[] | undefined;
      const workDir = args.workDir as string | undefined;

      // documentPaths または experimentIds のどちらかが必要
      if ((!documentPaths || documentPaths.length === 0) && (!experimentIds || experimentIds.length === 0)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: { code: 'INVALID_INPUT', message: 'documentPaths or experimentIds is required' },
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

      // ファイルパスからドキュメントを読み込み
      if (documentPaths && documentPaths.length > 0) {
        for (const docPath of documentPaths) {
          try {
            const content = await fs.readFile(docPath, 'utf-8');
            documents.push({
              id: path.basename(docPath, path.extname(docPath)),
              text: content,
              metadata: { path: docPath, type: 'document' },
            });
          } catch (e) {
            // Skip files that can't be read
          }
        }
      }

      // 実験IDから実験ノートを読み込み
      if (experimentIds && experimentIds.length > 0) {
        const storage = getExperimentStorage();
        for (const expId of experimentIds) {
          const result = await storage.get(expId);
          if (result.ok) {
            documents.push(experimentToDocument(result.value));
          }
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
                  error: { code: 'INVALID_INPUT', message: 'No readable documents or experiments found' },
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
