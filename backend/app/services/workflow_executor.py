from typing import Dict, Any
from app.services.components.user_query import UserQueryComponent
from app.services.components.knowledge_base import KnowledgeBaseComponent
from app.services.components.llm_engine import LLMEngineComponent
from app.services.components.output import OutputComponent
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore
from app.services.llm_service import LLMService
from app.services.web_search import WebSearchService
from app.services.components.base import ComponentContext


class WorkflowExecutor:
    def __init__(self, store: VectorStore | None = None, embedder: EmbeddingService | None = None):
        embedder = embedder or EmbeddingService()
        store = store or VectorStore()
        llm = LLMService()
        search = WebSearchService()

        self.store = store
        self.user_query = UserQueryComponent()
        self.knowledge_base = KnowledgeBaseComponent(embedder, store)
        self.llm_engine = LLMEngineComponent(llm=llm, search=search)
        self.output = OutputComponent()

    async def execute(self, definition: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        # Simplified execution order: user_query -> kb? -> llm -> output
        context: ComponentContext = ComponentContext()
        await self.user_query.run(payload, context)
        if definition.get("knowledge_base_enabled", True):
            await self.knowledge_base.run(payload, context)
        await self.llm_engine.run(payload, context)
        return await self.output.run(payload, context)
