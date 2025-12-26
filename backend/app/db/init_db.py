import asyncio
from app.db.session import engine
from app.db.base import Base


aSYNC_METADATA_CREATE = Base.metadata.create_all


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init_db())
