from typing import List


class EmbeddingService:
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        # Placeholder: return deterministic dummy embeddings
        return [[float(i) for i, _ in enumerate(text)] for text in texts]

    async def embed_query(self, query: str) -> List[float]:
        return [float(i) for i, _ in enumerate(query)]
