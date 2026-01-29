/**
 * ExperimentStorageService Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExperimentStorageService } from '../services/experiment-storage.js';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_STORAGE_PATH = join(process.cwd(), '.test-storage-experiment');

describe('ExperimentStorageService', () => {
  let storage: ExperimentStorageService;

  beforeEach(async () => {
    // テスト用ディレクトリを作成
    await mkdir(TEST_STORAGE_PATH, { recursive: true });
    storage = new ExperimentStorageService({
      basePath: TEST_STORAGE_PATH,
    });
  });

  afterEach(async () => {
    // テスト用ディレクトリを削除
    if (existsSync(TEST_STORAGE_PATH)) {
      await rm(TEST_STORAGE_PATH, { recursive: true, force: true });
    }
  });

  describe('create', () => {
    it('should create a new experiment log', async () => {
      const result = await storage.create({
        title: 'Test Experiment',
        description: 'A test experiment',
        category: 'analysis',
        tags: ['test', 'unit-test'],
        hypothesis: 'Testing should work',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.title).toBe('Test Experiment');
      expect(result.value.description).toBe('A test experiment');
      expect(result.value.category).toBe('analysis');
      expect(result.value.tags).toEqual(['test', 'unit-test']);
      expect(result.value.hypothesis).toBe('Testing should work');
      expect(result.value.experimentId).toMatch(/^EXP-\d{4}-\d{2}-\d{2}-\d{3}$/);
    });

    it('should create experiments with sequential IDs on same day', async () => {
      const result1 = await storage.create({
        title: 'Experiment 1',
        category: 'hypothesis',
      });

      const result2 = await storage.create({
        title: 'Experiment 2',
        category: 'hypothesis',
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // IDの末尾が連番になっていることを確認
      const id1 = result1.value.experimentId;
      const id2 = result2.value.experimentId;
      const seq1 = parseInt(id1.split('-').pop()!, 10);
      const seq2 = parseInt(id2.split('-').pop()!, 10);

      expect(seq2).toBe(seq1 + 1);
    });
  });

  describe('get', () => {
    it('should retrieve an existing experiment', async () => {
      const createResult = await storage.create({
        title: 'Get Test',
        category: 'evaluation',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const getResult = await storage.get(createResult.value.experimentId);

      expect(getResult.ok).toBe(true);
      if (!getResult.ok) return;

      expect(getResult.value.title).toBe('Get Test');
      expect(getResult.value.experimentId).toBe(createResult.value.experimentId);
    });

    it('should return error for non-existent experiment', async () => {
      const result = await storage.get('EXP-2000-01-01-001');

      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error).toContain('not found');
    });
  });

  describe('update', () => {
    it('should update experiment with inputs and outputs', async () => {
      const createResult = await storage.create({
        title: 'Update Test',
        category: 'data-collection',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = await storage.update(createResult.value.experimentId, {
        inputs: [
          { name: 'param1', type: 'parameter', value: 100 },
        ],
        outputs: [
          { name: 'result', type: 'metric', value: 0.95 },
        ],
        observations: ['Input processed successfully'],
        conclusions: 'Test passed',
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      expect(updateResult.value.inputs).toHaveLength(1);
      expect(updateResult.value.outputs).toHaveLength(1);
      expect(updateResult.value.observations).toContain('Input processed successfully');
      expect(updateResult.value.conclusions).toBe('Test passed');
    });

    it('should accumulate observations on multiple updates', async () => {
      const createResult = await storage.create({
        title: 'Accumulate Test',
        category: 'analysis',
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      await storage.update(createResult.value.experimentId, {
        observations: ['First observation'],
      });

      const updateResult = await storage.update(createResult.value.experimentId, {
        observations: ['Second observation'],
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      expect(updateResult.value.observations).toContain('First observation');
      expect(updateResult.value.observations).toContain('Second observation');
    });
  });

  describe('search', () => {
    it('should find experiments by query', async () => {
      await storage.create({
        title: 'Machine Learning Experiment',
        category: 'model-training',
        tags: ['ml', 'deep-learning'],
      });

      await storage.create({
        title: 'Data Analysis',
        category: 'analysis',
        tags: ['statistics'],
      });

      const result = await storage.search({ query: 'machine learning' }, 10);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.experiments).toHaveLength(1);
      expect(result.value.experiments[0].title).toBe('Machine Learning Experiment');
    });

    it('should filter experiments by tags', async () => {
      await storage.create({
        title: 'Tagged Experiment',
        category: 'hypothesis',
        tags: ['important', 'priority'],
      });

      await storage.create({
        title: 'Untagged Experiment',
        category: 'hypothesis',
        tags: ['other'],
      });

      const result = await storage.search({ tags: ['important'] }, 10);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.experiments).toHaveLength(1);
      expect(result.value.experiments[0].tags).toContain('important');
    });

    it('should filter experiments by category', async () => {
      await storage.create({
        title: 'Hypothesis Test',
        category: 'hypothesis',
      });

      await storage.create({
        title: 'Analysis Test',
        category: 'analysis',
      });

      const result = await storage.search({ category: 'hypothesis' }, 10);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.experiments).toHaveLength(1);
      expect(result.value.experiments[0].category).toBe('hypothesis');
    });
  });
});
