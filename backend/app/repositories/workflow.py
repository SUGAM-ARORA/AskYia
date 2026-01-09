from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid as uuid_lib

from app.models.workflow import (
    Workflow, WorkflowVersion, WorkflowCollaborator, 
    WorkflowShare, CollaboratorRole
)
from app.models.user import User
from app.repositories.base import CRUDBase


class WorkflowRepository(CRUDBase[Workflow]):
    def __init__(self):
        super().__init__(Workflow)

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any]) -> Workflow:
        # Generate UUID if not provided
        if 'uuid' not in obj_in:
            obj_in['uuid'] = str(uuid_lib.uuid4())
        
        workflow = Workflow(**obj_in)
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        
        # Create initial version
        await self.create_version(
            db, 
            workflow_id=workflow.id, 
            user_id=workflow.owner_id,
            commit_message="Initial version"
        )
        
        return workflow

    async def get_with_details(self, db: AsyncSession, id: int) -> Optional[Workflow]:
        result = await db.execute(
            select(Workflow)
            .options(
                selectinload(Workflow.owner),
                selectinload(Workflow.collaborators).selectinload(WorkflowCollaborator.user),
                selectinload(Workflow.versions),
            )
            .where(Workflow.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[Workflow]:
        result = await db.execute(select(Workflow).where(Workflow.uuid == uuid))
        return result.scalar_one_or_none()

    async def get_user_workflows(
        self,
        db: AsyncSession,
        user_id: int,
        *,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        search: Optional[str] = None,
        include_shared: bool = True
    ) -> List[Workflow]:
        """Get workflows owned by user or shared with them."""
        
        conditions = [Workflow.owner_id == user_id]
        
        if include_shared:
            # Include workflows where user is a collaborator
            collab_subq = select(WorkflowCollaborator.workflow_id).where(
                WorkflowCollaborator.user_id == user_id
            )
            conditions = [or_(
                Workflow.owner_id == user_id,
                Workflow.id.in_(collab_subq)
            )]
        
        query = select(Workflow).where(and_(*conditions))
        
        if status:
            query = query.where(Workflow.status == status)
        
        if search:
            query = query.where(
                or_(
                    Workflow.name.ilike(f"%{search}%"),
                    Workflow.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Workflow.updated_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_public_workflows(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> List[Workflow]:
        """Get public workflows."""
        query = select(Workflow).where(Workflow.is_public == True)
        
        if search:
            query = query.where(
                or_(
                    Workflow.name.ilike(f"%{search}%"),
                    Workflow.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Workflow.execution_count.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_templates(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 50
    ) -> List[Workflow]:
        """Get workflow templates."""
        result = await db.execute(
            select(Workflow)
            .where(Workflow.is_template == True)
            .order_by(Workflow.execution_count.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def increment_execution_count(self, db: AsyncSession, workflow_id: int) -> None:
        await db.execute(
            update(Workflow)
            .where(Workflow.id == workflow_id)
            .values(
                execution_count=Workflow.execution_count + 1,
                last_executed_at=datetime.utcnow()
            )
        )
        await db.commit()

    async def check_access(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int,
        required_role: CollaboratorRole = CollaboratorRole.VIEWER
    ) -> bool:
        """Check if user has access to workflow."""
        workflow = await self.get(db, workflow_id)
        if not workflow:
            return False
        
        # Owner has full access
        if workflow.owner_id == user_id:
            return True
        
        # Check collaborator access
        result = await db.execute(
            select(WorkflowCollaborator).where(
                WorkflowCollaborator.workflow_id == workflow_id,
                WorkflowCollaborator.user_id == user_id
            )
        )
        collab = result.scalar_one_or_none()
        
        if not collab:
            return False
        
        role_hierarchy = {
            CollaboratorRole.VIEWER.value: 1,
            CollaboratorRole.EDITOR.value: 2,
            CollaboratorRole.ADMIN.value: 3
        }
        
        return role_hierarchy.get(collab.role, 0) >= role_hierarchy.get(required_role.value, 0)

    # ============== Version Methods ==============

    async def create_version(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int,
        commit_message: Optional[str] = None
    ) -> WorkflowVersion:
        """Create a new version of the workflow."""
        workflow = await self.get(db, workflow_id)
        if not workflow:
            raise ValueError("Workflow not found")
        
        # Get next version number
        result = await db.execute(
            select(func.max(WorkflowVersion.version))
            .where(WorkflowVersion.workflow_id == workflow_id)
        )
        max_version = result.scalar() or 0
        new_version = max_version + 1
        
        version = WorkflowVersion(
            workflow_id=workflow_id,
            version=new_version,
            name=workflow.name,
            description=workflow.description,
            definition=workflow.definition,
            commit_message=commit_message,
            created_by_id=user_id
        )
        db.add(version)
        
        # Update workflow's current version
        workflow.current_version = new_version
        
        await db.commit()
        await db.refresh(version)
        return version

    async def get_versions(
        self,
        db: AsyncSession,
        workflow_id: int,
        *,
        skip: int = 0,
        limit: int = 20
    ) -> List[WorkflowVersion]:
        """Get version history for a workflow."""
        result = await db.execute(
            select(WorkflowVersion)
            .where(WorkflowVersion.workflow_id == workflow_id)
            .order_by(WorkflowVersion.version.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_version(
        self,
        db: AsyncSession,
        workflow_id: int,
        version: int
    ) -> Optional[WorkflowVersion]:
        """Get specific version of a workflow."""
        result = await db.execute(
            select(WorkflowVersion).where(
                WorkflowVersion.workflow_id == workflow_id,
                WorkflowVersion.version == version
            )
        )
        return result.scalar_one_or_none()

    async def restore_version(
        self,
        db: AsyncSession,
        workflow_id: int,
        version: int,
        user_id: int
    ) -> Workflow:
        """Restore workflow to a specific version."""
        version_obj = await self.get_version(db, workflow_id, version)
        if not version_obj:
            raise ValueError(f"Version {version} not found")
        
        workflow = await self.get(db, workflow_id)
        if not workflow:
            raise ValueError("Workflow not found")
        
        # Update workflow with version data
        workflow.name = version_obj.name
        workflow.description = version_obj.description
        workflow.definition = version_obj.definition
        
        await db.commit()
        
        # Create new version marking the restore
        await self.create_version(
            db, workflow_id, user_id,
            commit_message=f"Restored from version {version}"
        )
        
        await db.refresh(workflow)
        return workflow

    # ============== Collaborator Methods ==============

    async def add_collaborator(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int,
        role: CollaboratorRole = CollaboratorRole.VIEWER
    ) -> WorkflowCollaborator:
        """Add a collaborator to workflow."""
        collab = WorkflowCollaborator(
            workflow_id=workflow_id,
            user_id=user_id,
            role=role.value
        )
        db.add(collab)
        await db.commit()
        await db.refresh(collab)
        return collab

    async def update_collaborator_role(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int,
        role: CollaboratorRole
    ) -> Optional[WorkflowCollaborator]:
        """Update collaborator's role."""
        result = await db.execute(
            select(WorkflowCollaborator).where(
                WorkflowCollaborator.workflow_id == workflow_id,
                WorkflowCollaborator.user_id == user_id
            )
        )
        collab = result.scalar_one_or_none()
        if collab:
            collab.role = role.value
            await db.commit()
            await db.refresh(collab)
        return collab

    async def remove_collaborator(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int
    ) -> bool:
        """Remove a collaborator from workflow."""
        result = await db.execute(
            delete(WorkflowCollaborator).where(
                WorkflowCollaborator.workflow_id == workflow_id,
                WorkflowCollaborator.user_id == user_id
            )
        )
        await db.commit()
        return result.rowcount > 0

    async def get_collaborators(
        self,
        db: AsyncSession,
        workflow_id: int
    ) -> List[WorkflowCollaborator]:
        """Get all collaborators for a workflow."""
        result = await db.execute(
            select(WorkflowCollaborator)
            .options(selectinload(WorkflowCollaborator.user))
            .where(WorkflowCollaborator.workflow_id == workflow_id)
        )
        return list(result.scalars().all())

    # ============== Share Methods ==============

    async def create_share(
        self,
        db: AsyncSession,
        workflow_id: int,
        user_id: int,
        *,
        allow_edit: bool = False,
        allow_execute: bool = True,
        allow_duplicate: bool = False,
        expires_at: Optional[datetime] = None,
        max_uses: Optional[int] = None
    ) -> WorkflowShare:
        """Create a shareable link for workflow."""
        share = WorkflowShare(
            workflow_id=workflow_id,
            share_token=str(uuid_lib.uuid4()),
            allow_edit=allow_edit,
            allow_execute=allow_execute,
            allow_duplicate=allow_duplicate,
            expires_at=expires_at,
            max_uses=max_uses,
            created_by_id=user_id
        )
        db.add(share)
        await db.commit()
        await db.refresh(share)
        return share

    async def get_share_by_token(
        self,
        db: AsyncSession,
        token: str
    ) -> Optional[WorkflowShare]:
        """Get share by token."""
        result = await db.execute(
            select(WorkflowShare)
            .options(selectinload(WorkflowShare.workflow))
            .where(WorkflowShare.share_token == token)
        )
        return result.scalar_one_or_none()

    async def increment_share_usage(
        self,
        db: AsyncSession,
        share_id: int
    ) -> None:
        """Increment share usage count."""
        await db.execute(
            update(WorkflowShare)
            .where(WorkflowShare.id == share_id)
            .values(use_count=WorkflowShare.use_count + 1)
        )
        await db.commit()

    async def delete_share(self, db: AsyncSession, share_id: int) -> bool:
        """Delete a share link."""
        result = await db.execute(
            delete(WorkflowShare).where(WorkflowShare.id == share_id)
        )
        await db.commit()
        return result.rowcount > 0

    async def get_shares(
        self,
        db: AsyncSession,
        workflow_id: int
    ) -> List[WorkflowShare]:
        """Get all shares for a workflow."""
        result = await db.execute(
            select(WorkflowShare)
            .where(WorkflowShare.workflow_id == workflow_id)
            .order_by(WorkflowShare.created_at.desc())
        )
        return list(result.scalars().all())


# Singleton instance
workflow_repository = WorkflowRepository()