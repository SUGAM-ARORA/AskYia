# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.repositories.user import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter()
user_repo = UserRepository()


@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: AsyncSession = Depends(deps.get_session)):
    """Register a new user."""
    existing = await user_repo.get_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": get_password_hash(user_in.password)
    }
    created = await user_repo.create(db, obj_in=user_dict)
    return created


@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(deps.get_session)):
    """Login with email and password."""
    user = await user_repo.get_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}


# Placeholder endpoints for OAuth (return not implemented)
@router.get("/oauth/google")
async def google_oauth():
    raise HTTPException(status_code=501, detail="Google OAuth not configured")


@router.get("/oauth/github")
async def github_oauth():
    raise HTTPException(status_code=501, detail="GitHub OAuth not configured")


@router.post("/oauth/google/callback")
async def google_callback():
    raise HTTPException(status_code=501, detail="Google OAuth not configured")


@router.post("/oauth/github/callback")
async def github_callback():
    raise HTTPException(status_code=501, detail="GitHub OAuth not configured")


@router.post("/password/reset-request")
async def password_reset_request():
    return {"message": "If an account exists, you will receive a reset email."}


@router.post("/password/reset")
async def password_reset():
    raise HTTPException(status_code=501, detail="Password reset not configured")


@router.get("/me", response_model=UserOut)
async def get_me(
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get current user profile."""
    user = await user_repo.get(db, int(current_user["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user