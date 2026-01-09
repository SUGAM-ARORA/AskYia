from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from app.models.user import User
from app.repositories.base import CRUDBase


class UserRepository(CRUDBase[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_oauth(
        self, db: AsyncSession, provider: str, oauth_id: str
    ) -> Optional[User]:
        result = await db.execute(
            select(User).where(
                User.oauth_provider == provider,
                User.oauth_id == oauth_id
            )
        )
        return result.scalar_one_or_none()

    async def update_last_login(self, db: AsyncSession, user_id: int) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
        await db.commit()

    async def set_verified(self, db: AsyncSession, user_id: int) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_verified=True)
        )
        await db.commit()

    async def update_password(
        self, db: AsyncSession, user_id: int, hashed_password: str
    ) -> None:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(hashed_password=hashed_password)
        )
        await db.commit()