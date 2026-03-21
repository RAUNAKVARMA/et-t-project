"""Extract plain text from uploaded documents (PDF, DOCX, TXT, MD, CSV)."""

from __future__ import annotations

import csv
import io
from docx import Document
from PyPDF2 import PdfReader


def extract_text_from_bytes(filename: str, raw: bytes) -> str:
    """
    Route by file extension and return UTF-8 text suitable for chunking.

    Raises:
        ValueError: Unknown or empty extension.
    """
    lower = filename.lower()
    if "." not in lower:
        raise ValueError("Filename must include an extension")
    ext = lower.rsplit(".", 1)[-1]

    if ext in ("txt", "md"):
        return raw.decode("utf-8", errors="replace")

    if ext == "csv":
        return _parse_csv(raw)

    if ext == "pdf":
        return _parse_pdf(raw)

    if ext == "docx":
        return _parse_docx(raw)

    raise ValueError(f"Unsupported file type: .{ext}")


def _parse_csv(raw: bytes) -> str:
    """Flatten CSV rows into line-oriented text for embedding."""
    text = raw.decode("utf-8", errors="replace")
    buffer = io.StringIO(text)
    reader = csv.reader(buffer)
    lines: list[str] = []
    for row in reader:
        lines.append(" | ".join(cell.strip() for cell in row))
    return "\n".join(lines)


def _parse_pdf(raw: bytes) -> str:
    """Extract text from PDF bytes."""
    bio = io.BytesIO(raw)
    reader = PdfReader(bio)
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n\n".join(parts)


def _parse_docx(raw: bytes) -> str:
    """Extract paragraphs from DOCX bytes."""
    bio = io.BytesIO(raw)
    doc = Document(bio)
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
