from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.liuyao import calculate_manual_liuyao

router = APIRouter(prefix="/api/liuyao", tags=["liuyao"])


class ManualLiuYaoRequest(BaseModel):
    manual_lines: list[int] = Field(description="Six line values from bottom to top. Allowed values: 6, 7, 8, 9.")


@router.post("/manual")
def create_manual_liuyao(payload: ManualLiuYaoRequest) -> dict:
    try:
        return calculate_manual_liuyao(payload.manual_lines)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
