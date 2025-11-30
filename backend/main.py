# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Absolute imports only
from routers.auth import router as auth_router
from routers.upload import router as upload_router
from routers.ask import router as ask_router
from routers.docs import router as docs_router
from routers.chat_history import router as chat_history_router


app = FastAPI(title="Nixai AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(ask_router)
app.include_router(docs_router)
app.include_router(chat_history_router)  


@app.get("/")
def root():
    return {"status": "Nixai Backend — Modular & Running Perfectly"}