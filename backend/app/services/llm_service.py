from typing import Optional


class LLMService:
    async def generate(self, query: str, context: Optional[str] = None, prompt: Optional[str] = None) -> str:
        composed = "".join([part for part in [prompt, context, query] if part])
        return f"LLM response for: {composed[:200]}"
