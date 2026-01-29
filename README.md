# ARIA - AI Research & Inquiry Assistant

[![CI](https://github.com/YOUR_USERNAME/ARIA/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ARIA/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> GitHub Copilot Agent Skills を活用した AI for Science 研究支援プラットフォーム

## 🎯 概要

ARIA (AI Research & Inquiry Assistant) は、研究者の実験記録・論文分析・知識管理を支援するプラットフォームです。

### 主な機能

- **📝 実験ノート記録**: 実験日・GitHub Copilot とのやり取りを自動保存
- **📄 論文分析**: docling による PDF→Markdown 変換、メタデータ抽出
- **🔍 GraphRAG**: Microsoft GraphRAG による高度なナレッジグラフ検索
- **🔗 MCP連携**: Model Context Protocol による外部システム統合
- **🤖 マルチLLM**: Azure OpenAI, OpenAI, Claude, Ollama 対応

## 🚀 クイックスタート

### 前提条件

- Node.js 20+
- Python 3.10+
- pnpm 9+

### インストール

```bash
cd aria
pnpm install
pnpm build
```

### MCPサーバー起動

```bash
pnpm mcp:serve
```

## 📁 プロジェクト構造

```
aria/
├── AGENTS.md                    # AI Agent向けナレッジ
├── .github/
│   ├── skills/                  # GitHub Copilot Agent Skills
│   │   ├── experiment-log/      # 実験記録スキル
│   │   ├── paper-analysis/      # 論文分析スキル
│   │   ├── graphrag-query/      # GraphRAGスキル
│   │   ├── knowledge-capture/   # 知識キャプチャスキル
│   │   └── research-workflow/   # 研究ワークフロースキル
│   └── workflows/               # CI/CD
├── packages/
│   ├── core/                    # コア機能
│   └── mcp-server/              # MCPサーバー
├── docs/                        # ドキュメント
└── config/
    └── aria.config.yaml         # 設定ファイル

# ルートレベル（MUSUBIX憲法準拠）
storage/
├── specs/                       # 要件定義・SDD仕様
├── design/                      # 設計文書
├── changes/                     # 変更履歴
├── reviews/                     # レビュー記録
├── learning/                    # 学習データ
├── experiments/                 # 実験記録
├── papers/                      # 論文データ
└── knowledge-graph/             # グラフデータ
```

## 🛠️ GitHub Copilot Agent Skills

| スキル | 説明 |
|--------|------|
| `experiment-log` | 実験ノートの作成・管理 |
| `paper-analysis` | 論文のインポート・分析 |
| `graphrag-query` | ナレッジグラフ検索 |
| `knowledge-capture` | 知識・洞察のキャプチャ |
| `research-workflow` | 研究プロセスのガイド |

## 🔌 MCP ツール

| カテゴリ | ツール |
|----------|--------|
| Experiment | `experiment_create`, `experiment_update`, `experiment_search` |
| Paper | `paper_import`, `paper_analyze`, `paper_search` |
| GraphRAG | `graphrag_index`, `graphrag_query`, `graphrag_local`, `graphrag_global` |
| Knowledge | `knowledge_add`, `knowledge_search`, `knowledge_relate` |

## ⚙️ 設定

`config/aria.config.yaml` で LLM プロバイダー、GraphRAG、ストレージを設定します。

### LLMプロバイダー設定例

```yaml
llm:
  default_provider: "ollama"
  providers:
    ollama:
      base_url: "http://192.168.224.1:11434"
      models:
        chat: "llama3.2"
```

## 📚 ドキュメント

- [API リファレンス](./docs/API.md) - 全16 MCP ツールの詳細仕様
- [要件定義書](./storage/specs/)
- [設計書](./storage/design/)
- [AGENTS.md](./AGENTS.md) - AI Agent向けナレッジ

### パッケージドキュメント

| パッケージ | 説明 |
|-----------|------|
| [@aria/core](./packages/core/README.md) | コアライブラリ |
| [@aria/llm-providers](./packages/llm-providers/README.md) | マルチLLMプロバイダー |
| [@aria/paper-downloader](./packages/paper-downloader/README.md) | 論文検索・ダウンロード |
| [@aria/mcp-server](./packages/mcp-server/README.md) | MCPサーバー |
| [@aria/docling-adapter](./packages/docling-adapter/README.md) | PDF変換アダプター |
| [@aria/graphrag](./packages/graphrag/README.md) | GraphRAG統合 |

## 🔗 外部連携

- [Microsoft GraphRAG](https://github.com/microsoft/graphrag) - ナレッジグラフRAG
- [docling](https://github.com/docling-project/docling) - PDF→Markdown変換
- [MCP](https://spec.modelcontextprotocol.io/) - Model Context Protocol

## 📝 ライセンス

MIT License
