/**
 * Experiment Storage Service
 * ファイルベースの実験ログストレージ
 */

import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { ExperimentLogEntity } from '../entities/experiment-log.js';
import type { ExperimentLog, ExperimentCategory } from '../types/experiment.js';
import { type Result, ok, err } from '../types/result.js';
import YAML from 'yaml';

export interface ExperimentCreateInput {
  title: string;
  description?: string | undefined;
  category: ExperimentCategory;
  tags?: string[] | undefined;
  hypothesis?: string | undefined;
}

export interface ExperimentUpdateInput {
  inputs?: Array<{ name: string; type: string; value: unknown }> | undefined;
  outputs?: Array<{ name: string; type: string; value: unknown }> | undefined;
  observations?: string[] | undefined;
  conclusions?: string | undefined;
}

export interface ExperimentSearchFilters {
  query?: string | undefined;
  tags?: string[] | undefined;
  category?: ExperimentCategory | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
}

export interface ExperimentSearchResult {
  experiments: ExperimentLog[];
  total: number;
}

export interface ExperimentStorageOptions {
  basePath: string;
}

/**
 * 実験ログのファイルベースストレージサービス
 * 
 * ディレクトリ構造:
 *   storage/experiments/YYYY/MM/DD/EXP-YYYY-MM-DD-NNN.yaml
 */
export class ExperimentStorageService {
  private basePath: string;
  private sequenceCache: Map<string, number> = new Map();

  constructor(options: ExperimentStorageOptions) {
    this.basePath = options.basePath;
  }

  /**
   * 次のシーケンス番号を取得
   */
  private async getNextSequence(date: Date): Promise<number> {
    const dateKey = this.formatDateKey(date);
    
    // キャッシュチェック
    if (this.sequenceCache.has(dateKey)) {
      const current = this.sequenceCache.get(dateKey)!;
      this.sequenceCache.set(dateKey, current + 1);
      return current + 1;
    }

    // ディレクトリの既存ファイルを確認
    const dir = this.getDateDirectory(date);
    let maxSeq = 0;

    if (existsSync(dir)) {
      const files = await readdir(dir);
      for (const file of files) {
        const match = file.match(/EXP-\d{4}-\d{2}-\d{2}-(\d{3})\.yaml$/);
        if (match && match[1]) {
          const seq = parseInt(match[1], 10);
          maxSeq = Math.max(maxSeq, seq);
        }
      }
    }

    this.sequenceCache.set(dateKey, maxSeq + 1);
    return maxSeq + 1;
  }

  /**
   * 日付キー生成
   */
  private formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * 日付ディレクトリパス取得
   */
  private getDateDirectory(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return join(this.basePath, String(year), month, day);
  }

  /**
   * 実験ログのファイルパス取得
   */
  private getFilePath(experimentId: string): string {
    // EXP-2026-01-28-001 形式をパース
    const match = experimentId.match(/^EXP-(\d{4})-(\d{2})-(\d{2})-(\d{3})$/);
    if (!match || !match[1] || !match[2] || !match[3]) {
      throw new Error(`Invalid experiment ID format: ${experimentId}`);
    }
    const year = match[1];
    const month = match[2];
    const day = match[3];
    return join(this.basePath, year, month, day, `${experimentId}.yaml`);
  }

  /**
   * 新規実験ログを作成して保存
   */
  async create(input: ExperimentCreateInput): Promise<Result<ExperimentLog, string>> {
    try {
      const now = new Date();
      const sequence = await this.getNextSequence(now);
      
      const entity = ExperimentLogEntity.create({
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags ?? [],
        hypothesis: input.hypothesis,
      }, sequence);

      const filePath = this.getFilePath(entity.experimentId);
      const dir = dirname(filePath);

      // ディレクトリ作成
      await mkdir(dir, { recursive: true });

      // YAMLとして保存
      const yaml = YAML.stringify(entity.toJSON());
      await writeFile(filePath, yaml, 'utf-8');

      return ok(entity.data);
    } catch (error) {
      return err(`Failed to create experiment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 実験ログを読み込み
   */
  async get(experimentId: string): Promise<Result<ExperimentLog, string>> {
    try {
      const filePath = this.getFilePath(experimentId);
      
      if (!existsSync(filePath)) {
        return err(`Experiment not found: ${experimentId}`);
      }

      const content = await readFile(filePath, 'utf-8');
      const data = YAML.parse(content) as ExperimentLog;
      
      return ok(data);
    } catch (error) {
      return err(`Failed to read experiment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 実験ログを更新
   */
  async update(experimentId: string, updates: ExperimentUpdateInput): Promise<Result<ExperimentLog, string>> {
    try {
      const getResult = await this.get(experimentId);
      if (!getResult.ok) {
        return getResult;
      }

      const entity = ExperimentLogEntity.fromData(getResult.value);

      // 入力を追加
      if (updates.inputs) {
        for (const input of updates.inputs) {
          entity.addInput({
            name: input.name,
            type: input.type as 'file' | 'parameter' | 'data' | 'reference',
            value: input.value as string | number | boolean | Record<string, unknown>,
          });
        }
      }

      // 出力を追加
      if (updates.outputs) {
        for (const output of updates.outputs) {
          entity.addOutput({
            name: output.name,
            type: output.type as 'file' | 'metric' | 'visualization' | 'model',
            value: output.value as string | number | Record<string, unknown>,
          });
        }
      }

      // 観察を追加
      if (updates.observations) {
        for (const obs of updates.observations) {
          entity.addObservation(obs);
        }
      }

      // 結論を設定
      if (updates.conclusions) {
        entity.setConclusions(updates.conclusions);
      }

      // 保存
      const filePath = this.getFilePath(experimentId);
      const yaml = YAML.stringify(entity.toJSON());
      await writeFile(filePath, yaml, 'utf-8');

      return ok(entity.data);
    } catch (error) {
      return err(`Failed to update experiment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 実験ログを検索
   */
  async search(filters: ExperimentSearchFilters, limit: number = 10): Promise<Result<ExperimentSearchResult, string>> {
    try {
      const experiments: ExperimentLog[] = [];

      // ベースディレクトリ存在チェック
      if (!existsSync(this.basePath)) {
        return ok({ experiments: [], total: 0 });
      }

      // 全実験をスキャン（年→月→日のディレクトリ構造）
      const years = await readdir(this.basePath);
      
      for (const year of years) {
        const yearPath = join(this.basePath, year);
        const yearStat = await stat(yearPath);
        if (!yearStat.isDirectory()) continue;

        const months = await readdir(yearPath);
        for (const month of months) {
          const monthPath = join(yearPath, month);
          const monthStat = await stat(monthPath);
          if (!monthStat.isDirectory()) continue;

          const days = await readdir(monthPath);
          for (const day of days) {
            const dayPath = join(monthPath, day);
            const dayStat = await stat(dayPath);
            if (!dayStat.isDirectory()) continue;

            // 日付フィルタ
            const dateStr = `${year}-${month}-${day}`;
            if (filters.dateFrom && dateStr < filters.dateFrom) continue;
            if (filters.dateTo && dateStr > filters.dateTo) continue;

            const files = await readdir(dayPath);
            for (const file of files) {
              if (!file.endsWith('.yaml')) continue;

              const content = await readFile(join(dayPath, file), 'utf-8');
              const exp = YAML.parse(content) as ExperimentLog;

              // フィルタ適用
              if (!this.matchesFilters(exp, filters)) continue;

              experiments.push(exp);
            }
          }
        }
      }

      // 日付降順でソート
      experiments.sort((a, b) => b.timestamp - a.timestamp);

      const total = experiments.length;
      const limited = experiments.slice(0, limit);

      return ok({ experiments: limited, total });
    } catch (error) {
      return err(`Failed to search experiments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * フィルタマッチング
   */
  private matchesFilters(exp: ExperimentLog, filters: ExperimentSearchFilters): boolean {
    // カテゴリフィルタ
    if (filters.category && exp.category !== filters.category) {
      return false;
    }

    // タグフィルタ（AND条件）
    if (filters.tags && filters.tags.length > 0) {
      const expTags = new Set(exp.tags);
      if (!filters.tags.every(tag => expTags.has(tag))) {
        return false;
      }
    }

    // クエリ検索（タイトル、説明、仮説、観察、結論に対するテキストマッチ）
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = [
        exp.title,
        exp.description ?? '',
        exp.hypothesis ?? '',
        ...(exp.observations ?? []),
        exp.conclusions ?? '',
      ].join(' ').toLowerCase();

      if (!searchText.includes(query)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 全実験のリストを取得
   */
  async list(limit: number = 50): Promise<Result<ExperimentSearchResult, string>> {
    return this.search({}, limit);
  }
}
