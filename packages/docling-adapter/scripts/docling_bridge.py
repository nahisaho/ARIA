#!/usr/bin/env python3
"""
ARIA Docling Bridge - PDF to Markdown conversion using docling.

Usage:
  python docling_bridge.py <pdf_path> [output_dir]

Output (JSON to stdout):
  {"ok": true, "markdownPath": "...", "assetsDir": "..."}
  {"ok": false, "code": "...", "message": "..."}
"""

import json
import sys
import os
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "ok": False,
            "code": "INVALID_INPUT",
            "message": "Usage: python docling_bridge.py <pdf_path> [output_dir]"
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.isfile(pdf_path):
        print(json.dumps({
            "ok": False,
            "code": "INVALID_INPUT",
            "message": f"PDF file not found: {pdf_path}"
        }))
        sys.exit(1)

    try:
        from docling.document_converter import DocumentConverter
    except ImportError:
        print(json.dumps({
            "ok": False,
            "code": "NOT_INSTALLED",
            "message": "docling is not installed. Run: pip install docling"
        }))
        sys.exit(1)

    try:
        # Determine output directory
        pdf_path_obj = Path(pdf_path)
        if output_dir:
            out_dir = Path(output_dir)
        else:
            out_dir = pdf_path_obj.parent

        out_dir.mkdir(parents=True, exist_ok=True)

        # Convert PDF to Markdown using docling
        converter = DocumentConverter()
        result = converter.convert(pdf_path)

        # Export to Markdown
        md_filename = pdf_path_obj.stem + ".md"
        md_path = out_dir / md_filename
        md_content = result.document.export_to_markdown()

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        # Assets directory (for figures, etc.)
        assets_dir = out_dir / (pdf_path_obj.stem + "_assets")

        # Export figures if available
        has_assets = False
        if hasattr(result.document, 'pictures') and result.document.pictures:
            assets_dir.mkdir(parents=True, exist_ok=True)
            for i, pic in enumerate(result.document.pictures):
                if hasattr(pic, 'image') and pic.image:
                    img_path = assets_dir / f"figure_{i}.png"
                    pic.image.save(str(img_path))
                    has_assets = True

        response = {
            "ok": True,
            "markdownPath": str(md_path.resolve()),
        }

        if has_assets:
            response["assetsDir"] = str(assets_dir.resolve())

        print(json.dumps(response))

    except Exception as e:
        print(json.dumps({
            "ok": False,
            "code": "CONVERSION_FAILED",
            "message": str(e)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
