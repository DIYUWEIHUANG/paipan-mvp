from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.interpret_enhancer import enhance_interpretation, parse_stepfun_interpretation_response
from app.main import app


def sample_payload() -> dict:
    return {
        "resultType": "liu_yao",
        "questionText": "要不要推进？",
        "questionCategory": "decision",
        "rawResult": {"type": "liu_yao", "milestone": 12},
        "ruleInterpretation": {"timing": {"timing_scale": "short_term"}},
        "nameWuxingProfile": {"name": "杨丙辰"},
        "personalizedInfluence": {"summary": "补益扶助偏强"},
    }


def test_llm_parser_ignores_thinking_and_extracts_json_code_block():
    parsed = parse_stepfun_interpretation_response(
        {
            "stop_reason": "end_turn",
            "content": [
                {"type": "thinking", "text": "hidden chain"},
                {
                    "type": "text",
                    "text": """```json
{"summary":"倾向可以推进","keySignals":["资源提示"],"riskSignals":["沟通摩擦"],"timingAdvice":"候选窗口为1-3日","actionAdvice":"适合小步验证","avoidAction":"不宜重押","confidence":"medium"}
```""",
                },
            ],
        }
    )

    assert parsed["summary"] == "倾向可以推进"
    assert parsed["keySignals"] == ["资源提示"]
    assert "hidden" not in str(parsed)


def test_llm_parser_sanitizes_absolute_language():
    parsed = parse_stepfun_interpretation_response(
        {
            "stop_reason": "end_turn",
            "content": [
                {
                    "type": "text",
                    "text": '{"summary":"一定会好","keySignals":["必然出现"],"riskSignals":[],"timingAdvice":"注定明天","actionAdvice":"一定推进","avoidAction":"不要拖延","confidence":"high"}',
                }
            ],
        }
    )

    assert "一定" not in str(parsed)
    assert "必然" not in str(parsed)
    assert "注定" not in str(parsed)


def test_enhance_interpretation_uses_large_max_tokens(monkeypatch):
    captured: dict = {}

    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "stop_reason": "end_turn",
                "content": [
                    {
                        "type": "text",
                        "text": '{"summary":"倾向平衡","keySignals":[],"riskSignals":[],"timingAdvice":"候选窗口","actionAdvice":"适合观察","avoidAction":"不宜重押","confidence":"medium"}',
                    }
                ],
            }

    def fake_post(url: str, headers: dict, json: dict, timeout: int) -> Response:
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setenv("STEPFUN_BASE_URL", "https://stepfun.example")
    monkeypatch.setenv("STEPFUN_AUTH_TOKEN", "token")
    monkeypatch.setattr("app.core.interpret_enhancer.httpx.post", fake_post)

    result = enhance_interpretation(sample_payload())

    assert result["summary"] == "倾向平衡"
    assert captured["json"]["max_tokens"] == 1_000_000
    assert captured["json"]["model"] == "step-router-v1"


def test_admin_interpret_endpoint_requires_token(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)

    assert client.post("/api/admin/interpret/enhance", json=sample_payload()).status_code == 401


def test_admin_interpret_endpoint_returns_shape(monkeypatch):
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    monkeypatch.setattr(
        "app.api.interpret.enhance_interpretation",
        lambda payload: {
            "summary": "倾向平衡",
            "keySignals": ["同气"],
            "riskSignals": [],
            "timingAdvice": "候选窗口为1-3日",
            "actionAdvice": "适合观察",
            "avoidAction": "不宜重押",
            "confidence": "medium",
        },
    )
    client = TestClient(app)

    response = client.post("/api/admin/interpret/enhance", headers={"X-Admin-Token": "secret"}, json=sample_payload())

    assert response.status_code == 200
    assert response.json()["confidence"] == "medium"
