from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.liuren import calculate_liuren_basic, calculate_liuren_v1

router = APIRouter(prefix="/api/liuren", tags=["liuren"])


class LiurenBasicRequest(BaseModel):
    question_time: str
    timezone: str = "Asia/Shanghai"


@router.post("/basic")
def create_liuren_basic(payload: LiurenBasicRequest) -> dict:
    try:
        return calculate_liuren_basic(payload.question_time, payload.timezone)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/v1")
def create_liuren_v1(payload: LiurenBasicRequest) -> dict:
    try:
        return calculate_liuren_v1(payload.question_time, payload.timezone)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
