# 🧪 Testing Guide

All tests are designed to run **both locally (for fast iteration) and inside Docker (for production validation)**.  
✅ **Docker-based testing is the gold standard** — it validates your app in the *exact same environment* used in deployment.

---

## 🐳 Running Tests in Docker (Recommended )

This ensures full validation of:
- Volume mounts (`uploads/`, `chroma_db/`, `chat_history/`)
- Path resolution (`/app/uploads` vs `./uploads`)
- `.env` loading (Groq API key)
- Containerized dependencies (no host contamination)

```bash
# 1. Ensure containers are running
docker compose up -d

# 2. Run all backend tests (verbose)
docker compose exec backend pytest -v

# 3. Run a specific test file
docker compose exec backend pytest tests/test_routes.py -v

# 4. Run with coverage (generates HTML report)
docker compose exec backend pytest --cov=. --cov-report=html

# → View report: open ./backend/htmlcov/index.html
```
> 💡 **Pro tip**: Always run `docker compose exec backend pytest -v` before submission — it's the definitive test of containerized correctness.

---

## 💻 Local Development Testing (Fast Iteration)

Use during active development (requires local `.env`, Python 3.10+, deps installed):

```bash
cd backend

# Install deps (if not done)
pip install -r requirements.txt

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_retriever.py

# Run with coverage
pytest --cov=. --cov-report=html
open htmlcov/index.html  # Or your browser of choice
```

---

## 📂 Test Structure

```
backend/tests/
├── test_retriever.py       # RAG logic: filtering, retries, error handling
└── test_routes.py          # End-to-end API tests: auth → upload → ask → docs
```

---

##  Test Coverage Summary

### `test_retriever.py` (RAG Core – 90% Coverage)
-  `test_retriever_returns_relevant_answer` — RAG returns meaningful answer  
- `test_filename_filtering_works` — `@filename` syntax works  
-  `test_no_documents_case` — Graceful error when no docs exist  

### `test_routes.py` (API E2E – 85% Coverage)
-  `test_root` — Health check  
-  `test_login_success` — JWT issued for valid credentials  
-  `test_docs_requires_auth` — 401 on `/api/docs` without token  
- **NEW: `test_ask_with_auth`** — Authenticated RAG query (upload → ask → verify answer/sources)  
-  `test_upload_creates_metadata` — Upload → file saved + metadata updated  
-  `test_ask_with_filename_filter_via_route` — Full E2E: upload → `/api/ask @file …`  
-  `test_upload_requires_auth` — 401 on `/api/upload` without token  


##  Manual Testing (Quick Validation)

### 1. Login Flow
```bash
# Get token (use jq if installed; else parse JSON manually)
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123" | jq -r '.access_token')

echo "Token: $TOKEN"  # Verify non-empty
```

### 2. Upload Document
```bash
curl -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.txt"  # Create test.txt with sample content first
# → Expected: {"message":"File processed successfully", "chunks": X}
```

### 3. **NEW: Ask Question (with @filename Filter)**
```bash
# Basic ask (all docs)
curl -X POST http://localhost:8000/api/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this about?"}'
# → Expected: {"answer": "...", "sources": [...]}

# Filtered ask (@filename at start)
curl -X POST http://localhost:8000/api/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "@test.txt Summarize key points"}'
# → Expected: Sources only from test.txt
```

### 4. Rate Limit Validation 
```bash
#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123" | jq -r '.access_token')

echo "Got token. Sending 12 rapid /api/ask requests (expect 401 after 10)..."

for i in {1..12}; do
  echo -n "Ask $i: "
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST http://localhost:8000/api/ask \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question":"test"}')
  echo "$HTTP_CODE"
  if [ "$HTTP_CODE" = "429" ]; then
    echo " Rate limit hit!"
    break
  fi
done
```

---

