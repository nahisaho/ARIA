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

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AnthropicResponse = {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

type AnthropicModelsResponse = {
  data: Array<{
    id: string;
    display_name: string;
    created_at: string;
    type: string;
  }>;
};

export class AnthropicProvider extends BaseLLMProvider {
  readonly name = 'Anthropic';
  readonly type = 'anthropic' as const;

  private baseUrl: string;
  private defaultModel: string;
  private apiVersion: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com';
    this.defaultModel = config.models?.chat ?? 'claude-sonnet-4-20250514';
    this.apiVersion = config.apiVersion ?? '2023-06-01';
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.getApiKey(),
        'anthropic-version': this.apiVersion,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult> {
    const model = options?.model ?? this.defaultModel;

    // Extract system message if present
    let systemPrompt: string | undefined;
    const anthropicMessages: AnthropicMessage[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemPrompt = m.content;
      } else {
        anthropicMessages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        });
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens ?? 4096,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop_sequences = options.stop;

    const response = await this.request<AnthropicResponse>('/v1/messages', body);

    const content = response.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    this.trackUsage(response.usage.input_tokens, response.usage.output_tokens);

    return {
      content,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason,
    };
  }

  async embed(_texts: string[]): Promise<EmbeddingResult> {
    // Anthropic doesn't have a public embedding API yet
    // Recommend using a different provider for embeddings
    throw new Error(
      'Anthropic does not provide an embedding API. Use OpenAI or another provider for embeddings.',
    );
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const model = options?.model ?? this.defaultModel;

    // Extract system message if present
    let systemPrompt: string | undefined;
    const anthropicMessages: AnthropicMessage[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemPrompt = m.content;
      } else {
        anthropicMessages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        });
      }
    }

    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    };

    if (systemPrompt) body.system = systemPrompt;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop_sequences = options.stop;

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.getApiKey(),
        'anthropic-version': this.apiVersion,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
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
              type: string;
              delta?: { type: string; text?: string };
            };
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'x-api-key': this.getApiKey(),
          'anthropic-version': this.apiVersion,
        },
      });

      if (!response.ok) {
        // Fall back to known models if API fails
        return this.getKnownModels();
      }

      const data = (await response.json()) as AnthropicModelsResponse;

      return data.data.map((m) => ({
        id: m.id,
        name: m.display_name,
        contextWindow: this.getContextWindow(m.id),
        capabilities: ['chat', 'completion'],
      }));
    } catch {
      return this.getKnownModels();
    }
  }

  private getKnownModels(): ModelInfo[] {
    return [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        contextWindow: 200000,
        maxOutputTokens: 64000,
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        capabilities: ['chat', 'completion'],
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        capabilities: ['chat', 'completion'],
      },
    ];
  }

  private getContextWindow(modelId: string): number {
    if (modelId.includes('claude-3') || modelId.includes('claude-sonnet-4')) {
      return 200000;
    }
    return 100000;
  }
}
