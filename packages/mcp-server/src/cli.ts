#!/usr/bin/env node
/**
 * ARIA MCP Server CLI
 */

import { AriaMCPServer } from './server.js';

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function printHelp(): void {
  console.log('ARIA MCP Server');
  console.log('');
  console.log('Usage:');
  console.log('  aria-mcp serve       Start the MCP server');
  console.log('  aria-mcp list-tools  List available tools');
  console.log('  aria-mcp help        Show this help message');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'serve':
      if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
        printHelp();
        break;
      }

      console.error('Starting ARIA MCP Server...');
      {
        const server = new AriaMCPServer();
        await server.start();
      }
      break;

    case 'list-tools':
      console.log('ARIA MCP Tools:');
      console.log('');
      console.log('Experiment:');
      console.log('  - experiment_create: Create a new experiment log');
      console.log('  - experiment_update: Update an existing experiment log');
      console.log('  - experiment_search: Search experiment logs');
      console.log('');
      console.log('Paper:');
      console.log('  - paper_check_oa: Check open-access availability for a paper');
      console.log('  - paper_download: Download open-access PDF');
      console.log('  - paper_import: Import a PDF paper using docling');
      console.log('  - paper_analyze: Analyze paper metadata');
      console.log('  - paper_search: Search papers');
      console.log('');
      console.log('GraphRAG:');
      console.log('  - graphrag_index: Index documents into GraphRAG');
      console.log('  - graphrag_query: Query the knowledge graph');
      console.log('  - graphrag_local: Local search in GraphRAG');
      console.log('  - graphrag_global: Global search in GraphRAG');
      console.log('');
      console.log('Knowledge:');
      console.log('  - knowledge_add: Add knowledge entity');
      console.log('  - knowledge_search: Search knowledge base');
      console.log('  - knowledge_relate: Add relation between entities');
      break;

    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
