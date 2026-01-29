import { v4 as uuidv4 } from 'uuid';

/**
 * UUID生成
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * 実験ID生成
 * 形式: EXP-YYYY-MM-DD-NNN
 */
export function generateExperimentId(date: Date, sequence: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');

  return `EXP-${year}-${month}-${day}-${seq}`;
}

/**
 * 論文ID生成
 * 形式: PAPER-{uuid の先頭8文字}
 */
export function generatePaperId(): string {
  const uuid = generateUUID();
  return `PAPER-${uuid.substring(0, 8)}`;
}

/**
 * 知識エンティティID生成
 * 形式: KN-{uuid の先頭8文字}
 */
export function generateKnowledgeId(): string {
  const uuid = generateUUID();
  return `KN-${uuid.substring(0, 8)}`;
}

/**
 * 対話ID生成
 * 形式: INT-{uuid の先頭8文字}
 */
export function generateInteractionId(): string {
  const uuid = generateUUID();
  return `INT-${uuid.substring(0, 8)}`;
}
