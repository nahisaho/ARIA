import type {
  ChatMessage,
  ChatResult,
  CompletionOptions,
  CompletionResult,
  EmbeddingResult,
  ILLMProvider,
  LLMProviderConfig,
  ModelInfo,
  UsageInfo,
} from '@aria/core';

/**
 * Base class for LLM providers with common functionality.
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly name: string;
  abstract readonly type: LLMProviderConfig['type'];

  protected config: LLMProviderConfig;
  protected totalUsage: UsageInfo = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  abstract complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  abstract chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult>;
  abstract embed(texts: string[]): Promise<EmbeddingResult>;
  abstract streamChat(messages: ChatMessage[], options?: CompletionOptions): AsyncIterable<string>;
  abstract listModels(): Promise<ModelInfo[]>;

  async getUsage(): Promise<UsageInfo> {
    return { ...this.totalUsage };
  }

  protected trackUsage(promptTokens: number, completionTokens: number): void {
    this.totalUsage.promptTokens += promptTokens;
    this.totalUsage.completionTokens += completionTokens;
    this.totalUsage.totalTokens += promptTokens + completionTokens;
  }

  protected getApiKey(): string {
    const key = this.config.apiKey;
    if (!key) {
      throw new Error(`API key is required for ${this.name}`);
    }
    return key;
  }
}
