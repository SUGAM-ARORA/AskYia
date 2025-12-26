#!/usr/bin/env python3
"""
Seed database with initial data including a default user
Run this after database initialization
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.db.base import Base


async def seed_database():
    """Create default user and initial data"""
    
    print("🗄️  Creating database tables...")
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("🌱 Seeding database...")
    # Create session
    async with AsyncSessionLocal() as db:
        # Check if default user exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@askyia.com"))
        existing_user = result.scalar_one_or_none()
        
        if not existing_user:
            # Create default admin user
            default_user = User(
                email="admin@askyia.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User"
            )
            db.add(default_user)
            
            # Create test user
            test_user = User(
                email="test@askyia.com",
                hashed_password=get_password_hash("test123"),
                full_name="Test User"
            )
            db.add(test_user)
            
            await db.commit()
            print("✅ Default users created:")
            print("   📧 Email: admin@askyia.com | 🔑 Password: admin123")
            print("   📧 Email: test@askyia.com | 🔑 Password: test123")
        else:
            print("ℹ️  Default users already exist")
            print("   📧 Email: admin@askyia.com | 🔑 Password: admin123")
            print("   📧 Email: test@askyia.com | 🔑 Password: test123")


if __name__ == "__main__":
    try:
        print("=" * 50)
        print("🌱 Database Seeding Script")
        print("=" * 50)
        asyncio.run(seed_database())
        print("=" * 50)
        print("✅ Database seeding complete!")
        print("=" * 50)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
