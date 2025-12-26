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
    existing = await user_repo.get_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user_in.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    created = await user_repo.create(db, obj_in=user_dict)
    return UserOut.from_orm(created)


@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(deps.get_session)):
    user = await user_repo.get_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}
