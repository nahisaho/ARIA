/**
 * ARIA MCP Tools - Knowledge
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { KnowledgeStorageService, type KnowledgeType, type RelationType, type SourceType, type ConfidenceLevel } from '@aria/core';
import { join } from 'path';

// ストレージサービスのインスタンス
let knowledgeStorage: KnowledgeStorageService | null = null;

/**
 * ストレージサービスを初期化
 */
export function initKnowledgeStorage(basePath: string): void {
  knowledgeStorage = new KnowledgeStorageService({
    basePath: join(basePath, 'knowledge'),
  });
}

/**
 * デフォルトストレージパスで初期化
 */
function ensureStorage(): KnowledgeStorageService {
  if (!knowledgeStorage) {
    const basePath = process.env.ARIA_STORAGE_PATH ?? process.cwd();
    initKnowledgeStorage(join(basePath, 'storage'));
  }
  return knowledgeStorage!;
}

export const knowledgeTools: Tool[] = [
  {
    name: 'knowledge_add',
    description: 'Add a new knowledge entity (concept, method, finding, or relation) to the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['concept', 'method', 'finding', 'relation'],
          description: 'Type of knowledge entity',
        },
        name: {
          type: 'string',
          description: 'Name of the knowledge entity',
        },
        description: {
          type: 'string',
          description: 'Detailed description',
        },
        aliases: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alternative names',
        },
        source: {
          type: 'string',
          description: 'Source of the knowledge (paper ID, experiment ID, URL)',
        },
        sourceType: {
          type: 'string',
          enum: ['paper', 'experiment', 'conversation', 'url', 'manual'],
          description: 'Type of the source',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization',
        },
        // Type-specific fields
        category: {
          type: 'string',
          description: 'Category (for concept type)',
        },
        purpose: {
          type: 'string',
          description: 'Purpose (for method type)',
        },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Steps (for method type)',
        },
        evidence: {
          type: 'string',
          description: 'Evidence (for finding type)',
        },
        conditions: {
          type: 'string',
          description: 'Conditions (for finding type)',
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Confidence level (for finding type)',
        },
        // For relation type
        fromEntity: {
          type: 'string',
          description: 'Source entity name (for relation type)',
        },
        toEntity: {
          type: 'string',
          description: 'Target entity name (for relation type)',
        },
        relationType: {
          type: 'string',
          enum: ['is_a', 'variant_of', 'part_of', 'uses', 'related_to', 'precedes', 'follows', 'contradicts', 'supports', 'derived_from'],
          description: 'Type of relation (for relation type)',
        },
      },
      required: ['type', 'name', 'description'],
    },
  },
  {
    name: 'knowledge_search',
    description: 'Search the knowledge base for entities matching the query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        types: {
          type: 'array',
          items: { type: 'string', enum: ['concept', 'method', 'finding', 'relation'] },
          description: 'Filter by knowledge types',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
        semantic: {
          type: 'boolean',
          description: 'Whether to use semantic search',
          default: true,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'knowledge_relate',
    description: 'Add a relation between two existing knowledge entities',
    inputSchema: {
      type: 'object',
      properties: {
        fromEntity: {
          type: 'string',
          description: 'Name or ID of the source entity',
        },
        toEntity: {
          type: 'string',
          description: 'Name or ID of the target entity',
        },
        relationType: {
          type: 'string',
          enum: ['is_a', 'variant_of', 'part_of', 'uses', 'related_to', 'precedes', 'follows', 'contradicts', 'supports', 'derived_from'],
          description: 'Type of relation',
        },
        description: {
          type: 'string',
          description: 'Description of the relation',
        },
        bidirectional: {
          type: 'boolean',
          description: 'Whether the relation is bidirectional',
          default: false,
        },
        source: {
          type: 'string',
          description: 'Source of this relation knowledge',
        },
      },
      required: ['fromEntity', 'toEntity', 'relationType'],
    },
  },
  {
    name: 'knowledge_update',
    description: 'Update an existing knowledge entity',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the entity to update',
        },
        name: {
          type: 'string',
          description: 'Name to search for (if ID not provided)',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        aliases: {
          type: 'array',
          items: { type: 'string' },
          description: 'New aliases',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags',
        },
      },
    },
  },
];

export async function handleKnowledgeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const storage = ensureStorage();

  switch (name) {
    case 'knowledge_add': {
      const result = await storage.add({
        type: args.type as KnowledgeType,
        name: args.name as string,
        description: args.description as string,
        aliases: args.aliases as string[] | undefined,
        source: args.source as string | undefined,
        sourceType: args.sourceType as SourceType | undefined,
        tags: (args.tags as string[]) ?? [],
        category: args.category as string | undefined,
        purpose: args.purpose as string | undefined,
        steps: args.steps as string[] | undefined,
        evidence: args.evidence as string | undefined,
        conditions: args.conditions as string | undefined,
        confidence: args.confidence as ConfidenceLevel | undefined,
        fromEntity: args.fromEntity as string | undefined,
        toEntity: args.toEntity as string | undefined,
        relationType: args.relationType as RelationType | undefined,
      });

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const entity = result.value;
      const response = {
        success: true,
        type: entity.type,
        name: 'name' in entity ? entity.name : `${entity.fromEntity} -> ${entity.toEntity}`,
        id: entity.id,
        createdAt: entity.createdAt,
        message: `Knowledge entity "${args.name}" added successfully`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'knowledge_search': {
      const result = await storage.search({
        query: args.query as string,
        types: args.types as KnowledgeType[] | undefined,
        tags: args.tags as string[] | undefined,
        limit: args.limit as number | undefined,
      });

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const { entities, relations, total } = result.value;

      // エンティティをサマリー化
      const entitySummaries = entities.map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        description: e.description.substring(0, 100) + (e.description.length > 100 ? '...' : ''),
        tags: e.tags,
      }));

      // 関係をサマリー化
      const relationSummaries = relations.map(r => ({
        id: r.id,
        from: r.fromEntity,
        to: r.toEntity,
        type: r.relationType,
      }));

      const response = {
        success: true,
        query: args.query,
        filters: {
          types: args.types,
          tags: args.tags,
        },
        limit: args.limit ?? 10,
        semantic: args.semantic ?? true,
        entities: entitySummaries,
        relations: relationSummaries,
        total,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'knowledge_relate': {
      const result = await storage.relate({
        fromEntity: args.fromEntity as string,
        toEntity: args.toEntity as string,
        relationType: args.relationType as RelationType,
        description: args.description as string | undefined,
        bidirectional: args.bidirectional as boolean | undefined,
        source: args.source as string | undefined,
      });

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const relation = result.value;
      const response = {
        success: true,
        relation: {
          id: relation.id,
          from: relation.fromEntity,
          to: relation.toEntity,
          type: relation.relationType,
          bidirectional: relation.bidirectional,
        },
        createdAt: relation.createdAt,
        message: `Relation "${relation.fromEntity}" --[${relation.relationType}]--> "${relation.toEntity}" added successfully`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    case 'knowledge_update': {
      const result = await storage.update({
        id: args.id as string | undefined,
        name: args.name as string | undefined,
        description: args.description as string | undefined,
        aliases: args.aliases as string[] | undefined,
        tags: args.tags as string[] | undefined,
      });

      if (!result.ok) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: result.error }, null, 2),
          }],
        };
      }

      const entity = result.value;
      const response = {
        success: true,
        id: entity.id,
        name: entity.name,
        updatedAt: entity.updatedAt,
        message: `Knowledge entity "${entity.name}" updated successfully`,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown knowledge tool: ${name}`);
  }
}
