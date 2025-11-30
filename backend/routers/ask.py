# backend/routers/ask.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import re
import json                     # ← ADD THIS LINE
from datetime import datetime, timezone
from dependencies import CurrentUser
from rag.retriever import query_with_retry
from core.config import CHAT_HISTORY_DIR, user_vectorstores

router = APIRouter(tags=["chat"])

class AskRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask(request: AskRequest, current_user: CurrentUser):
    full_q = request.question.strip()
    if not full_q:
        return {"answer": "Ask something!", "sources": []}

    target_file = None
    match = re.match(r"@([^@\s]+)", full_q)
    if match:
        target_file = match.group(1)
        question = full_q[len(match.group(0)):].strip()
    else:
        question = full_q

    try:
        result = query_with_retry(current_user["user_id"], question, target_file)
        sources = [
            {"content": doc.page_content, "filename": doc.metadata.get("source", "Unknown")}
            for doc in result.get("source_documents", [])
        ]
        answer = result["result"]

        # Save history
        hist_file = CHAT_HISTORY_DIR / f"{current_user['user_id']}.json"
        history = hist_file.read_text(encoding="utf-8") if hist_file.exists() else "[]"
        history = json.loads(history)
        history.append({
            "question": full_q,
            "answer": answer,
            "sources": sources,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        hist_file.write_text(json.dumps(history[-50:], indent=2))

        return {"answer": answer, "sources": sources}
    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")