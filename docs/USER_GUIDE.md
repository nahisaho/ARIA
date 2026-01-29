# ARIA ユーザーガイド

> **ARIA** - AI Research & Inquiry Assistant  
> 研究者のための AI アシスタントシステム

## 📚 目次

1. [はじめに](#はじめに)
2. [インストール](#インストール)
3. [クイックスタート](#クイックスタート)
4. [主要機能](#主要機能)
5. [MCP ツールの使い方](#mcp-ツールの使い方)
6. [設定](#設定)
7. [トラブルシューティング](#トラブルシューティング)

---

## はじめに

ARIA は研究活動を支援するAIアシスタントです。以下の機能を提供します。

- 📝 **実験ノート管理** - 構造化された実験記録の作成・検索
- 📄 **論文処理** - PDF のインポート、分析、メタデータ抽出
- 🧠 **ナレッジグラフ** - GraphRAG による知識の関連付けと検索
- 🤖 **LLM 統合** - 複数の LLM プロバイダーに対応

---

## インストール

### 前提条件

- Node.js 20.x 以上
- pnpm 9.x 以上
- Python 3.10 以上（docling/graphrag 使用時）

### 手順

```bash
# リポジトリのクローン
git clone https://github.com/nahisaho/ARIA.git
cd ARIA/aria

# 依存関係のインストール
pnpm install

# ビルド
pnpm build

# Python 仮想環境のセットアップ（オプション）
python3 -m venv .venv
source .venv/bin/activate
pip install docling graphrag
```

---

## クイックスタート

### 1. MCP サーバーの起動

VS Code で ARIA の MCP ツールを使用するには：

```bash
# MCP サーバーを起動
pnpm --filter @aria/mcp-server start
```

VS Code の `settings.json` に追加：

```json
{
  "github.copilot.chat.mcpServers": {
    "aria": {
      "command": "node",
      "args": ["/path/to/aria/packages/mcp-server/dist/cli.js"],
      "env": {
        "STORAGE_PATH": "/path/to/aria/storage"
      }
    }
  }
}
```

### 2. 最初の実験ノートを作成

GitHub Copilot Chat で：

```
@aria 新しい実験を作成してください。
タイトル: Transformer モデルの学習率最適化
仮説: 学習率 warmup を使用すると収束が早くなる
```

### 3. 論文をインポート

```
@aria arXiv:2312.10997 の論文をインポートして分析してください
```

### 4. 複数の論文をインポート後、インデックスを作成

```
# 複数の論文をインポート
@aria 以下の論文をインポート:
- arXiv:1706.03762 (Attention Is All You Need)
- arXiv:1810.04805 (BERT)
- arXiv:2005.14165 (GPT-3)

# インポート完了後、GraphRAG インデックスを作成
@aria インポートした論文でナレッジグラフのインデックスを作成してください
```

> **注意**: インデックス作成は、複数の論文をインポートした後にまとめて実行することを推奨します。インデックス作成には LLM API を使用するため、論文ごとに実行するよりも効率的です。

---

## 主要機能

### 📝 実験ノート管理

実験の仮説、方法論、結果、結論を構造化して記録します。

**作成例：**
```yaml
id: EXP-20260130-001
title: Transformer 学習率最適化実験
status: in_progress
hypothesis: warmup を使用すると収束が早くなる
methodology:
  - ベースライン: 固定学習率 1e-4
  - 実験群: warmup 1000 steps + cosine decay
variables:
  independent:
    - warmup_steps: [500, 1000, 2000]
  dependent:
    - validation_loss
    - convergence_epoch
```

**検索：**
```
@aria 「学習率」に関する実験を検索
```

### 📄 論文処理

PDF 論文を Markdown に変換し、メタデータを抽出します。

**対応形式：**
- arXiv ID（例: `2312.10997`）
- DOI（例: `10.1000/xyz123`）
- PMC ID（例: `PMC12345`）
- ローカル PDF ファイル

**分析内容：**
- タイトル、著者、所属
- アブストラクト
- セクション構造
- 図表、数式
- 参考文献

### 🧠 ナレッジグラフ (GraphRAG)

論文や実験から抽出した知識をグラフとして管理します。

**エンティティタイプ：**
- `concept` - 概念、理論
- `method` - 手法、アルゴリズム
- `finding` - 発見、結果
- `relation` - エンティティ間の関係

**クエリモード：**

| モード | 用途 | 例 |
|--------|------|-----|
| Local | 特定のエンティティについて詳細を調べる | 「Attention 機構とは何か？」 |
| Global | テーマ全体の概要を把握する | 「この分野の主要な研究トレンドは？」 |
| DRIFT | 探索的に関連知識を発見する | 「Transformer の応用分野を探索」 |

### 🤖 LLM プロバイダー

複数の LLM に対応し、自動フォールバックをサポート：

| プロバイダー | モデル例 | 用途 |
|--------------|----------|------|
| OpenAI | gpt-4o | 高品質な分析 |
| Azure OpenAI | gpt-4o | エンタープライズ |
| Anthropic | claude-3-5-sonnet | 長文処理 |
| Ollama | llama3.2 | ローカル推論 |

---

## MCP ツールの使い方

### 実験ツール

#### `experiment_create`
新しい実験ノートを作成します。

```
@aria 実験を作成:
- タイトル: BERT ファインチューニング実験
- 仮説: ドメイン固有データで事前学習すると精度が向上する
- 状態: planned
```

#### `experiment_update`
既存の実験を更新します。

```
@aria 実験 EXP-20260130-001 を更新:
- 状態: completed
- 結果: warmup 1000 steps が最適、収束が 20% 早くなった
```

#### `experiment_search`
実験を検索します。

```
@aria 「BERT」に関する実験を検索
```

### 知識ツール

#### `knowledge_add`
知識エンティティを追加します。

```
@aria 知識を追加:
- 名前: Self-Attention
- タイプ: concept
- 説明: クエリ、キー、バリューを使った注意機構
- タグ: transformer, attention, deep-learning
```

#### `knowledge_search`
知識を検索します。

```
@aria 「attention」に関する知識を検索
```

#### `knowledge_relate`
エンティティ間の関係を作成します。

```
@aria 関係を作成:
Self-Attention --[is_component_of]--> Transformer
```

### 論文ツール

#### `paper_import`
論文をインポートして処理します。

```
@aria 論文をインポート: arXiv:1706.03762
```

#### `paper_analyze`
インポートした論文を詳細分析します。

```
@aria 論文 PAPER-001 を分析して、主要な貢献を抽出
```

### GraphRAG ツール

#### `graphrag_index`
インポートした論文からナレッジグラフのインデックスを作成します。

> **推奨ワークフロー**: 
> 1. `paper_import` で複数の論文をインポート
> 2. `graphrag_index` でまとめてインデックスを作成
> 3. `graphrag_query` で検索

```
# インポート済みの論文からインデックスを作成
@aria ./storage/papers/processed フォルダの論文でインデックスを作成

# または特定のファイルを指定
@aria 以下のファイルでインデックスを作成:
- storage/papers/processed/attention-paper.md
- storage/papers/processed/bert-paper.md
```

#### `graphrag_query`
ナレッジグラフにクエリを実行します。

```
@aria GraphRAG検索（ローカル）: Transformer の計算効率改善手法
```

---

## 設定

### 設定ファイル

`config/aria.config.yaml` で各種設定をカスタマイズできます。

---

### LLM プロバイダー設定

#### デフォルトプロバイダーの選択

```yaml
llm:
  default_provider: "openai"  # openai, azure-openai, anthropic, ollama から選択
```

#### OpenAI

```yaml
llm:
  providers:
    openai:
      type: "openai"
      api_key: "${OPENAI_API_KEY}"  # 環境変数から読み込み
      models:
        chat: "gpt-4o"              # チャット用モデル
        embedding: "text-embedding-3-large"  # 埋め込み用モデル
```

**環境変数の設定：**
```bash
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**利用可能なモデル：**
| 用途 | モデル | 特徴 |
|------|--------|------|
| チャット | `gpt-4o` | 最高性能、マルチモーダル |
| チャット | `gpt-4o-mini` | コスト効率重視 |
| チャット | `gpt-4-turbo` | 長文対応 |
| 埋め込み | `text-embedding-3-large` | 高精度 |
| 埋め込み | `text-embedding-3-small` | 低コスト |

#### Azure OpenAI

```yaml
llm:
  providers:
    azure-openai:
      type: "azure-openai"
      endpoint: "${AZURE_OPENAI_ENDPOINT}"
      api_key: "${AZURE_OPENAI_API_KEY}"
      api_version: "2024-02-15-preview"
      deployments:
        chat: "gpt-4o"              # デプロイメント名
        embedding: "text-embedding-3-large"
```

**環境変数の設定：**
```bash
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> **注意**: `deployments` には Azure ポータルで作成したデプロイメント名を指定します。

#### Microsoft Foundry (Azure AI Foundry)

Microsoft Foundry は Azure AI の統合プラットフォームで、Azure OpenAI モデルに加えて、Meta Llama、DeepSeek、Grok などの Foundry Models を利用できます。

```yaml
llm:
  providers:
    azure-foundry:
      type: "azure-foundry"
      endpoint: "${AZURE_FOUNDRY_ENDPOINT}"  # プロジェクトエンドポイント
      api_key: "${AZURE_FOUNDRY_API_KEY}"    # または Microsoft Entra ID 認証
      deployments:
        chat: "MAI-DS-R1"           # デプロイメント名
        embedding: "text-embedding-3-large"
```

**環境変数の設定：**
```bash
# プロジェクトエンドポイント（Foundry ポータルで確認）
export AZURE_FOUNDRY_ENDPOINT="https://YOUR-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR_PROJECT_NAME"
export AZURE_FOUNDRY_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**セットアップ手順：**

1. [Microsoft Foundry ポータル](https://ai.azure.com/) にサインイン
2. **プロジェクトを作成**（または既存のプロジェクトを選択）
3. **Model catalog** からモデルを選択
4. **Use this model** → **Deploy** でデプロイメントを作成
5. **Models + Endpoints** でエンドポイント URL と API キーを確認

**利用可能な Foundry Models：**

| カテゴリ | モデル | 特徴 |
|----------|--------|------|
| **Azure 直接販売** | `gpt-4o`, `gpt-4o-mini` | Azure OpenAI モデル |
| **Microsoft AI** | `MAI-DS-R1` | 高精度推論 |
| **Grok** | `grok-4`, `grok-3` | フロンティア推論 |
| **DeepSeek** | `DeepSeek-V3`, `DeepSeek-R1` | マルチモーダル |
| **Meta Llama** | `Llama-3.3-70B-Instruct` | エンタープライズ向け |

**Python SDK での使用例：**
```python
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

# プロジェクトクライアントを作成
project_client = AIProjectClient(
    endpoint="https://YOUR-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR_PROJECT_NAME",
    credential=DefaultAzureCredential(),  # キーレス認証推奨
)

# OpenAI 互換クライアントを取得
openai_client = project_client.get_openai_client()

# Responses API で生成
response = openai_client.responses.create(
    model="MAI-DS-R1",  # デプロイメント名
    input="What is the capital of France?",
)
print(response.model_dump_json(indent=2))
```

> **参考**: [Microsoft Foundry ドキュメント](https://learn.microsoft.com/azure/ai-foundry/)

#### Anthropic Claude

```yaml
llm:
  providers:
    anthropic:
      type: "anthropic"
      api_key: "${ANTHROPIC_API_KEY}"
      models:
        chat: "claude-3-5-sonnet-20241022"
```

**環境変数の設定：**
```bash
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**利用可能なモデル：**
| モデル | 特徴 |
|--------|------|
| `claude-3-5-sonnet-20241022` | バランス型、推奨 |
| `claude-3-opus-20240229` | 最高性能 |
| `claude-3-haiku-20240307` | 高速・低コスト |

#### Ollama（ローカル推論）

```yaml
llm:
  providers:
    ollama:
      type: "ollama"
      base_url: "http://localhost:11434"  # Ollama サーバーのURL
      models:
        chat: "llama3.2"
        embedding: "nomic-embed-text"
```

**Ollama のセットアップ：**
```bash
# Ollama をインストール
curl -fsSL https://ollama.com/install.sh | sh

# モデルをダウンロード
ollama pull llama3.2
ollama pull nomic-embed-text

# サーバーを起動（通常は自動起動）
ollama serve
```

**利用可能なモデル（例）：**
| 用途 | モデル | サイズ |
|------|--------|--------|
| チャット | `llama3.2` | 3B |
| チャット | `llama3.2:70b` | 70B |
| チャット | `mistral` | 7B |
| チャット | `codellama` | 7B |
| 埋め込み | `nomic-embed-text` | 137M |
| 埋め込み | `mxbai-embed-large` | 335M |

#### フォールバック設定

複数のプロバイダーを設定し、障害時に自動切り替え：

```yaml
llm:
  default_provider: "openai"
  
  fallback:
    enabled: true
    order:
      - openai      # 最初に試行
      - azure-openai
      - anthropic
      - ollama      # 最後のフォールバック
    retry_count: 3
    retry_delay_ms: 1000
```

---

### GraphRAG 設定

```yaml
graphrag:
  indexing:
    chunk_size: 300
    chunk_overlap: 50
  
  query:
    local_search:
      max_results: 10
      similarity_threshold: 0.7
```

### 環境変数

```bash
# .env ファイル
OPENAI_API_KEY=sk-xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## トラブルシューティング

### よくある問題

#### MCP サーバーに接続できない

1. サーバーが起動しているか確認：
   ```bash
   pnpm --filter @aria/mcp-server start
   ```

2. VS Code の設定パスが正しいか確認

3. ログを確認：
   ```bash
   cat logs/aria.log
   ```

#### docling でエラーが発生する

1. Python 仮想環境が有効か確認：
   ```bash
   source .venv/bin/activate
   which python
   ```

2. docling がインストールされているか確認：
   ```bash
   pip show docling
   ```

#### GraphRAG インデックスが失敗する

1. OpenAI API キーが設定されているか確認：
   ```bash
   echo $OPENAI_API_KEY
   ```

2. 入力ファイルが存在するか確認：
   ```bash
   ls storage/knowledge-graph/input/
   ```

### ログの確認

```bash
# アプリケーションログ
tail -f logs/aria.log

# デバッグモードで起動
DEBUG=* pnpm --filter @aria/mcp-server start
```

### サポート

- **Issues**: https://github.com/nahisaho/ARIA/issues
- **ドキュメント**: https://github.com/nahisaho/ARIA/tree/main/docs

---

## 次のステップ

1. [API リファレンス](./API.md) を参照
2. [要件定義書](./requirements/) で詳細を確認
3. [CHANGELOG](../CHANGELOG.md) で最新の変更を確認

---

*ARIA v0.1.0 | 最終更新: 2026-01-30*
