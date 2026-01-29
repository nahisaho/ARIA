# REQ-003: GitHub Copilot Agent Skills 仕様

> **作成日**: 2026-01-28  
> **バージョン**: 0.1.0  
> **ステータス**: Draft

---

## 1. 概要

GitHub Copilot Agent Skills を活用して、ARIA の機能を Copilot から直接利用可能にする。

### 1.1 スキル配置構造

```
aria/.github/skills/
├── experiment-log/
│   ├── SKILL.md
│   ├── templates/
│   │   └── experiment-template.yaml
│   └── examples/
│       └── sample-experiment.yaml
├── paper-analysis/
│   ├── SKILL.md
│   ├── scripts/
│   │   └── analyze.py
│   └── prompts/
│       └── extraction-prompt.md
├── graphrag-query/
│   ├── SKILL.md
│   └── examples/
│       └── query-examples.md
├── knowledge-capture/
│   ├── SKILL.md
│   └── templates/
│       └── entity-template.yaml
└── research-workflow/
    ├── SKILL.md
    └── workflows/
        └── paper-review.yaml
```

---

## 2. experiment-log スキル

### 2.1 SKILL.md

```markdown
---
name: experiment-log
description: |
  実験ノートの作成・管理を行うスキル。
  実験の記録、Copilotとのやり取り保存、実験データの構造化を支援します。
  使用タイミング：実験を開始する時、実験結果を記録する時、過去の実験を検索する時
license: MIT
---

# 実験ノート記録スキル

## 使用方法

### 新規実験の開始

実験を開始する際は、以下の情報を収集して記録してください：

1. **実験タイトル**: 簡潔で検索可能な名前
2. **カテゴリ**: hypothesis, data-collection, analysis, visualization, model-training, evaluation
3. **タグ**: 関連するキーワード（例：graphrag, nlp, optimization）
4. **目的**: 実験の目的と仮説

### 実験記録の構造

storage/experiments/YYYY/MM/DD/EXP-YYYY-MM-DD-NNN.yaml に保存

### テンプレート

templates/experiment-template.yaml を参照して実験ログを作成してください。

### Copilot対話の記録

このやり取りも実験ログに記録されます。重要な以下の情報を含めてください：
- 質問・プロンプト内容
- 得られた回答・コード
- 実行結果とその評価

### MCP連携

aria-mcp-server の以下のツールを使用：
- `experiment_create`: 新規作成
- `experiment_update`: 更新
- `experiment_search`: 検索

## 例

```yaml
title: "GraphRAGのchunk_sizeパラメータ最適化"
category: analysis
tags: [graphrag, parameter-tuning]
inputs:
  - name: chunk_size
    type: parameter
    value: 300
outputs:
  - name: recall
    type: metric
    value: 0.85
```
```

### 2.2 テンプレート

```yaml
# templates/experiment-template.yaml
# 実験ログテンプレート v1.0

# === 基本情報 ===
title: ""                    # 必須: 実験タイトル
description: ""              # 任意: 詳細説明
category: ""                 # 必須: hypothesis|data-collection|analysis|visualization|model-training|evaluation
tags: []                     # 推奨: 検索用タグ

# === 実験設定 ===
hypothesis: ""               # 仮説（hypothesis カテゴリの場合は必須）
methodology: ""              # 手法の説明

# === 入力 ===
inputs:
  - name: ""
    type: ""                 # file|parameter|data|reference
    value: ""
    source: ""               # 任意: データソース

# === 出力 ===
outputs:
  - name: ""
    type: ""                 # file|metric|visualization|model
    value: ""
    path: ""                 # 任意: ファイルパス

# === 観察・結論 ===
observations: []             # 観察事項のリスト
conclusions: ""              # 結論

# === 関連情報 ===
relatedPapers: []            # 関連論文ID
relatedExperiments: []       # 関連実験ID

# === メタデータ（自動生成） ===
# id: auto-generated
# experimentId: auto-generated
# date: auto-generated
# timestamp: auto-generated
# interactions: auto-captured
# version: 1
# createdAt: auto-generated
# updatedAt: auto-generated
```

---

## 3. paper-analysis スキル

### 3.1 SKILL.md

```markdown
---
name: paper-analysis
description: |
  論文の分析・情報抽出を行うスキル。
  PDF論文の読み込み、Markdown変換、メタデータ抽出、要約生成を支援します。
  使用タイミング：論文を分析する時、論文から情報を抽出する時、文献レビューを行う時
license: MIT
---

# 論文分析スキル

## 使用方法

### 論文のインポートと変換

1. PDF論文を `storage/papers/inbox/` に配置
2. docling を使用して Markdown に変換
3. メタデータを自動抽出

### 分析プロセス

1. **基本情報抽出**: タイトル、著者、要旨、出版情報
2. **構造解析**: セクション、図表、数式の特定
3. **引用分析**: 参考文献の抽出と関連付け
4. **キーワード抽出**: 主要概念とトピックの特定

### MCP連携

aria-mcp-server の以下のツールを使用：
- `paper_import`: 論文インポート
- `paper_analyze`: 詳細分析
- `paper_search`: 論文検索

### 出力形式

分析結果は以下の形式で保存：
- `storage/papers/processed/{paper_id}/paper.md`: 本文Markdown
- `storage/papers/processed/{paper_id}/metadata.yaml`: メタデータ
- `storage/papers/processed/{paper_id}/figures/`: 図表

## 分析プロンプト例

### 論文要約の依頼
「この論文の主要な貢献と手法を要約してください」

### 手法の詳細分析
「提案手法のアーキテクチャと主要なコンポーネントを説明してください」

### 比較分析
「この論文と関連研究を比較し、差分を明らかにしてください」

## 出力例

```yaml
title: "GraphRAG: Unlocking LLM Discovery on Narrative Private Data"
authors:
  - name: "Example Author"
    affiliation: "Microsoft Research"
abstract: "We present GraphRAG, a graph-based approach..."
keywords:
  - knowledge graph
  - retrieval-augmented generation
  - large language models
sections:
  - title: "Introduction"
    summary: "..."
  - title: "Methodology"
    summary: "..."
key_contributions:
  - "Novel graph-based RAG architecture"
  - "Community detection for summarization"
```
```

### 3.2 分析スクリプト

```python
# scripts/analyze.py
"""
論文分析スクリプト
docling を使用してPDFを変換し、メタデータを抽出
"""

import sys
from pathlib import Path
from docling.document_converter import DocumentConverter
import yaml
import json

def analyze_paper(pdf_path: str, output_dir: str) -> dict:
    """論文を分析し、構造化データを生成"""
    
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document
    
    # Markdown生成
    md_content = doc.export_to_markdown()
    
    # メタデータ抽出（基本実装）
    metadata = {
        "original_path": pdf_path,
        "title": extract_title(doc),
        "sections": extract_sections(doc),
        "processing_status": "completed",
    }
    
    # 保存
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    (output_path / "paper.md").write_text(md_content)
    (output_path / "metadata.yaml").write_text(yaml.dump(metadata, allow_unicode=True))
    
    return metadata

def extract_title(doc) -> str:
    """タイトル抽出（実装は docling のAPIに依存）"""
    # TODO: docling の API を使用して実装
    return ""

def extract_sections(doc) -> list:
    """セクション抽出"""
    # TODO: docling の API を使用して実装
    return []

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python analyze.py <pdf_path> <output_dir>")
        sys.exit(1)
    
    result = analyze_paper(sys.argv[1], sys.argv[2])
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

---

## 4. graphrag-query スキル

### 4.1 SKILL.md

```markdown
---
name: graphrag-query
description: |
  GraphRAG を使用したナレッジグラフ検索スキル。
  論文や実験データに対するセマンティック検索、グラフベースの推論を支援します。
  使用タイミング：複雑な質問に回答する時、関連情報を探す時、知識を統合する時
license: MIT
---

# GraphRAG クエリスキル

## 使用方法

### 検索モード

1. **ローカル検索 (Local Search)**
   - 特定のエンティティや概念に関する詳細情報
   - 「〇〇とは何か」「〇〇の詳細を教えて」

2. **グローバル検索 (Global Search)**
   - 広範なトピックの概要や要約
   - 「〇〇分野の最新動向」「〇〇と△△の関係」

3. **ドリフト検索 (Drift Search)**
   - 探索的な質問、関連情報の発見
   - 「〇〇に関連する興味深いトピック」

### MCP連携

aria-mcp-server の以下のツールを使用：
- `graphrag_query`: 汎用クエリ
- `graphrag_local`: ローカル検索
- `graphrag_global`: グローバル検索
- `graphrag_index`: インデックス更新

### クエリ例

#### ローカル検索
```
質問: GraphRAGのchunk_sizeパラメータの最適値は？
モード: local
コンテキスト: parameter-tuning, graphrag
```

#### グローバル検索
```
質問: 知識グラフを使用したRAGの最新手法を概説してください
モード: global
コンテキスト: rag, knowledge-graph, survey
```

### 応答形式

検索結果には以下が含まれます：
- **回答**: 質問への直接的な回答
- **根拠**: 回答の根拠となるソース（論文、実験）
- **関連エンティティ**: グラフ上の関連ノード
- **信頼度スコア**: 回答の確信度

## GraphRAG設定

```yaml
query:
  local_search:
    max_results: 10
    similarity_threshold: 0.7
  global_search:
    community_level: 2
    max_summaries: 5
  drift_search:
    exploration_depth: 3
```
```

---

## 5. knowledge-capture スキル

### 5.1 SKILL.md

```markdown
---
name: knowledge-capture
description: |
  知識・洞察のキャプチャと構造化を行うスキル。
  会話から重要な情報を抽出し、ナレッジグラフに追加します。
  使用タイミング：新しい知見を得た時、重要な情報を記録したい時
license: MIT
---

# 知識キャプチャスキル

## 使用方法

### キャプチャ対象

1. **概念 (Concept)**: 新しい用語、定義、説明
2. **手法 (Method)**: アルゴリズム、手順、テクニック
3. **発見 (Finding)**: 実験結果、観察、洞察
4. **関係 (Relation)**: エンティティ間の関連性

### キャプチャフォーマット

```yaml
type: concept|method|finding|relation
name: "エンティティ名"
description: "説明"
source: "情報源（論文ID、実験ID、URL等）"
tags: [tag1, tag2]
relations:
  - type: "関係タイプ"
    target: "対象エンティティ"
```

### 自動キャプチャ

会話中に以下のパターンを検出し、自動的にキャプチャを提案：
- 「〇〇とは...」→ 概念定義
- 「〇〇する方法は...」→ 手法
- 「〇〇が分かった」→ 発見
- 「〇〇は△△に関連する」→ 関係

### MCP連携

- `knowledge_add`: 知識追加
- `knowledge_search`: 知識検索
- `knowledge_relate`: 関係追加

## 例

### 概念のキャプチャ
```yaml
type: concept
name: "LazyGraphRAG"
description: "オンデマンドでグラフを構築する軽量版GraphRAG"
source: "EXP-2026-01-28-001"
tags: [graphrag, optimization, lazy-evaluation]
relations:
  - type: "variant_of"
    target: "GraphRAG"
```
```

---

## 6. research-workflow スキル

### 6.1 SKILL.md

```markdown
---
name: research-workflow
description: |
  研究ワークフローをガイドするスキル。
  文献レビュー、実験計画、論文執筆などの研究プロセスを支援します。
  使用タイミング：研究を計画する時、文献レビューを行う時、論文を書く時
license: MIT
---

# 研究ワークフロースキル

## ワークフロー一覧

### 1. 文献レビュー (Literature Review)

```
Phase 1: 検索戦略
├── キーワード定義
├── データベース選定
└── 検索クエリ作成

Phase 2: 論文収集
├── paper_import で PDF をインポート
├── paper_analyze で分析
└── GraphRAG でインデックス

Phase 3: 分析・統合
├── graphrag_global で概要把握
├── graphrag_local で詳細確認
└── knowledge_capture で知見記録

Phase 4: 整理
├── テーマ別分類
├── 比較表作成
└── ギャップ分析
```

### 2. 実験計画 (Experiment Planning)

```
Phase 1: 仮説設定
├── 研究質問の明確化
├── 仮説の文書化
└── experiment_create で記録

Phase 2: 実験設計
├── 変数の定義
├── 手順の計画
└── 評価指標の設定

Phase 3: 実行・記録
├── 実験の実施
├── データ収集
└── experiment_update で更新

Phase 4: 分析・報告
├── 結果の分析
├── 結論の導出
└── knowledge_capture で知見記録
```

### 3. 論文執筆 (Paper Writing)

```
Phase 1: アウトライン
├── 構成の決定
├── 主要な主張の整理
└── 図表の計画

Phase 2: ドラフト作成
├── セクションごとの執筆
├── 関連研究の引用
└── 図表の作成

Phase 3: レビュー・修正
├── 内容の確認
├── 表現の改善
└── 一貫性のチェック
```

## 使用例

### 文献レビューの開始
「GraphRAG に関する文献レビューを開始します。最近の関連論文を探してください。」

### 実験の計画
「新しい実験を計画しています。LazyGraphRAG の性能を評価したいです。」

### 論文執筆の支援
「実験結果をまとめた論文を書きたいです。構成を提案してください。」
```

---

## 7. 次のステップ

1. 各スキルの SKILL.md ファイルを `.github/skills/` に配置
2. テンプレートとスクリプトを追加
3. MCP サーバーとの連携をテスト
4. 実際の使用フローで検証

---

**関連ドキュメント**:
- [REQ-001: プロジェクト概要](./REQ-001-project-overview.md)
- [REQ-002: 詳細機能仕様](./REQ-002-functional-specs.md)
