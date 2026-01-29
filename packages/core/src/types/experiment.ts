import { z } from 'zod';

/**
 * 実験カテゴリ
 */
export const ExperimentCategorySchema = z.enum([
  'hypothesis',
  'data-collection',
  'analysis',
  'visualization',
  'model-training',
  'evaluation',
  'other',
]);

export type ExperimentCategory = z.infer<typeof ExperimentCategorySchema>;

/**
 * Copilot対話タイプ
 */
export const InteractionTypeSchema = z.enum([
  'prompt',
  'response',
  'code',
  'error',
]);

export type InteractionType = z.infer<typeof InteractionTypeSchema>;

/**
 * Copilot対話
 */
export const CopilotInteractionSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  type: InteractionTypeSchema,
  content: z.string(),
  model: z.string().optional(),
  tokens: z
    .object({
      prompt: z.number(),
      completion: z.number(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CopilotInteraction = z.infer<typeof CopilotInteractionSchema>;

/**
 * 実験入力タイプ
 */
export const ExperimentInputTypeSchema = z.enum([
  'file',
  'parameter',
  'data',
  'reference',
]);

export type ExperimentInputType = z.infer<typeof ExperimentInputTypeSchema>;

/**
 * 実験入力
 */
export const ExperimentInputSchema = z.object({
  name: z.string(),
  type: ExperimentInputTypeSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  source: z.string().optional(),
  description: z.string().optional(),
});

export type ExperimentInput = z.infer<typeof ExperimentInputSchema>;

/**
 * 実験出力タイプ
 */
export const ExperimentOutputTypeSchema = z.enum([
  'file',
  'metric',
  'visualization',
  'model',
]);

export type ExperimentOutputType = z.infer<typeof ExperimentOutputTypeSchema>;

/**
 * 実験出力
 */
export const ExperimentOutputSchema = z.object({
  name: z.string(),
  type: ExperimentOutputTypeSchema,
  value: z.union([z.string(), z.number(), z.record(z.unknown())]),
  path: z.string().optional(),
  unit: z.string().optional(),
});

export type ExperimentOutput = z.infer<typeof ExperimentOutputSchema>;

/**
 * 実験ログ
 */
export const ExperimentLogSchema = z.object({
  // ID
  id: z.string().uuid(),
  experimentId: z.string(),
  date: z.string(),
  timestamp: z.number(),

  // メタデータ
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  category: ExperimentCategorySchema,

  // 実験設定
  hypothesis: z.string().optional(),
  methodology: z.string().optional(),
  environment: z
    .object({
      llm_provider: z.string().optional(),
      llm_model: z.string().optional(),
      tools: z.array(z.string()).optional(),
    })
    .optional(),

  // Copilot対話記録
  interactions: z.array(CopilotInteractionSchema),

  // 実験データ
  inputs: z.array(ExperimentInputSchema),
  outputs: z.array(ExperimentOutputSchema),
  observations: z.array(z.string()),
  conclusions: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),

  // 関連情報
  relatedPapers: z.array(z.string()).optional(),
  relatedExperiments: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),

  // バージョン管理
  version: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ExperimentLog = z.infer<typeof ExperimentLogSchema>;

/**
 * 実験ログ作成用入力
 */
export const CreateExperimentLogInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: ExperimentCategorySchema,
  hypothesis: z.string().optional(),
  methodology: z.string().optional(),
});

export type CreateExperimentLogInput = z.infer<
  typeof CreateExperimentLogInputSchema
>;

/**
 * 実験ログ更新用入力
 */
export const UpdateExperimentLogInputSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hypothesis: z.string().optional(),
  methodology: z.string().optional(),
  inputs: z.array(ExperimentInputSchema).optional(),
  outputs: z.array(ExperimentOutputSchema).optional(),
  observations: z.array(z.string()).optional(),
  conclusions: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
  relatedPapers: z.array(z.string()).optional(),
  relatedExperiments: z.array(z.string()).optional(),
});

export type UpdateExperimentLogInput = z.infer<
  typeof UpdateExperimentLogInputSchema
>;
