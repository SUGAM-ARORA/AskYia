from typing import Dict
from app.services.components.base import Component, ComponentContext, ComponentResult


class OutputComponent(Component):
    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        return {"answer": context.get("answer", payload.get("answer", ""))}
