import { z } from 'zod';

/**
 * LLMプロバイダータイプ
 */
export const LLMProviderTypeSchema = z.enum([
  'azure-openai',
  'openai',
  'anthropic',
  'ollama',
]);

export type LLMProviderType = z.infer<typeof LLMProviderTypeSchema>;

/**
 * メッセージロール
 */
export const MessageRoleSchema = z.enum(['system', 'user', 'assistant']);

export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * チャットメッセージ
 */
export const ChatMessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * 完了オプション
 */
export const CompletionOptionsSchema = z.object({
  model: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.array(z.string()).optional(),
});

export type CompletionOptions = z.infer<typeof CompletionOptionsSchema>;

/**
 * 完了結果
 */
export const CompletionResultSchema = z.object({
  content: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  finishReason: z.string().optional(),
});

export type CompletionResult = z.infer<typeof CompletionResultSchema>;

/**
 * チャット結果
 */
export const ChatResultSchema = CompletionResultSchema;

export type ChatResult = z.infer<typeof ChatResultSchema>;

/**
 * 埋め込み結果
 */
export const EmbeddingResultSchema = z.object({
  embeddings: z.array(z.array(z.number())),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    totalTokens: z.number(),
  }),
});

export type EmbeddingResult = z.infer<typeof EmbeddingResultSchema>;

/**
 * モデル情報
 */
export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive().optional(),
  capabilities: z.array(z.string()),
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;

/**
 * 使用量情報
 */
export const UsageInfoSchema = z.object({
  promptTokens: z.number().int(),
  completionTokens: z.number().int(),
  totalTokens: z.number().int(),
  cost: z.number().optional(),
});

export type UsageInfo = z.infer<typeof UsageInfoSchema>;

/**
 * LLMプロバイダー設定
 */
export const LLMProviderConfigSchema = z.object({
  type: LLMProviderTypeSchema,
  endpoint: z.string().optional(),
  apiKey: z.string().optional(),
  apiVersion: z.string().optional(),
  baseUrl: z.string().url().optional(),
  models: z
    .object({
      chat: z.string().optional(),
      embedding: z.string().optional(),
    })
    .optional(),
  deployments: z
    .object({
      chat: z.string().optional(),
      embedding: z.string().optional(),
    })
    .optional(),
});

export type LLMProviderConfig = z.infer<typeof LLMProviderConfigSchema>;

/**
 * LLMプロバイダーインターフェース
 */
export interface ILLMProvider {
  readonly name: string;
  readonly type: LLMProviderType;

  /**
   * テキスト完了
   */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * チャット完了
   */
  chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult>;

  /**
   * テキスト埋め込み
   */
  embed(texts: string[]): Promise<EmbeddingResult>;

  /**
   * チャットストリーミング
   */
  streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string>;

  /**
   * 利用可能なモデル一覧
   */
  listModels(): Promise<ModelInfo[]>;

  /**
   * 使用量取得
   */
  getUsage(): Promise<UsageInfo>;
}
