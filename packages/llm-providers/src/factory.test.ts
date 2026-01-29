/**
 * LLM Provider Factory Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLLMProvider, createLLMProviderFromEnv } from './factory.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OllamaProvider } from './ollama.js';
import { AzureOpenAIProvider } from './azure-openai.js';

describe('LLM Provider Factory', () => {
  describe('createLLMProvider', () => {
    it('should create OpenAI provider', () => {
      const provider = createLLMProvider({
        type: 'openai',
        apiKey: 'test-key',
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.name).toBe('OpenAI');
      expect(provider.type).toBe('openai');
    });

    it('should create Anthropic provider', () => {
      const provider = createLLMProvider({
        type: 'anthropic',
        apiKey: 'test-key',
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(provider.name).toBe('Anthropic');
      expect(provider.type).toBe('anthropic');
    });

    it('should create Ollama provider', () => {
      const provider = createLLMProvider({
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
      });

      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.name).toBe('Ollama');
      expect(provider.type).toBe('ollama');
    });

    it('should create Azure OpenAI provider', () => {
      const provider = createLLMProvider({
        type: 'azure-openai',
        apiKey: 'test-key',
        endpoint: 'https://test.openai.azure.com',
        deployments: {
          chat: 'gpt-4',
          embedding: 'text-embedding-3-small',
        },
      });

      expect(provider).toBeInstanceOf(AzureOpenAIProvider);
      expect(provider.name).toBe('Azure OpenAI');
      expect(provider.type).toBe('azure-openai');
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        createLLMProvider({
          type: 'unknown' as any,
          apiKey: 'test-key',
        });
      }).toThrow('Unknown LLM provider type');
    });
  });

  describe('createLLMProviderFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create Azure OpenAI provider from env', () => {
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com';
      process.env.AZURE_OPENAI_API_KEY = 'test-key';
      
      const provider = createLLMProviderFromEnv();
      expect(provider).toBeInstanceOf(AzureOpenAIProvider);
    });

    it('should create OpenAI provider from env', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      const provider = createLLMProviderFromEnv();
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create Anthropic provider from env', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      
      const provider = createLLMProviderFromEnv();
      expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('should create Ollama provider from env', () => {
      process.env.OLLAMA_HOST = 'http://localhost:11434';
      
      const provider = createLLMProviderFromEnv();
      expect(provider).toBeInstanceOf(OllamaProvider);
    });

    it('should throw error when no provider configured', () => {
      // Clear all provider env vars
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OLLAMA_HOST;
      delete process.env.OLLAMA_MODEL;

      expect(() => createLLMProviderFromEnv()).toThrow('No LLM provider configured');
    });
  });
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({
      type: 'openai',
      apiKey: 'test-api-key',
      models: { chat: 'gpt-4o-mini' },
    });
  });

  it('should have correct name and type', () => {
    expect(provider.name).toBe('OpenAI');
    expect(provider.type).toBe('openai');
  });

  it('should track usage', async () => {
    const usage = await provider.getUsage();
    expect(usage).toHaveProperty('promptTokens');
    expect(usage).toHaveProperty('completionTokens');
    expect(usage).toHaveProperty('totalTokens');
    expect(usage.totalTokens).toBe(0);
  });
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider({
      type: 'anthropic',
      apiKey: 'test-api-key',
      models: { chat: 'claude-3-sonnet-20240229' },
    });
  });

  it('should have correct name and type', () => {
    expect(provider.name).toBe('Anthropic');
    expect(provider.type).toBe('anthropic');
  });

  it('should track usage', async () => {
    const usage = await provider.getUsage();
    expect(usage).toHaveProperty('promptTokens');
    expect(usage).toHaveProperty('completionTokens');
  });
});

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider({
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: { chat: 'llama3' },
    });
  });

  it('should have correct name and type', () => {
    expect(provider.name).toBe('Ollama');
    expect(provider.type).toBe('ollama');
  });

  it('should use default base URL if not provided', () => {
    const providerWithDefaults = new OllamaProvider({
      type: 'ollama',
      models: { chat: 'llama3' },
    });
    expect(providerWithDefaults.name).toBe('Ollama');
    expect(providerWithDefaults.type).toBe('ollama');
  });
});

describe('AzureOpenAIProvider', () => {
  let provider: AzureOpenAIProvider;

  beforeEach(() => {
    provider = new AzureOpenAIProvider({
      type: 'azure-openai',
      apiKey: 'test-api-key',
      endpoint: 'https://test.openai.azure.com',
      apiVersion: '2024-02-01',
      deployments: {
        chat: 'gpt-4',
        embedding: 'text-embedding-3-small',
      },
    });
  });

  it('should have correct name and type', () => {
    expect(provider.name).toBe('Azure OpenAI');
    expect(provider.type).toBe('azure-openai');
  });

  it('should require endpoint', () => {
    expect(() => {
      new AzureOpenAIProvider({
        type: 'azure-openai',
        apiKey: 'test-key',
      });
    }).toThrow('Azure OpenAI endpoint is required');
  });

  it('should track usage', async () => {
    const usage = await provider.getUsage();
    expect(usage).toHaveProperty('promptTokens');
    expect(usage).toHaveProperty('completionTokens');
  });
});
