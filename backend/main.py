# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.auth import router as auth_router
from routers.upload import router as upload_router
from routers.ask import router as ask_router
from routers.docs import router as docs_router
from routers.chat_history import router as chat_history_router


# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse
from limiter import limiter
app = FastAPI(
    title="Nixai AI Assistant",
    description="A secure, per-user RAG system with Groq LLM, background processing, rate limiting, and full user isolation.",
)

# Limiter setup
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)  # ← THIS IS THE KEY
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded: 10 requests per minute"}
    )
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(ask_router)
app.include_router(docs_router)
app.include_router(chat_history_router)

@app.get("/")
def root():
    return {"status": "Nixai Backend — Modular & Running Perfectly"}

