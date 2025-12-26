from typing import Any, Dict, Optional


class ComponentContext(Dict[str, Any]):
    pass


class ComponentResult(Dict[str, Any]):
    pass


class Component:
    async def run(self, payload: Dict[str, Any], context: ComponentContext) -> ComponentResult:
        raise NotImplementedError
