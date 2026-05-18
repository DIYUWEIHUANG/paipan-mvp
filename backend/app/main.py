from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dataset import router as dataset_router
from app.api.liuren import router as liuren_router
from app.api.liuyao import router as liuyao_router
from app.api.name_wuxing import router as name_wuxing_router
from app.settings import cors_allowed_origins

app = FastAPI(title="Paipan MVP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(liuyao_router)
app.include_router(liuren_router)
app.include_router(dataset_router)
app.include_router(name_wuxing_router)
