---
name: knowledge-capture
description: |
  知識・洞察のキャプチャと構造化を行うスキル。
  会話から重要な情報を抽出し、ナレッジグラフに追加します。
  使用タイミング：新しい知見を得た時、重要な情報を記録したい時
license: MIT
---

# 知識キャプチャスキル

会話や研究から得られた知識・洞察を構造化し、ナレッジグラフに追加するスキルです。

## キャプチャ対象

### 1. 概念 (Concept)
新しい用語、定義、説明

```yaml
type: concept
name: "LazyGraphRAG"
description: "オンデマンドでグラフを構築する軽量版GraphRAG"
source: "EXP-2026-01-28-001"
tags: [graphrag, optimization, lazy-evaluation]
```

### 2. 手法 (Method)
アルゴリズム、手順、テクニック

```yaml
type: method
name: "Community-based Summarization"
description: "グラフコミュニティ単位で要約を生成する手法"
steps:
  - "エンティティ抽出"
  - "関係構築"
  - "コミュニティ検出"
  - "コミュニティ要約生成"
source: "PAPER-graphrag-2024"
tags: [summarization, community-detection, graphrag]
```

### 3. 発見 (Finding)
実験結果、観察、洞察

```yaml
type: finding
name: "chunk_size最適値"
description: "論文データに対してchunk_size=300が最適"
evidence: "recall=0.85, precision=0.78 を達成"
conditions: "論文100件のテストセットにて"
source: "EXP-2026-01-28-001"
tags: [graphrag, parameter-tuning]
```

### 4. 関係 (Relation)
エンティティ間の関連性

```yaml
type: relation
from_entity: "LazyGraphRAG"
to_entity: "GraphRAG"
relation_type: "variant_of"
description: "LazyGraphRAGはGraphRAGの軽量版実装"
source: "conversation"
```

## MCP連携

aria-mcp-server の以下のツールを使用：

| ツール | 用途 |
|--------|------|
| `knowledge_add` | 知識エンティティの追加 |
| `knowledge_search` | 知識の検索 |
| `knowledge_relate` | エンティティ間の関係追加 |
| `knowledge_update` | 既存知識の更新 |

## 自動キャプチャパターン

会話中に以下のパターンを検出し、自動的にキャプチャを提案：

| パターン | キャプチャタイプ |
|----------|------------------|
| 「〇〇とは...」 | concept |
| 「〇〇の定義は...」 | concept |
| 「〇〇する方法は...」 | method |
| 「〇〇の手順は...」 | method |
| 「〇〇が分かった」 | finding |
| 「〇〇を発見した」 | finding |
| 「〇〇は△△に関連する」 | relation |
| 「〇〇は△△の一種」 | relation |

## ワークフロー

### 手動キャプチャ

```
1. 重要な情報を特定
   └── 概念/手法/発見/関係 を判断

2. 構造化データを作成
   └── 適切なテンプレートを使用

3. knowledge_add で保存
   └── ナレッジグラフに追加

4. 関係を設定
   └── knowledge_relate で既存知識と接続
```

### 自動キャプチャ

```
1. 会話を監視
   └── キャプチャパターンを検出

2. キャプチャ候補を提案
   └── ユーザーに確認

3. 承認後に保存
   └── knowledge_add で追加

4. 関連エンティティを自動リンク
   └── 既存の関連知識を検索して接続
```

## キャプチャテンプレート

### 概念テンプレート

```yaml
type: concept
name: ""                    # 必須: 概念名
description: ""             # 必須: 説明
aliases: []                 # 別名
category: ""                # カテゴリ
source: ""                  # 情報源
source_type: ""             # paper|experiment|conversation|url
tags: []                    # タグ
relations:
  - type: ""                # 関係タイプ
    target: ""              # 対象エンティティ
```

### 手法テンプレート

```yaml
type: method
name: ""                    # 必須: 手法名
description: ""             # 必須: 説明
purpose: ""                 # 目的
steps: []                   # 手順
inputs: []                  # 入力
outputs: []                 # 出力
prerequisites: []           # 前提条件
limitations: []             # 制限事項
source: ""
tags: []
```

### 発見テンプレート

```yaml
type: finding
name: ""                    # 必須: 発見の名前
description: ""             # 必須: 説明
evidence: ""                # 根拠
conditions: ""              # 条件
implications: []            # 示唆
confidence: ""              # high|medium|low
source: ""
tags: []
```

### 関係テンプレート

```yaml
type: relation
from_entity: ""             # 必須: 元エンティティ
to_entity: ""               # 必須: 先エンティティ
relation_type: ""           # 必須: 関係タイプ
description: ""             # 説明
bidirectional: false        # 双方向か
source: ""
```

## 関係タイプ

| 関係タイプ | 説明 | 例 |
|------------|------|-----|
| `is_a` | 継承関係 | "LazyGraphRAG is_a RAG Method" |
| `variant_of` | 派生 | "LazyGraphRAG variant_of GraphRAG" |
| `part_of` | 構成要素 | "Entity Extraction part_of GraphRAG" |
| `uses` | 使用関係 | "GraphRAG uses Community Detection" |
| `related_to` | 関連 | "GraphRAG related_to Knowledge Graph" |
| `precedes` | 先行 | "Chunking precedes Entity Extraction" |
| `contradicts` | 矛盾 | "Finding A contradicts Finding B" |
| `supports` | 支持 | "Experiment supports Hypothesis" |

## 例

### 概念のキャプチャ

```
ユーザー: LazyGraphRAGとは、クエリ時にオンデマンドでグラフを構築する手法です

アクション:
1. 概念キャプチャを検出
2. knowledge_add を呼び出し:
   type: concept
   name: "LazyGraphRAG"
   description: "クエリ時にオンデマンドでグラフを構築する手法"
   source: "conversation"
3. knowledge_relate で GraphRAG との関係を追加:
   relation_type: "variant_of"
   target: "GraphRAG"
```

### 発見のキャプチャ

```
ユーザー: 実験の結果、chunk_size=300 が最適だと分かりました

アクション:
1. 発見キャプチャを検出
2. knowledge_add を呼び出し:
   type: finding
   name: "chunk_size最適値"
   description: "GraphRAGにおけるchunk_sizeの最適値は300"
   source: "EXP-2026-01-28-001"
   confidence: "high"
```
