from fastapi.testclient import TestClient

from app.main import app


def test_liuren_basic_endpoint():
    client = TestClient(app)
    response = client.post(
        "/api/liuren/basic",
        json={"question_time": "2026-05-17T10:30:00", "timezone": "Asia/Shanghai"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "da_liuren"
    assert body["milestone"] == 2
    assert set(body) >= {"four_pillars", "xunkong", "month_general", "tian_di_pan", "debug_trace"}


def test_liuren_basic_endpoint_rejects_bad_timezone():
    client = TestClient(app)
    response = client.post(
        "/api/liuren/basic",
        json={"question_time": "2026-05-17T10:30:00", "timezone": "Bad/Zone"},
    )
    assert response.status_code == 400


def test_liuren_v1_endpoint():
    client = TestClient(app)
    response = client.post(
        "/api/liuren/v1",
        json={"question_time": "2026-05-17T10:30:00", "timezone": "Asia/Shanghai"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "da_liuren"
    assert body["milestone"] == 3
    assert body["four_lessons"]["status"] == "computed"
    assert body["three_transmissions"]["status"] == "computed"
    assert set(body["three_transmissions"]) >= {"gate", "variant", "items"}
