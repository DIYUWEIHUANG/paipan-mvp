from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from app.api.dataset import require_admin_token
from app.core.interpret_enhancer import InterpretEnhancerError, enhance_interpretation

router = APIRouter(tags=["interpret"])


class InterpretEnhancePayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    resultType: Literal["da_liuren", "xiao_liuren", "liu_yao"]
    questionText: str = ""
    questionCategory: str = "general"
    rawResult: dict[str, Any]
    ruleInterpretation: dict[str, Any] = {}
    nameWuxingProfile: dict[str, Any] | None = None
    personalizedInfluence: dict[str, Any] | None = None
    feedbackHistory: list[dict[str, Any]] | None = None


@router.post("/api/admin/interpret/enhance")
def admin_interpret_enhance(
    payload: InterpretEnhancePayload,
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> dict[str, Any]:
    require_admin_token(x_admin_token)
    try:
        return enhance_interpretation(payload.model_dump(mode="json"))
    except InterpretEnhancerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
