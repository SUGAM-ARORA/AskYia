from typing import Dict, List
from app.services.components.base import Component, ComponentContext, ComponentResult
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore


class KnowledgeBaseComponent(Component):
    def __init__(self, embedder: EmbeddingService, store: VectorStore):
        self.embedder = embedder
        self.store = store

    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        query = context.get("query", payload.get("query", ""))
        query_embedding = await self.embedder.embed_query(query)
        docs = await self.store.similarity_search(query_embedding)
        context["context"] = "\n".join(docs)
        return {"context": context.get("context", "")}
