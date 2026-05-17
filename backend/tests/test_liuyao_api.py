from fastapi.testclient import TestClient

from app.main import app


def test_manual_liuyao_endpoint():
    client = TestClient(app)
    response = client.post("/api/liuyao/manual", json={"manual_lines": [7, 8, 9, 6, 7, 8]})
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "liu_yao"
    assert body["milestone"] == 1
    assert body["moving_lines"] == [3, 4]
    assert set(body) >= {"base_hexagram", "changed_hexagram", "debug_trace"}


def test_manual_liuyao_endpoint_rejects_bad_lines():
    client = TestClient(app)
    response = client.post("/api/liuyao/manual", json={"manual_lines": [7, 8, 9]})
    assert response.status_code == 400
