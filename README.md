# 🧠  AI Knowledge Assistant

A full-stack AI-powered knowledge base system built with FastAPI, Next.js, and Groq LLM. Upload documents, ask questions, and get AI-generated answers with source citations.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/Groq-LLM-purple)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)


## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- OR: Python 3.10+, Node.js 18+, and Groq API key

### Option 1: Docker (Recommended)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd ai-knowledge-assistant

# 2. Create .env file
cat > backend/.env << EOF
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_BACKEND_URL=http://backend:8000
EOF

# 3. Start everything
docker compose up --build

# Stop containers (keep images)
docker compose down

# Rebuild from scratch if needed
docker compose down && docker compose up --build

# Remove all images and rebuild fresh (cleanup everything)
docker compose down --rmi all && docker compose up --build

# 4. Access the app
Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

echo NEXT_PUBLIC_BACKEND_URL=http://backend:8000 > .env

# Run server
uvicorn main:app --reload

# Backend runs at http://localhost:8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Frontend runs at http://localhost:3000
```


## 📖 Usage

### 1. **Login**
Use demo accounts:
- `user@example.com` / `password123`
- `admin@nixai.com` / `admin123`

### 2. **Upload Documents**
- Click "Upload" tab
- Select PDF or TXT file
- File processes in background

### 3. **Ask Questions**
- Go to "Chat" tab
- Type your question
- Get AI-powered answers with sources

### 4. **Advanced Search**
Use `@filename` to search specific documents:
```
@report.pdf What were the Q3 results?
```


### Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- LangChain - LLM orchestration
- ChromaDB - Vector database
- Groq - LLM API (Llama 3.1)
- JWT - Authentication
- Tenacity - Retry logic
- SlowAPI - Rate limiting

**Frontend:**
- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Component-based architecture

## 📁 Project Structure

```
ai-knowledge-assistant/
├── backend/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py              # App configuration
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── ingest.py              # Document processing
│   │   └── retriever.py           # RAG query logic
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                # Login endpoints
│   │   ├── upload.py              # File upload
│   │   ├── ask.py                 # Q&A endpoint
│   │   ├── docs.py                # Document list
│   │   └── chat_history.py        # Chat history
│   ├── tests/
│   │   ├── test_retriever.py      # RAG tests
│   │   └── test_routes.py         # API tests
│   ├── main.py                    # FastAPI app
│   ├── dependencies.py            # Auth dependencies
│   └── requirements.txt

│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx           # Main page
│   │   ├── components/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── UploadTab.tsx
│   │   │   ├── ChatTab.tsx
│   │   │   └── DocsTab.tsx
│   │   └── lib/
│   │       ├── types.ts           # TypeScript types
│   │       └── api.ts             # API client
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_jwt_secret_key  # Optional, has default
```

### Get Groq API Key

1. Go to https://console.groq.com
2. Sign up for free account
3. Navigate to API Keys
4. Create new key
5. Copy to `.env` file

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | User login |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/upload` | Upload document |
| `GET` | `/documents` | List user's documents |
| `POST` | `/ask` | Ask question |
| `GET` | `/chat-history` | Get chat history |

Full API documentation(swagger ui): http://localhost:8000/docs

## Security Features

- **JWT Authentication** - Token-based auth with 12-hour expiry
- **Password Hashing** - bcrypt with salt
- **User Isolation** - Separate vectorstores per user
- **Rate Limiting** - 10 requests/minute
- **CORS Protection** - Restricted origins

## 🐛 Troubleshooting

### "Connection refused" error
```bash
# Check if backend is running
curl http://localhost:8000

# Restart docker
docker-compose restart
```


### Frontend can't connect
```bash
# Verify API URL in browser console
Should be http://localhost:8000

# Check CORS settings in main.py
```

## 📊 Testing Strategy

**Unit Tests:**
- RAG retrieval logic
- @filename filtering
- Authentication flows

**Integration Tests:**
- API endpoint responses
- File upload pipeline
- Chat history persistence

## 🧪 Testing
```bash

cd backend
#via docker
# 1. Ensure containers are running
docker compose up -d

# 2. Run all backend tests (verbose)
docker compose exec backend pytest -v
# Manual
pytest -v
```
## ✨ Features

- **🔐 JWT Authentication** - Secure user login with token-based auth
- **📁 Document Upload** - Support for PDF and TXT files
- **🤖 AI Q&A** - Powered by Groq's Llama 3.1 model
- **💬 Chat History** - Persistent conversation storage per user
- **📚 Source Citations** - View exact document chunks used for answers
- **🔍 @filename Search** - Target specific documents with `@filename` syntax
- **🔄 Background Processing** - Async file processing for instant uploads
- **♻️ Retry Logic** - Automatic retry with exponential backoff
- **🔒 User Isolation** - Each user has private documents and chat history
- **⚡ Rate Limiting** - 10 requests/minute protection
- **🧪 Unit Tests** - Comprehensive test coverage


## Demo Video URL  
[[[[[https://drive.google.com/file/d/1YMipXSrqp7rhATt1YIQQ6_EVl9biFrJw/view?usp=sharing](https://drive.google.com/drive/u/0/folders/1MgeyoFHQqsoaQj9Piz5iQb-E5ux2Uz3_)
](https://drive.google.com/drive/u/0/home)
](https://drive.google.com/drive/u/0/folders/1MgeyoFHQqsoaQj9Piz5iQb-E5ux2Uz3_)
](https://drive.google.com/drive/u/0/folders/1MgeyoFHQqsoaQj9Piz5iQb-E5ux2Uz3_)
](https://drive.google.com/drive/u/0/folders/1MgeyoFHQqsoaQj9Piz5iQb-E5ux2Uz3_)
