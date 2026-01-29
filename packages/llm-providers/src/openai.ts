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

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenAIChatResponse = {
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

type OpenAIEmbeddingResponse = {
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

type OpenAIModelsResponse = {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
};

export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'OpenAI';
  readonly type = 'openai' as const;

  private baseUrl: string;
  private defaultChatModel: string;
  private defaultEmbeddingModel: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
    this.defaultChatModel = config.models?.chat ?? 'gpt-4o';
    this.defaultEmbeddingModel = config.models?.embedding ?? 'text-embedding-3-small';
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult> {
    const model = options?.model ?? this.defaultChatModel;

    const openaiMessages: OpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: openaiMessages,
    };

    if (options?.maxTokens) body.max_tokens = options.maxTokens;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop = options.stop;

    const response = await this.request<OpenAIChatResponse>('/chat/completions', body);

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
    const response = await this.request<OpenAIEmbeddingResponse>('/embeddings', {
      model: this.defaultEmbeddingModel,
      input: texts,
    });

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
    const model = options?.model ?? this.defaultChatModel;

    const openaiMessages: OpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: openaiMessages,
      stream: true,
    };

    if (options?.maxTokens) body.max_tokens = options.maxTokens;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop = options.stop;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
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
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIModelsResponse;

    return data.data
      .filter((m) => m.id.startsWith('gpt-') || m.id.includes('embedding'))
      .map((m) => ({
        id: m.id,
        name: m.id,
        contextWindow: m.id.includes('gpt-4') ? 128000 : 16385,
        capabilities: m.id.includes('embedding') ? ['embedding'] : ['chat', 'completion'],
      }));
  }
}
