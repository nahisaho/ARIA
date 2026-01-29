/**
 * KnowledgeStorageService Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeStorageService } from '../services/knowledge-storage.js';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_STORAGE_PATH = join(process.cwd(), '.test-storage-knowledge');

describe('KnowledgeStorageService', () => {
  let storage: KnowledgeStorageService;

  beforeEach(async () => {
    await mkdir(TEST_STORAGE_PATH, { recursive: true });
    storage = new KnowledgeStorageService({
      basePath: TEST_STORAGE_PATH,
    });
  });

  afterEach(async () => {
    if (existsSync(TEST_STORAGE_PATH)) {
      await rm(TEST_STORAGE_PATH, { recursive: true, force: true });
    }
  });

  describe('add - concept', () => {
    it('should add a concept entity', async () => {
      const result = await storage.add({
        type: 'concept',
        name: 'Transformer',
        description: 'A neural network architecture based on attention',
        tags: ['deep-learning', 'nlp'],
        category: 'architecture',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.type).toBe('concept');
      expect(result.value.name).toBe('Transformer');
    });

    it('should store aliases in index', async () => {
      await storage.add({
        type: 'concept',
        name: 'Transformer',
        description: 'A neural network architecture',
        aliases: ['Transformer Architecture', 'Self-Attention Network'],
        tags: [],
      });

      // 名前で検索
      const result1 = await storage.get('Transformer');
      expect(result1.ok).toBe(true);

      // エイリアスで検索
      const result2 = await storage.get('Transformer Architecture');
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok && result1.value && result2.value) {
        expect(result1.value.id).toBe(result2.value.id);
      }
    });
  });

  describe('add - method', () => {
    it('should add a method entity', async () => {
      const result = await storage.add({
        type: 'method',
        name: 'Self-Attention',
        description: 'Attention mechanism within a single sequence',
        tags: ['attention'],
        purpose: 'Capture dependencies within a sequence',
        steps: ['Compute Q, K, V', 'Calculate attention weights', 'Apply weighted sum'],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.type).toBe('method');
      if ('purpose' in result.value) {
        expect(result.value.purpose).toBe('Capture dependencies within a sequence');
      }
    });
  });

  describe('add - finding', () => {
    it('should add a finding entity', async () => {
      const result = await storage.add({
        type: 'finding',
        name: 'Scaling Law',
        description: 'Performance improves predictably with scale',
        tags: ['scaling'],
        evidence: 'Empirical results from GPT-3 paper',
        confidence: 'high',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.type).toBe('finding');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await storage.add({
        type: 'concept',
        name: 'Neural Network',
        description: 'A computational model inspired by biological neurons',
        tags: ['ml', 'basics'],
      });

      await storage.add({
        type: 'method',
        name: 'Backpropagation',
        description: 'Algorithm for training neural networks',
        tags: ['ml', 'training'],
      });

      await storage.add({
        type: 'finding',
        name: 'Deep networks perform better',
        description: 'Deeper networks can learn more complex functions',
        tags: ['ml', 'architecture'],
      });
    });

    it('should find entities by query', async () => {
      const result = await storage.search({ query: 'neural' });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.entities.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const result = await storage.search({
        query: 'neural',
        types: ['concept'],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.entities.every(e => e.type === 'concept')).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await storage.search({
        query: '',
        tags: ['training'],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.entities.every(e => e.tags.includes('training'))).toBe(true);
    });
  });

  describe('relate', () => {
    it('should create a relation between entities', async () => {
      await storage.add({
        type: 'concept',
        name: 'Transformer',
        description: 'Architecture using attention',
        tags: [],
      });

      await storage.add({
        type: 'method',
        name: 'Self-Attention',
        description: 'Attention mechanism',
        tags: [],
      });

      const result = await storage.relate({
        fromEntity: 'Transformer',
        toEntity: 'Self-Attention',
        relationType: 'uses',
        description: 'Transformer uses self-attention as its core mechanism',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.fromEntity).toBe('Transformer');
      expect(result.value.toEntity).toBe('Self-Attention');
      expect(result.value.relationType).toBe('uses');
    });

    it('should retrieve relations for an entity', async () => {
      await storage.add({
        type: 'concept',
        name: 'EntityA',
        description: 'Test entity A',
        tags: [],
      });

      await storage.add({
        type: 'concept',
        name: 'EntityB',
        description: 'Test entity B',
        tags: [],
      });

      await storage.relate({
        fromEntity: 'EntityA',
        toEntity: 'EntityB',
        relationType: 'related_to',
      });

      const result = await storage.getRelations('EntityA');

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.length).toBe(1);
      expect(result.value[0].toEntity).toBe('EntityB');
    });
  });

  describe('update', () => {
    it('should update entity description', async () => {
      await storage.add({
        type: 'concept',
        name: 'Test Entity',
        description: 'Original description',
        tags: ['original'],
      });

      const updateResult = await storage.update({
        name: 'Test Entity',
        description: 'Updated description',
        tags: ['updated', 'modified'],
      });

      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      expect(updateResult.value.description).toBe('Updated description');
      expect(updateResult.value.tags).toContain('updated');
    });

    it('should return error for non-existent entity', async () => {
      const result = await storage.update({
        name: 'Non-existent',
        description: 'New description',
      });

      expect(result.ok).toBe(false);
    });
  });
});
