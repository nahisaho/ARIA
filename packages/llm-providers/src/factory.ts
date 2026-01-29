import type {
  ILLMProvider,
  LLMProviderConfig,
} from '@aria/core';

import { OpenAIProvider } from './openai.js';
import { AzureOpenAIProvider } from './azure-openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';

/**
 * Create an LLM provider based on configuration.
 */
export function createLLMProvider(config: LLMProviderConfig): ILLMProvider {
  switch (config.type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'azure-openai':
      return new AzureOpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default:
      throw new Error(`Unknown LLM provider type: ${config.type as string}`);
  }
}

/**
 * Create an LLM provider from environment variables.
 */
export function createLLMProviderFromEnv(): ILLMProvider {
  // Check for Azure OpenAI
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
    return createLLMProvider({
      type: 'azure-openai',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
      deployments: {
        chat: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
        embedding: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      },
    });
  }

  // Check for OpenAI
  if (process.env.OPENAI_API_KEY) {
    return createLLMProvider({
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      models: {
        chat: process.env.OPENAI_CHAT_MODEL,
        embedding: process.env.OPENAI_EMBEDDING_MODEL,
      },
    });
  }

  // Check for Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return createLLMProvider({
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      models: {
        chat: process.env.ANTHROPIC_MODEL,
      },
    });
  }

  // Check for Ollama (default to localhost)
  if (process.env.OLLAMA_HOST || process.env.OLLAMA_MODEL) {
    return createLLMProvider({
      type: 'ollama',
      baseUrl: process.env.OLLAMA_HOST ?? 'http://localhost:11434',
      models: {
        chat: process.env.OLLAMA_MODEL ?? 'llama3.2',
        embedding: process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text',
      },
    });
  }

  throw new Error(
    'No LLM provider configured. Set one of: AZURE_OPENAI_*, OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_HOST',
  );
}
