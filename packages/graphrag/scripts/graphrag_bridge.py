#!/usr/bin/env python3
"""
ARIA GraphRAG Bridge - Knowledge graph indexing and querying using Microsoft GraphRAG v3.

Commands:
  init    - Initialize GraphRAG configuration
  index   - Build index from documents
  query   - Query the knowledge graph

Usage:
  python graphrag_bridge.py init <work_dir>
  python graphrag_bridge.py index <work_dir>
  python graphrag_bridge.py query <work_dir> <query> [--mode local|global|drift] [--community-level N]

Output (JSON to stdout):
  {"ok": true, ...}
  {"ok": false, "code": "...", "message": "..."}
"""

import json
import sys
import os
from pathlib import Path
import argparse
import subprocess


def check_graphrag_installed():
    """Check if graphrag is installed."""
    try:
        import graphrag
        return True
    except ImportError:
        return False


def run_graphrag_cli(args: list[str], work_dir: str) -> tuple[int, str, str]:
    """Run graphrag CLI command and return exit code, stdout, stderr."""
    try:
        result = subprocess.run(
            ["graphrag"] + args,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout for indexing
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as e:
        return 1, "", str(e)


def init_command(work_dir: str):
    """Initialize GraphRAG configuration in work_dir."""
    if not check_graphrag_installed():
        print(json.dumps({
            "ok": False,
            "code": "NOT_INSTALLED",
            "message": "graphrag is not installed. Run: pip install graphrag"
        }))
        sys.exit(1)

    work_path = Path(work_dir)
    work_path.mkdir(parents=True, exist_ok=True)

    # Run graphrag init
    exit_code, stdout, stderr = run_graphrag_cli(["init", "--root", str(work_path)], str(work_path))

    if exit_code == 0:
        print(json.dumps({
            "ok": True,
            "workDir": str(work_path.resolve()),
            "message": "GraphRAG initialized successfully"
        }))
    else:
        print(json.dumps({
            "ok": False,
            "code": "INIT_FAILED",
            "message": stderr or stdout or "Failed to initialize GraphRAG"
        }))
        sys.exit(1)


def index_command(work_dir: str):
    """Build GraphRAG index from documents in work_dir/input/."""
    if not check_graphrag_installed():
        print(json.dumps({
            "ok": False,
            "code": "NOT_INSTALLED",
            "message": "graphrag is not installed. Run: pip install graphrag"
        }))
        sys.exit(1)

    work_path = Path(work_dir)
    input_dir = work_path / "input"

    if not input_dir.exists():
        print(json.dumps({
            "ok": False,
            "code": "INVALID_INPUT",
            "message": f"Input directory not found: {input_dir}"
        }))
        sys.exit(1)

    # Check for input files
    input_files = list(input_dir.glob("*.txt")) + list(input_dir.glob("*.md"))
    if not input_files:
        print(json.dumps({
            "ok": False,
            "code": "INVALID_INPUT",
            "message": f"No .txt or .md files found in {input_dir}"
        }))
        sys.exit(1)

    # Check for settings.yaml
    settings_path = work_path / "settings.yaml"
    if not settings_path.exists():
        print(json.dumps({
            "ok": False,
            "code": "NOT_INITIALIZED",
            "message": f"settings.yaml not found. Run 'init' command first or create settings.yaml in {work_path}"
        }))
        sys.exit(1)

    # Run graphrag index
    exit_code, stdout, stderr = run_graphrag_cli(["index", "--root", str(work_path)], str(work_path))

    if exit_code == 0:
        output_dir = work_path / "output"
        print(json.dumps({
            "ok": True,
            "indexId": str(work_path.name),
            "outputDir": str(output_dir.resolve()) if output_dir.exists() else None,
            "documentsProcessed": len(input_files),
            "message": "Indexing completed successfully"
        }))
    else:
        # Check for common errors
        error_message = stderr or stdout or "Indexing failed"
        error_code = "UNKNOWN"
        
        if "OPENAI_API_KEY" in error_message or "api_key" in error_message.lower():
            error_code = "API_KEY_MISSING"
            error_message = "OpenAI API key not configured. Set OPENAI_API_KEY environment variable or configure in settings.yaml"
        elif "rate limit" in error_message.lower():
            error_code = "RATE_LIMIT"
        
        print(json.dumps({
            "ok": False,
            "code": error_code,
            "message": error_message
        }))
        sys.exit(1)


def query_command(work_dir: str, query: str, mode: str = "local", community_level: int = 2):
    """Query the GraphRAG knowledge graph."""
    if not check_graphrag_installed():
        print(json.dumps({
            "ok": False,
            "code": "NOT_INSTALLED",
            "message": "graphrag is not installed. Run: pip install graphrag"
        }))
        sys.exit(1)

    work_path = Path(work_dir)
    output_dir = work_path / "output"

    if not output_dir.exists():
        print(json.dumps({
            "ok": False,
            "code": "INDEX_NOT_FOUND",
            "message": f"Index not found at {output_dir}. Run indexing first."
        }))
        sys.exit(1)

    # Build query command
    query_args = [
        "query",
        "--root", str(work_path),
        "--method", mode,
        "--community-level", str(community_level),
        "--query", query
    ]

    exit_code, stdout, stderr = run_graphrag_cli(query_args, str(work_path))

    if exit_code == 0:
        # Parse the response
        response = {
            "ok": True,
            "answer": stdout.strip() if stdout else "No answer generated",
            "mode": mode,
            "communityLevel": community_level
        }
        print(json.dumps(response))
    else:
        error_message = stderr or stdout or "Query failed"
        error_code = "QUERY_FAILED"
        
        if "OPENAI_API_KEY" in error_message or "api_key" in error_message.lower():
            error_code = "API_KEY_MISSING"
            error_message = "OpenAI API key not configured"
        
        print(json.dumps({
            "ok": False,
            "code": error_code,
            "message": error_message
        }))
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="ARIA GraphRAG Bridge")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize GraphRAG configuration")
    init_parser.add_argument("work_dir", help="Working directory to initialize")

    # Index command
    index_parser = subparsers.add_parser("index", help="Build GraphRAG index")
    index_parser.add_argument("work_dir", help="Working directory with input/ folder")

    # Query command
    query_parser = subparsers.add_parser("query", help="Query the knowledge graph")
    query_parser.add_argument("work_dir", help="Working directory with output/ folder")
    query_parser.add_argument("query", help="Query string")
    query_parser.add_argument("--mode", choices=["local", "global", "drift"], default="local",
                             help="Query mode (default: local)")
    query_parser.add_argument("--community-level", type=int, default=2,
                             help="Community level for search (default: 2)")

    args = parser.parse_args()

    if args.command == "init":
        init_command(args.work_dir)
    elif args.command == "index":
        index_command(args.work_dir)
    elif args.command == "query":
        query_command(args.work_dir, args.query, args.mode, args.community_level)
    else:
        parser.print_help()
        print(json.dumps({
            "ok": False,
            "code": "INVALID_INPUT",
            "message": "No command specified. Use 'init', 'index', or 'query'."
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
