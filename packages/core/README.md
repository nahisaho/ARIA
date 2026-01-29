# @aria/core

> ARIA のコアライブラリ - エンティティ、型定義、ストレージサービス

## 📦 インストール

```bash
pnpm add @aria/core
```

## 🎯 概要

`@aria/core` は ARIA プラットフォームの基盤となるパッケージで、以下を提供します：

- **型定義**: 実験ログ、論文、知識エンティティ、LLM の型
- **ストレージサービス**: ファイルベースの永続化層
- **ユーティリティ**: ID生成、日付処理

## 📖 使用方法

### 型のインポート

```typescript
import type {
  // 実験
  ExperimentLog,
  ExperimentStatus,
  
  // 論文
  Paper,
  PaperMetadata,
  
  // 知識
  KnowledgeEntity,
  KnowledgeRelation,
  
  // LLM
  LLMProviderConfig,
  CompletionOptions,
  CompletionResult,
  
  // Result型
  Result,
} from '@aria/core';
```

### ExperimentStorageService

実験ログの YAML ベースストレージ。

```typescript
import { ExperimentStorageService } from '@aria/core';

const storage = new ExperimentStorageService('./storage/experiments');

// 作成
const result = await storage.create({
  title: 'LLM比較実験',
  objective: 'Claude vs GPT-4の要約精度比較',
  tags: ['llm', 'benchmark'],
});

if (result.ok) {
  console.log(`Created: ${result.value.id}`);
}

// 検索
const searchResult = await storage.search({ tags: ['llm'] });

// 更新
await storage.update(experimentId, {
  observations: '観察結果...',
  status: 'completed',
});
```

### KnowledgeStorageService

知識エンティティの JSON ベースストレージ。

```typescript
import { KnowledgeStorageService } from '@aria/core';

const storage = new KnowledgeStorageService('./storage/knowledge');

// エンティティ追加
const result = await storage.add({
  type: 'concept',
  name: 'Transformer',
  description: '自己注意機構を用いたニューラルネットワークアーキテクチャ',
  tags: ['deep-learning', 'nlp'],
});

// 検索
const entities = await storage.search({
  query: 'attention',
  type: 'concept',
});

// 関係追加
await storage.relate({
  fromEntity: 'KN-concept-001',
  toEntity: 'KN-concept-002',
  relationType: 'is_a',
  description: 'TransformerはSeq2Seqモデルの一種',
});
```

### Result 型

エラーハンドリングのための Result 型。

```typescript
import { ok, err, type Result } from '@aria/core';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero');
  }
  return ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

## 📁 ストレージ構造

```
storage/
├── experiments/          # 実験ログ (YAML)
│   └── YYYY/MM/DD/
│       └── EXP-YYYYMMDD-NNN.yaml
└── knowledge/            # 知識エンティティ (JSON)
    ├── entities/
    │   ├── concept/
    │   ├── method/
    │   ├── finding/
    │   └── relation/
    └── relations/
```

## 🧪 テスト

```bash
pnpm test
```

## 📚 型一覧

### ExperimentLog

```typescript
interface ExperimentLog {
  id: string;
  title: string;
  objective?: string;
  hypothesis?: string;
  methodology?: string;
  observations?: string;
  results?: string;
  conclusions?: string;
  nextSteps?: string[];
  status: ExperimentStatus;
  tags?: string[];
  relatedPapers?: string[];
  relatedExperiments?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### KnowledgeEntity

```typescript
interface KnowledgeEntity {
  id: string;
  type: 'concept' | 'method' | 'finding' | 'relation';
  name: string;
  description: string;
  aliases?: string[];
  tags?: string[];
  source?: string;
  sourceType?: 'paper' | 'experiment' | 'conversation' | 'url' | 'manual';
  relations?: KnowledgeRelation[];
  createdAt: Date;
  updatedAt: Date;
}
```

### LLMProviderConfig

```typescript
interface LLMProviderConfig {
  type: 'openai' | 'azure-openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  endpoint?: string;       // Azure用
  apiVersion?: string;     // Azure用
  models?: {
    chat?: string;
    embedding?: string;
  };
  deployments?: {          // Azure用
    chat?: string;
    embedding?: string;
  };
}
```
