# ARIA API ドキュメント

> ARIA MCP サーバーが提供する全16ツールのリファレンス

## 📚 目次

- [概要](#概要)
- [Experiment ツール](#experiment-ツール)
- [Knowledge ツール](#knowledge-ツール)
- [Paper ツール](#paper-ツール)
- [GraphRAG ツール](#graphrag-ツール)
- [エラーハンドリング](#エラーハンドリング)

---

## 概要

ARIA MCP サーバーは Model Context Protocol (MCP) を通じて、以下のカテゴリのツールを提供します：

| カテゴリ | ツール数 | 用途 |
|----------|----------|------|
| Experiment | 3 | 実験ログの作成・更新・検索 |
| Knowledge | 4 | 知識エンティティの管理 |
| Paper | 4 | 論文の検索・インポート・分析 |
| GraphRAG | 5 | ナレッジグラフRAG |

### 接続方法

```bash
# MCPサーバー起動
cd aria
pnpm mcp:serve

# または直接実行
node packages/mcp-server/dist/cli.js
```

---

## Experiment ツール

実験ログの作成・管理を行うツール群です。

### experiment_create

新しい実験ログを作成します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | ✅ | 実験タイトル |
| `objective` | string | ❌ | 実験の目的 |
| `hypothesis` | string | ❌ | 仮説 |
| `tags` | string[] | ❌ | タグ |
| `relatedPapers` | string[] | ❌ | 関連論文ID |

**出力:**

```typescript
{
  success: boolean;
  experimentId: string;  // 例: "EXP-20260129-001"
  filePath: string;      // 保存先パス
}
```

**使用例:**

```json
{
  "title": "LLMによる論文要約の精度検証",
  "objective": "Claude vs GPT-4の要約品質を比較",
  "hypothesis": "Claudeの方が学術論文の要約精度が高い",
  "tags": ["llm", "summarization", "benchmark"]
}
```

---

### experiment_update

既存の実験ログを更新します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `experimentId` | string | ✅ | 実験ID |
| `observations` | string | ❌ | 観察・記録 |
| `results` | string | ❌ | 結果 |
| `conclusions` | string | ❌ | 結論 |
| `nextSteps` | string[] | ❌ | 次のステップ |
| `status` | string | ❌ | ステータス (active/completed/paused/abandoned) |

**出力:**

```typescript
{
  success: boolean;
  experimentId: string;
  updatedAt: string;  // ISO 8601形式
}
```

---

### experiment_search

実験ログを検索します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ❌ | 検索クエリ |
| `tags` | string[] | ❌ | タグでフィルタ |
| `status` | string | ❌ | ステータスでフィルタ |
| `startDate` | string | ❌ | 開始日 (YYYY-MM-DD) |
| `endDate` | string | ❌ | 終了日 (YYYY-MM-DD) |
| `limit` | number | ❌ | 最大件数 (デフォルト: 10) |

**出力:**

```typescript
{
  experiments: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    tags: string[];
  }>;
  total: number;
}
```

---

## Knowledge ツール

知識エンティティ（概念、手法、発見、関係）の管理を行うツール群です。

### knowledge_add

新しい知識エンティティを追加します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `type` | string | ✅ | エンティティタイプ (concept/method/finding/relation) |
| `name` | string | ✅ | 名前 |
| `description` | string | ✅ | 説明 |
| `aliases` | string[] | ❌ | 別名 |
| `tags` | string[] | ❌ | タグ |
| `source` | string | ❌ | 出典 (論文ID、URL等) |
| `sourceType` | string | ❌ | 出典タイプ (paper/experiment/url/manual) |

**タイプ別追加パラメータ:**

- **concept**: `category` (カテゴリ)
- **method**: `purpose` (目的), `steps` (手順)
- **finding**: `evidence` (証拠), `confidence` (信頼度: high/medium/low), `conditions` (条件)

**出力:**

```typescript
{
  success: boolean;
  entityId: string;  // 例: "KN-concept-001"
  type: string;
  name: string;
}
```

---

### knowledge_search

知識エンティティを検索します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `type` | string | ❌ | タイプでフィルタ |
| `tags` | string[] | ❌ | タグでフィルタ |
| `limit` | number | ❌ | 最大件数 (デフォルト: 10) |

**出力:**

```typescript
{
  entities: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    tags: string[];
    score: number;  // 関連度スコア
  }>;
  total: number;
}
```

---

### knowledge_relate

2つの知識エンティティ間に関係を追加します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `fromEntity` | string | ✅ | 関係元エンティティID |
| `toEntity` | string | ✅ | 関係先エンティティID |
| `relationType` | string | ✅ | 関係タイプ |
| `description` | string | ❌ | 関係の説明 |
| `bidirectional` | boolean | ❌ | 双方向関係 (デフォルト: false) |

**関係タイプ:**

| タイプ | 説明 |
|--------|------|
| `is_a` | ～である |
| `variant_of` | ～の変種 |
| `part_of` | ～の一部 |
| `uses` | ～を使用 |
| `related_to` | ～に関連 |
| `precedes` | ～に先行 |
| `follows` | ～に続く |
| `contradicts` | ～と矛盾 |
| `supports` | ～を支持 |
| `derived_from` | ～から派生 |

**出力:**

```typescript
{
  success: boolean;
  relationId: string;
  from: string;
  to: string;
  type: string;
}
```

---

### knowledge_update

既存の知識エンティティを更新します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `id` | string | ✅ | エンティティID |
| `name` | string | ❌ | 新しい名前 |
| `description` | string | ❌ | 新しい説明 |
| `aliases` | string[] | ❌ | 新しい別名 |
| `tags` | string[] | ❌ | 新しいタグ |

**出力:**

```typescript
{
  success: boolean;
  entityId: string;
  updatedAt: string;
}
```

---

## Paper ツール

論文の検索・インポート・分析を行うツール群です。

### paper_search

Semantic Scholar API を使用して論文を検索します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `limit` | number | ❌ | 最大件数 (デフォルト: 10, 最大: 100) |
| `offset` | number | ❌ | オフセット |
| `year` | string | ❌ | 出版年でフィルタ (例: "2024", "2020-2024") |
| `fields` | string[] | ❌ | 取得フィールド |

**出力:**

```typescript
{
  papers: Array<{
    paperId: string;
    title: string;
    authors: Array<{ name: string; authorId?: string }>;
    year: number;
    abstract?: string;
    citationCount: number;
    url?: string;
    venue?: string;
    openAccessPdf?: { url: string };
  }>;
  total: number;
  offset: number;
}
```

---

### paper_check_oa

論文のオープンアクセス (OA) 状況を確認します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `identifier` | string | ✅ | DOI, arXiv ID, または PMC ID |

**出力:**

```typescript
{
  isOpenAccess: boolean;
  pdfUrl?: string;
  source?: string;  // "unpaywall", "arxiv", "pmc", "semantic_scholar"
  license?: string;
  version?: string;  // "publishedVersion", "acceptedVersion", etc.
}
```

---

### paper_import

論文 PDF をインポートして Markdown に変換します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `source` | string | ✅ | PDF パスまたは URL |
| `paperId` | string | ❌ | DOI または arXiv ID |
| `extractMetadata` | boolean | ❌ | メタデータを抽出 (デフォルト: true) |

**出力:**

```typescript
{
  success: boolean;
  paperId: string;
  title: string;
  markdownPath: string;
  metadata: {
    authors: string[];
    year: number;
    abstract: string;
    keywords: string[];
  };
}
```

---

### paper_analyze

インポート済みの論文を分析します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `paperId` | string | ✅ | 論文ID |
| `extractSections` | boolean | ❌ | セクション抽出 (デフォルト: true) |
| `extractFigures` | boolean | ❌ | 図表抽出 (デフォルト: true) |
| `extractEquations` | boolean | ❌ | 数式抽出 (デフォルト: true) |
| `extractReferences` | boolean | ❌ | 参考文献抽出 (デフォルト: true) |

**出力:**

```typescript
{
  paperId: string;
  sections: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  figures: Array<{
    id: string;
    caption: string;
    path?: string;
  }>;
  equations: Array<{
    id: string;
    latex: string;
    context: string;
  }>;
  references: Array<{
    id: string;
    text: string;
    doi?: string;
  }>;
}
```

---

## GraphRAG ツール

Microsoft GraphRAG を活用したナレッジグラフ検索ツール群です。

### graphrag_index

ドキュメントを GraphRAG インデックスに追加します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `documents` | string[] | ✅ | ドキュメントパス配列 |
| `rebuild` | boolean | ❌ | インデックス再構築 (デフォルト: false) |

**出力:**

```typescript
{
  success: boolean;
  indexedCount: number;
  totalEntities: number;
  totalRelationships: number;
}
```

---

### graphrag_query

GraphRAG で自動モード選択クエリを実行します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `maxResults` | number | ❌ | 最大結果数 (デフォルト: 10) |

**出力:**

```typescript
{
  answer: string;
  sources: Array<{
    id: string;
    content: string;
    score: number;
  }>;
  mode: string;  // "local" または "global"
}
```

---

### graphrag_local

特定のエンティティ・コンセプトの詳細を検索します (Local Search)。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `entityTypes` | string[] | ❌ | エンティティタイプでフィルタ |
| `maxHops` | number | ❌ | 最大ホップ数 (デフォルト: 2) |

**出力:**

```typescript
{
  answer: string;
  entities: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}
```

---

### graphrag_global

広範なトピックの概要・要約を検索します (Global Search)。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `communityLevel` | number | ❌ | コミュニティレベル (1-5, デフォルト: 2) |
| `maxSummaries` | number | ❌ | 最大サマリー数 (デフォルト: 5) |

**出力:**

```typescript
{
  answer: string;
  communities: Array<{
    id: string;
    title: string;
    summary: string;
    level: number;
  }>;
}
```

---

### graphrag_drift

DRIFT (Dynamic Reasoning and Inference with Flexible Traversal) 検索を実行します。

**入力パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `query` | string | ✅ | 検索クエリ |
| `maxIterations` | number | ❌ | 最大イテレーション数 |

**出力:**

```typescript
{
  answer: string;
  reasoning: Array<{
    step: number;
    thought: string;
    action: string;
    result: string;
  }>;
}
```

---

## エラーハンドリング

すべてのツールは Result 型パターンを使用します。

### 成功レスポンス

```typescript
{
  success: true,
  // ツール固有のデータ
}
```

### エラーレスポンス

```typescript
{
  success: false,
  error: {
    code: string;      // エラーコード
    message: string;   // エラーメッセージ
    details?: any;     // 追加情報
  }
}
```

### 共通エラーコード

| コード | 説明 |
|--------|------|
| `NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | 入力パラメータが不正 |
| `STORAGE_ERROR` | ストレージエラー |
| `API_ERROR` | 外部APIエラー |
| `RATE_LIMIT` | レート制限 |

---

## 型定義

詳細な TypeScript 型定義は `@aria/core` パッケージを参照してください。

```typescript
import type {
  ExperimentLog,
  KnowledgeEntity,
  Paper,
  Result,
} from '@aria/core';
```
