"""Detect Render so production defaults apply on the hosted API."""

from __future__ import annotations

import os


def on_render() -> bool:
    flag = (os.getenv("RENDER") or "").strip().lower()
    if flag in {"true", "1", "yes", "on"}:
        return True
    return bool(os.getenv("RENDER_EXTERNAL_URL") or os.getenv("RENDER_SERVICE_ID"))


def inferred_api_public_url() -> str | None:
    """Public API origin when Render injects it and API_PUBLIC_URL is unset."""
    render_url = (os.getenv("RENDER_EXTERNAL_URL") or "").strip().rstrip("/")
    return render_url or None
