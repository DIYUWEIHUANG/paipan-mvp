from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.name_wuxing import NameWuxingError, parse_stepfun_response
from app.main import app


def test_stepfun_parser_ignores_thinking_and_extracts_json_code_block():
    parsed = parse_stepfun_response(
        {
            "stop_reason": "end_turn",
            "content": [
                {"type": "thinking", "text": "private reasoning should be ignored"},
                {
                    "type": "text",
                    "text": '```json\n{"name":"杨丙辰","elements":["木","火","土"],"characters":[{"char":"杨","element":"木"},{"char":"丙","element":"火"},{"char":"辰","element":"土"}]}\n```',
                },
            ],
        }
    )

    assert parsed == {
        "name": "杨丙辰",
        "elements": ["木", "火", "土"],
        "characters": [
            {"char": "杨", "element": "木"},
            {"char": "丙", "element": "火"},
            {"char": "辰", "element": "土"},
        ],
    }


def test_stepfun_parser_reports_max_tokens_without_raw_content():
    with pytest.raises(NameWuxingError) as exc:
        parse_stepfun_response({"stop_reason": "max_tokens", "content": [{"type": "thinking", "text": "hidden"}]})

    assert "max_tokens" in str(exc.value)
    assert "hidden" not in str(exc.value)


def test_admin_name_wuxing_endpoint_requires_token(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)

    assert client.post("/api/admin/name-wuxing", json={"name": "杨丙辰"}).status_code == 401


def test_admin_name_wuxing_endpoint_returns_public_shape(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    monkeypatch.setattr(
        "app.api.name_wuxing.analyze_name_wuxing",
        lambda name: {
            "name": name,
            "elements": ["木", "火", "土"],
            "characters": [
                {"char": "杨", "element": "木"},
                {"char": "丙", "element": "火"},
                {"char": "辰", "element": "土"},
            ],
        },
    )
    client = TestClient(app)

    response = client.post("/api/admin/name-wuxing", headers={"X-Admin-Token": "secret"}, json={"name": "杨丙辰"})

    assert response.status_code == 200
    assert response.json()["characters"][0] == {"char": "杨", "element": "木"}
