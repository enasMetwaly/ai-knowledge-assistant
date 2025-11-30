# backend/core/config.py — FINAL LIGHTNING FAST VERSION
from pathlib import Path
from dotenv import load_dotenv
import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"  # ← ONE LINE FIXES ALL TELEMETRY ERRORS
import json

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
CHROMA_DIR = BASE_DIR / "chroma_db"
CHAT_HISTORY_DIR = BASE_DIR / "chat_history"
METADATA_FILE = BASE_DIR / "docs_metadata.json"

for d in [UPLOAD_DIR, CHROMA_DIR, CHAT_HISTORY_DIR]:
    d.mkdir(exist_ok=True)

if not METADATA_FILE.exists():
    METADATA_FILE.write_text("{}")

# ULTRA FAST — NO DOWNLOADS — PERFECT FOR DEMO
from langchain_community.embeddings import FakeEmbeddings
from langchain_groq import ChatGroq

embeddings = FakeEmbeddings(size=384)  # Instant, 0 MB download

llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant",
    temperature=0.1,
    max_tokens=800
)