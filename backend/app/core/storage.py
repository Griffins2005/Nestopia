"""Upload storage on local disk or a Railway-mounted volume."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import BinaryIO, Union
from uuid import uuid4

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

FileLike = Union[BinaryIO, bytes]

# Mount Railway volumes at this path (Settings → Volumes → Mount path).
RAILWAY_UPLOADS_DEFAULT = "/data/uploads"


def _on_railway() -> bool:
    return bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PUBLIC_DOMAIN"))


def get_uploads_root() -> Path:
    configured = (settings.UPLOADS_DIR or "").strip()
    if configured:
        root = Path(configured)
    elif _on_railway():
        root = Path(RAILWAY_UPLOADS_DEFAULT)
    else:
        root = Path(__file__).resolve().parent.parent.parent / "uploads"

    root.mkdir(parents=True, exist_ok=True)
    (root / "listing_images").mkdir(exist_ok=True)
    (root / "profile_pics").mkdir(exist_ok=True)
    return root


def _read_bytes(data: FileLike) -> bytes:
    if isinstance(data, bytes):
        return data
    return data.read()


def save_upload(subdir: str, filename: str, data: FileLike) -> str:
    """Write file under uploads root; return /static/{subdir}/{filename} URL."""
    raw = _read_bytes(data)
    ext = os.path.splitext(filename)[1] or ".bin"
    fname = f"{uuid4().hex}{ext}"

    root = get_uploads_root()
    dest_dir = root / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / fname
    dest.write_bytes(raw)
    return f"/static/{subdir}/{fname}"


def log_storage_mode() -> None:
    root = get_uploads_root()
    if not _on_railway():
        logger.info("Upload storage: %s", root)
        return

    configured = (settings.UPLOADS_DIR or "").strip()
    if configured:
        logger.info("Upload storage: Railway volume (UPLOADS_DIR=%s)", configured)
    else:
        logger.info(
            "Upload storage: %s (attach a Railway volume at this mount path to survive redeploys)",
            root,
        )

    # Fail fast if the mount is not writable — avoids silent upload loss.
    probe = root / ".write_probe"
    try:
        probe.write_text("ok")
        probe.unlink(missing_ok=True)
    except OSError as exc:
        logger.error("Upload directory not writable (%s): %s", root, exc)
