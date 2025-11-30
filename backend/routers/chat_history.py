# backend/routers/chat_history.py
from fastapi import APIRouter, Depends
from core.config import CHAT_HISTORY_DIR
from dependencies import CurrentUser
import json

router = APIRouter()


@router.get("/chat-history")
async def get_chat_history(current_user: CurrentUser):
    file = CHAT_HISTORY_DIR / f"{current_user['user_id']}.json"
    if not file.exists():
        return {"history": []}
    try:
        return {"history": json.load(open(file))}
    except:
        return {"history": []}