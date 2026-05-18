from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.api.dataset import require_admin_token
from app.core.name_wuxing import NameWuxingError, analyze_name_wuxing

router = APIRouter(tags=["name-wuxing"])


class NameWuxingPayload(BaseModel):
    name: str


@router.post("/api/admin/name-wuxing")
def admin_name_wuxing(payload: NameWuxingPayload, x_admin_token: str | None = Header(default=None, alias="X-Admin-Token")) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    try:
        return analyze_name_wuxing(payload.name)
    except NameWuxingError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
