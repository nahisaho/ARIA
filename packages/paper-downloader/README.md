# @aria/paper-downloader

> 論文ダウンロード・検索ライブラリ - Semantic Scholar, Unpaywall, arXiv 対応

## 📦 インストール

```bash
pnpm add @aria/paper-downloader
```

## 🎯 概要

`@aria/paper-downloader` は学術論文の検索、オープンアクセス (OA) 確認、PDF ダウンロードを行うパッケージです。

### 機能

- **論文検索**: Semantic Scholar API による論文検索
- **OA 確認**: Unpaywall, arXiv, PubMed Central からの OA PDF 解決
- **PDF ダウンロード**: OA 論文の自動ダウンロード

## 📖 使用方法

### 論文検索

```typescript
import { SemanticScholarClient } from '@aria/paper-downloader';

const client = new SemanticScholarClient();

// キーワード検索
const results = await client.search({
  query: 'transformer attention mechanism',
  limit: 10,
  year: '2020-2024',
  fields: ['title', 'authors', 'abstract', 'citationCount', 'openAccessPdf'],
});

for (const paper of results.papers) {
  console.log(`${paper.title} (${paper.year}) - ${paper.citationCount} citations`);
}
```

### 論文詳細取得

```typescript
// Paper ID で取得
const paper = await client.getPaper('204e3073870fae3d05bcbc2f6a8e263d9b72e776');

// DOI で取得
const paperByDoi = await client.getPaperByDOI('10.48550/arXiv.1706.03762');

// arXiv ID で取得
const paperByArxiv = await client.getPaperByArxiv('1706.03762');
```

### 引用・参照取得

```typescript
// 引用論文
const citations = await client.getCitations('paper-id', { limit: 50 });

// 参照論文
const references = await client.getReferences('paper-id', { limit: 50 });
```

### OA 確認

```typescript
import { OpenAccessResolver } from '@aria/paper-downloader';

const resolver = new OpenAccessResolver();

// DOI から OA PDF を解決
const oaResult = await resolver.resolve('10.48550/arXiv.1706.03762');

if (oaResult.isOpenAccess && oaResult.pdfUrl) {
  console.log(`OA PDF: ${oaResult.pdfUrl}`);
  console.log(`Source: ${oaResult.source}`);  // "arxiv", "unpaywall", etc.
}
```

### PDF ダウンロード

```typescript
import { PaperDownloader } from '@aria/paper-downloader';

const downloader = new PaperDownloader('./storage/papers');

// DOI または arXiv ID からダウンロード
const result = await downloader.download('10.48550/arXiv.1706.03762');

if (result.ok) {
  console.log(`Downloaded to: ${result.value.path}`);
}
```

## 📊 Semantic Scholar API

### 検索オプション

```typescript
interface PaperSearchRequest {
  query: string;
  limit?: number;         // デフォルト: 10, 最大: 100
  offset?: number;        // ページネーション
  year?: string;          // "2024" または "2020-2024"
  fieldsOfStudy?: string[];
  openAccessPdf?: boolean;
  minCitationCount?: number;
  fields?: string[];      // 取得フィールド
}
```

### 取得可能フィールド

| フィールド | 説明 |
|-----------|------|
| `paperId` | Semantic Scholar Paper ID |
| `title` | 論文タイトル |
| `abstract` | 概要 |
| `year` | 出版年 |
| `authors` | 著者リスト |
| `citationCount` | 被引用数 |
| `referenceCount` | 参照数 |
| `venue` | 出版会場 |
| `publicationTypes` | 出版タイプ |
| `openAccessPdf` | OA PDF URL |
| `externalIds` | DOI, arXiv ID, PubMed ID など |
| `s2FieldsOfStudy` | 分野分類 |
| `tldr` | TL;DR 要約 |

## 🔍 OA ソース

| ソース | 説明 |
|--------|------|
| `arxiv` | arXiv プレプリント |
| `unpaywall` | Unpaywall データベース |
| `pmc` | PubMed Central |
| `semantic_scholar` | Semantic Scholar OA リンク |

## ⚠️ レート制限

- **Semantic Scholar**: 100 requests / 5 minutes (API キーなし)
- **Unpaywall**: 100,000 requests / day (メールアドレス必須)

API キーを使用する場合は環境変数を設定:

```bash
export SEMANTIC_SCHOLAR_API_KEY=your-key
export UNPAYWALL_EMAIL=your-email@example.com
```

## 🧪 テスト

```bash
# API テストをスキップ
SKIP_API_TESTS=1 pnpm test

# 全テスト実行 (レート制限に注意)
pnpm test
```

## 📚 型定義

```typescript
interface Paper {
  paperId: string;
  title: string;
  abstract?: string;
  year?: number;
  authors: Author[];
  citationCount?: number;
  referenceCount?: number;
  venue?: string;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
    PubMedCentral?: string;
  };
}

interface OpenAccessResult {
  isOpenAccess: boolean;
  pdfUrl?: string;
  source?: string;
  license?: string;
  version?: string;
}
```
