# backend/core/config.py
from pathlib import Path
from dotenv import load_dotenv
import os
import json


load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
CHROMA_DIR = BASE_DIR / "chroma_db"
CHAT_HISTORY_DIR = BASE_DIR / "chat_history"
METADATA_FILE = BASE_DIR / "docs_metadata.json"

for d in [UPLOAD_DIR, CHROMA_DIR, CHAT_HISTORY_DIR]:
    d.mkdir(exist_ok=True)

# Shared globals
docs_metadata: dict = {}
user_vectorstores: dict = {}

if METADATA_FILE.exists():
    with open(METADATA_FILE, 'r') as f:
        docs_metadata = json.load(f)
# LangChain setup
from langchain_community.embeddings import FakeEmbeddings
from langchain_groq import ChatGroq

embeddings = FakeEmbeddings(size=384)
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant",
    temperature=0.1,
    max_tokens=800
)