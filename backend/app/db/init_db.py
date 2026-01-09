"""
Database initialization script
Creates all tables and runs initial setup
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base

# Import all models to register them with Base
from app.models.user import User
from app.models.workflow import Workflow, WorkflowVersion, WorkflowCollaborator, WorkflowShare
from app.models.chat import ChatSession, ChatMessage
from app.models.document import Document
from app.models.webhook import Webhook, WebhookLog
from app.models.execution_log import ExecutionLog


async def create_tables():
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully")


async def drop_tables():
    """Drop all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.message_metadata.drop_all)
    print("⚠️ Database tables dropped")


async def init_db():
    """Initialize database with tables and seed data."""
    await create_tables()
    
    # Add any seed data here if needed
    async with AsyncSessionLocal() as session:
        # Example: Create default admin user
        # from app.repositories.user import UserRepository
        # from app.core.security import get_password_hash
        # user_repo = UserRepository()
        # admin = await user_repo.get_by_email(session, "admin@askyia.com")
        # if not admin:
        #     await user_repo.create(session, obj_in={
        #         "email": "admin@askyia.com",
        #         "hashed_password": get_password_hash("admin123"),
        #         "full_name": "Admin",
        #         "is_superuser": True,
        #         "is_verified": True
        #     })
        pass
    
    print("✅ Database initialized successfully")


if __name__ == "__main__":
    asyncio.run(init_db())