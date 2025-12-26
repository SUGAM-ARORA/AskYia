from app.models.workflow import Workflow
from app.repositories.base import CRUDBase


class WorkflowRepository(CRUDBase[Workflow]):
    def __init__(self):
        super().__init__(Workflow)
