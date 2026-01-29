---
name: research-workflow
description: |
  研究ワークフローをガイドするスキル。
  文献レビュー、実験計画、論文執筆などの研究プロセスを支援します。
  使用タイミング：研究を計画する時、文献レビューを行う時、論文を書く時
license: MIT
---

# 研究ワークフロースキル

研究プロセス全体をガイドし、各フェーズで適切なスキルとツールを組み合わせて使用するスキルです。

## ワークフロー一覧

### 1. 文献レビュー (Literature Review)

体系的な文献調査と分析を行います。

```
Phase 1: 検索戦略の策定
├── 研究質問の定義
├── キーワードの選定
├── 検索対象データベースの決定
└── 包含/除外基準の設定

Phase 2: 論文収集
├── paper_import で PDF をインポート
├── paper_analyze でメタデータ抽出
├── 重複除去と初期スクリーニング
└── GraphRAG でインデックス作成

Phase 3: 分析・統合
├── graphrag_global で分野の概要把握
├── graphrag_local で個別論文の詳細確認
├── テーマ別の分類・整理
└── knowledge_capture で知見記録

Phase 4: 成果物作成
├── 文献レビューマトリクス作成
├── 研究ギャップの特定
├── 今後の研究方向性の提案
└── 実験ログとして記録
```

**使用するスキル・ツール:**
- paper-analysis: 論文のインポートと分析
- graphrag-query: 知識ベースの検索
- knowledge-capture: 知見の記録
- experiment-log: プロセスの記録

### 2. 実験計画 (Experiment Planning)

仮説検証のための実験を計画・実行します。

```
Phase 1: 仮説設定
├── 研究質問の明確化
├── 仮説の文書化
├── 既存研究との差異を確認（graphrag_search）
└── experiment_create で実験開始

Phase 2: 実験設計
├── 独立変数・従属変数の定義
├── 制御条件の設定
├── 評価指標の選定
└── 実験手順の文書化

Phase 3: 実行・データ収集
├── 実験の実施
├── データの記録
├── 予期せぬ観察の記録
└── experiment_update で進捗更新

Phase 4: 分析・報告
├── データ分析
├── 結果の解釈
├── 結論の導出
└── knowledge_capture で知見を保存
```

**使用するスキル・ツール:**
- experiment-log: 実験の記録・管理
- graphrag-query: 関連研究の検索
- knowledge-capture: 発見の記録

### 3. 論文執筆 (Paper Writing)

研究成果を論文としてまとめます。

```
Phase 1: 構成設計
├── 論文タイプの決定（フルペーパー/ショート/ポスター）
├── アウトライン作成
├── 主要な主張の整理
└── 図表の計画

Phase 2: セクション執筆
├── Introduction: 背景・動機・貢献
├── Related Work: 関連研究（graphrag_global使用）
├── Methodology: 提案手法
├── Experiments: 実験設定と結果
├── Discussion: 考察・限界
└── Conclusion: 結論・今後の展望

Phase 3: 推敲・改善
├── 論理の一貫性確認
├── 表現の改善
├── 図表の最適化
└── 参考文献の確認

Phase 4: 投稿準備
├── フォーマット調整
├── 補足資料の準備
└── 著者・所属の確認
```

**使用するスキル・ツール:**
- paper-analysis: 関連研究の分析
- graphrag-query: 文献検索・引用
- experiment-log: 実験データの参照
- knowledge-capture: 知見の整理

### 4. 仮説生成 (Hypothesis Generation)

新しい研究仮説を生成します。

```
Phase 1: 知識探索
├── graphrag_global で分野の概要把握
├── graphrag_query (drift) で関連トピック探索
└── 研究ギャップの特定

Phase 2: 仮説形成
├── 観察事項の整理
├── パターンの発見
├── 因果関係の推測
└── 検証可能な仮説の定式化

Phase 3: 仮説評価
├── 既存研究との比較
├── 検証可能性の評価
├── リソース要件の見積もり
└── 優先順位付け

Phase 4: 記録
├── knowledge_capture で仮説を保存
├── 関連する概念との関係を設定
└── 次の実験計画へ接続
```

## ワークフロー開始方法

### 文献レビューの開始

```
ユーザー: [トピック] に関する文献レビューを開始します

アクション:
1. 研究質問を確認
2. experiment_create で文献レビュー実験を開始
3. 検索戦略を策定
4. paper_import で論文を収集開始
```

### 実験の計画

```
ユーザー: [仮説] を検証する実験を計画しています

アクション:
1. 仮説の明確化を支援
2. graphrag_search で関連研究を確認
3. 実験設計の提案
4. experiment_create で実験を開始
```

### 論文執筆の支援

```
ユーザー: 実験結果をまとめた論文を書きたいです

アクション:
1. 実験ログから結果を収集
2. 構成案を提案
3. 各セクションの執筆を支援
4. graphrag_search で引用候補を提示
```

## ワークフロー間の連携

```
文献レビュー ──→ 仮説生成 ──→ 実験計画 ──→ 論文執筆
     │              │            │            │
     └──────────────┴────────────┴────────────┘
                    ↓
              knowledge_capture
              (知識の蓄積)
```

## ベストプラクティス

### 1. すべての作業を記録

```
- 文献レビュー → experiment-log で記録
- 実験 → experiment-log で記録
- 論文執筆 → experiment-log で進捗記録
```

### 2. 知識を構造化して保存

```
- 新しい概念 → knowledge_capture (concept)
- 発見事項 → knowledge_capture (finding)
- 手法 → knowledge_capture (method)
```

### 3. GraphRAGを活用

```
- 概要把握 → graphrag_global
- 詳細確認 → graphrag_local
- 探索 → graphrag_query (drift)
```

### 4. 関連付けを維持

```
- 論文 ←→ 実験: relatedPapers, relatedExperiments
- 知識 ←→ ソース: source フィールド
- エンティティ ←→ エンティティ: relations
```
