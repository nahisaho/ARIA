# @aria/llm-providers

> マルチ LLM プロバイダー対応ライブラリ - OpenAI, Azure OpenAI, Anthropic, Ollama

## 📦 インストール

```bash
pnpm add @aria/llm-providers
```

## 🎯 概要

`@aria/llm-providers` は複数の LLM プロバイダーを統一インターフェースで利用するためのパッケージです。

### サポートプロバイダー

| プロバイダー | チャット | 埋め込み | ストリーミング |
|--------------|----------|----------|----------------|
| OpenAI | ✅ | ✅ | ✅ |
| Azure OpenAI | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ❌ | ✅ |
| Ollama | ✅ | ✅ | ✅ |

## 📖 使用方法

### ファクトリー関数

```typescript
import { createLLMProvider, createLLMProviderFromEnv } from '@aria/llm-providers';

// 設定から作成
const provider = createLLMProvider({
  type: 'openai',
  apiKey: 'sk-...',
  models: {
    chat: 'gpt-4o',
    embedding: 'text-embedding-3-small',
  },
});

// 環境変数から作成
const providerFromEnv = createLLMProviderFromEnv();
```

### チャット補完

```typescript
const result = await provider.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is GraphRAG?' },
]);

console.log(result.content);
```

### ストリーミング

```typescript
for await (const chunk of provider.streamChat([
  { role: 'user', content: 'Explain transformers in detail.' },
])) {
  process.stdout.write(chunk.content);
}
```

### 埋め込み

```typescript
const embeddings = await provider.embed([
  'First document',
  'Second document',
]);

console.log(embeddings[0].length); // 埋め込み次元数
```

### 使用量トラッキング

```typescript
const usage = await provider.getUsage();
console.log(`Total tokens: ${usage.totalTokens}`);
```

## ⚙️ プロバイダー設定

### OpenAI

```typescript
const openai = createLLMProvider({
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: 'https://api.openai.com/v1',  // オプション
  models: {
    chat: 'gpt-4o',
    embedding: 'text-embedding-3-small',
  },
});
```

**環境変数:**
- `OPENAI_API_KEY` (必須)
- `OPENAI_BASE_URL` (オプション)
- `OPENAI_CHAT_MODEL` (オプション)
- `OPENAI_EMBEDDING_MODEL` (オプション)

### Azure OpenAI

```typescript
const azure = createLLMProvider({
  type: 'azure-openai',
  endpoint: 'https://your-resource.openai.azure.com',
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: '2024-02-15-preview',
  deployments: {
    chat: 'gpt-4o',
    embedding: 'text-embedding-3-small',
  },
});
```

**環境変数:**
- `AZURE_OPENAI_ENDPOINT` (必須)
- `AZURE_OPENAI_API_KEY` (必須)
- `AZURE_OPENAI_API_VERSION` (オプション)
- `AZURE_OPENAI_CHAT_DEPLOYMENT` (オプション)
- `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` (オプション)

### Anthropic

```typescript
const anthropic = createLLMProvider({
  type: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  models: {
    chat: 'claude-3-5-sonnet-20241022',
  },
});
```

**環境変数:**
- `ANTHROPIC_API_KEY` (必須)
- `ANTHROPIC_BASE_URL` (オプション)
- `ANTHROPIC_MODEL` (オプション)

### Ollama

```typescript
const ollama = createLLMProvider({
  type: 'ollama',
  baseUrl: 'http://localhost:11434',
  models: {
    chat: 'llama3.2',
    embedding: 'nomic-embed-text',
  },
});
```

**環境変数:**
- `OLLAMA_HOST` (オプション、デフォルト: `http://localhost:11434`)
- `OLLAMA_MODEL` (オプション)
- `OLLAMA_EMBEDDING_MODEL` (オプション)

## 🔧 CompletionOptions

```typescript
interface CompletionOptions {
  temperature?: number;      // 0.0 - 2.0
  maxTokens?: number;        // 最大出力トークン数
  topP?: number;             // 0.0 - 1.0
  frequencyPenalty?: number; // -2.0 - 2.0
  presencePenalty?: number;  // -2.0 - 2.0
  stop?: string[];           // 停止シーケンス
}
```

## 🧪 テスト

```bash
pnpm test
```

## 📚 インターフェース

### ILLMProvider

```typescript
interface ILLMProvider {
  readonly name: string;
  readonly type: LLMProviderType;

  // チャット
  chat(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult>;

  // ストリーミング
  streamChat(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncIterable<CompletionChunk>;

  // 埋め込み
  embed(texts: string[]): Promise<number[][]>;

  // 使用量
  getUsage(): Promise<UsageStats>;
}
```
