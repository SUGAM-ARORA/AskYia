from typing import Dict, Optional
from app.services.components.base import Component, ComponentContext, ComponentResult
from app.services.llm_service import LLMService
from app.services.web_search import WebSearchService


class LLMEngineComponent(Component):
    def __init__(self, llm: LLMService, search: Optional[WebSearchService] = None):
        self.llm = llm
        self.search = search

    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        query = context.get("query", payload.get("query", ""))
        prompt = payload.get("prompt")
        kb_context = context.get("context")

        if payload.get("web_search") and self.search:
            search_snippet = await self.search.search(query)
            kb_context = "\n".join(filter(None, [kb_context, search_snippet]))

        answer = await self.llm.generate(query=query, context=kb_context, prompt=prompt)
        context["answer"] = answer
        return {"answer": answer}
