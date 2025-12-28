"""
Document Upload and Processing Endpoints
Askyia - No-Code AI Workflow Builder
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import structlog

from app.services.document_processor import DocumentProcessor
from app.services.state import vector_store, embedding_service

logger = structlog.get_logger()
router = APIRouter()
processor = DocumentProcessor()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and process a document.
    Extracts text, generates embeddings, and stores in vector database.
    """
    
    # Validate file
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
        # Read file content
        raw = await file.read()
        
        logger.info("document_upload_start", filename=file.filename, size=len(raw))
        
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
        
        # Store in vector database
        metadatas = [{"filename": file.filename, "chunk_index": i} for i in range(len(texts))]
        ids = await vector_store.add(embeddings, texts, metadatas)
        
        logger.info("document_stored", filename=file.filename, chunks=len(texts))
        
        return {
            "success": True,
            "filename": file.filename,
            "chunks": len(texts),
            "stored": True,
            "ids": ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("document_upload_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/count")
async def get_document_count():
    """Get the number of document chunks in the vector store."""
    count = vector_store.count()
    return {"count": count}


@router.delete("/clear")
async def clear_documents():
    """Clear all documents from the vector store."""
    success = await vector_store.clear()
    return {"success": success}