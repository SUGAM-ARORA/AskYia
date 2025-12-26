from typing import List, Tuple


class VectorStore:
    def __init__(self):
        self.store: List[Tuple[List[float], str]] = []

    async def add(self, embeddings: List[List[float]], texts: List[str]):
        for emb, text in zip(embeddings, texts):
            self.store.append((emb, text))

    async def similarity_search(self, query_embedding: List[float], top_k: int = 3) -> List[str]:
        if not self.store:
            return []
        scored = []
        for emb, text in self.store:
            score = sum(min(a, b) for a, b in zip(query_embedding, emb))
            scored.append((score, text))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [text for _, text in scored[:top_k]]
