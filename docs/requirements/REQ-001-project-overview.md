# REQ-001: ARIA プロジェクト概要要件定義

> **作成日**: 2026-01-28  
> **バージョン**: 0.1.0  
> **ステータス**: Draft

---

## 1. プロジェクト概要

### 1.1 プロジェクト名
**ARIA** - AI Research & Inquiry Assistant

### 1.2 ビジョン
GitHub Copilot Agent Skills を活用し、AI for Science を推進する研究支援プラットフォームを構築する。

### 1.3 ミッション
- 研究者の実験記録・論文分析・知識管理を自動化
- Microsoft GraphRAG/LazyGraphRAG による高度な情報検索
- マルチLLMサポートによる柔軟なAI活用

---

## 2. システム要件

### 2.1 機能要件

#### FR-001: 実験ノート記録
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-001-01 | 実験日時の自動記録 | Must |
| FR-001-02 | GitHub Copilot とのやり取り履歴保存 | Must |
| FR-001-03 | 実験データの構造化保存（JSON/YAML） | Must |
| FR-001-04 | タグ・カテゴリによる分類 | Should |
| FR-001-05 | 検索・フィルタリング機能 | Should |

#### FR-002: 論文分析機能
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-002-01 | PDF→Markdown変換（docling使用） | Must |
| FR-002-02 | 論文メタデータ抽出（タイトル、著者、要旨） | Must |
| FR-002-03 | 引用関係の抽出・可視化 | Should |
| FR-002-04 | 図表・数式の解析 | Could |

#### FR-003: GraphRAG機能
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-003-01 | Microsoft GraphRAG 統合 | Must |
| FR-003-02 | LazyGraphRAG 実装 | Should |
| FR-003-03 | ナレッジグラフ構築・更新 | Must |
| FR-003-04 | セマンティック検索 | Must |
| FR-003-05 | グラフクエリ実行 | Should |

#### FR-004: マルチLLMサポート
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-004-01 | Azure OpenAI 対応 | Must |
| FR-004-02 | OpenAI API 対応 | Must |
| FR-004-03 | Claude (Anthropic) 対応 | Must |
| FR-004-04 | Ollama ローカルLLM対応 | Must |
| FR-004-05 | 設定ファイルによるモデル切替 | Must |

#### FR-005: MCP連携
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-005-01 | MCP サーバー実装 | Must |
| FR-005-02 | MCP クライアント実装 | Must |
| FR-005-03 | 外部システム連携プロトコル | Must |
| FR-005-04 | ツール動的登録 | Should |

#### FR-006: GitHub Copilot Agent Skills
| ID | 要件 | 優先度 |
|----|------|--------|
| FR-006-01 | .github/skills ディレクトリ構造 | Must |
| FR-006-02 | SKILL.md ファイル作成 | Must |
| FR-006-03 | 実験記録スキル | Must |
| FR-006-04 | 論文分析スキル | Must |
| FR-006-05 | GraphRAGクエリスキル | Should |

### 2.2 非機能要件

#### NFR-001: パフォーマンス
| ID | 要件 | 目標値 |
|----|------|--------|
| NFR-001-01 | PDF変換速度 | 10ページ/分以上 |
| NFR-001-02 | GraphRAGクエリ応答 | 5秒以内 |
| NFR-001-03 | 同時処理数 | 10並列以上 |

#### NFR-002: スケーラビリティ
| ID | 要件 | 目標値 |
|----|------|--------|
| NFR-002-01 | 論文保存数 | 10,000件以上 |
| NFR-002-02 | ナレッジグラフノード | 1,000,000以上 |

#### NFR-003: セキュリティ
| ID | 要件 | 優先度 |
|----|------|--------|
| NFR-003-01 | APIキー暗号化保存 | Must |
| NFR-003-02 | ローカル実行オプション | Must |
| NFR-003-03 | データ匿名化オプション | Should |

---

## 3. 技術スタック

### 3.1 言語・ランタイム
| 項目 | 選定 | 理由 |
|------|------|------|
| 言語 | TypeScript + Python | TS: Agent Skills/MCP, Python: GraphRAG/docling |
| Node.js | 20.x LTS | ESM対応、最新API |
| Python | 3.10+ | docling/GraphRAG要件 |

### 3.2 フレームワーク・ライブラリ
| 項目 | 選定 | 用途 |
|------|------|------|
| docling | v2.70+ | PDF→Markdown変換 |
| Microsoft GraphRAG | v3.0+ | ナレッジグラフRAG |
| MCP SDK | 最新 | プロトコル連携 |

### 3.3 LLMプロバイダー
| プロバイダー | モデル例 | 用途 |
|--------------|----------|------|
| Azure OpenAI | gpt-4o, gpt-4-turbo | 本番環境 |
| OpenAI | gpt-4o, o1 | 本番環境 |
| Anthropic | claude-3.5-sonnet, opus | 本番環境 |
| Ollama | llama3.2, qwen2.5 | テスト/ローカル |

### 3.4 テスト環境
| 項目 | 設定 |
|------|------|
| Ollama Server | 192.168.224.1 |
| テストモデル | 設定で指定 |

---

## 4. 外部連携

### 4.1 MCP連携先候補
| システム | 連携内容 |
|----------|----------|
| GitHub | リポジトリ・Issues管理 |
| Zotero | 文献管理 |
| Notion | ドキュメント同期 |
| Obsidian | ナレッジベース |
| Slack | 通知・レポート |

---

## 5. 成果物

### 5.1 ディレクトリ構造（計画）
```
aria/
├── AGENTS.md                    # AI Agent向けナレッジ
├── .github/
│   ├── skills/                  # Agent Skills
│   │   ├── experiment-log/      # 実験記録スキル
│   │   ├── paper-analysis/      # 論文分析スキル
│   │   └── graphrag-query/      # GraphRAGスキル
│   └── workflows/               # CI/CD
├── packages/
│   ├── core/                    # コア機能
│   ├── mcp-server/              # MCPサーバー
│   ├── graphrag/                # GraphRAG統合
│   ├── docling-adapter/         # doclingアダプター
│   └── llm-providers/           # LLMプロバイダー
├── storage/
│   ├── experiments/             # 実験記録
│   ├── papers/                  # 論文データ
│   └── knowledge-graph/         # グラフデータ
├── docs/
│   ├── requirements/            # 要件定義
│   ├── design/                  # 設計文書
│   └── api/                     # API仕様
└── config/
    └── aria.config.yaml         # 設定ファイル
```

---

## 6. マイルストーン

| フェーズ | 期間 | 成果物 |
|----------|------|--------|
| Phase 1 | Week 1-2 | 基本構造・Agent Skills |
| Phase 2 | Week 3-4 | 実験ノート機能 |
| Phase 3 | Week 5-6 | docling統合・論文分析 |
| Phase 4 | Week 7-8 | GraphRAG統合 |
| Phase 5 | Week 9-10 | MCP連携・統合テスト |

---

## 7. 用語集

| 用語 | 定義 |
|------|------|
| ARIA | AI Research & Inquiry Assistant |
| Agent Skills | GitHub Copilotの拡張機能 |
| GraphRAG | グラフベースのRAGシステム |
| LazyGraphRAG | 軽量版GraphRAG |
| MCP | Model Context Protocol |
| docling | PDF/ドキュメント変換ライブラリ |

---

## 8. 参考資料

- [GitHub Copilot Agent Skills](https://docs.github.com/ja/copilot/concepts/agents/about-agent-skills)
- [Microsoft GraphRAG](https://github.com/microsoft/graphrag)
- [docling](https://github.com/docling-project/docling)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

---

**次のステップ**: [REQ-002: 詳細機能仕様](./REQ-002-functional-specs.md)
