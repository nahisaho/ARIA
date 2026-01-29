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

type OllamaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

type OllamaEmbeddingResponse = {
  model: string;
  embeddings: number[][];
};

type OllamaModelsResponse = {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      parent_model: string;
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
  }>;
};

export class OllamaProvider extends BaseLLMProvider {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;

  private baseUrl: string;
  private defaultChatModel: string;
  private defaultEmbeddingModel: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.defaultChatModel = config.models?.chat ?? 'llama3.2';
    this.defaultEmbeddingModel = config.models?.embedding ?? 'nomic-embed-text';
  }

  private async request<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options?: CompletionOptions): Promise<ChatResult> {
    const model = options?.model ?? this.defaultChatModel;

    const ollamaMessages: OllamaMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: ollamaMessages,
      stream: false,
    };

    // Ollama uses 'options' for model parameters
    const modelOptions: Record<string, unknown> = {};
    if (options?.temperature !== undefined) modelOptions.temperature = options.temperature;
    if (options?.topP !== undefined) modelOptions.top_p = options.topP;
    if (options?.stop) modelOptions.stop = options.stop;
    if (Object.keys(modelOptions).length > 0) {
      body.options = modelOptions;
    }

    const response = await this.request<OllamaChatResponse>('/api/chat', body);

    // Ollama provides token counts in eval metrics
    const promptTokens = response.prompt_eval_count ?? 0;
    const completionTokens = response.eval_count ?? 0;

    this.trackUsage(promptTokens, completionTokens);

    return {
      content: response.message.content,
      model: response.model,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      finishReason: response.done ? 'stop' : undefined,
    };
  }

  async embed(texts: string[]): Promise<EmbeddingResult> {
    // Ollama's embed endpoint
    const response = await this.request<OllamaEmbeddingResponse>('/api/embed', {
      model: this.defaultEmbeddingModel,
      input: texts,
    });

    // Ollama doesn't provide token counts for embeddings
    const estimatedTokens = texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0);
    this.trackUsage(estimatedTokens, 0);

    return {
      embeddings: response.embeddings,
      model: response.model,
      usage: {
        promptTokens: estimatedTokens,
        totalTokens: estimatedTokens,
      },
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): AsyncIterable<string> {
    const model = options?.model ?? this.defaultChatModel;

    const ollamaMessages: OllamaMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: ollamaMessages,
      stream: true,
    };

    const modelOptions: Record<string, unknown> = {};
    if (options?.temperature !== undefined) modelOptions.temperature = options.temperature;
    if (options?.topP !== undefined) modelOptions.top_p = options.topP;
    if (options?.stop) modelOptions.stop = options.stop;
    if (Object.keys(modelOptions).length > 0) {
      body.options = modelOptions;
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${error}`);
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
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line) as OllamaChatResponse;
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
          if (parsed.done) return;
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = (await response.json()) as OllamaModelsResponse;

    return data.models.map((m) => ({
      id: m.name,
      name: m.name,
      contextWindow: this.getContextWindow(m.name),
      capabilities: m.name.includes('embed') ? ['embedding'] : ['chat', 'completion'],
    }));
  }

  private getContextWindow(modelName: string): number {
    // Estimate context window based on model name
    const lowerName = modelName.toLowerCase();
    if (lowerName.includes('llama3')) return 128000;
    if (lowerName.includes('llama2')) return 4096;
    if (lowerName.includes('mistral')) return 32768;
    if (lowerName.includes('mixtral')) return 32768;
    if (lowerName.includes('gemma')) return 8192;
    if (lowerName.includes('phi')) return 128000;
    if (lowerName.includes('qwen')) return 32768;
    return 4096; // Default fallback
  }
}
