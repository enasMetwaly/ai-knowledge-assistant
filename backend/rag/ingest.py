# backend/rag/ingest.py
import json
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma  # ← NEW, MODERN, NO DEPRECATION
from core.config import embeddings, CHROMA_DIR, METADATA_FILE


def ingest_document(filepath: str, user_id: str, original_name: str):
    try:
        # Load document
        loader = PyPDFLoader(filepath) if filepath.lower().endswith(".pdf") else TextLoader(filepath, encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = original_name

        # Split
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(docs)

        # Per-user Chroma DB (isolated folder)
        user_dir = CHROMA_DIR / user_id
        user_dir.mkdir(parents=True, exist_ok=True)

        # Create or load per-user vectorstore
        vectorstore = Chroma(
    persist_directory=str(user_dir),
    embedding_function=embeddings,
    collection_name=f"user_{user_id}"
)
        vectorstore.add_documents(chunks)  # Auto-persists, no need for .persist()

        # Update shared metadata (safe — has user_id)
        safe_key = f"{user_id}_{original_name.replace(' ', '_')}"
        metadata = {}
        if METADATA_FILE.exists():
            try:
                metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
            except:
                pass

        metadata[safe_key] = {
            "user_id": user_id,
            "original_name": original_name,
            "chunks": len(chunks),
            "embedding_count": vectorstore.get()['ids'].__len__()
        }
        METADATA_FILE.write_text(json.dumps(metadata, indent=2))

        print(f"Success: {original_name} processed for user {user_id} (isolated)")

    except Exception as e:
        print(f"Failed to process {original_name}: {e}")