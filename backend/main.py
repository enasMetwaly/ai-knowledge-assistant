from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil
from pathlib import Path

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


app = FastAPI(title="Nixai AI Assistant Backend")



# Directories
UPLOAD_DIR = Path("uploads")
CHROMA_DIR = Path("chroma_db")
UPLOAD_DIR.mkdir(exist_ok=True)

# Global store (for demo only — not production)
vectorstore = None
docs_metadata = {}

# Embedding model (free, no API key)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

@app.get("/")
def root():
    return {"status": "Nixai AI Assistant Backend is running!"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.txt', '.pdf')):
        raise HTTPException(400, "Only .txt and .pdf files allowed")
    
    # Save file
    safe_filename = file.filename.replace(" ", "_")
    filepath = UPLOAD_DIR / safe_filename
    with open(filepath, "wb") as f:
        f.write(await file.read())
    
    # Load document
    if filepath.suffix == ".pdf":
        loader = PyPDFLoader(str(filepath))
    else:
        loader = TextLoader(str(filepath), encoding="utf-8")
    
    docs = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(docs)

    # Initialize or update vectorstore
    global vectorstore
    if vectorstore is None:
        vectorstore = Chroma.from_documents(
            chunks, embeddings, persist_directory=str(CHROMA_DIR)
        )
    else:
        vectorstore.add_documents(chunks)

    # Save metadata
    docs_metadata[safe_filename] = {
        "chunks": len(chunks),
        "embedding_count": len(chunks)
    }

    return {
        "message": "File processed successfully",
        "filename": safe_filename,
        "chunks": len(chunks)
    }

@app.get("/api/docs")
async def list_docs():
    return {
        "docs": [
            {
                "name": name,
                "chunks": meta["chunks"],
                "embedding_count": meta["embedding_count"]
            }
            for name, meta in docs_metadata.items()
        ]
    }

@app.post("/api/ask")
async def ask_question(payload: dict):
    global vectorstore
    if vectorstore is None:
        return {"answer": "No documents uploaded yet.", "sources": []}
    
    question = payload.get("question", "").strip()
    if not question:
        return {"answer": "Please provide a question.", "sources": []}

    # Retrieve relevant chunks
    results = vectorstore.similarity_search(question, k=2)
    
    # Mock answer (replace with real LLM )
    answer = f"This is a simulated answer to: '{question}'. In a real system, an LLM would generate this using the retrieved context."
    sources = [
        {
            "content": doc.page_content[:300] + "...",
            "filename": "uploaded_document"
        }
        for doc in results
    ]

    return {"answer": answer, "sources": sources}