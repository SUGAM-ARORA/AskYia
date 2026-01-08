"""
Document Upload and Processing Endpoints
Askyia - No-Code AI Workflow Builder
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import structlog

from app.services.document_processor import DocumentProcessor
from app.services.state import vector_store, embedding_service

logger = structlog.get_logger()
router = APIRouter()
processor = DocumentProcessor()


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResult(BaseModel):
    text: str
    score: float
    metadata: dict


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document.
    Extracts text, generates embeddings, and stores in vector database.
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    allowed_extensions = ['.pdf', '.txt', '.md', '.doc', '.docx']
    file_ext = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {allowed_extensions}"
        )

    try:
        raw = await file.read()

        logger.info("document_upload_start", filename=file.filename, size=len(raw))

        # Get document info
        doc_info = processor.get_document_info(raw, file.filename)

        # Extract text chunks
        texts = processor.extract_text(raw, filename=file.filename)

        if not texts:
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        logger.info("document_text_extracted", chunks=len(texts))

        # Generate embeddings
        embeddings = await embedding_service.embed_texts(texts)

        if not embeddings:
            raise HTTPException(status_code=500, detail="Failed to generate embeddings")

        logger.info("document_embeddings_generated", count=len(embeddings))

        # Store in vector database with metadata
        metadatas = [
            {
                "filename": file.filename,
                "chunk_index": i,
                "total_chunks": len(texts),
                "file_size": doc_info.get("size_kb", 0),
                "pages": doc_info.get("pages", 1)
            } 
            for i in range(len(texts))
        ]
        
        ids = await vector_store.add(embeddings, texts, metadatas)

        logger.info("document_stored", filename=file.filename, chunks=len(texts))

        return {
            "success": True,
            "filename": file.filename,
            "chunks": len(texts),
            "stored": True,
            "ids": ids,
            "info": doc_info
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("document_upload_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-multiple")
async def upload_multiple_documents(files: List[UploadFile] = File(...)):
    """Upload multiple documents at once."""
    
    results = []
    for file in files:
        try:
            result = await upload_document(file)
            results.append(result)
        except HTTPException as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": e.detail
            })
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })
    
    successful = sum(1 for r in results if r.get("success"))
    
    return {
        "total": len(files),
        "successful": successful,
        "failed": len(files) - successful,
        "results": results
    }


@router.post("/search", response_model=List[SearchResult])
async def search_documents(request: SearchRequest):
    """
    Search documents using semantic similarity.
    """
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        # Generate query embedding
        query_embedding = await embedding_service.embed_query(request.query)
        
        # Search vector store
        results = await vector_store.similarity_search(
            query_embedding=query_embedding,
            top_k=request.top_k
        )
        
        return [
            SearchResult(
                text=r.get("text", ""),
                score=r.get("score", 0),
                metadata=r.get("metadata", {})
            )
            for r in results
        ]
        
    except Exception as e:
        logger.error("search_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/count")
async def get_document_count():
    """Get the number of document chunks in the vector store."""
    count = vector_store.count()
    return {"count": count}


@router.get("/status")
async def get_rag_status():
    """Get RAG system status."""
    
    count = vector_store.count()
    
    return {
        "status": "ready" if count > 0 else "empty",
        "document_chunks": count,
        "vector_store": "chromadb" if not vector_store.use_memory_fallback else "memory",
        "embedding_service": "gemini" if embedding_service.gemini_configured else (
            "openai" if embedding_service.openai_client else "dummy"
        ),
        "embedding_dimension": embedding_service.get_dimension()
    }


@router.delete("/clear")
async def clear_documents():
    """Clear all documents from the vector store."""
    success = await vector_store.clear()
    return {"success": success, "message": "All documents cleared" if success else "Failed to clear"}


@router.delete("/document/{filename}")
async def delete_document(filename: str):
    """Delete all chunks of a specific document."""
    
    # This would require tracking document IDs - simplified for now
    # In production, you'd store document metadata separately
    
    return {
        "message": "Document deletion by filename requires document tracking. Use /clear to remove all documents."
    }