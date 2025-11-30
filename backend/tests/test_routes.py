import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "Modular" in r.json()["status"]

def test_login_success():
    r = client.post("/auth/login", data={"username": "user@example.com", "password": "password123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_docs_requires_auth():
    r = client.get("/documents")
    assert r.status_code == 401

def test_ask_with_auth():
    login = client.post("/auth/login", data={"username": "user@example.com", "password": "password123"})
    token = login.json()["access_token"]
    r = client.post("/ask", json={"question": "hello"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200




    # ──────────────────────────────────────────────────────────────
# 8. Test file upload actually creates metadata
# ──────────────────────────────────────────────────────────────
def test_upload_creates_metadata():
    # Login
    login = client.post("/auth/login", data={"username": "user@example.com", "password": "password123"})
    token = login.json()["access_token"]

    # Upload a tiny test file
    test_content = b"Artificial intelligence will change everything."
    response = client.post(
        "/upload",
        files={"file": ("test_ai.txt", test_content, "text/plain")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    # Check /documents now shows it (after background task – give it a sec)
    # We just verify the endpoint returns 200 and has at least one doc
    docs_resp = client.get("/documents", headers={"Authorization": f"Bearer {token}"})
    assert docs_resp.status_code == 200
    docs = docs_resp.json()["docs"]
    assert len(docs) >= 1
    assert any(doc["name"] == "test_ai.txt" for doc in docs)


# ──────────────────────────────────────────────────────────────
# 9. Test @filename filtering from real route
# ──────────────────────────────────────────────────────────────
def test_ask_with_filename_filter_via_route():
    login = client.post("/auth/login", data={"username": "user@example.com", "password": "password123"})
    token = login.json()["access_token"]

    # Make sure we have the test file from previous test
    response = client.post(
        "/ask",
        json={"question": "@test_ai.txt What will AI change?"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "change everything" in data["answer"].lower() or "artificial intelligence" in data["answer"].lower()
    assert any(src["filename"] == "test_ai.txt" for src in data["sources"])


# ──────────────────────────────────────────────────────────────
# 10. Test unauthorized access to /upload returns 401
# ──────────────────────────────────────────────────────────────
def test_upload_requires_auth():
    response = client.post("/upload", files={"file": ("test.txt", b"hello", "text/plain")})
    assert response.status_code == 401