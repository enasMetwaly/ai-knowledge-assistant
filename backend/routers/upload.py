# backend/routers/upload.py
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException  
from dependencies import CurrentUser
from rag.ingest import ingest_document
from core.config import UPLOAD_DIR

router = APIRouter(tags=["Documents"])

@router.post("/upload")
async def upload(
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(('.pdf', '.txt')):
        raise HTTPException(400, "Only PDF/TXT")

    user_id = current_user["user_id"]
    safe_name = f"{user_id}_{file.filename.replace(' ', '_')}"
    path = UPLOAD_DIR / safe_name
    contents = await file.read()
    path.write_bytes(contents)

    background_tasks.add_task(ingest_document, str(path), user_id, file.filename)

    return {"message": "Uploaded! Processing...", "filename": file.filename}