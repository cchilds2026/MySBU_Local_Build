from __future__ import annotations

import os
import pathlib
import uuid
from dataclasses import dataclass
from typing import BinaryIO


@dataclass
class UploadedDocument:
    file_name: str
    mime_type: str
    storage_path: str
    file_url: str
    provider: str


def _sanitize_path_segment(value: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in "._-" else "-" for ch in (value or "").strip().lower())
    return safe.strip("-") or "unknown"


def _ensure_directory(path: pathlib.Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def upload_document(
    *,
    file_stream: BinaryIO,
    file_name: str,
    mime_type: str,
    source_section_id: str,
) -> UploadedDocument:
    """
    Phase 2 upload adapter entrypoint.

    Modes:
    - local_stub: saves file locally for end-to-end plumbing tests
    - sharepoint_graph: reserved for future real SharePoint upload
    """

    mode = os.getenv("DOCUMENT_UPLOAD_MODE", "local_stub").strip().lower()

    if mode == "local_stub":
        return _upload_document_local_stub(
            file_stream=file_stream,
            file_name=file_name,
            mime_type=mime_type,
            source_section_id=source_section_id,
        )

    if mode == "sharepoint_graph":
        raise NotImplementedError(
            "DOCUMENT_UPLOAD_MODE=sharepoint_graph is not configured yet. "
            "Keep the current workflow enabled until IT approves the SharePoint auth path."
        )

    raise ValueError(f"Unsupported DOCUMENT_UPLOAD_MODE: {mode}")


def _upload_document_local_stub(
    *,
    file_stream: BinaryIO,
    file_name: str,
    mime_type: str,
    source_section_id: str,
) -> UploadedDocument:
    safe_section = _sanitize_path_segment(source_section_id)
    safe_file_name = _sanitize_path_segment(file_name)
    unique_prefix = uuid.uuid4().hex[:10]

    uploads_root = pathlib.Path(__file__).resolve().parents[1] / "dev_uploads" / safe_section
    _ensure_directory(uploads_root)

    stored_name = f"{unique_prefix}-{safe_file_name}"
    destination = uploads_root / stored_name

    with destination.open("wb") as output_file:
        output_file.write(file_stream.read())

    storage_path = str(destination)

    public_base_url = os.getenv("DOCUMENT_PUBLIC_BASE_URL", "http://127.0.0.1:5050").rstrip("/")
    file_url = f"{public_base_url}/api/dev-uploads/{safe_section}/{stored_name}"

    return UploadedDocument(
        file_name=file_name,
        mime_type=mime_type or "application/octet-stream",
        storage_path=storage_path,
        file_url=file_url,
        provider="local_stub",
    )