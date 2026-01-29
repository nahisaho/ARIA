---
name: graphrag-query
description: |
  GraphRAG を使用したナレッジグラフ検索スキル。
  論文や実験データに対するセマンティック検索、グラフベースの推論を支援します。
  使用タイミング：複雑な質問に回答する時、関連情報を探す時、知識を統合する時
license: MIT
---

# GraphRAG クエリスキル

Microsoft GraphRAG を使用して、論文・実験データの高度な検索と推論を行うスキルです。

## 検索モード

### 1. ローカル検索 (Local Search)

特定のエンティティや概念に関する詳細情報を取得します。

**適したクエリ:**
- 「〇〇とは何ですか」
- 「〇〇の詳細を教えてください」
- 「〇〇はどのように機能しますか」

**例:**
```yaml
graphrag_local:
  query: "GraphRAGのchunk_sizeパラメータとは"
  context_tags: [graphrag, parameter]
  max_results: 10
```

### 2. グローバル検索 (Global Search)

広範なトピックの概要や要約を生成します。コミュニティ構造を活用。

**適したクエリ:**
- 「〇〇分野の最新動向」
- 「〇〇と△△の関係」
- 「〇〇に関する全体像」

**例:**
```yaml
graphrag_global:
  query: "知識グラフを使用したRAGの最新手法"
  community_level: 2
  max_summaries: 5
```

### 3. ドリフト検索 (Drift Search)

探索的な質問、関連情報の発見に使用。グラフを横断的に探索。

**適したクエリ:**
- 「〇〇に関連する興味深いトピック」
- 「〇〇から派生する研究テーマ」
- 「予想外の関連性を発見したい」

**例:**
```yaml
graphrag_query:
  query: "GraphRAGに関連する新しいアプローチ"
  mode: drift
  exploration_depth: 3
```

## MCP連携

aria-mcp-server の以下のツールを使用：

| ツール | 用途 |
|--------|------|
| `graphrag_index` | ドキュメントのインデキシング |
| `graphrag_query` | 汎用クエリ（モード指定可能） |
| `graphrag_local` | ローカル検索 |
| `graphrag_global` | グローバル検索 |

## 応答形式

検索結果には以下が含まれます：

```yaml
response:
  answer: "質問への回答テキスト"
  confidence: 0.85
  
  sources:
    - type: paper
      id: "PAPER-graphrag-2024"
      title: "GraphRAG: ..."
      relevance: 0.92
    - type: experiment
      id: "EXP-2026-01-28-001"
      title: "GraphRAG パラメータ最適化"
      relevance: 0.78
  
  related_entities:
    - name: "chunk_size"
      type: PARAMETER
      description: "..."
    - name: "GraphRAG"
      type: METHOD
      description: "..."
  
  graph_context:
    nodes_visited: 45
    communities_used: 3
    depth: 2
```

## クエリ最適化

### 効果的なクエリの書き方

1. **具体的に**: 抽象的な質問より具体的な質問
2. **コンテキスト付与**: 関連するタグやカテゴリを指定
3. **モード選択**: 質問タイプに応じた適切なモードを選択

### 良いクエリ例

```
❌ 悪い例: "RAGについて教えて"
✅ 良い例: "GraphRAGのLocal SearchとGlobal Searchの違いを説明してください"

❌ 悪い例: "パラメータは？"
✅ 良い例: "GraphRAGのインデキシングで推奨されるchunk_sizeの範囲は？"
```

## ワークフロー

### 質問応答

```
1. 質問を分析
   ├── 質問タイプの判定（詳細/概要/探索）
   └── 適切な検索モードを選択

2. 検索実行
   ├── graphrag_local / graphrag_global / graphrag_query
   └── 結果を取得

3. 結果評価
   ├── 信頼度スコアを確認
   ├── ソースを検証
   └── 必要に応じて追加検索

4. 回答生成
   ├── 検索結果を統合
   └── ソースを明示
```

### 知識探索

```
1. 初期クエリ
   └── graphrag_global で概要把握

2. 深掘り
   └── 興味深いトピックに対して graphrag_local

3. 関連発見
   └── graphrag_query (drift) で関連トピック探索

4. 知識記録
   └── knowledge_capture で新しい知見を保存
```

## 設定

### GraphRAG設定

```yaml
# config/aria.config.yaml
graphrag:
  query:
    local_search:
      max_results: 10
      similarity_threshold: 0.7
      include_text_units: true
    
    global_search:
      community_level: 2
      max_summaries: 5
      use_cached: true
    
    drift_search:
      exploration_depth: 3
      branching_factor: 5
```

## 例：研究質問への回答

```
ユーザー: 知識グラフを使ったRAGで最も効果的なアプローチは何ですか？

アクション:
1. graphrag_global を使用（概要的な質問のため）
2. クエリ: "knowledge graph RAG effective approaches"
3. community_level: 2

結果:
- answer: "知識グラフベースのRAGで効果的なアプローチは..."
- sources: [論文A, 論文B, 実験C]
- related_entities: [GraphRAG, KGQA, Entity Linking]
```
