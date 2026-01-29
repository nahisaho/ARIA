# @aria/mcp-server

> ARIA MCP サーバー - Model Context Protocol による AI 統合

## 📦 インストール

```bash
pnpm add @aria/mcp-server
```

## 🎯 概要

`@aria/mcp-server` は Model Context Protocol (MCP) を通じて ARIA の機能を AI アシスタント（Claude, GitHub Copilot など）に公開するサーバーです。

### 提供ツール

| カテゴリ | ツール | 説明 |
|----------|--------|------|
| Experiment | `experiment_create` | 実験ログ作成 |
| | `experiment_update` | 実験ログ更新 |
| | `experiment_search` | 実験ログ検索 |
| Knowledge | `knowledge_add` | 知識エンティティ追加 |
| | `knowledge_search` | 知識エンティティ検索 |
| | `knowledge_relate` | 関係追加 |
| | `knowledge_update` | エンティティ更新 |
| Paper | `paper_search` | 論文検索 (Semantic Scholar) |
| | `paper_check_oa` | OA 確認 |
| | `paper_import` | 論文インポート |
| | `paper_analyze` | 論文分析 |
| GraphRAG | `graphrag_index` | インデックス構築 |
| | `graphrag_query` | 自動モード検索 |
| | `graphrag_local` | ローカル検索 |
| | `graphrag_global` | グローバル検索 |
| | `graphrag_drift` | DRIFT 検索 |

## 🚀 起動方法

### CLI

```bash
# pnpm script
pnpm mcp:serve

# 直接実行
node packages/mcp-server/dist/cli.js

# 設定ファイル指定
node packages/mcp-server/dist/cli.js --config ./config/aria.config.yaml
```

### プログラマティック

```typescript
import { AriaServer } from '@aria/mcp-server';

const server = new AriaServer({
  storagePath: './storage',
  llmProvider: 'ollama',
});

await server.start();
```

## ⚙️ 設定

### Claude Desktop

`~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aria": {
      "command": "node",
      "args": ["/path/to/aria/packages/mcp-server/dist/cli.js"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "aria": {
      "command": "node",
      "args": ["${workspaceFolder}/aria/packages/mcp-server/dist/cli.js"]
    }
  }
}
```

## 📖 ツール使用例

### 実験記録

```
User: 新しい実験を始めます。LLMの要約精度を比較します。

Claude: experiment_create を使用して実験ログを作成します。

[experiment_create]
title: "LLM要約精度の比較実験"
objective: "Claude vs GPT-4の学術論文要約精度を比較"
tags: ["llm", "summarization", "benchmark"]

Created: EXP-20260129-001
```

### 論文検索

```
User: Attention Is All You Needの論文を検索して

Claude: paper_search を使用して検索します。

[paper_search]
query: "Attention Is All You Need transformer"
limit: 5

Found:
1. Attention Is All You Need (2017) - 128,456 citations
   Authors: Vaswani et al.
   OA PDF available
```

### 知識追加

```
User: Transformerについての知識を追加して

Claude: knowledge_add を使用して追加します。

[knowledge_add]
type: "concept"
name: "Transformer"
description: "自己注意機構を用いたニューラルネットワークアーキテクチャ。
              並列処理が可能で、長距離依存関係を効率的に学習できる。"
tags: ["deep-learning", "nlp", "architecture"]
source: "10.48550/arXiv.1706.03762"
sourceType: "paper"

Added: KN-concept-001
```

## 🔧 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `ARIA_STORAGE_PATH` | ストレージパス | `./storage` |
| `ARIA_CONFIG_PATH` | 設定ファイルパス | `./config/aria.config.yaml` |
| `OLLAMA_HOST` | Ollama ホスト | `http://localhost:11434` |
| `OPENAI_API_KEY` | OpenAI API キー | - |
| `ANTHROPIC_API_KEY` | Anthropic API キー | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI エンドポイント | - |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API キー | - |

## 🧪 テスト

```bash
pnpm test
```

## 📚 API ドキュメント

詳細なツール仕様は [API.md](../../docs/API.md) を参照してください。
