from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def record_payload() -> dict:
    return {
        "id": "record-1",
        "resultType": "da_liuren",
        "modeLabel": "大六壬",
        "createdAt": "2026-05-18T00:00:00.000Z",
        "title": "今晚几点睡觉好？",
        "result": {
            "type": "da_liuren",
            "milestone": 11,
            "input": {
                "questionText": "今晚几点睡觉好？",
                "questionCategory": "sleep_health",
                "asker_birth_time": "1990-01-01T00:00",
            },
            "nameProfile": {
                "name": "杨丙辰",
                "elements": {"木": 2, "火": 2, "土": 2, "金": 0, "水": 0},
                "dominantElements": ["木", "火", "土"],
            },
        },
    }


def feedback_payload(quality_tag: str = "valid") -> dict:
    return {
        "recordId": "record-1",
        "resultType": "da_liuren",
        "createdAt": "2026-05-18T00:00:00.000Z",
        "feedbackAt": "2026-05-18T02:00:00.000Z",
        "actualOutcome": "确实很晚才睡",
        "outcomeMatched": "matched",
        "timingMatched": "late",
        "qualityTag": quality_tag,
        "privacyLevel": "private_raw",
        "usefulParts": ["应期提醒"],
        "wrongParts": [],
        "userNote": "带有私有备注",
        "adminReviewNote": "人工确认有效",
        "originalResult": record_payload()["result"],
    }


def test_public_stats_is_anonymous_and_health_aliases(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'paipan.sqlite3'}")
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)

    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/api/health").json() == {"status": "ok"}
    client.post("/api/records", headers={"X-Admin-Token": "secret"}, json=record_payload())
    client.post("/api/feedbacks", headers={"X-Admin-Token": "secret"}, json=feedback_payload())

    response = client.get("/api/stats")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["byOutcomeMatched"]["matched"] == 1
    assert "今晚几点睡觉好" not in str(body)
    assert "带有私有备注" not in str(body)
    assert "originalResult" not in str(body)


def test_admin_token_guards_raw_endpoints(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'paipan.sqlite3'}")
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)

    assert client.post("/api/records", json=record_payload()).status_code == 401
    assert client.get("/api/admin/records").status_code == 401

    response = client.post("/api/records", headers={"X-Admin-Token": "secret"}, json=record_payload())
    assert response.status_code == 200
    response = client.get("/api/admin/records", headers={"X-Admin-Token": "secret"})
    assert response.status_code == 200
    assert response.json()[0]["questionText"] == "今晚几点睡觉好？"


def test_admin_exports_raw_and_anonymized(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'paipan.sqlite3'}")
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)
    headers = {"X-Admin-Token": "secret"}

    client.post("/api/records", headers=headers, json=record_payload())
    client.post("/api/feedbacks", headers=headers, json=feedback_payload())

    raw = client.get("/api/admin/export/private_raw", headers=headers).json()
    assert raw["records"][0]["questionText"] == "今晚几点睡觉好？"
    assert raw["feedbacks"][0]["userNote"] == "带有私有备注"

    anonymized = client.get("/api/admin/export/anonymized", headers=headers).json()
    assert anonymized["feedbacks"] == [
        {
            "resultType": "da_liuren",
            "questionCategory": "sleep_health",
            "outcomeMatched": "matched",
            "timingMatched": "late",
            "qualityTag": "valid",
            "ruleVersion": "da_liuren:milestone-11",
        }
    ]
    assert "今晚几点睡觉好" not in str(anonymized)
    assert "带有私有备注" not in str(anonymized)
    assert "杨丙辰" not in str(anonymized)


def test_public_stats_only_counts_valid_quality(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'paipan.sqlite3'}")
    monkeypatch.setenv("ADMIN_TOKEN", "secret")
    client = TestClient(app)
    headers = {"X-Admin-Token": "secret"}

    client.post("/api/records", headers=headers, json=record_payload())
    client.post("/api/feedbacks", headers=headers, json=feedback_payload("test"))
    assert client.get("/api/stats").json()["total"] == 0

    client.post("/api/feedbacks", headers=headers, json=feedback_payload("valid"))
    assert client.get("/api/stats").json()["total"] == 1
