# backend/alembic/versions/xxx_add_auth_fields.py
# Run: alembic revision --autogenerate -m "Add authentication fields to users"

"""Add authentication fields to users

Revision ID: xxx
Revises: previous_revision
Create Date: 2024-xx-xx

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'xxx_add_auth_fields'
down_revision = 'previous_revision'  # Update this
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users table
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('oauth_provider', sa.String(), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('email_verification_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    
    # Make hashed_password nullable for OAuth users
    op.alter_column('users', 'hashed_password', nullable=True)
    
    # Add index for oauth lookup
    op.create_index('ix_users_oauth_id', 'users', ['oauth_id'])


def downgrade():
    op.drop_index('ix_users_oauth_id', table_name='users')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'is_email_verified')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')
    op.drop_column('users', 'avatar_url')
    op.alter_column('users', 'hashed_password', nullable=False)