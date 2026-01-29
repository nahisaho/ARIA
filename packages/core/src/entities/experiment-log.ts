import {
  type ExperimentLog,
  type CreateExperimentLogInput,
  type UpdateExperimentLogInput,
  type CopilotInteraction,
  type ExperimentInput,
  type ExperimentOutput,
  ExperimentLogSchema,
} from '../types/experiment.js';
import {
  generateUUID,
  generateExperimentId,
  generateInteractionId,
} from '../utils/id-generator.js';
import { nowISO, nowTimestamp, formatDate } from '../utils/date-utils.js';

/**
 * 実験ログエンティティ
 */
export class ExperimentLogEntity {
  private _data: ExperimentLog;

  private constructor(data: ExperimentLog) {
    this._data = ExperimentLogSchema.parse(data);
  }

  /**
   * 新規実験ログを作成
   */
  static create(input: CreateExperimentLogInput, sequence: number = 1): ExperimentLogEntity {
    const now = new Date();
    const data: ExperimentLog = {
      id: generateUUID(),
      experimentId: generateExperimentId(now, sequence),
      date: formatDate(now),
      timestamp: nowTimestamp(),

      title: input.title,
      description: input.description,
      tags: input.tags ?? [],
      category: input.category,

      hypothesis: input.hypothesis,
      methodology: input.methodology,
      environment: undefined,

      interactions: [],
      inputs: [],
      outputs: [],
      observations: [],
      conclusions: undefined,
      nextSteps: undefined,

      relatedPapers: undefined,
      relatedExperiments: undefined,
      references: undefined,

      version: 1,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    return new ExperimentLogEntity(data);
  }

  /**
   * 既存データから復元
   */
  static fromData(data: ExperimentLog): ExperimentLogEntity {
    return new ExperimentLogEntity(data);
  }

  /**
   * データを取得
   */
  get data(): Readonly<ExperimentLog> {
    return this._data;
  }

  /**
   * ID取得
   */
  get id(): string {
    return this._data.id;
  }

  /**
   * 実験ID取得
   */
  get experimentId(): string {
    return this._data.experimentId;
  }

  /**
   * タイトル取得
   */
  get title(): string {
    return this._data.title;
  }

  /**
   * 更新
   */
  update(input: UpdateExperimentLogInput): void {
    if (input.title !== undefined) {
      this._data.title = input.title;
    }
    if (input.description !== undefined) {
      this._data.description = input.description;
    }
    if (input.tags !== undefined) {
      this._data.tags = input.tags;
    }
    if (input.hypothesis !== undefined) {
      this._data.hypothesis = input.hypothesis;
    }
    if (input.methodology !== undefined) {
      this._data.methodology = input.methodology;
    }
    if (input.inputs !== undefined) {
      this._data.inputs = input.inputs;
    }
    if (input.outputs !== undefined) {
      this._data.outputs = input.outputs;
    }
    if (input.observations !== undefined) {
      this._data.observations = input.observations;
    }
    if (input.conclusions !== undefined) {
      this._data.conclusions = input.conclusions;
    }
    if (input.nextSteps !== undefined) {
      this._data.nextSteps = input.nextSteps;
    }
    if (input.relatedPapers !== undefined) {
      this._data.relatedPapers = input.relatedPapers;
    }
    if (input.relatedExperiments !== undefined) {
      this._data.relatedExperiments = input.relatedExperiments;
    }

    this._data.version += 1;
    this._data.updatedAt = nowISO();
  }

  /**
   * 対話を追加
   */
  addInteraction(
    type: CopilotInteraction['type'],
    content: string,
    model?: string,
    tokens?: { prompt: number; completion: number },
  ): void {
    const interaction: CopilotInteraction = {
      id: generateInteractionId(),
      timestamp: nowISO(),
      type,
      content,
      model,
      tokens,
    };

    this._data.interactions.push(interaction);
    this._data.updatedAt = nowISO();
  }

  /**
   * 入力を追加
   */
  addInput(input: ExperimentInput): void {
    this._data.inputs.push(input);
    this._data.updatedAt = nowISO();
  }

  /**
   * 出力を追加
   */
  addOutput(output: ExperimentOutput): void {
    this._data.outputs.push(output);
    this._data.updatedAt = nowISO();
  }

  /**
   * 観察を追加
   */
  addObservation(observation: string): void {
    this._data.observations.push(observation);
    this._data.updatedAt = nowISO();
  }

  /**
   * 結論を設定
   */
  setConclusions(conclusions: string): void {
    this._data.conclusions = conclusions;
    this._data.updatedAt = nowISO();
  }

  /**
   * JSONにシリアライズ
   */
  toJSON(): ExperimentLog {
    return { ...this._data };
  }
}
