# Changelog

All notable changes to ARIA (AI Research & Inquiry Assistant) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-30

### 🎉 Initial Release

First release of ARIA - AI Research & Inquiry Assistant, a comprehensive research support system.

### Added

#### Core Features
- **Experiment Logging** - Create, update, and search structured experiment logs
  - YAML-based storage format
  - Rich metadata support (hypothesis, methodology, results, conclusions)
  - Full-text search capabilities

- **Knowledge Management** - Capture and organize research knowledge
  - Entity management (concepts, methods, findings, relations)
  - Semantic search with vector embeddings
  - Relationship mapping between entities

#### Paper Processing
- **PDF Import & Analysis** via docling integration
  - PDF to Markdown conversion
  - Automatic metadata extraction
  - Support for OCR, tables, figures, and equations
  - arXiv, DOI, and PMC resolver support

- **Paper Search** via Semantic Scholar API
  - Title and keyword search
  - Author search
  - Paper recommendations

#### Knowledge Graph (GraphRAG)
- **GraphRAG Integration** with Microsoft GraphRAG v3
  - Document indexing into knowledge graph
  - Local search (entity-focused queries)
  - Global search (community summaries)
  - DRIFT search (exploratory queries)

#### LLM Support
- **Multi-provider LLM Integration**
  - OpenAI (GPT-4o, text-embedding-3-large)
  - Azure OpenAI
  - Anthropic Claude (claude-3-5-sonnet)
  - Ollama (local inference)
  - Automatic fallback between providers

#### MCP Tools (16 tools)
| Category | Tools |
|----------|-------|
| Experiment | `experiment_create`, `experiment_update`, `experiment_search` |
| Knowledge | `knowledge_add`, `knowledge_search`, `knowledge_relate`, `knowledge_update` |
| Paper | `paper_check_oa`, `paper_download`, `paper_import`, `paper_analyze` |
| GraphRAG | `graphrag_index`, `graphrag_query`, `graphrag_local`, `graphrag_global` |

#### GitHub Copilot Agent Skills (5 skills)
- **experiment-log** - Structured experiment note creation
- **paper-analysis** - Academic paper analysis and extraction
- **graphrag-query** - Knowledge graph retrieval assistance
- **knowledge-capture** - Knowledge entity capture and structuring
- **research-workflow** - End-to-end research workflow guidance

### Packages

| Package | Description |
|---------|-------------|
| `@aria/core` | Core entities, types, and storage services |
| `@aria/llm-providers` | Multi-provider LLM abstraction |
| `@aria/paper-downloader` | Paper search, resolution, and download |
| `@aria/docling-adapter` | PDF to Markdown conversion via docling |
| `@aria/graphrag` | GraphRAG knowledge graph integration |
| `@aria/mcp-server` | MCP server with 16 tools |

### Technical Details
- **Language**: TypeScript (ESM) + Python
- **Runtime**: Node.js 20+, Python 3.10+
- **Package Manager**: pnpm (workspace)
- **Testing**: Vitest (92%+ coverage target)
- **Python Dependencies**: docling, graphrag v3

### Documentation
- Project requirements (REQ-001 to REQ-004)
- Architecture design (DES-001 to DES-004)
- API documentation
- Package READMEs

---

## Future Roadmap

### [0.2.0] - Planned
- [ ] Wake-Sleep learning cycle integration
- [ ] Neo4j graph database support
- [ ] Enhanced paper citation network analysis
- [ ] Multi-language paper support

### [0.3.0] - Planned
- [ ] Web UI dashboard
- [ ] Collaborative features
- [ ] Export to various formats (LaTeX, BibTeX)
- [ ] Integration with reference managers

---

[0.1.0]: https://github.com/your-org/aria/releases/tag/v0.1.0
