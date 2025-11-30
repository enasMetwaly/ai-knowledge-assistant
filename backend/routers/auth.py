# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from dependencies import authenticate_user, create_access_token, CurrentUser
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Wrong credentials")
    token = create_access_token({"sub": user["email"], "user_id": user["user_id"]}, timedelta(minutes=720))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user["email"], "name": user["name"], "user_id": user["user_id"]}
    }

@router.get("/me", response_model=dict)
async def me(user: CurrentUser):
    return user