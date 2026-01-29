/**
 * Knowledge Storage Service
 * ファイルベースの知識エンティティストレージ
 */

import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { type Result, ok, err } from '../types/result.js';
import type {
  KnowledgeEntity,
  KnowledgeType,
  RelationEntity,
  RelationType,
  AddKnowledgeInput,
} from '../types/knowledge.js';
import { generateUUID, generateKnowledgeId } from '../utils/id-generator.js';
import { nowISO } from '../utils/date-utils.js';

// Re-export for convenience
export type { AddKnowledgeInput };

export interface KnowledgeSearchFilters {
  query?: string | undefined;
  types?: KnowledgeType[] | undefined;
  tags?: string[] | undefined;
  limit?: number | undefined;
}

export interface KnowledgeRelateInput {
  fromEntity: string;
  toEntity: string;
  relationType: RelationType;
  description?: string | undefined;
  bidirectional?: boolean | undefined;
  source?: string | undefined;
}

export interface KnowledgeUpdateInput {
  id?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  aliases?: string[] | undefined;
  tags?: string[] | undefined;
}

export interface KnowledgeSearchResult {
  entities: KnowledgeEntity[];
  relations: RelationEntity[];
  total: number;
}

export interface KnowledgeStorageOptions {
  basePath: string;
}

/**
 * 知識エンティティのファイルベースストレージサービス
 * 
 * ディレクトリ構造:
 *   storage/knowledge/entities/{type}/KN-xxxxxxxx.json
 *   storage/knowledge/relations/REL-xxxxxxxx.json
 *   storage/knowledge/index.json  (名前→IDのマッピング)
 */
export class KnowledgeStorageService {
  private basePath: string;
  private indexCache: Map<string, string> | null = null;  // name -> id

  constructor(options: KnowledgeStorageOptions) {
    this.basePath = options.basePath;
  }

  /**
   * エンティティディレクトリパス取得
   */
  private getEntityDir(type: KnowledgeType): string {
    return join(this.basePath, 'entities', type);
  }

  /**
   * 関係ディレクトリパス取得
   */
  private getRelationsDir(): string {
    return join(this.basePath, 'relations');
  }

  /**
   * インデックスファイルパス取得
   */
  private getIndexPath(): string {
    return join(this.basePath, 'index.json');
  }

  /**
   * インデックスを読み込み
   */
  private async loadIndex(): Promise<Map<string, string>> {
    if (this.indexCache) {
      return this.indexCache;
    }

    const indexPath = this.getIndexPath();
    if (!existsSync(indexPath)) {
      this.indexCache = new Map();
      return this.indexCache;
    }

    const content = await readFile(indexPath, 'utf-8');
    const data = JSON.parse(content) as Record<string, string>;
    this.indexCache = new Map(Object.entries(data));
    return this.indexCache;
  }

  /**
   * インデックスを保存
   */
  private async saveIndex(): Promise<void> {
    if (!this.indexCache) return;

    const indexPath = this.getIndexPath();
    await mkdir(this.basePath, { recursive: true });

    const data = Object.fromEntries(this.indexCache.entries());
    await writeFile(indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 関係ID生成
   */
  private generateRelationId(): string {
    const uuid = generateUUID();
    return `REL-${uuid.substring(0, 8)}`;
  }

  /**
   * 知識エンティティを追加
   */
  async add(input: AddKnowledgeInput): Promise<Result<KnowledgeEntity | RelationEntity, string>> {
    try {
      const now = nowISO();

      if (input.type === 'relation') {
        // 関係エンティティ
        if (!input.fromEntity || !input.toEntity || !input.relationType) {
          return err('Relation requires fromEntity, toEntity, and relationType');
        }

        const relation: RelationEntity = {
          id: generateUUID(),
          type: 'relation',
          fromEntity: input.fromEntity,
          toEntity: input.toEntity,
          relationType: input.relationType,
          description: input.description,
          bidirectional: false,
          source: input.source,
          sourceType: input.sourceType,
          createdAt: now,
          updatedAt: now,
        };

        const relDir = this.getRelationsDir();
        await mkdir(relDir, { recursive: true });

        const relId = this.generateRelationId();
        const filePath = join(relDir, `${relId}.json`);
        await writeFile(filePath, JSON.stringify(relation, null, 2), 'utf-8');

        return ok(relation);
      }

      // 通常のエンティティ
      const id = generateUUID();
      const knowledgeId = generateKnowledgeId();

      let entity: KnowledgeEntity;

      switch (input.type) {
        case 'concept':
          entity = {
            id,
            type: 'concept',
            name: input.name,
            description: input.description,
            aliases: input.aliases,
            source: input.source,
            sourceType: input.sourceType,
            tags: input.tags ?? [],
            category: input.category,
            createdAt: now,
            updatedAt: now,
          };
          break;

        case 'method':
          entity = {
            id,
            type: 'method',
            name: input.name,
            description: input.description,
            aliases: input.aliases,
            source: input.source,
            sourceType: input.sourceType,
            tags: input.tags ?? [],
            purpose: input.purpose,
            steps: input.steps,
            createdAt: now,
            updatedAt: now,
          };
          break;

        case 'finding':
          entity = {
            id,
            type: 'finding',
            name: input.name,
            description: input.description,
            aliases: input.aliases,
            source: input.source,
            sourceType: input.sourceType,
            tags: input.tags ?? [],
            evidence: input.evidence,
            conditions: input.conditions,
            confidence: input.confidence,
            createdAt: now,
            updatedAt: now,
          };
          break;

        default:
          return err(`Unknown knowledge type: ${input.type}`);
      }

      // ディレクトリ作成
      const dir = this.getEntityDir(input.type);
      await mkdir(dir, { recursive: true });

      // エンティティ保存
      const filePath = join(dir, `${knowledgeId}.json`);
      await writeFile(filePath, JSON.stringify(entity, null, 2), 'utf-8');

      // インデックス更新
      const index = await this.loadIndex();
      index.set(input.name.toLowerCase(), knowledgeId);
      if (input.aliases) {
        for (const alias of input.aliases) {
          index.set(alias.toLowerCase(), knowledgeId);
        }
      }
      await this.saveIndex();

      return ok(entity);
    } catch (error) {
      return err(`Failed to add knowledge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 名前またはIDでエンティティを取得
   */
  async get(nameOrId: string): Promise<Result<KnowledgeEntity | null, string>> {
    try {
      // IDで直接検索を試みる
      if (nameOrId.startsWith('KN-')) {
        for (const type of ['concept', 'method', 'finding'] as KnowledgeType[]) {
          const filePath = join(this.getEntityDir(type), `${nameOrId}.json`);
          if (existsSync(filePath)) {
            const content = await readFile(filePath, 'utf-8');
            return ok(JSON.parse(content) as KnowledgeEntity);
          }
        }
      }

      // 名前でインデックス検索
      const index = await this.loadIndex();
      const knowledgeId = index.get(nameOrId.toLowerCase());
      
      if (!knowledgeId) {
        return ok(null);
      }

      // 各typeディレクトリを検索
      for (const type of ['concept', 'method', 'finding'] as KnowledgeType[]) {
        const filePath = join(this.getEntityDir(type), `${knowledgeId}.json`);
        if (existsSync(filePath)) {
          const content = await readFile(filePath, 'utf-8');
          return ok(JSON.parse(content) as KnowledgeEntity);
        }
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to get knowledge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 知識を検索
   */
  async search(filters: KnowledgeSearchFilters): Promise<Result<KnowledgeSearchResult, string>> {
    try {
      const entities: KnowledgeEntity[] = [];
      const relations: RelationEntity[] = [];
      const limit = filters.limit ?? 10;

      // エンティティ検索
      const typesToSearch = filters.types ?? (['concept', 'method', 'finding'] as KnowledgeType[]);

      for (const type of typesToSearch) {
        const dir = this.getEntityDir(type);
        if (!existsSync(dir)) continue;

        const files = await readdir(dir);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;

          const content = await readFile(join(dir, file), 'utf-8');
          const entity = JSON.parse(content) as KnowledgeEntity;

          if (this.matchesFilters(entity, filters)) {
            entities.push(entity);
          }
        }
      }

      // 関係検索（タイプフィルタがなければ含める）
      if (!filters.types || filters.types.includes('relation' as KnowledgeType)) {
        const relDir = this.getRelationsDir();
        if (existsSync(relDir)) {
          const files = await readdir(relDir);
          for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const content = await readFile(join(relDir, file), 'utf-8');
            const rel = JSON.parse(content) as RelationEntity;

            if (this.matchesRelationFilter(rel, filters)) {
              relations.push(rel);
            }
          }
        }
      }

      // 名前順でソート
      entities.sort((a, b) => a.name.localeCompare(b.name));

      const total = entities.length + relations.length;

      return ok({
        entities: entities.slice(0, limit),
        relations: relations.slice(0, Math.max(0, limit - entities.length)),
        total,
      });
    } catch (error) {
      return err(`Failed to search knowledge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * エンティティがフィルタにマッチするか
   */
  private matchesFilters(entity: KnowledgeEntity, filters: KnowledgeSearchFilters): boolean {
    // タグフィルタ
    if (filters.tags && filters.tags.length > 0) {
      const entityTags = new Set(entity.tags);
      if (!filters.tags.some(tag => entityTags.has(tag))) {
        return false;
      }
    }

    // クエリ検索
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = [
        entity.name,
        entity.description,
        ...(entity.aliases ?? []),
        ...entity.tags,
      ].join(' ').toLowerCase();

      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 関係がフィルタにマッチするか
   */
  private matchesRelationFilter(rel: RelationEntity, filters: KnowledgeSearchFilters): boolean {
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = [
        rel.fromEntity,
        rel.toEntity,
        rel.relationType,
        rel.description ?? '',
      ].join(' ').toLowerCase();

      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 2つのエンティティ間の関係を追加
   */
  async relate(input: KnowledgeRelateInput): Promise<Result<RelationEntity, string>> {
    try {
      const now = nowISO();

      const relation: RelationEntity = {
        id: generateUUID(),
        type: 'relation',
        fromEntity: input.fromEntity,
        toEntity: input.toEntity,
        relationType: input.relationType,
        description: input.description,
        bidirectional: input.bidirectional ?? false,
        source: input.source,
        createdAt: now,
        updatedAt: now,
      };

      const relDir = this.getRelationsDir();
      await mkdir(relDir, { recursive: true });

      const relId = this.generateRelationId();
      const filePath = join(relDir, `${relId}.json`);
      await writeFile(filePath, JSON.stringify(relation, null, 2), 'utf-8');

      return ok(relation);
    } catch (error) {
      return err(`Failed to add relation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * エンティティを更新
   */
  async update(input: KnowledgeUpdateInput): Promise<Result<KnowledgeEntity, string>> {
    try {
      // エンティティを検索
      const searchKey = input.id ?? input.name;
      if (!searchKey) {
        return err('Either id or name is required');
      }

      const getResult = await this.get(searchKey);
      if (!getResult.ok) {
        return err(getResult.error);
      }
      if (!getResult.value) {
        return err(`Entity not found: ${searchKey}`);
      }

      const entity = getResult.value;
      const now = nowISO();

      // フィールド更新
      if (input.description !== undefined) {
        entity.description = input.description;
      }
      if (input.aliases !== undefined) {
        entity.aliases = input.aliases;
      }
      if (input.tags !== undefined) {
        entity.tags = input.tags;
      }
      entity.updatedAt = now;

      // 保存先を特定
      const index = await this.loadIndex();
      let knowledgeId: string | undefined;
      
      // 名前からIDを取得
      knowledgeId = index.get(entity.name.toLowerCase());
      
      if (!knowledgeId) {
        return err('Could not find entity file');
      }

      // 各typeディレクトリを検索して保存
      for (const type of ['concept', 'method', 'finding'] as KnowledgeType[]) {
        const filePath = join(this.getEntityDir(type), `${knowledgeId}.json`);
        if (existsSync(filePath)) {
          await writeFile(filePath, JSON.stringify(entity, null, 2), 'utf-8');
          
          // エイリアスが変更された場合、インデックスも更新
          if (input.aliases !== undefined) {
            // 古いエイリアスを削除して新しいものを追加
            index.set(entity.name.toLowerCase(), knowledgeId);
            for (const alias of input.aliases) {
              index.set(alias.toLowerCase(), knowledgeId);
            }
            await this.saveIndex();
          }
          
          return ok(entity);
        }
      }

      return err('Entity file not found');
    } catch (error) {
      return err(`Failed to update knowledge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * エンティティの関連を取得
   */
  async getRelations(entityName: string): Promise<Result<RelationEntity[], string>> {
    try {
      const relations: RelationEntity[] = [];
      const relDir = this.getRelationsDir();

      if (!existsSync(relDir)) {
        return ok([]);
      }

      const files = await readdir(relDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const content = await readFile(join(relDir, file), 'utf-8');
        const rel = JSON.parse(content) as RelationEntity;

        if (rel.fromEntity === entityName || rel.toEntity === entityName ||
            (rel.bidirectional && (rel.fromEntity === entityName || rel.toEntity === entityName))) {
          relations.push(rel);
        }
      }

      return ok(relations);
    } catch (error) {
      return err(`Failed to get relations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
