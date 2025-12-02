# API Documentation

## Base URL
http://localhost:8000

## OpenAPI
Interactive docs at /docs (Swagger) and /redoc
Raw spec: /openapi.json  

## Authentication

All endpoints (except `/auth/login`) require a JWT token:
```bash
Authorization: Bearer <your_token>
```

## Endpoints

### POST /auth/login
Login and get access token.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "email": "user@example.com",
    "name": "Demo User",
    "user_id": "user_1"
  }
}
```

### POST /upload
Upload a document (PDF or TXT).

**Request:**
- Form data with file

**Response:**
```json
{
  "message": "Uploaded! Processing...",
  "filename": "document.pdf"
}
```

### GET /documents
List user's uploaded documents.

**Response:**
```json
{
  "docs": [
    {
      "name": "document.pdf",
      "chunks": 15,
      "embedding_count": 15
    }
  ]
}
```

### POST /ask
Ask a question about documents.

**Request:**
```json
{
  "question": "What is AI?"
}
```

**Response:**
```json
{
  "answer": "AI is artificial intelligence...",
  "sources": [
    {
      "content": "Artificial intelligence refers to...",
      "filename": "ai-basics.pdf"
    }
  ]
}
```

### GET /chat-history
Get chat history for current user.

**Response:**
```json
{
  "history": [
    {
      "question": "What is AI?",
      "answer": "AI is...",
      "sources": [...],
      "timestamp": "2024-11-30T12:00:00Z"
    }
  ]
}
```

## Rate Limits For Ask End Point

- 10 requests per minute per IP address
- Returns 429 Too Many Requests if exceeded

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |