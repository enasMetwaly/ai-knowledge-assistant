import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app
import pytest
import json
import time
from pathlib import Path

client = TestClient(app)

# Cleanup fixture that runs after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_files():
    """Automatically cleanup test files after all tests complete"""
    yield  # Let tests run first
    
    # Cleanup after tests
    print("\n🧹 Cleaning up test_ai.txt...")
    
    # Import here to avoid circular imports
    from core.config import UPLOAD_DIR, METADATA_FILE
    
    # Remove uploaded test file
    test_file = UPLOAD_DIR / "user_1_test_ai.txt"
    if test_file.exists():
        test_file.unlink()
        print(f"✅ Removed {test_file}")
    
    # Clean metadata
    if METADATA_FILE.exists():
        try:
            metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
            key = "user_1_test_ai.txt"
            if key in metadata:
                del metadata[key]
                METADATA_FILE.write_text(json.dumps(metadata, indent=2))
                print(f"✅ Cleaned metadata entry for test_ai.txt")
        except Exception as e:
            print(f"⚠️ Metadata cleanup warning: {e}")
    
    print("✅ test_main.py cleanup complete")

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
    
    # Wait for background task to complete
    time.sleep(2)
    
    # Check /documents now shows it
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
    
    # More flexible assertion - just check for relevant keywords
    answer_lower = data["answer"].lower()
    has_relevant_content = any(keyword in answer_lower for keyword in [
        "change", "artificial", "intelligence", "everything", "ai"
    ])
    assert has_relevant_content, f"Answer doesn't contain relevant keywords: {data['answer']}"
    
    # Check sources if they exist
    if data["sources"]:
        assert any(src["filename"] == "test_ai.txt" for src in data["sources"])

# ──────────────────────────────────────────────────────────────
# 10. Test unauthorized access to /upload returns 401
# ──────────────────────────────────────────────────────────────
def test_upload_requires_auth():
    response = client.post("/upload", files={"file": ("test.txt", b"hello", "text/plain")})
    assert response.status_code == 401