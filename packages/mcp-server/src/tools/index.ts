/**
 * ARIA MCP Tools - Index
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { experimentTools, handleExperimentTool, initExperimentStorage } from './experiment.js';
import { paperTools, handlePaperTool } from './paper.js';
import { graphragTools, handleGraphRAGTool } from './graphrag.js';
import { knowledgeTools, handleKnowledgeTool, initKnowledgeStorage } from './knowledge.js';
import { join } from 'path';

/**
 * ストレージを初期化
 */
export function initStorage(basePath?: string): void {
  const storagePath = basePath ?? join(process.env.ARIA_STORAGE_PATH ?? process.cwd(), 'storage');
  initExperimentStorage(storagePath);
  initKnowledgeStorage(storagePath);
}

/**
 * すべてのツール定義を取得
 */
export function getToolDefinitions(): Tool[] {
  return [
    ...experimentTools,
    ...paperTools,
    ...graphragTools,
    ...knowledgeTools,
  ];
}

/**
 * ツール呼び出しをハンドル
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Experiment tools
  if (name.startsWith('experiment_')) {
    return await handleExperimentTool(name, args);
  }

  // Paper tools
  if (name.startsWith('paper_')) {
    return await handlePaperTool(name, args);
  }

  // GraphRAG tools
  if (name.startsWith('graphrag_')) {
    return await handleGraphRAGTool(name, args);
  }

  // Knowledge tools
  if (name.startsWith('knowledge_')) {
    return await handleKnowledgeTool(name, args);
  }

  throw new Error(`Unknown tool: ${name}`);
}
