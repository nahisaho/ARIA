# ARIA — AI Research & Inquiry Assistant v0.1.0

> **AI Agent 向けナレッジ** — GitHub Copilot Agent Skills で AI for Science を推進

---

## 🎯 クイックリファレンス

| 項目 | 値 |
|------|-----|
| プロジェクト名 | ARIA (AI Research & Inquiry Assistant) |
| バージョン | 0.1.0 |
| Agent Skills | 5 |
| MCP Tools | 10+ |
| 対応LLM | Azure OpenAI, OpenAI, Claude, Ollama |

---

## 📦 機能概要

| カテゴリ | 機能 | 説明 |
|----------|------|------|
| **実験記録** | Experiment Log | 実験日・Copilot対話履歴の保存 |
| **論文分析** | Paper Analysis | PDF→Markdown変換、メタデータ抽出 |
| **GraphRAG** | Knowledge Graph | Microsoft GraphRAG/LazyGraphRAG統合 |
| **MCP連携** | External Integration | 外部システムとのプロトコル連携 |

---

## 📁 ディレクトリ構造

```
aria/
├── AGENTS.md                    # このファイル
├── .github/
│   ├── skills/                  # Agent Skills
│   │   ├── experiment-log/      # 実験記録スキル
│   │   ├── paper-analysis/      # 論文分析スキル
│   │   ├── graphrag-query/      # GraphRAGスキル
│   │   ├── knowledge-capture/   # 知識キャプチャスキル
│   │   └── research-workflow/   # 研究ワークフロースキル
│   └── workflows/               # CI/CD
├── packages/
│   ├── core/                    # コア機能
│   ├── mcp-server/              # MCPサーバー
│   ├── graphrag/                # GraphRAG統合
│   ├── docling-adapter/         # doclingアダプター
│   └── llm-providers/           # LLMプロバイダー
├── config/
│   └── aria.config.yaml         # 設定ファイル
└── docs/

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

config/
    └── aria.config.yaml         # 設定ファイル
```

---

## 🛠️ Agent Skills

### experiment-log
| 項目 | 値 |
|------|-----|
| 場所 | `.github/skills/experiment-log/` |
| 用途 | 実験ノートの作成・管理 |
| トリガー | 実験開始時、結果記録時 |

**WHEN**: 実験を開始する、結果を記録する
**DO**: experiment_create, experiment_update ツールを使用

### paper-analysis
| 項目 | 値 |
|------|-----|
| 場所 | `.github/skills/paper-analysis/` |
| 用途 | 論文のインポート・分析 |
| トリガー | 論文を読む時、文献レビュー時 |

**WHEN**: 論文PDFを分析する
**DO**: paper_import, paper_analyze ツールを使用

### graphrag-query
| 項目 | 値 |
|------|-----|
| 場所 | `.github/skills/graphrag-query/` |
| 用途 | ナレッジグラフ検索 |
| トリガー | 複雑な質問、関連情報探索 |

**WHEN**: 知識ベースを検索する
**DO**: graphrag_local, graphrag_global ツールを使用

### knowledge-capture
| 項目 | 値 |
|------|-----|
| 場所 | `.github/skills/knowledge-capture/` |
| 用途 | 知識・洞察のキャプチャ |
| トリガー | 新しい知見を得た時 |

**WHEN**: 重要な情報を記録したい
**DO**: knowledge_add, knowledge_relate ツールを使用

### research-workflow
| 項目 | 値 |
|------|-----|
| 場所 | `.github/skills/research-workflow/` |
| 用途 | 研究プロセスのガイド |
| トリガー | 研究計画、文献レビュー、論文執筆 |

**WHEN**: 研究ワークフローを実行する
**DO**: 適切なスキルとツールを組み合わせて使用

---

## 🔌 MCP ツール

| ツール | 説明 | カテゴリ |
|--------|------|----------|
| `experiment_create` | 実験ログ作成 | Experiment |
| `experiment_update` | 実験ログ更新 | Experiment |
| `experiment_search` | 実験検索 | Experiment |
| `paper_import` | 論文インポート (docling使用) | Paper |
| `paper_analyze` | 論文分析 | Paper |
| `paper_search` | 論文検索 | Paper |
| `paper_download` | 論文PDF取得（OAソース） | Paper |
| `paper_check_oa` | Open Access確認（Unpaywall） | Paper |
| `graphrag_index` | インデックス作成 | GraphRAG |
| `graphrag_query` | グラフクエリ | GraphRAG |
| `graphrag_local` | ローカル検索 | GraphRAG |
| `graphrag_global` | グローバル検索 | GraphRAG |
| `knowledge_add` | 知識追加 | Knowledge |
| `knowledge_search` | 知識検索 | Knowledge |

### 論文PDF取得ソース（ToolUniverse参考）

| ソース | PDF直接取得 | 用途 |
|--------|-------------|------|
| arXiv | ✅ | CS/Physics/Math プレプリント |
| PubMed Central | ✅ | バイオメディカル フルテキスト |
| Unpaywall | ✅ (OA URL) | DOIからOAロケーション発見 |
| CORE | ✅ | 世界最大のOAコレクション |
| Europe PMC | ✅ | ヨーロッパ バイオメディカル |
| BioRxiv/MedRxiv | ✅ | バイオ/医療プレプリント |
| DOAJ | ✅ | OAジャーナルディレクトリ |
| Zenodo | ✅ | オープン研究データ |

---

## ⚙️ LLM設定

### 対応プロバイダー

| プロバイダー | 環境変数 | 用途 |
|--------------|----------|------|
| Azure OpenAI | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` | 本番 |
| OpenAI | `OPENAI_API_KEY` | 本番 |
| Anthropic | `ANTHROPIC_API_KEY` | 本番 |
| Ollama | `OLLAMA_BASE_URL` (default: 192.168.224.1) | テスト |

### 設定例 (aria.config.yaml)

```yaml
llm:
  default_provider: "ollama"  # テスト環境
  
  providers:
    ollama:
      type: "ollama"
      base_url: "http://192.168.224.1:11434"
      models:
        chat: "llama3.2"
        embedding: "nomic-embed-text"
```

---

## 📜 ガイドライン

### WHEN: 新規実験開始

```
DO:
1. experiment-log スキルを参照
2. 実験目的と仮説を明確化
3. experiment_create でログ作成
4. 対話履歴を自動記録
```

### WHEN: 論文分析

```
DO:
1. paper-analysis スキルを参照
2. PDFを storage/papers/inbox/ に配置
3. paper_import で Markdown 変換
4. paper_analyze でメタデータ抽出
5. graphrag_index でインデックス追加
```

### WHEN: 知識検索

```
DO:
1. graphrag-query スキルを参照
2. 質問タイプを判断（local/global/drift）
3. 適切な検索ツールを使用
4. 結果を knowledge_capture で記録
```

### WHEN: 研究ワークフロー

```
DO:
1. research-workflow スキルを参照
2. フェーズに応じたスキルを選択
3. 各ステップの成果物を記録
4. 進捗を追跡
```

---

## � AI for Science コンポーネント（ToolUniverse参考）

### 科学ワークフローパターン

| パターン | 説明 | ARIA実装 |
|----------|------|----------|
| **Broadcasting** | 複数ソース並列検索 | 文献レビュー |
| **Sequential Chaining** | 順次実行パイプライン | 分析フロー |
| **Conditional Branching** | 条件分岐 | 仮説検証 |
| **Iterative Refinement** | 反復改善 | パラメータ最適化 |
| **Agentic Composition** | AI主導選択 | 自律研究 |

### 対応データソース（Phase 1）

| ソース | タイプ | 用途 |
|--------|--------|------|
| arXiv | プレプリント | CS/Physics/Math論文 |
| Semantic Scholar | 学術全般 | 引用分析・検索 |
| Crossref | メタデータ | DOI解決 |
| OpenAlex | 学術全般 | オープン文献 |
| Wikipedia/Wikidata | 知識ベース | 一般知識参照 |

### ツール発見モード

```
WHEN: 適切なツールを探す
DO:
1. キーワード検索: tool_find_by_keyword
2. セマンティック検索: tool_find_by_semantic
3. LLM推薦: tool_find_by_llm
```

### Scientific Workflow 使用例

```yaml
# 文献レビューワークフロー
workflow: literature_review
input: { topic: "GraphRAG applications" }
steps:
  1. search_arxiv → papers[]
  2. search_semantic_scholar → papers[]
  3. merge_deduplicate → unique_papers[]
  4. analyze_batch → analyses[]
  5. synthesize → review_summary
```

> **参考**: [ToolUniverse](https://github.com/mims-harvard/ToolUniverse) の設計思想を採用  
> **詳細**: [REQ-004: AI for Science コンポーネント](../storage/specs/REQ-004-ai-for-science-components.md)

---

## �🗄️ データ保存

### 実験ログ
- **場所**: `storage/experiments/YYYY/MM/DD/`
- **形式**: YAML
- **命名**: `EXP-YYYY-MM-DD-NNN.yaml`

### 論文データ
- **入力**: `storage/papers/inbox/` (PDF)
- **処理済み**: `storage/papers/processed/{paper_id}/`
- **含まれるもの**: paper.md, metadata.yaml, figures/

### ナレッジグラフ
- **ベクトルストア**: `storage/knowledge-graph/vectors/`
- **グラフデータ**: `storage/knowledge-graph/graph/`

---

## 🔗 外部連携

### Microsoft GraphRAG
- **リポジトリ**: https://github.com/microsoft/graphrag
- **バージョン**: v3.0+
- **用途**: ナレッジグラフ構築、RAG検索

### docling
- **リポジトリ**: https://github.com/docling-project/docling
- **バージョン**: v2.70+
- **用途**: PDF→Markdown変換

---

## 🚨 重要な制約

| 制約 | 理由 |
|------|------|
| Python 3.10+ | docling/GraphRAG要件 |
| Node.js 20+ | ESM対応 |
| MCP SDK | プロトコル標準 |

---

## 📋 AI Agent ガイドライン

1. **コンテキスト最優先**: このAGENTS.mdと関連スキルを参照
2. **実験記録**: すべての作業を実験ログとして記録
3. **知識蓄積**: 新しい知見は必ずキャプチャ
4. **ツール活用**: MCP経由で適切なツールを使用
5. **段階的実行**: 複雑なタスクは小さなステップに分解

---

## �️ ストレージ構造（MUSUBIX憲法準拠）

| ディレクトリ | 用途 |
|--------------|------|
| `storage/specs/` | 要件定義・SDD仕様 |
| `storage/design/` | 設計文書 |
| `storage/changes/` | 変更履歴 |
| `storage/reviews/` | レビュー記録 |
| `storage/learning/` | 学習データ |
| `storage/dashboard/` | メトリクス |
| `storage/experiments/` | 実験記録 |
| `storage/papers/` | 論文データ |
| `storage/knowledge-graph/` | グラフデータ |

---

## 📞 参考資料

- [要件定義書](../storage/specs/)
  - [REQ-001: プロジェクト概要](../storage/specs/REQ-001-project-overview.md)
  - [REQ-002: 機能仕様](../storage/specs/REQ-002-functional-specs.md)
  - [REQ-003: Agent Skills](../storage/specs/REQ-003-agent-skills.md)
  - [REQ-004: AI for Science コンポーネント](../storage/specs/REQ-004-ai-for-science-components.md)
- [GitHub Copilot Agent Skills](https://docs.github.com/ja/copilot/concepts/agents/about-agent-skills)
- [Microsoft GraphRAG](https://github.com/microsoft/graphrag)
- [docling](https://github.com/docling-project/docling)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

### AI for Science 外部参考
- [ToolUniverse](https://github.com/mims-harvard/ToolUniverse)（Harvard Zitnik Lab）— ツール設計参考
- [Microsoft Research AI for Science](https://www.microsoft.com/en-us/research/lab/microsoft-research-ai-for-science/) — 第5パラダイム
- [MatterGen](https://www.microsoft.com/en-us/research/blog/mattergen-a-new-paradigm-of-materials-design-with-generative-ai/) — 生成AIパターン
- [MatterSim](https://www.microsoft.com/en-us/research/blog/mattersim-a-deep-learning-model-for-materials-under-real-world-conditions/) — エミュレータパターン
- [Aurora](https://www.microsoft.com/en-us/research/project/aurora-forecasting/) — 基盤モデル
- [Graphormer](https://www.microsoft.com/en-us/research/project/graphormer/) — グラフトランスフォーマー
- [Azure AI Foundry Labs](https://ai.azure.com/labs) — モデル公開プラットフォーム

---

**最終更新**: 2026-01-28 | **バージョン**: 0.2.0
