"""
Document Processor - Text extraction and chunking
Askyia - No-Code AI Workflow Builder
"""

from typing import List, Optional, Dict, Any
import structlog
import re

logger = structlog.get_logger()


class DocumentProcessor:
    """
    Extracts text from documents and splits into chunks.
    Supports PDF, TXT, MD, DOC files.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
        # Check if PyMuPDF is available
        self.pymupdf_available = False
        try:
            import fitz
            self.pymupdf_available = True
            logger.info("PyMuPDF available for PDF processing")
        except ImportError:
            logger.warning("PyMuPDF not installed - PDF support limited")
    
    def extract_text(
        self,
        file_bytes: bytes,
        filename: str = ""
    ) -> List[str]:
        """
        Extract text from file bytes and split into chunks.
        
        Args:
            file_bytes: Raw file content
            filename: Original filename (used to detect type)
        
        Returns:
            List of text chunks
        """
        
        file_ext = self._get_extension(filename)
        
        logger.info(
            "document_processing_start",
            filename=filename,
            extension=file_ext,
            size_bytes=len(file_bytes)
        )
        
        # Extract raw text based on file type
        if file_ext == 'pdf':
            raw_text = self._extract_pdf(file_bytes, filename)
        elif file_ext in ['txt', 'md', 'text']:
            raw_text = self._extract_text_file(file_bytes)
        elif file_ext in ['doc', 'docx']:
            raw_text = self._extract_doc(file_bytes)
        else:
            # Try as plain text
            raw_text = self._extract_text_file(file_bytes)
        
        if not raw_text or not raw_text.strip():
            logger.warning("document_empty", filename=filename)
            return []
        
        # Clean the text
        raw_text = self._clean_text(raw_text)
        
        # Split into chunks
        chunks = self._split_into_chunks(raw_text)
        
        # Filter out too-small chunks
        chunks = [c for c in chunks if len(c) >= self.min_chunk_size]
        
        logger.info(
            "document_processed",
            filename=filename,
            total_chars=len(raw_text),
            chunks=len(chunks)
        )
        
        return chunks
    
    def _get_extension(self, filename: str) -> str:
        """Extract file extension."""
        if '.' in filename:
            return filename.rsplit('.', 1)[-1].lower()
        return 'txt'
    
    def _extract_pdf(self, file_bytes: bytes, filename: str) -> str:
        """Extract text from PDF using PyMuPDF."""
        
        if not self.pymupdf_available:
            logger.warning("pymupdf_not_available", filename=filename)
            return self._extract_text_file(file_bytes)
        
        try:
            import fitz  # PyMuPDF
            
            # Open PDF from bytes
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            
            text_parts = []
            total_pages = len(doc)
            
            for page_num in range(total_pages):
                page = doc[page_num]
                
                # Extract text with better formatting
                text = page.get_text("text")
                
                if text and text.strip():
                    # Add page marker for long documents
                    if total_pages > 1:
                        text_parts.append(f"--- Page {page_num + 1} ---\n{text}")
                    else:
                        text_parts.append(text)
            
            doc.close()
            
            full_text = "\n\n".join(text_parts)
            
            logger.info(
                "pdf_extracted",
                filename=filename,
                pages=total_pages,
                chars=len(full_text)
            )
            
            return full_text
            
        except Exception as e:
            logger.error("pdf_extraction_failed", filename=filename, error=str(e))
            # Fallback to basic text extraction
            return self._extract_text_file(file_bytes)
    
    def _extract_text_file(self, file_bytes: bytes) -> str:
        """Extract text from plain text file."""
        
        # Try different encodings
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'ascii']
        
        for encoding in encodings:
            try:
                text = file_bytes.decode(encoding)
                logger.debug("text_decoded", encoding=encoding)
                return text
            except (UnicodeDecodeError, LookupError):
                continue
        
        # Last resort: ignore errors
        return file_bytes.decode('utf-8', errors='ignore')
    
    def _extract_doc(self, file_bytes: bytes) -> str:
        """Extract text from DOC/DOCX files."""
        
        # Try python-docx for .docx files
        try:
            from io import BytesIO
            from docx import Document
            
            doc = Document(BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
            
        except ImportError:
            logger.warning("python-docx not installed")
        except Exception as e:
            logger.warning(f"docx extraction failed: {e}")
        
        # Fallback to plain text
        return self._extract_text_file(file_bytes)
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        
        if not text:
            return ""
        
        # Replace multiple whitespace with single space
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Replace multiple newlines with double newline
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove leading/trailing whitespace from lines
        lines = [line.strip() for line in text.split('\n')]
        text = '\n'.join(lines)
        
        # Remove excessive newlines (more than 2)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
    
    def _split_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        
        if not text:
            return []
        
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Determine end of chunk
            end = start + self.chunk_size
            
            if end >= len(text):
                # Last chunk
                chunk = text[start:].strip()
                if chunk:
                    chunks.append(chunk)
                break
            
            # Try to find a good break point
            break_point = self._find_break_point(text, start, end)
            
            chunk = text[start:break_point].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start with overlap
            start = max(start + 1, break_point - self.chunk_overlap)
        
        return chunks
    
    def _find_break_point(self, text: str, start: int, end: int) -> int:
        """Find a good break point (sentence/paragraph end) near target."""
        
        # Look for breaks in the last portion of the chunk
        search_start = max(start, end - 300)
        search_text = text[search_start:end]
        
        # Priority: paragraph break > sentence end > word break
        
        # 1. Try paragraph break
        para_break = search_text.rfind('\n\n')
        if para_break != -1 and para_break > len(search_text) * 0.3:
            return search_start + para_break + 2
        
        # 2. Try sentence endings
        for sep in ['. ', '.\n', '! ', '? ', '.\t']:
            last_sep = search_text.rfind(sep)
            if last_sep != -1 and last_sep > len(search_text) * 0.3:
                return search_start + last_sep + len(sep)
        
        # 3. Try newline
        newline = search_text.rfind('\n')
        if newline != -1 and newline > len(search_text) * 0.3:
            return search_start + newline + 1
        
        # 4. Try word boundary
        space = search_text.rfind(' ')
        if space != -1:
            return search_start + space + 1
        
        # 5. Just use the end
        return end
    
    def get_document_info(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Get information about a document without full processing."""
        
        file_ext = self._get_extension(filename)
        
        info = {
            "filename": filename,
            "extension": file_ext,
            "size_bytes": len(file_bytes),
            "size_kb": round(len(file_bytes) / 1024, 2)
        }
        
        if file_ext == 'pdf' and self.pymupdf_available:
            try:
                import fitz
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                info["pages"] = len(doc)
                info["title"] = doc.metadata.get("title", "")
                info["author"] = doc.metadata.get("author", "")
                doc.close()
            except:
                pass
        
        return info