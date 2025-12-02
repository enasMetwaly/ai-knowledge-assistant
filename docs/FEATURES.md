# Features Documentation

## Core Features

### 1. JWT Authentication 
- Secure token-based authentication
- 12-hour token expiry
- Password hashing with bcrypt

### 2. Document Upload 
- PDF and TXT support
- Background processing
- Per-user isolation

### 3. AI Question Answering 
- Powered by Groq's Llama 3.1
- Source citations
- Context-aware responses

### 4. Chat History 
- Persistent storage
- Per-user history
- Last 50 messages kept

### 5. Advanced Search 
**@filename syntax:**
@rusume.pdf What is the name?
Searches only within specified file.

### 6. Background Processing 
- Instant upload response
- Non-blocking file processing
- User can continue working

### 7. Retry Logic 
- Automatic retry on failures
- Exponential backoff (2s, 4s, 8s)
- 3 attempts before failure

### 8. Rate Limiting 
- 10 requests/minute per IP
- Prevents abuse
- Returns 429 when exceeded

### 9. Source Viewer 
- Click to expand sources
- See exact text chunks
- File name attribution

### 10. User Isolation 
- Separate vector stores
- Private documents
- Isolated chat history

## Other Features

-  Unit tests (pytest)
-  Docker support
-  API documentation (Swagger)
