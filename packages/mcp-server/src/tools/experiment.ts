/**
 * ARIA MCP Tools - Experiment
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ExperimentStorageService, type ExperimentCategory } from '@aria/core';
import { join } from 'path';

// ストレージサービスのインスタンス（初期化時に設定）
let experimentStorage: ExperimentStorageService | null = null;

/**
 * ストレージサービスを初期化
 */
export function initExperimentStorage(basePath: string): void {
  experimentStorage = new ExperimentStorageService({
    basePath: join(basePath, 'experiments'),
  });
}

/**
 * デフォルトストレージパスで初期化
 */
function ensureStorage(): ExperimentStorageService {
  if (!experimentStorage) {
    // デフォルトは現在の作業ディレクトリの storage/experiments
    const basePath = process.env.ARIA_STORAGE_PATH ?? process.cwd();
    initExperimentStorage(join(basePath, 'storage'));
  }
  return experimentStorage!;
}

export const experimentTools: Tool[] = [
  {
    name: 'experiment_create',
    description: 'Create a new experiment log to record research activities and Copilot interactions',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the experiment',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the experiment',
        },
        category: {
          type: 'string',
          enum: ['hypothesis', 'data-collection', 'analysis', 'visualization', 'model-training', 'evaluation', 'other'],
          description: 'Category of the experiment',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization and search',
        },
        hypothesis: {
          type: 'string',
          description: 'Hypothesis being tested (if applicable)',
        },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'experiment_update',
    description: 'Update an existing experiment log with new data, observations, or conclusions',
    inputSchema: {
      type: 'object',
      properties: {
        experimentId: {
          type: 'string',
          description: 'ID of the experiment to update (e.g., EXP-2026-01-28-001)',
        },
        inputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['file', 'parameter', 'data', 'reference'] },
              value: { type: ['string', 'number', 'boolean', 'object'] },
            },
          },
          description: 'Input parameters or data for the experiment',
        },
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['file', 'metric', 'visualization', 'model'] },
              value: { type: ['string', 'number', 'object'] },
            },
          },
          description: 'Output results or metrics from the experiment',
        },
        observations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Observations made during the experiment',
        },
        conclusions: {
          type: 'string',
          description: 'Conclusions drawn from the experiment',
        },
      },
      required: ['experimentId'],
    },
  },
  {
    name: 'experiment_search',
    description: 'Search for experiment logs by query, tags, or date range',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        category: {
          type: 'string',
          enum: ['hypothesis', 'data-collection', 'analysis', 'visualization', 'model-training', 'evaluation', 'other'],
          description: 'Filter by category',
        },
        dateFrom: {
          type: 'string',
          description: 'Filter by start date (YYYY-MM-DD)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter by end date (YYYY-MM-DD)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
      },
    },
  },
];

export async function handleExperimentTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const storage = ensureStorage();

  switch (name) {
    case 'experiment_create': {
      const result = await storage.create({
        title: args.title as string,
        description: args.description as string | undefined,
        category: args.category as ExperimentCategory,
        tags: (args.tags as string[]) ?? [],
        hypothesis: args.hypothesis as string | undefined,
      });

      if (!result.ok) {
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const exp = result.value;
      const response = {
        success: true,
        experimentId: exp.experimentId,
        title: exp.title,
        category: exp.category,
        tags: exp.tags,
        createdAt: exp.createdAt,
        message: `Experiment "${exp.title}" created successfully`,
        path: `storage/experiments/${exp.date.replace(/-/g, '/')}/${exp.experimentId}.yaml`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'experiment_update': {
      const experimentId = args.experimentId as string;
      
      const result = await storage.update(experimentId, {
        inputs: args.inputs as Array<{ name: string; type: string; value: unknown }> | undefined,
        outputs: args.outputs as Array<{ name: string; type: string; value: unknown }> | undefined,
        observations: args.observations as string[] | undefined,
        conclusions: args.conclusions as string | undefined,
      });

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const exp = result.value;
      const response = {
        success: true,
        experimentId: exp.experimentId,
        title: exp.title,
        version: exp.version,
        updatedAt: exp.updatedAt,
        updated: {
          inputs: exp.inputs.length,
          outputs: exp.outputs.length,
          observations: exp.observations.length,
          hasConclusions: !!exp.conclusions,
        },
        message: `Experiment ${experimentId} updated successfully`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'experiment_search': {
      const limit = (args.limit as number) ?? 10;
      
      const result = await storage.search({
        query: args.query as string | undefined,
        tags: args.tags as string[] | undefined,
        category: args.category as ExperimentCategory | undefined,
        dateFrom: args.dateFrom as string | undefined,
        dateTo: args.dateTo as string | undefined,
      }, limit);

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const { experiments, total } = result.value;
      
      // 検索結果をサマリー化
      const summaries = experiments.map(exp => ({
        experimentId: exp.experimentId,
        title: exp.title,
        category: exp.category,
        date: exp.date,
        tags: exp.tags,
        hasConclusions: !!exp.conclusions,
        observationCount: exp.observations.length,
      }));

      const response = {
        success: true,
        query: args.query ?? '*',
        filters: {
          tags: args.tags,
          category: args.category,
          dateFrom: args.dateFrom,
          dateTo: args.dateTo,
        },
        results: summaries,
        returned: summaries.length,
        total,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown experiment tool: ${name}`);
  }
}
