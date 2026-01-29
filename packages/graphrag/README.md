# @aria/graphrag

> Microsoft GraphRAG 統合ライブラリ - ナレッジグラフ RAG

## 📦 インストール

```bash
pnpm add @aria/graphrag
```

### Python 依存

```bash
pip install graphrag
```

## 🎯 概要

`@aria/graphrag` は [Microsoft GraphRAG](https://github.com/microsoft/graphrag) を使用したナレッジグラフベースの検索拡張生成 (RAG) を提供します。

### 検索モード

| モード | 用途 | 特徴 |
|--------|------|------|
| **Local** | 特定エンティティの詳細 | 高精度、狭範囲 |
| **Global** | 広範なトピック概要 | コミュニティサマリー活用 |
| **DRIFT** | 動的推論 | 段階的探索 |

## 📖 使用方法

### インデックス構築

```typescript
import { GraphRAGService } from '@aria/graphrag';

const service = new GraphRAGService({
  workDir: './storage/graphrag',
  llmProvider: 'ollama',
});

// ドキュメントをインデックス
await service.index([
  './papers/paper1.md',
  './papers/paper2.md',
]);
```

### Local Search

特定のエンティティ・コンセプトの詳細を検索。

```typescript
const result = await service.localSearch({
  query: 'What is the self-attention mechanism?',
  entityTypes: ['concept', 'method'],
  maxHops: 2,
});

console.log(result.answer);
console.log(result.entities);
```

### Global Search

広範なトピックの概要・要約を検索。

```typescript
const result = await service.globalSearch({
  query: 'What are the main contributions of transformer models?',
  communityLevel: 2,
  maxSummaries: 5,
});

console.log(result.answer);
console.log(result.communities);
```

### DRIFT Search

動的推論による段階的探索。

```typescript
const result = await service.driftSearch({
  query: 'How has attention mechanism evolved?',
  maxIterations: 5,
});

console.log(result.answer);
for (const step of result.reasoning) {
  console.log(`Step ${step.step}: ${step.thought}`);
}
```

### 自動モード選択

クエリに応じて最適なモードを自動選択。

```typescript
const result = await service.query('What is BERT?');
console.log(`Mode used: ${result.mode}`);
```

## ⚙️ 設定

### 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `GRAPHRAG_WORK_DIR` | 作業ディレクトリ | `./storage/graphrag` |
| `GRAPHRAG_LLM_MODEL` | LLM モデル | `gpt-4o-mini` |
| `GRAPHRAG_EMBEDDING_MODEL` | 埋め込みモデル | `text-embedding-3-small` |

### 設定ファイル

`config/aria.config.yaml`:

```yaml
graphrag:
  work_dir: "./storage/graphrag"
  llm:
    provider: "ollama"
    model: "llama3.2"
  embedding:
    provider: "ollama"
    model: "nomic-embed-text"
  indexing:
    chunk_size: 1200
    chunk_overlap: 100
```

## 📁 データ構造

```
storage/graphrag/
├── input/              # 入力ドキュメント
├── output/             # GraphRAG 出力
│   ├── entities.parquet
│   ├── relationships.parquet
│   ├── communities.parquet
│   └── community_reports.parquet
└── cache/              # キャッシュ
```

## 📚 型定義

```typescript
interface LocalSearchResult {
  answer: string;
  entities: Entity[];
  relationships: Relationship[];
  sources: Source[];
}

interface GlobalSearchResult {
  answer: string;
  communities: Community[];
  sources: Source[];
}

interface DriftSearchResult {
  answer: string;
  reasoning: ReasoningStep[];
  sources: Source[];
}

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface Community {
  id: string;
  title: string;
  summary: string;
  level: number;
}
```
