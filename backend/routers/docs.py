# routers/docs.py
from fastapi import APIRouter, Depends
from dependencies import CurrentUser
from core.config import docs_metadata

router = APIRouter(tags=["documents"])

# @router.get("/docs")
@router.get("/documents") # changed to documents as/docs conclit with /docs for sewgeer ui

async def list_docs(current_user: CurrentUser):
    user_docs = [
        {"name": v["original_name"], "chunks": v["chunks"], "embedding_count": v["embedding_count"]}
        for k, v in docs_metadata.items()
        if v.get("user_id") == current_user["user_id"]
    ]
    return {"docs": user_docs}