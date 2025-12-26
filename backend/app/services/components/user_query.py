from typing import Dict
from app.services.components.base import Component, ComponentContext, ComponentResult


class UserQueryComponent(Component):
    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        context["query"] = payload.get("query", "")
        return {"query": context["query"]}
