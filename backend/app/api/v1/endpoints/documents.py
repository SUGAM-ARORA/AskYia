from fastapi import APIRouter, UploadFile, File
from app.services.document_processor import DocumentProcessor
from app.services.state import vector_store, embedding_service

router = APIRouter()
processor = DocumentProcessor()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    raw = await file.read()
    texts = processor.extract_text(raw)
    embeddings = await embedding_service.embed_texts(texts)
    await vector_store.add(embeddings, texts)
    return {"chunks": len(texts), "stored": True}
