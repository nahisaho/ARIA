# @aria/docling-adapter

> PDF → Markdown 変換アダプター - docling Python ブリッジ

## 📦 インストール

```bash
pnpm add @aria/docling-adapter
```

### Python 依存

```bash
pip install docling
```

## 🎯 概要

`@aria/docling-adapter` は [docling](https://github.com/docling-project/docling) を使用して PDF ドキュメントを Markdown に変換するアダプターです。

### 機能

- PDF → Markdown 変換
- テーブル、数式、図の抽出
- メタデータ抽出
- バッチ処理

## 📖 使用方法

### 基本変換

```typescript
import { DoclingConverter } from '@aria/docling-adapter';

const converter = new DoclingConverter();

const result = await converter.convert('./paper.pdf');

if (result.ok) {
  console.log(result.value.markdown);
  console.log(result.value.metadata);
}
```

### オプション付き変換

```typescript
const result = await converter.convert('./paper.pdf', {
  extractTables: true,
  extractFigures: true,
  extractEquations: true,
  outputDir: './output',
});
```

### バッチ変換

```typescript
const results = await converter.convertBatch([
  './paper1.pdf',
  './paper2.pdf',
  './paper3.pdf',
], {
  concurrency: 2,
});
```

## ⚙️ 設定

### 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `DOCLING_PYTHON` | Python 実行パス | `python3` |
| `DOCLING_TIMEOUT` | タイムアウト (秒) | `300` |

## 📁 出力構造

```
output/
├── paper.md           # Markdown 本文
├── paper.meta.json    # メタデータ
├── tables/            # 抽出テーブル
│   ├── table_1.md
│   └── table_2.md
├── figures/           # 抽出図
│   ├── fig_1.png
│   └── fig_2.png
└── equations/         # 抽出数式
    └── equations.json
```

## 📚 型定義

```typescript
interface ConversionResult {
  markdown: string;
  metadata: DocumentMetadata;
  tables?: Table[];
  figures?: Figure[];
  equations?: Equation[];
}

interface DocumentMetadata {
  title?: string;
  authors?: string[];
  abstract?: string;
  keywords?: string[];
  pages?: number;
}
```
