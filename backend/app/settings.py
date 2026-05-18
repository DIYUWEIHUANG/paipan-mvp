from __future__ import annotations

import os
from pathlib import Path


def _env_file_paths() -> list[Path]:
    return [
        Path.cwd() / ".env",
        Path(__file__).resolve().parents[1] / ".env",
    ]


def _env_file_value(name: str) -> str:
    for path in _env_file_paths():
        if not path.exists():
            continue
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key, value = stripped.split("=", 1)
                if key.strip() == name:
                    return value.strip().strip('"').strip("'")
        except OSError:
            continue
    return ""


def env_value(name: str, default: str = "") -> str:
    return os.getenv(name) or _env_file_value(name) or default


def admin_token() -> str:
    return env_value("ADMIN_TOKEN") or env_value("API_SECRET_KEY")


def stepfun_base_url() -> str:
    return env_value("STEPFUN_BASE_URL")


def stepfun_auth_token() -> str:
    return env_value("STEPFUN_AUTH_TOKEN")


def database_path() -> Path:
    database_url = env_value("DATABASE_URL", "sqlite:///paipan.sqlite3")
    if not database_url.startswith("sqlite:///"):
        raise ValueError("Milestone 11 MVP only supports sqlite:/// DATABASE_URL values.")

    raw_path = database_url.removeprefix("sqlite:///")
    path = Path(raw_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def cors_allowed_origins() -> list[str]:
    raw = env_value("CORS_ALLOWED_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://diyuweihuang.github.io",
    ]
