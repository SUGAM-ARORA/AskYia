from app.models.chat import ChatMessage
from app.repositories.base import CRUDBase


class ChatRepository(CRUDBase[ChatMessage]):
    def __init__(self):
        super().__init__(ChatMessage)
