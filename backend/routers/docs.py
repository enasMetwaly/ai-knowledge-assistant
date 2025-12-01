# backend/routers/docs.py
from fastapi import APIRouter, Depends
from dependencies import CurrentUser
from core.config import METADATA_FILE
import json

router = APIRouter(tags=["Documents"])


@router.get("/documents")
async def list_docs(current_user: CurrentUser):
    user_id = current_user["user_id"]

    if not METADATA_FILE.exists():
        return {"docs": []}

    try:
        all_metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    except:
        return {"docs": []}

    # Only return docs belonging to this user
    user_docs = [
        {
            "name": v["original_name"],
            "chunks": v["chunks"],
            "embedding_count": v["embedding_count"]
        }
        for k, v in all_metadata.items()
        if v.get("user_id") == user_id
    ]

    return {"docs": user_docs}