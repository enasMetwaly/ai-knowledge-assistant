#  System Architecture

## Overview

 AI Knowledge Assistant is a full-stack RAG (Retrieval-Augmented Generation) system that enables users to upload documents and ask questions, receiving AI-generated answers with source citations.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                     http://localhost:3000                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      Next.js Frontend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  LoginPage   │  │  UploadTab   │  │   ChatTab    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              API Client (lib/api.ts)                  │       │
│  │  - Centralized HTTP calls                            │       │
│  │  - Token management                                  │       │
│  │  - Error handling                                    │       │
│  └──────────────────────────────────────────────────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ JWT Bearer Token
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     FastAPI Backend                              │
│                   http://localhost:8000                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │               Router Layer                          │         │
│  │  /auth  /upload  /ask  /documents  /chat-history  │         │
│  └──────────────────┬──────────────────────────────────┘         │
│                     │                                            │
│  ┌─────────────────▼──────────────────────────────────┐         │
│  │          Middleware & Dependencies                  │         │
│  │  - JWT Authentication (dependencies.py)            │         │
│  │  - CORS (allow localhost:3000)                     │         │
│  │  - Rate Limiting (10 req/min per IP)               │         │
│  └──────────────────┬──────────────────────────────────┘         │
│                     │                                            │
│  ┌─────────────────▼──────────────────────────────────┐         │
│  │            Business Logic Layer                     │         │
│  │  ┌──────────────┐         ┌──────────────┐         │         │
│  │  │ rag/ingest   │         │rag/retriever │         │         │
│  │  │ - PDF parse  │         │ - Similarity │         │         │
│  │  │ - Chunking   │         │   search     │         │         │
│  │  │ - Embedding  │         │ - LLM chain  │         │         │
│  │  └──────────────┘         └──────────────┘         │         │
│  └─────────────────┬──────────────────────────────────┘         │
└────────────────────┼────────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ChromaDB│  │ Groq   │  │ Files  │
    │Vector  │  │  LLM   │  │Storage │
    │  DB    │  │  API   │  │(local) │
    └────────┘  └────────┘  └────────┘
```

## Component Details

### 1. Frontend (Next.js 14)

**Technology:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture

**Structure:**
```
src/
├── app/
│   └── page.tsx           # Main application shell
├── components/
│   ├── LoginPage.tsx      # Authentication UI
│   ├── Header.tsx         # User info & logout
│   ├── UploadTab.tsx      # File upload interface
│   ├── ChatTab.tsx        # Q&A interface
│   └── DocsTab.tsx        # Document list
└── lib/
    ├── types.ts           # TypeScript interfaces
    └── api.ts             # API client
```


---

### 2. Backend (FastAPI)

**Technology:**
- FastAPI for async Python web framework
- JWT for authentication
- LangChain for RAG pipeline

**Structure:**
```
backend/
├── main.py                # Application entry point
├── dependencies.py        # Auth dependencies
├── limiter.py              #rate limiter
├── core/
│   └── config.py          # Configuration & globals
├── rag/
│   ├── ingest.py          # Document processing
│   └── retriever.py       # Question answering
├── routers/
│   ├── auth.py            # /auth/* endpoints
│   ├── upload.py          # /upload endpoint
│   ├── ask.py             # /ask endpoint
│   ├── docs.py            # /documents endpoint
│   └── chat_history.py    # /chat-history endpoint
└── tests/
    ├── test_retriever.py  # Unit tests for RAG
    └── test_routes.py     # Integration tests
```

**Router Responsibilities:**

| Router | Endpoints | Purpose |
|--------|-----------|---------|
| `auth.py` | `POST /auth/login`, `GET /auth/me` | User authentication |
| `upload.py` | `POST /upload` | File upload with background processing |
| `ask.py` | `POST /ask` | Question answering with retry logic |
| `docs.py` | `GET /documents` | List user's documents |
| `chat_history.py` | `GET /chat-history` | Retrieve chat history |

---

### 3. RAG Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    Document Ingestion                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌────────┐         ┌──────────┐        ┌──────────┐
   │  PDF   │         │   TXT    │        │  Future  │
   │ Loader │         │  Loader  │        │  Format  │
   └────┬───┘         └────┬─────┘        └──────────┘
        │                  │
        └──────────┬───────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Text Splitter  │
          │  (500 chars)    │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Embeddings    │
          │ (FakeEmbeddings)│
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    ChromaDB     │
          │ (per-user store)│
          └─────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Question Answering                    │
└─────────────────────────────────────────────────────────┘
                            │
                User Question (optional @filename filter)
                            │
                            ▼
                   ┌─────────────────┐
                   │ Vector Search   │
                   │  (k=4 chunks)   │
                   └────────┬────────┘
                            │
                   Retrieved Documents
                            │
                            ▼
                   ┌─────────────────┐
                   │  Groq LLM API   │
                   │ (Llama 3.1-8b)  │
                   └────────┬────────┘
                            │
                    Generated Answer
                            │
                            ▼
                   ┌─────────────────┐
                   │ Response + Srcs │
                   └─────────────────┘
```

---

### 4. Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Browser │                                    │ Backend │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /auth/login                           │
     │  { username, password }                     │
     ├────────────────────────────────────────────►│
     │                                              │
     │                                     ┌────────▼────────┐
     │                                     │ Verify Password │
     │                                     │   (bcrypt)      │
     │                                     └────────┬────────┘
     │                                              │
     │                                     ┌────────▼────────┐
     │                                     │  Create JWT     │
     │                                     │ (12h expiry)    │
     │                                     └────────┬────────┘
     │                                              │
     │  { access_token, user }                     │
     │◄────────────────────────────────────────────┤
     │                                              │
┌────▼────┐                                         │
│Store in │                                         │
│localStorage                                       │
└────┬────┘                                         │
     │                                              │
     │  POST /ask                                   │
     │  Authorization: Bearer <token>              │
     ├────────────────────────────────────────────►│
     │                                              │
     │                                     ┌────────▼────────┐
     │                                     │  Decode JWT     │
     │                                     │ Extract user_id │
     │                                     └────────┬────────┘
     │                                              │
     │                                     ┌────────▼────────┐
     │                                     │ Process Request │
     │                                     │ (user-scoped)   │
     │                                     └────────┬────────┘
     │                                              │
     │  { answer, sources }                        │
     │◄────────────────────────────────────────────┤
     │                                              │
```

---

### 5. Data Storage

**User Data Isolation:**
```
chroma_db/
├── user_1/                    # User 1's vector store
│   └── collection_user_1/
├── user_2/                    # User 2's vector store
│   └── collection_user_2/
└── ...

chat_history/
├── user_1.json                # User 1's chat history
├── user_2.json                # User 2's chat history
└── ...

uploads/
├── user_1_document.pdf        # Prefixed with user_id
├── user_2_report.txt
└── ...

docs_metadata.json             # Shared metadata (user_id indexed)
{
  "user_1_document.pdf": {
    "user_id": "user_1",
    "original_name": "document.pdf",
    "chunks": 10,
    "embedding_count": 10
  }
}
```

---

### 6. Key Design 

#### Background Processing
```python
@router.post("/upload")
async def upload(background_tasks: BackgroundTasks, file: UploadFile):
    # 1. Save file immediately
    save_file(file)
    
    # 2. Return success to user
    # 3. Process in background (doesn't block)
    background_tasks.add_task(ingest_document, file)
    
    return {"message": "Uploaded! Processing..."}
```

#### Retry Logic with Exponential Backoff
```python
@retry(stop=stop_after_attempt(3), 
       wait=wait_exponential(multiplier=1, max=10))
def query_with_retry(user_id, question):
    # Auto-retries on failure:
    # Attempt 1: immediate
    # Attempt 2: after 2s
    # Attempt 3: after 4s
    return qa_chain.invoke({"query": question})
```

#### User Isolation
```python
# Each user gets their own vectorstore
user_dir = CHROMA_DIR / user_id
vectorstore = Chroma(
    persist_directory=str(user_dir),
    collection_name=f"user_{user_id}"
)
```

---

### 7. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
└─────────────────────────────────────────────────────────┘

Layer 1: CORS
├── Only allow http://localhost:3000
└── Reject all other origins

Layer 2: Rate Limiting
├── 10 requests/minute per IP
└── SlowAPI middleware

Layer 3: JWT Authentication
├── All routes (except /auth/login) require valid token
├── Tokens expire after 12 hours
└── User context extracted from token

Layer 4: User Isolation
├── Documents filtered by user_id
├── Separate vectorstores per user
└── Private chat history per user

Layer 5: Input Validation
├── Pydantic models for request validation
├── File type restrictions (.pdf, .txt)
└── Sanitized file names
```

---

### 8. Testing Architecture

```
tests/
├── test_retriever.py
│   ├── test_retriever_returns_relevant_answer()
│   ├── test_filename_filtering_works()
│   └── test_no_documents_case()
│
└── test_routes.py
    ├── test_root()
    ├── test_login_success()
    ├── test_docs_requires_auth()
    ├── test_ask_with_auth()
    ├── test_upload_creates_metadata()
    ├── test_ask_with_filename_filter_via_route()
    └── test_upload_requires_auth()
```

**Test Coverage:**
- ✅ RAG retrieval logic
- ✅ @filename filtering
- ✅ Authentication flows
- ✅ API endpoints
- ✅ Background processing
- ✅ Error cases

---


## Technology Choices Rationale

| Technology | Why Chosen |
|-----------|------------|
| **FastAPI** | Async support, auto API docs, type safety |
| **Next.js** | SSR support, great DX, built-in optimization |
| **Groq** | Fastest LLM inference (400+ tokens/sec) |
| **ChromaDB** | Lightweight, embedded, perfect for demo |
| **LangChain** | RAG framework, easy LLM integration |
| **JWT** | Stateless auth, scalable |
---

