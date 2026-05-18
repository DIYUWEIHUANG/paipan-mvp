from __future__ import annotations

import os
from pathlib import Path


def admin_token() -> str:
    return os.getenv("ADMIN_TOKEN") or os.getenv("API_SECRET_KEY") or ""


def database_path() -> Path:
    database_url = os.getenv("DATABASE_URL", "sqlite:///paipan.sqlite3")
    if not database_url.startswith("sqlite:///"):
        raise ValueError("Milestone 11 MVP only supports sqlite:/// DATABASE_URL values.")

    raw_path = database_url.removeprefix("sqlite:///")
    path = Path(raw_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def cors_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://diyuweihuang.github.io",
    ]
