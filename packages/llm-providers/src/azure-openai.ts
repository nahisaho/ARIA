import type {
  ChatMessage,
  ChatResult,
  CompletionOptions,
  CompletionResult,
  EmbeddingResult,
  LLMProviderConfig,
  ModelInfo,
} from '@aria/core';
import { BaseLLMProvider } from './base.js';

type AzureOpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AzureOpenAIChatResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type AzureOpenAIEmbeddingResponse = {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};

export class AzureOpenAIProvider extends BaseLLMProvider {
  readonly name = 'Azure OpenAI';
  readonly type = 'azure-openai' as const;

  private endpoint: string;
  private apiVersion: string;
  private chatDeployment: string;
  private embeddingDeployment: string;

  constructor(config: LLMProviderConfig) {
    super(config);

    if (!config.endpoint) {
      throw new Error('Azure OpenAI endpoint is required');
    }

    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.apiVersion = config.apiVersion ?? '2024-02-15-preview';
    this.chatDeployment = config.deployments?.chat ?? 'gpt-4o';
    this.embeddingDeployment = config.deployments?.embedding ?? 'text-embedding-3-small';
  }

  private buildUrl(deployment: string, operation: string): string {
    return `${this.endpoint}/openai/deployments/${deployment}/${operation}?api-version=${this.apiVersion}`;
  }

  private async request<T>(
    deployment: string,
    operation: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const url = this.buildUrl(deployment, operation);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.getApiKey(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult> {
    const deployment = options?.model ?? this.chatDeployment;

    const azureMessages: AzureOpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      messages: azureMessages,
    };

    if (options?.maxTokens) body.max_tokens = options.maxTokens;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop = options.stop;

    const response = await this.request<AzureOpenAIChatResponse>(
      deployment,
      'chat/completions',
      body,
    );

    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No completion choice returned');
    }

    this.trackUsage(response.usage.prompt_tokens, response.usage.completion_tokens);

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  async embed(texts: string[]): Promise<EmbeddingResult> {
    const response = await this.request<AzureOpenAIEmbeddingResponse>(
      this.embeddingDeployment,
      'embeddings',
      { input: texts },
    );

    this.trackUsage(response.usage.prompt_tokens, 0);

    return {
      embeddings: response.data.map((d) => d.embedding),
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const deployment = options?.model ?? this.chatDeployment;
    const url = this.buildUrl(deployment, 'chat/completions');

    const azureMessages: AzureOpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      messages: azureMessages,
      stream: true,
    };

    if (options?.maxTokens) body.max_tokens = options.maxTokens;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop = options.stop;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.getApiKey(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error (${response.status}): ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const content = parsed.choices[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // Azure OpenAI doesn't have a list models endpoint like OpenAI
    // Return the configured deployments as available models
    return [
      {
        id: this.chatDeployment,
        name: `Azure ${this.chatDeployment}`,
        contextWindow: 128000,
        capabilities: ['chat', 'completion'],
      },
      {
        id: this.embeddingDeployment,
        name: `Azure ${this.embeddingDeployment}`,
        contextWindow: 8191,
        capabilities: ['embedding'],
      },
    ];
  }
}
