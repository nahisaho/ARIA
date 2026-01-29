import { z } from 'zod';

/**
 * 知識タイプ
 */
export const KnowledgeTypeSchema = z.enum([
  'concept',
  'method',
  'finding',
  'relation',
]);

export type KnowledgeType = z.infer<typeof KnowledgeTypeSchema>;

/**
 * ソースタイプ
 */
export const SourceTypeSchema = z.enum([
  'paper',
  'experiment',
  'conversation',
  'url',
  'manual',
]);

export type SourceType = z.infer<typeof SourceTypeSchema>;

/**
 * 関係タイプ
 */
export const RelationTypeSchema = z.enum([
  'is_a',
  'variant_of',
  'part_of',
  'uses',
  'related_to',
  'precedes',
  'follows',
  'contradicts',
  'supports',
  'derived_from',
]);

export type RelationType = z.infer<typeof RelationTypeSchema>;

/**
 * 信頼度レベル
 */
export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

/**
 * 知識関係
 */
export const KnowledgeRelationSchema = z.object({
  type: RelationTypeSchema,
  target: z.string(),
  description: z.string().optional(),
  bidirectional: z.boolean().default(false),
});

export type KnowledgeRelation = z.infer<typeof KnowledgeRelationSchema>;

/**
 * 基本知識エンティティ
 */
const BaseKnowledgeEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  aliases: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceType: SourceTypeSchema.optional(),
  tags: z.array(z.string()),
  relations: z.array(KnowledgeRelationSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * 概念エンティティ
 */
export const ConceptEntitySchema = BaseKnowledgeEntitySchema.extend({
  type: z.literal('concept'),
  category: z.string().optional(),
});

export type ConceptEntity = z.infer<typeof ConceptEntitySchema>;

/**
 * 手法エンティティ
 */
export const MethodEntitySchema = BaseKnowledgeEntitySchema.extend({
  type: z.literal('method'),
  purpose: z.string().optional(),
  steps: z.array(z.string()).optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
});

export type MethodEntity = z.infer<typeof MethodEntitySchema>;

/**
 * 発見エンティティ
 */
export const FindingEntitySchema = BaseKnowledgeEntitySchema.extend({
  type: z.literal('finding'),
  evidence: z.string().optional(),
  conditions: z.string().optional(),
  implications: z.array(z.string()).optional(),
  confidence: ConfidenceLevelSchema.optional(),
});

export type FindingEntity = z.infer<typeof FindingEntitySchema>;

/**
 * 関係エンティティ
 */
export const RelationEntitySchema = z.object({
  id: z.string().uuid(),
  type: z.literal('relation'),
  fromEntity: z.string(),
  toEntity: z.string(),
  relationType: RelationTypeSchema,
  description: z.string().optional(),
  bidirectional: z.boolean().default(false),
  source: z.string().optional(),
  sourceType: SourceTypeSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RelationEntity = z.infer<typeof RelationEntitySchema>;

/**
 * 知識エンティティ（統合型）
 */
export const KnowledgeEntitySchema = z.discriminatedUnion('type', [
  ConceptEntitySchema,
  MethodEntitySchema,
  FindingEntitySchema,
]);

export type KnowledgeEntity = z.infer<typeof KnowledgeEntitySchema>;

/**
 * 知識追加入力
 */
export const AddKnowledgeInputSchema = z.object({
  type: KnowledgeTypeSchema,
  name: z.string(),
  description: z.string(),
  aliases: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceType: SourceTypeSchema.optional(),
  tags: z.array(z.string()).default([]),

  // type-specific fields
  category: z.string().optional(), // concept
  purpose: z.string().optional(), // method
  steps: z.array(z.string()).optional(), // method
  evidence: z.string().optional(), // finding
  conditions: z.string().optional(), // finding
  confidence: ConfidenceLevelSchema.optional(), // finding

  // relation (when type === 'relation')
  fromEntity: z.string().optional(),
  toEntity: z.string().optional(),
  relationType: RelationTypeSchema.optional(),
});

export type AddKnowledgeInput = z.infer<typeof AddKnowledgeInputSchema>;

/**
 * 知識検索入力
 */
export const SearchKnowledgeInputSchema = z.object({
  query: z.string(),
  types: z.array(KnowledgeTypeSchema).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  semantic: z.boolean().default(true),
});

export type SearchKnowledgeInput = z.infer<typeof SearchKnowledgeInputSchema>;
