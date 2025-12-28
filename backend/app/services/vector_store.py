"""
Vector Store Service - ChromaDB Integration
Askyia - No-Code AI Workflow Builder
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
import structlog
import uuid

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class VectorStore:
    """
    Vector Store using ChromaDB for persistent storage.
    Falls back to in-memory storage if ChromaDB is unavailable.
    """
    
    def __init__(self, collection_name: str = "askyia_documents"):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self.use_memory_fallback = False
        
        # In-memory fallback storage
        self.memory_store: List[Tuple[str, List[float], str, Dict]] = []  # (id, embedding, text, metadata)
        
        # Try to connect to ChromaDB
        self._initialize_chromadb()
    
    def _initialize_chromadb(self):
        """Initialize ChromaDB client and collection."""
        
        if not CHROMADB_AVAILABLE:
            logger.warning("ChromaDB package not available, using memory fallback")
            self.use_memory_fallback = True
            return
        
        try:
            # Connect to ChromaDB server
            chroma_host = settings.chromadb_host
            chroma_port = settings.chromadb_port
            
            logger.info("Connecting to ChromaDB", host=chroma_host, port=chroma_port)
            
            self.client = chromadb.HttpClient(
                host=chroma_host,
                port=chroma_port,
                settings=ChromaSettings(
                    anonymized_telemetry=False
                )
            )
            
            # Test connection
            self.client.heartbeat()
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            
            logger.info(
                "ChromaDB initialized",
                collection=self.collection_name,
                count=self.collection.count()
            )
            
        except Exception as e:
            logger.warning(f"ChromaDB connection failed: {e}, using memory fallback")
            self.use_memory_fallback = True
            self.client = None
            self.collection = None
    
    async def add(
        self,
        embeddings: List[List[float]],
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> List[str]:
        """Add documents with embeddings to the vector store."""
        
        if not embeddings or not texts:
            return []
        
        # Generate IDs if not provided
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in range(len(texts))]
        
        # Generate metadata if not provided
        if metadatas is None:
            metadatas = [{"source": "upload"} for _ in range(len(texts))]
        
        logger.info("vector_store_add", count=len(texts))
        
        if self.use_memory_fallback:
            return await self._add_memory(embeddings, texts, metadatas, ids)
        else:
            return await self._add_chromadb(embeddings, texts, metadatas, ids)
    
    async def _add_chromadb(
        self,
        embeddings: List[List[float]],
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> List[str]:
        """Add to ChromaDB."""
        
        try:
            # Run in executor since ChromaDB is sync
            def sync_add():
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, sync_add)
            
            logger.info("chromadb_add_success", count=len(ids))
            return ids
            
        except Exception as e:
            logger.error("chromadb_add_failed", error=str(e))
            # Fallback to memory
            return await self._add_memory(embeddings, texts, metadatas, ids)
    
    async def _add_memory(
        self,
        embeddings: List[List[float]],
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> List[str]:
        """Add to in-memory store."""
        
        for i, (emb, text, meta) in enumerate(zip(embeddings, texts, metadatas)):
            doc_id = ids[i] if i < len(ids) else str(uuid.uuid4())
            self.memory_store.append((doc_id, emb, text, meta))
        
        logger.info("memory_store_add", count=len(texts), total=len(self.memory_store))
        return ids
    
    async def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        
        logger.info("vector_store_search", top_k=top_k)
        
        if self.use_memory_fallback:
            return await self._search_memory(query_embedding, top_k, filter_metadata)
        else:
            return await self._search_chromadb(query_embedding, top_k, filter_metadata)
    
    async def _search_chromadb(
        self,
        query_embedding: List[float],
        top_k: int,
        filter_metadata: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB."""
        
        try:
            def sync_search():
                return self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=filter_metadata,
                    include=["documents", "metadatas", "distances"]
                )
            
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, sync_search)
            
            # Format results
            formatted = []
            if results and results.get('ids') and results['ids'][0]:
                for i, doc_id in enumerate(results['ids'][0]):
                    formatted.append({
                        "id": doc_id,
                        "text": results['documents'][0][i] if results.get('documents') else "",
                        "metadata": results['metadatas'][0][i] if results.get('metadatas') else {},
                        "distance": results['distances'][0][i] if results.get('distances') else 0,
                        "score": 1 - results['distances'][0][i] if results.get('distances') else 1
                    })
            
            logger.info("chromadb_search_success", results=len(formatted))
            return formatted
            
        except Exception as e:
            logger.error("chromadb_search_failed", error=str(e))
            return await self._search_memory(query_embedding, top_k, filter_metadata)
    
    async def _search_memory(
        self,
        query_embedding: List[float],
        top_k: int,
        filter_metadata: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search in-memory store using cosine similarity."""
        
        if not self.memory_store:
            return []
        
        def cosine_similarity(a: List[float], b: List[float]) -> float:
            """Calculate cosine similarity between two vectors."""
            if len(a) != len(b):
                # Pad shorter vector
                min_len = min(len(a), len(b))
                a = a[:min_len]
                b = b[:min_len]
            
            dot_product = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x * x for x in a) ** 0.5
            norm_b = sum(x * x for x in b) ** 0.5
            
            if norm_a == 0 or norm_b == 0:
                return 0
            
            return dot_product / (norm_a * norm_b)
        
        # Calculate similarities
        scored = []
        for doc_id, embedding, text, metadata in self.memory_store:
            score = cosine_similarity(query_embedding, embedding)
            scored.append({
                "id": doc_id,
                "text": text,
                "metadata": metadata,
                "score": score,
                "distance": 1 - score
            })
        
        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)
        
        logger.info("memory_search_success", results=min(top_k, len(scored)))
        return scored[:top_k]
    
    async def delete(self, ids: List[str]) -> bool:
        """Delete documents by ID."""
        
        if self.use_memory_fallback:
            self.memory_store = [
                item for item in self.memory_store 
                if item[0] not in ids
            ]
            logger.info("memory_store_delete", count=len(ids))
            return True
        
        try:
            def sync_delete():
                self.collection.delete(ids=ids)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, sync_delete)
            
            logger.info("chromadb_delete_success", count=len(ids))
            return True
            
        except Exception as e:
            logger.error("chromadb_delete_failed", error=str(e))
            return False
    
    async def clear(self) -> bool:
        """Clear all documents from the store."""
        
        if self.use_memory_fallback:
            self.memory_store = []
            logger.info("memory_store_cleared")
            return True
        
        try:
            # Delete and recreate collection
            def sync_clear():
                self.client.delete_collection(self.collection_name)
                self.collection = self.client.create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, sync_clear)
            
            logger.info("chromadb_cleared")
            return True
            
        except Exception as e:
            logger.error("chromadb_clear_failed", error=str(e))
            return False
    
    def count(self) -> int:
        """Get the number of documents in the store."""
        
        if self.use_memory_fallback:
            return len(self.memory_store)
        
        try:
            return self.collection.count()
        except:
            return len(self.memory_store)


# Singleton
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get or create vector store singleton."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store