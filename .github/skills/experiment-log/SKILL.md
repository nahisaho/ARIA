---
name: experiment-log
description: |
  実験ノートの作成・管理を行うスキル。
  実験の記録、GitHub Copilotとのやり取り保存、実験データの構造化を支援します。
  使用タイミング：実験を開始する時、実験結果を記録する時、過去の実験を検索する時
license: MIT
---

# 実験ノート記録スキル

実験の記録と管理を支援するスキルです。すべての実験データとCopilotとのやり取りを構造化して保存します。

## 使用方法

### 新規実験の開始

実験を開始する際は、以下の情報を収集して記録してください：

1. **実験タイトル**: 簡潔で検索可能な名前
2. **カテゴリ**: hypothesis, data-collection, analysis, visualization, model-training, evaluation
3. **タグ**: 関連するキーワード（例：graphrag, nlp, optimization）
4. **目的**: 実験の目的と仮説

### 実験記録の保存先

```
storage/experiments/YYYY/MM/DD/EXP-YYYY-MM-DD-NNN.yaml
```

### テンプレート

`templates/experiment-template.yaml` を参照して実験ログを作成してください。

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

## 実験ログの構造

```yaml
# 基本情報
title: "実験タイトル"
category: analysis
tags: [tag1, tag2]

# Copilot対話
interactions:
  - id: "int-001"
    timestamp: "2026-01-28T10:30:00Z"
    type: prompt
    content: "質問内容"
  - id: "int-002"
    timestamp: "2026-01-28T10:30:15Z"
    type: response
    content: "回答内容"

# 実験データ
inputs:
  - name: parameter_name
    type: parameter
    value: 300

outputs:
  - name: metric_name
    type: metric
    value: 0.85

# 観察と結論
observations:
  - "観察事項1"
  - "観察事項2"
conclusions: "結論"
```

## ワークフロー

```
1. 実験開始
   ├── experiment_create で新規ログ作成
   └── 目的・仮説を記録

2. 実験実行
   ├── Copilotとの対話を自動記録
   ├── 入力パラメータを記録
   └── 中間結果を記録

3. 結果記録
   ├── 出力・メトリクスを記録
   ├── 観察事項を記録
   └── 結論を導出

4. 保存・共有
   ├── experiment_update で最終保存
   └── 関連する実験・論文をリンク
```

## 例

### 新規実験の作成

```
ユーザー: GraphRAGのchunk_sizeパラメータを最適化する実験を開始します

アクション:
1. experiment_create を呼び出し
2. 以下の情報で実験ログを作成：
   - title: "GraphRAG chunk_size パラメータ最適化"
   - category: analysis
   - tags: [graphrag, parameter-tuning, optimization]
```

### 結果の記録

```
ユーザー: chunk_size=300 で recall=0.85 が得られました

アクション:
1. experiment_update を呼び出し
2. outputs に結果を追加：
   - name: recall
     type: metric
     value: 0.85
```

## 検索

過去の実験を検索する際は `experiment_search` を使用：

```
experiment_search:
  query: "GraphRAG optimization"
  filters:
    category: analysis
    date_from: "2026-01-01"
    tags: [graphrag]
```
