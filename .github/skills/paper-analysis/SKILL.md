---
name: paper-analysis
description: |
  論文の分析・情報抽出を行うスキル。
  doclingを使用したPDF→Markdown変換、メタデータ抽出、要約生成を支援します。
  使用タイミング：論文を分析する時、論文から情報を抽出する時、文献レビューを行う時
license: MIT
---

# 論文分析スキル

docling を使用して論文PDFを分析し、構造化されたデータを抽出するスキルです。

## 使用方法

### 論文のインポートと変換

1. PDF論文を `storage/papers/inbox/` に配置
2. docling を使用して Markdown に変換
3. メタデータを自動抽出

### 分析プロセス

```
Phase 1: 文書変換
├── PDF読み込み
├── docling による解析
└── Markdown 生成

Phase 2: メタデータ抽出
├── タイトル・著者
├── 要旨（アブストラクト）
├── キーワード
└── 出版情報

Phase 3: 構造解析
├── セクション構造
├── 図表の特定
├── 数式の抽出
└── 引用文献

Phase 4: インデキシング
├── GraphRAG への登録
├── ベクトル埋め込み生成
└── 検索インデックス更新
```

### MCP連携

aria-mcp-server の以下のツールを使用：
- `paper_import`: 論文インポート（PDF→Markdown変換）
- `paper_analyze`: 詳細分析（メタデータ抽出）
- `paper_search`: 論文検索

### 出力形式

分析結果は以下の構造で保存：

```
storage/papers/processed/{paper_id}/
├── paper.md           # 本文Markdown
├── metadata.yaml      # メタデータ
├── figures/           # 抽出された図表
│   ├── fig1.png
│   └── fig2.png
└── tables/            # 抽出されたテーブル
    └── table1.csv
```

## メタデータ構造

```yaml
id: "paper-uuid"
paperId: "arXiv:2408.09869"  # DOI or arXiv ID

# 基本情報
title: "論文タイトル"
authors:
  - name: "著者名"
    affiliation: "所属機関"
    email: "email@example.com"
abstract: "要旨テキスト..."
publishedDate: "2024-08-18"
venue: "ジャーナル/会議名"

# 分類
categories:
  - "cs.CL"
  - "cs.AI"
keywords:
  - "knowledge graph"
  - "retrieval-augmented generation"

# 文書構造
sections:
  - id: "sec-1"
    title: "Introduction"
    level: 1
    startLine: 10
    endLine: 50
  - id: "sec-2"
    title: "Related Work"
    level: 1
    startLine: 51
    endLine: 100

# 引用
references:
  - id: "ref-1"
    citation: "[1] Author et al., 2023"
    doi: "10.1234/example"
    title: "引用論文タイトル"

# 処理情報
originalPath: "storage/papers/inbox/paper.pdf"
markdownPath: "storage/papers/processed/paper-uuid/paper.md"
processedAt: "2026-01-28T10:00:00Z"
processingStatus: "completed"
```

## ワークフロー

### 単一論文の分析

```
1. paper_import を呼び出し
   - input: PDF ファイルパス
   - output: 変換された Markdown と paper_id

2. paper_analyze を呼び出し
   - input: paper_id
   - output: 構造化メタデータ

3. graphrag_index を呼び出し（オプション）
   - input: paper_id
   - output: インデックス完了通知
```

### バッチ処理

```
1. storage/papers/inbox/ 内の全PDFを取得
2. 各PDFに対して paper_import を実行
3. 各論文に対して paper_analyze を実行
4. まとめて graphrag_index を実行
```

## 分析プロンプト例

### 論文要約の依頼
「この論文の主要な貢献と手法を要約してください」

### 手法の詳細分析
「提案手法のアーキテクチャと主要なコンポーネントを説明してください」

### 比較分析
「この論文と関連研究を比較し、新規性を明らかにしてください」

### 引用分析
「この論文で引用されている重要な先行研究をリストアップしてください」

## docling の使用

### Python コード例

```python
from docling.document_converter import DocumentConverter

# PDF変換
converter = DocumentConverter()
result = converter.convert("path/to/paper.pdf")

# Markdown出力
markdown = result.document.export_to_markdown()

# JSON出力（構造化データ）
json_data = result.document.export_to_json()
```

### CLI 使用例

```bash
# 単一ファイル変換
docling path/to/paper.pdf --output ./output/

# 複数ファイル変換
docling path/to/papers/*.pdf --output ./output/
```

## 検索

分析済み論文を検索する際は `paper_search` を使用：

```yaml
paper_search:
  query: "GraphRAG knowledge graph"
  filters:
    categories: ["cs.CL", "cs.AI"]
    date_from: "2024-01-01"
    authors: ["Author Name"]
  limit: 10
  sort_by: relevance  # relevance|date|citations
```
