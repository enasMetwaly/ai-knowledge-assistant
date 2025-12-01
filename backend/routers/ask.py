# backend/routers/ask.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import re
import json
from datetime import datetime, timezone
from pathlib import Path

from dependencies import CurrentUser
from rag.retriever import query_with_retry
from core.config import CHAT_HISTORY_DIR
from pydantic import BaseModel, Field



router = APIRouter(tags=["Chat"])

class AskRequest(BaseModel):
    # question: str just change
      question: str = Field(
        ...,
        example="@ai.txt What is Ai?",
        description="Your question. Use @filename to query a specific document only."
    )

@router.post("/ask")
async def ask(request: AskRequest, current_user: CurrentUser):
    #just """ doc string added 
    """
    Ask a question about your uploaded documents.

    - Supports `@filename` syntax to restrict to one file
    - Rate limited to 10 requests/minute
    - Returns AI answer + source chunks
    """
    full_q = request.question.strip()
    if not full_q:
        return {"answer": "Ask something!", "sources": []}

    # @filename extraction
    target_file = None
    match = re.match(r"@([^@\s]+)", full_q)
    if match:
        target_file = match.group(1)
        question = full_q[len(match.group(0)):].strip()
    else:
        question = full_q

    try:
        user_id = current_user["user_id"]

        # Graceful no-docs case
        result = query_with_retry(user_id, question, target_file)
        answer = result["result"]
        sources = [
            {"content": doc.page_content, "filename": doc.metadata.get("source", "Unknown")}
            for doc in result.get("source_documents", [])
        ]

        # Save chat history
        hist_file = CHAT_HISTORY_DIR / f"{user_id}.json"
        history = []
        if hist_file.exists():
            try:
                history = json.loads(hist_file.read_text(encoding="utf-8"))
            except:
                history = []

        history.append({
            "question": full_q,
            "answer": answer,
            "sources": sources,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        hist_file.write_text(json.dumps(history[-50:], indent=2))

        return {"answer": answer, "sources": sources}

    except ValueError as e:
        if "No documents" in str(e):
            return {"answer": "No documents uploaded yet. Please upload some documents first!", "sources": []}
        return {"answer": "Sorry, something went wrong.", "sources": []}
    except Exception as e:
        print(f"Ask error: {e}")
        return {"answer": "Sorry, something went wrong. Please try again later.", "sources": []}