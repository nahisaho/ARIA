/**
 * ARIA E2E Test Suite
 * MCP サーバー経由での統合テスト
 * 
 * 使用方法:
 *   npx tsx tests/e2e.test.ts
 *   SKIP_API_TESTS=1 npx tsx tests/e2e.test.ts  # API テストをスキップ
 */

import { ExperimentStorageService, KnowledgeStorageService } from '../packages/core/dist/index.js';
import { SemanticScholarClient } from '../packages/paper-downloader/dist/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_PATH = path.join(__dirname, '../.test-storage');

// テスト結果
const results: { name: string; status: 'pass' | 'fail' | 'skip'; error?: string; duration: number }[] = [];

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: 'pass', duration: Date.now() - start });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('Skipped')) {
      results.push({ name, status: 'skip', duration: Date.now() - start });
      console.log(`⏭️  ${name}: ${errorMsg}`);
    } else {
      results.push({ name, status: 'fail', error: errorMsg, duration: Date.now() - start });
      console.log(`❌ ${name}: ${errorMsg}`);
    }
  }
}

// ============================================
// Experiment Tests
// ============================================

async function testExperimentCreate(): Promise<void> {
  const storage = new ExperimentStorageService({ basePath: path.join(STORAGE_PATH, 'experiments') });
  
  const result = await storage.create({
    title: 'E2E Test: LLM Benchmark',
    description: 'Claude vs GPT-4 の要約精度を比較',
    category: 'model-training',
    hypothesis: 'Claude の方が学術論文の要約精度が高い',
    tags: ['e2e-test', 'llm', 'benchmark'],
  });

  if (!result.ok) {
    throw new Error(`Failed to create experiment: ${result.error}`);
  }

  const experiment = result.value;
  if (!experiment.experimentId) {
    throw new Error(`No experiment ID returned`);
  }
  if (!experiment.experimentId.startsWith('EXP-')) {
    throw new Error(`Invalid experiment ID format: ${experiment.experimentId}`);
  }
  if (experiment.title !== 'E2E Test: LLM Benchmark') {
    throw new Error(`Title mismatch: ${experiment.title}`);
  }

  // ファイルが作成されたか確認
  const files = fs.readdirSync(path.join(STORAGE_PATH, 'experiments'), { recursive: true }) as string[];
  const yamlFiles = files.filter(f => f.endsWith('.yaml'));
  if (yamlFiles.length === 0) {
    throw new Error('No YAML file created');
  }

  // グローバルに保存
  (globalThis as any).testExperimentId = experiment.experimentId;
}

async function testExperimentUpdate(): Promise<void> {
  const storage = new ExperimentStorageService({ basePath: path.join(STORAGE_PATH, 'experiments') });
  const experimentId = (globalThis as any).testExperimentId;

  if (!experimentId) {
    throw new Error('No experiment ID from previous test');
  }

  const result = await storage.update(experimentId, {
    observations: ['Claude-3.5-sonnet showed better understanding of technical terms'],
    conclusions: 'Claude: 87% accuracy, GPT-4: 82% accuracy',
  });

  if (!result.ok) {
    throw new Error(`Failed to update experiment: ${result.error}`);
  }

  // 更新されたか確認
  const getResult = await storage.get(experimentId);
  if (!getResult.ok) {
    throw new Error(`Failed to get experiment: ${getResult.error}`);
  }

  const experiment = getResult.value;
  if (!experiment.conclusions?.includes('Claude')) {
    throw new Error('Conclusions not updated');
  }
}

async function testExperimentSearch(): Promise<void> {
  const storage = new ExperimentStorageService({ basePath: path.join(STORAGE_PATH, 'experiments') });

  // タグで検索
  const result = await storage.search({ tags: ['e2e-test'] });

  if (!result.ok) {
    throw new Error(`Failed to search experiments: ${result.error}`);
  }

  if (result.value.experiments.length === 0) {
    throw new Error('No experiments found with tag e2e-test');
  }

  const found = result.value.experiments.find(e => e.title === 'E2E Test: LLM Benchmark');
  if (!found) {
    throw new Error('Created experiment not found in search results');
  }
}

// ============================================
// Knowledge Tests
// ============================================

async function testKnowledgeAdd(): Promise<void> {
  const storage = new KnowledgeStorageService({ basePath: path.join(STORAGE_PATH, 'knowledge') });

  // Concept 追加
  const result1 = await storage.add({
    type: 'concept',
    name: 'Transformer',
    description: '自己注意機構を用いたニューラルネットワークアーキテクチャ',
    aliases: ['Transformer Architecture', 'Attention Model'],
    tags: ['deep-learning', 'nlp', 'e2e-test'],
  });

  if (!result1.ok) {
    throw new Error(`Failed to add concept: ${result1.error}`);
  }

  (globalThis as any).testConceptId = result1.value.id;

  // Method 追加
  const result2 = await storage.add({
    type: 'method',
    name: 'Self-Attention',
    description: '入力シーケンス内の各位置が他のすべての位置に注意を向ける機構',
    tags: ['attention', 'mechanism', 'e2e-test'],
  });

  if (!result2.ok) {
    throw new Error(`Failed to add method: ${result2.error}`);
  }

  (globalThis as any).testMethodId = result2.value.id;

  // ファイルが作成されたか確認
  const conceptDir = path.join(STORAGE_PATH, 'knowledge', 'entities', 'concept');
  const methodDir = path.join(STORAGE_PATH, 'knowledge', 'entities', 'method');

  if (!fs.existsSync(conceptDir)) {
    throw new Error('Concept directory not created');
  }
  if (!fs.existsSync(methodDir)) {
    throw new Error('Method directory not created');
  }
}

async function testKnowledgeSearch(): Promise<void> {
  const storage = new KnowledgeStorageService({ basePath: path.join(STORAGE_PATH, 'knowledge') });

  // 名前で検索
  const result = await storage.search({ query: 'Transformer' });

  if (!result.ok) {
    throw new Error(`Failed to search knowledge: ${result.error}`);
  }

  if (result.value.entities.length === 0) {
    throw new Error('No knowledge entities found');
  }

  const found = result.value.entities.find(e => e.name === 'Transformer');
  if (!found) {
    throw new Error('Transformer concept not found');
  }
}

async function testKnowledgeRelate(): Promise<void> {
  const storage = new KnowledgeStorageService({ basePath: path.join(STORAGE_PATH, 'knowledge') });

  const conceptId = (globalThis as any).testConceptId;
  const methodId = (globalThis as any).testMethodId;

  if (!conceptId || !methodId) {
    throw new Error('Missing entity IDs from previous tests');
  }

  const result = await storage.relate({
    fromEntity: conceptId,
    toEntity: methodId,
    relationType: 'uses',
    description: 'Transformer uses Self-Attention mechanism',
  });

  if (!result.ok) {
    throw new Error(`Failed to create relation: ${result.error}`);
  }

  // 関係が追加されたか確認 - 検索で確認
  const searchResult = await storage.search({ query: 'Transformer' });
  if (!searchResult.ok) {
    throw new Error(`Failed to search: ${searchResult.error}`);
  }

  // 関係が存在することを確認
  if (searchResult.value.relations.length === 0) {
    throw new Error('No relations found');
  }
}

async function testKnowledgeUpdate(): Promise<void> {
  const storage = new KnowledgeStorageService({ basePath: path.join(STORAGE_PATH, 'knowledge') });

  const result = await storage.update({
    name: 'Transformer',
    description: '自己注意機構を用いたニューラルネットワークアーキテクチャ。2017年に発表され、NLPの革命をもたらした。',
    tags: ['deep-learning', 'nlp', 'e2e-test', 'updated'],
  });

  if (!result.ok) {
    throw new Error(`Failed to update knowledge: ${result.error}`);
  }

  // 更新されたか確認 - 名前で取得
  const getResult = await storage.get('Transformer');
  if (!getResult.ok) {
    throw new Error(`Failed to get entity: ${getResult.error}`);
  }

  const entity = getResult.value;
  if (!entity) {
    throw new Error('Entity not found after update');
  }
  if (!entity.description.includes('2017年')) {
    throw new Error('Description not updated');
  }
  if (!entity.tags?.includes('updated')) {
    throw new Error('Tags not updated');
  }
}

// ============================================
// Paper Search Tests
// ============================================

const SKIP_PAPER_TESTS = process.env.SKIP_PAPER_TESTS === '1' || process.env.SKIP_API_TESTS === '1';

async function testPaperSearch(): Promise<void> {
  if (SKIP_PAPER_TESTS) {
    throw new Error('Skipped (SKIP_API_TESTS=1)');
  }

  const client = new SemanticScholarClient();

  const result = await client.search({
    query: 'Attention Is All You Need transformer',
    limit: 5,
  });

  if (!result.ok) {
    throw new Error(`Search failed: ${result.error.message}`);
  }

  if (result.value.total === 0) {
    throw new Error('No papers found');
  }

  if (result.value.papers.length === 0) {
    throw new Error('Papers array is empty');
  }

  const paper = result.value.papers[0];
  if (!paper.title) {
    throw new Error('Paper has no title');
  }
  if (!paper.paperId) {
    throw new Error('Paper has no ID');
  }

  console.log(`   Found: "${paper.title}" (${paper.year || 'unknown year'})`);
  (globalThis as any).testPaperId = paper.paperId;
}

async function testPaperGetDetails(): Promise<void> {
  if (SKIP_PAPER_TESTS) {
    throw new Error('Skipped (SKIP_API_TESTS=1)');
  }

  const client = new SemanticScholarClient();
  const paperId = (globalThis as any).testPaperId;

  if (!paperId) {
    throw new Error('No paper ID from previous test');
  }

  // レート制限回避のために1秒待つ
  await new Promise(resolve => setTimeout(resolve, 1000));

  const result = await client.getPaper(paperId);

  if (!result.ok) {
    throw new Error(`Get paper failed: ${result.error.message}`);
  }

  const paper = result.value;
  if (!paper.title) {
    throw new Error('Paper has no title');
  }

  console.log(`   Title: "${paper.title}"`);
  console.log(`   Authors: ${paper.authors?.map(a => a.name).join(', ') || 'unknown'}`);
  console.log(`   Citations: ${paper.citationCount || 0}`);
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log('🧪 ARIA E2E Test Suite');
  console.log('='.repeat(50));
  console.log('');

  // ストレージディレクトリを作成
  fs.rmSync(STORAGE_PATH, { recursive: true, force: true });
  fs.mkdirSync(STORAGE_PATH, { recursive: true });

  // Experiment Tests
  console.log('📝 Experiment Tests');
  console.log('-'.repeat(30));
  await runTest('experiment_create', testExperimentCreate);
  await runTest('experiment_update', testExperimentUpdate);
  await runTest('experiment_search', testExperimentSearch);
  console.log('');

  // Knowledge Tests
  console.log('🧠 Knowledge Tests');
  console.log('-'.repeat(30));
  await runTest('knowledge_add', testKnowledgeAdd);
  await runTest('knowledge_search', testKnowledgeSearch);
  await runTest('knowledge_relate', testKnowledgeRelate);
  await runTest('knowledge_update', testKnowledgeUpdate);
  console.log('');

  // Paper Tests
  console.log('📄 Paper Tests');
  console.log('-'.repeat(30));
  await runTest('paper_search', testPaperSearch);
  await runTest('paper_get_details', testPaperGetDetails);
  console.log('');

  // Summary
  console.log('='.repeat(50));
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${totalDuration}ms)`);
  
  // クリーンアップ
  fs.rmSync(STORAGE_PATH, { recursive: true, force: true });

  if (failed > 0) {
    console.log('');
    console.log('❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ All tests passed!');
  }
}

main().catch(console.error);
