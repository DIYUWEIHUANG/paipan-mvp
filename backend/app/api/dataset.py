from __future__ import annotations

import secrets
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from app import storage
from app.settings import admin_token

router = APIRouter(tags=["dataset"])


class RawPayload(BaseModel):
    model_config = ConfigDict(extra="allow")


def require_admin_token(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> None:
    expected = admin_token()
    if not expected:
        raise HTTPException(status_code=503, detail="Admin token is not configured.")
    if not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(status_code=401, detail="Invalid admin token.")


@router.get("/health")
def public_health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/api/stats")
def public_stats() -> dict[str, Any]:
    return storage.stats()


@router.post("/api/records")
def create_record(payload: RawPayload, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    try:
        return storage.save_record(payload.model_dump(mode="json"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/admin/records")
def admin_records(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> list[dict[str, Any]]:
    require_admin_token(x_admin_token)
    return storage.get_records()


@router.get("/api/admin/records/{record_id}")
def admin_record(record_id: str, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    record = storage.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    return record


@router.post("/api/feedbacks")
def create_feedback(payload: RawPayload, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    try:
        return storage.save_feedback(payload.model_dump(mode="json"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/admin/feedbacks")
def admin_feedbacks(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> list[dict[str, Any]]:
    require_admin_token(x_admin_token)
    return storage.get_feedbacks()


@router.get("/api/admin/export/private_raw")
def admin_export_private_raw(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    return storage.private_raw_export()


@router.get("/api/admin/export/anonymized")
def admin_export_anonymized(x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    return storage.anonymized_export()
