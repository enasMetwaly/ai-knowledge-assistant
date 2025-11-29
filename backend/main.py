from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta, datetime, timezone
from passlib.context import CryptContext
from typing import Annotated
from pydantic import BaseModel
import os
import jwt
from jwt.exceptions import InvalidTokenError
from pathlib import Path
import json
import re
from dotenv import load_dotenv

# Retry logic
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# LangChain
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FakeEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA

load_dotenv()

app = FastAPI(title="Nixai AI Assistant Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
CHROMA_DIR = Path("chroma_db")
CHAT_HISTORY_DIR = Path("chat_history")
UPLOAD_DIR.mkdir(exist_ok=True)
CHROMA_DIR.mkdir(exist_ok=True)
CHAT_HISTORY_DIR.mkdir(exist_ok=True)
METADATA_FILE = Path("docs_metadata.json")

# ===== AUTH =====
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 720

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

fake_users_db = {
    "user@example.com": {
        "email": "user@example.com",
        "hashed_password": pwd_context.hash("password123"),
        "user_id": "user_1",
        "name": "Demo User"
    },
    "admin@nixai.com": {
        "email": "admin@nixai.com",
        "hashed_password": pwd_context.hash("admin123"),
        "user_id": "user_2",
        "name": "Admin User"
    }
}

docs_metadata: dict = {}
user_vectorstores: dict = {}

if METADATA_FILE.exists():
    with open(METADATA_FILE, "r") as f:
        docs_metadata = json.load(f)

embeddings = FakeEmbeddings(size=384)
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.1-8b-instant",
    temperature=0.1,
    max_tokens=800
)

# ===== AUTH HELPERS =====
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_user(email: str):
    return fake_users_db.get(email)

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user or not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        user_id: str | None = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        return {"email": email, "user_id": user_id}
    except (InvalidTokenError, jwt.ExpiredSignatureError):
        raise credentials_exception

CurrentUser = Annotated[dict, Depends(get_current_user)]

# ===== RETRY LOGIC FOR GROQ API =====
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((Exception,)),
    reraise=True,
    before_sleep=lambda retry_state: print(f"🔄 Retry attempt {retry_state.attempt_number}/3 - waiting {retry_state.next_action.sleep} seconds...")
)
def call_groq_with_retry(qa_chain, question: str):
    """Call Groq API with automatic retry on failure"""
    print(f"🚀 Calling Groq API (attempt {call_groq_with_retry.retry.statistics.get('attempt_number', 1)})...")
    try:
        result = qa_chain.invoke({"query": question})
        print("✅ Groq API call successful!")
        return result
    except Exception as e:
        print(f"❌ Groq API call failed: {str(e)[:100]}")
        raise

# ===== BACKGROUND TASK FOR FILE PROCESSING =====
def process_file_in_background(filepath: Path, user_id: str, original_filename: str):
    """Process uploaded file in background (async task)"""
    try:
        # Load document
        if filepath.suffix == ".pdf":
            loader = PyPDFLoader(str(filepath))
        else:
            loader = TextLoader(str(filepath), encoding="utf-8")
        
        docs = loader.load()
        
        # Set original filename in metadata
        for doc in docs:
            doc.metadata["source"] = original_filename
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(docs)
        
        # Create or update user's vectorstore
        user_dir = CHROMA_DIR / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        
        if user_id not in user_vectorstores or user_vectorstores[user_id] is None:
            user_vectorstores[user_id] = Chroma.from_documents(
                chunks, embeddings, persist_directory=str(user_dir)
            )
        else:
            user_vectorstores[user_id].add_documents(chunks)
        
        # Save metadata
        safe_filename = f"{user_id}_{original_filename.replace(' ', '_')}"
        docs_metadata[safe_filename] = {
            "user_id": user_id,
            "original_name": original_filename,
            "chunks": len(chunks),
            "embedding_count": len(chunks),
            "status": "completed"
        }
        
        with open(METADATA_FILE, 'w') as f:
            json.dump(docs_metadata, f, indent=2)
        
        print(f"✅ Background processing completed for {original_filename}")
        
    except Exception as e:
        print(f"❌ Background processing failed for {original_filename}: {e}")
        # Mark as failed in metadata
        safe_filename = f"{user_id}_{original_filename.replace(' ', '_')}"
        if safe_filename in docs_metadata:
            docs_metadata[safe_filename]["status"] = "failed"
            docs_metadata[safe_filename]["error"] = str(e)
            with open(METADATA_FILE, 'w') as f:
                json.dump(docs_metadata, f, indent=2)

# ===== MODELS =====
class AskRequest(BaseModel):
    question: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = "User"

# ===== ROUTES =====
@app.get("/")
def root():
    return {
        "status": "Nixai AI Assistant Backend is running!",
        "auth": "enabled",
        "features": ["retry_logic", "async_tasks"]
    }

@app.post("/api/register")
async def register(request: RegisterRequest):
    if request.email in fake_users_db:
        raise HTTPException(400, "Email already registered")
    user_id = f"user_{len(fake_users_db) + 1}"
    fake_users_db[request.email] = {
        "email": request.email,
        "hashed_password": pwd_context.hash(request.password),
        "user_id": user_id,
        "name": request.name
    }
    return {"message": "User registered successfully", "user_id": user_id}

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password",
                            headers={"WWW-Authenticate": "Bearer"})
    token = create_access_token(
        {"sub": user["email"], "user_id": user["user_id"]},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"]
    }

@app.get("/api/me")
async def get_me(current_user: CurrentUser):
    return current_user

@app.post("/api/upload")
async def upload_file(
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload file with async background processing"""
    if not file.filename.lower().endswith(('.txt', '.pdf')):
        raise HTTPException(400, "Only .txt and .pdf files allowed")

    user_id = current_user["user_id"]
    original_filename = file.filename
    safe_filename = f"{user_id}_{file.filename.replace(' ', '_')}"
    filepath = UPLOAD_DIR / safe_filename

    # Save file immediately
    content = await file.read()
    filepath.write_bytes(content)

    # Add background task for processing
    background_tasks.add_task(
        process_file_in_background,
        filepath,
        user_id,
        original_filename
    )

    return {
        "message": "File uploaded successfully. Processing in background...",
        "filename": original_filename,
        "status": "processing"
    }

@app.get("/api/docs")
async def list_docs(current_user: CurrentUser):
    user_id = current_user["user_id"]
    user_docs = [
        {
            "name": m["original_name"],
            "chunks": m["chunks"],
            "embedding_count": m["embedding_count"],
            "status": m.get("status", "completed")
        }
        for name, m in docs_metadata.items()
        if m.get("user_id") == user_id
    ]
    return {"docs": user_docs}

@app.post("/api/ask")
async def ask_question(request: AskRequest, current_user: CurrentUser):
    """Ask question with retry logic for Groq API"""
    user_id = current_user["user_id"]
    
    if user_id not in user_vectorstores or user_vectorstores[user_id] is None:
        return {"answer": "No documents uploaded yet. Please upload documents first.", "sources": []}

    full_question = request.question.strip()
    if not full_question:
        return {"answer": "Please provide a question.", "sources": []}

    # @filename parsing
    target_filename = None
    question = full_question

    match = re.match(r"@([^@\s]+)", full_question)
    if match:
        target_filename = match.group(1)
        question = full_question[len(match.group(0)):].strip()

    # Build retriever
    search_kwargs = {"k": 4}
    if target_filename:
        search_kwargs["filter"] = {"source": target_filename}

    retriever = user_vectorstores[user_id].as_retriever(search_kwargs=search_kwargs)

    try:
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        
        # Call with retry logic
        result = call_groq_with_retry(qa, question)

        sources = [
            {
                "content": doc.page_content,
                "filename": doc.metadata.get("source", "Unknown file")
            }
            for doc in result.get("source_documents", [])
        ]

        if target_filename and not sources:
            answer = f"I couldn't find the document '{target_filename}'. Try uploading it first!"
        else:
            answer = result["result"]

        # Save to chat history
        history_file = CHAT_HISTORY_DIR / f"{user_id}.json"
        history = []
        if history_file.exists():
            try:
                with open(history_file, "r") as f:
                    history = json.load(f)
            except:
                pass
        
        history.append({
            "question": full_question,
            "answer": answer,
            "sources": sources,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        history = history[-50:]
        
        with open(history_file, "w") as f:
            json.dump(history, f, indent=2)

        return {"answer": answer, "sources": sources}

    except Exception as e:
        # After retries failed
        error_msg = str(e)
        if "API key" in error_msg or "authentication" in error_msg.lower():
            raise HTTPException(500, f"❌ Authentication failed after 3 retries. Check your GROQ_API_KEY in .env file.")
        elif "timeout" in error_msg.lower() or "connection" in error_msg.lower():
            raise HTTPException(500, f"❌ Connection to Groq failed after 3 retries. Network issue or Groq service down.")
        else:
            raise HTTPException(500, f"❌ AI query failed after 3 retries: {error_msg[:200]}")

@app.get("/api/chat-history")
async def get_chat_history(current_user: CurrentUser):
    user_id = current_user["user_id"]
    history_file = CHAT_HISTORY_DIR / f"{user_id}.json"
    if not history_file.exists():
        return {"history": []}
    try:
        with open(history_file, "r") as f:
            return {"history": json.load(f)}
    except:
        return {"history": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)