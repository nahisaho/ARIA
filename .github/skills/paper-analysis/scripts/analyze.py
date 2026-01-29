"""
ARIA Paper Analysis Script
docling を使用して PDF 論文を Markdown に変換し、メタデータを抽出

Usage:
    python analyze.py <pdf_path> <output_dir>
    python analyze.py paper.pdf ./output

Requirements:
    pip install docling pyyaml
"""

import sys
import json
import re
from pathlib import Path
from typing import Any

try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False
    print("Warning: docling not installed. Install with: pip install docling")

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


def extract_title(text: str) -> str:
    """Markdown テキストからタイトルを抽出"""
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('# '):
            return line[2:].strip()
        if line and not line.startswith('#'):
            # 最初の非空行をタイトルとして使用
            return line[:200]  # 最大200文字
    return "Untitled"


def extract_abstract(text: str) -> str:
    """Markdown テキストから要旨を抽出"""
    # Abstract セクションを探す
    abstract_patterns = [
        r'(?i)##?\s*abstract\s*\n(.*?)(?=\n##?\s|\Z)',
        r'(?i)abstract[:\s]+([^\n]+(?:\n(?![A-Z][a-z]*:)[^\n]+)*)',
    ]
    
    for pattern in abstract_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            abstract = match.group(1).strip()
            # 最大1000文字
            return abstract[:1000] if len(abstract) > 1000 else abstract
    
    return ""


def extract_sections(text: str) -> list[dict[str, Any]]:
    """Markdown テキストからセクション構造を抽出"""
    sections = []
    current_section = None
    
    lines = text.split('\n')
    for line in lines:
        # H2, H3 ヘッダーを検出
        if line.startswith('## '):
            if current_section:
                sections.append(current_section)
            current_section = {
                'level': 2,
                'title': line[3:].strip(),
                'content': ''
            }
        elif line.startswith('### '):
            if current_section:
                sections.append(current_section)
            current_section = {
                'level': 3,
                'title': line[4:].strip(),
                'content': ''
            }
        elif current_section:
            current_section['content'] += line + '\n'
    
    if current_section:
        sections.append(current_section)
    
    # コンテンツを整形
    for section in sections:
        section['content'] = section['content'].strip()[:500]  # 最大500文字
    
    return sections


def extract_keywords(text: str) -> list[str]:
    """テキストからキーワードを抽出（簡易実装）"""
    # Keywords セクションを探す
    keyword_match = re.search(
        r'(?i)keywords?[:\s]+([^\n]+)',
        text
    )
    
    if keyword_match:
        keywords_text = keyword_match.group(1)
        # カンマ、セミコロン、改行で分割
        keywords = re.split(r'[,;・]', keywords_text)
        return [kw.strip() for kw in keywords if kw.strip()][:10]
    
    return []


def analyze_paper(pdf_path: str, output_dir: str) -> dict[str, Any]:
    """
    論文を分析し、構造化データを生成
    
    Args:
        pdf_path: PDFファイルのパス
        output_dir: 出力ディレクトリ
    
    Returns:
        メタデータ辞書
    """
    if not DOCLING_AVAILABLE:
        return {
            "error": "docling not available",
            "message": "Install docling with: pip install docling"
        }
    
    pdf_file = Path(pdf_path)
    if not pdf_file.exists():
        return {
            "error": "file_not_found",
            "message": f"PDF file not found: {pdf_path}"
        }
    
    # docling で変換
    print(f"Converting {pdf_path}...")
    converter = DocumentConverter()
    result = converter.convert(str(pdf_file))
    
    # Markdown 生成
    md_content = result.document.export_to_markdown()
    
    # メタデータ抽出
    metadata = {
        "original_path": str(pdf_file.absolute()),
        "filename": pdf_file.name,
        "title": extract_title(md_content),
        "abstract": extract_abstract(md_content),
        "sections": extract_sections(md_content),
        "keywords": extract_keywords(md_content),
        "processing_status": "completed",
        "word_count": len(md_content.split()),
        "char_count": len(md_content),
    }
    
    # 出力ディレクトリ作成
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # ファイル保存
    md_file = output_path / "paper.md"
    md_file.write_text(md_content, encoding='utf-8')
    print(f"Saved: {md_file}")
    
    if YAML_AVAILABLE:
        meta_file = output_path / "metadata.yaml"
        with open(meta_file, 'w', encoding='utf-8') as f:
            yaml.dump(metadata, f, allow_unicode=True, default_flow_style=False)
        print(f"Saved: {meta_file}")
    else:
        meta_file = output_path / "metadata.json"
        with open(meta_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f"Saved: {meta_file}")
    
    return metadata


def main():
    """メイン関数"""
    if len(sys.argv) < 3:
        print("Usage: python analyze.py <pdf_path> <output_dir>")
        print("Example: python analyze.py paper.pdf ./output")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = analyze_paper(pdf_path, output_dir)
    
    # 結果を JSON で出力
    print("\n--- Result ---")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
