# backend/rag/ingest.py
import json   # ← ADD THIS LINE AT THE TOP
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from core.config import embeddings, user_vectorstores, docs_metadata, METADATA_FILE, CHROMA_DIR

def ingest_document(filepath: str, user_id: str, original_name: str):
    try:
        loader = PyPDFLoader(filepath) if filepath.endswith(".pdf") else TextLoader(filepath, encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = original_name

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(docs)

        user_dir = CHROMA_DIR / user_id
        user_dir.mkdir(exist_ok=True)

        if user_id not in user_vectorstores:
            user_vectorstores[user_id] = Chroma.from_documents(
                chunks, embeddings, persist_directory=str(user_dir)
            )
        else:
            user_vectorstores[user_id].add_documents(chunks)

        safe_filename = f"{user_id}_{original_name.replace(' ', '_')}"
        docs_metadata[safe_filename] = {
            "user_id": user_id,
            "original_name": original_name,
            "chunks": len(chunks),
            "embedding_count": len(chunks)
        }
        METADATA_FILE.write_text(json.dumps(docs_metadata))
        print(f"Success: {original_name} processed")
    except Exception as e:
        print(f"Failed: {original_name} -> {e}")