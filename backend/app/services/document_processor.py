"""
Document Processor - Text extraction and chunking
Askyia - No-Code AI Workflow Builder
"""

from typing import List
import structlog

logger = structlog.get_logger()


class DocumentProcessor:
    """
    Extracts text from documents and splits into chunks.
    Supports PDF, TXT, MD files.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text(self, file_bytes: bytes, filename: str = "") -> List[str]:
        """
        Extract text from file bytes and split into chunks.
        
        Args:
            file_bytes: Raw file content
            filename: Original filename (used to detect type)
        
        Returns:
            List of text chunks
        """
        
        file_ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
        
        logger.info("document_processing", filename=filename, extension=file_ext)
        
        # Extract raw text based on file type
        if file_ext == 'pdf':
            raw_text = self._extract_pdf(file_bytes)
        elif file_ext in ['txt', 'md']:
            raw_text = self._extract_text(file_bytes)
        else:
            raw_text = self._extract_text(file_bytes)
        
        if not raw_text:
            logger.warning("document_empty", filename=filename)
            return []
        
        # Split into chunks
        chunks = self._split_into_chunks(raw_text)
        
        logger.info("document_processed", filename=filename, chunks=len(chunks))
        return chunks
    
    def _extract_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF using PyMuPDF."""
        
        try:
            import fitz  # PyMuPDF
            
            # Open PDF from bytes
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            
            text_parts = []
            for page_num, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    text_parts.append(f"[Page {page_num + 1}]\n{text}")
            
            doc.close()
            
            full_text = "\n\n".join(text_parts)
            logger.info("pdf_extracted", pages=len(text_parts), length=len(full_text))
            return full_text
            
        except ImportError:
            logger.warning("PyMuPDF not installed, falling back to text extraction")
            return self._extract_text(file_bytes)
        except Exception as e:
            logger.error("pdf_extraction_failed", error=str(e))
            return self._extract_text(file_bytes)
    
    def _extract_text(self, file_bytes: bytes) -> str:
        """Extract text from plain text file."""
        
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
        
        for encoding in encodings:
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue
        
        # Last resort: ignore errors
        return file_bytes.decode('utf-8', errors='ignore')
    
    def _split_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        
        if not text:
            return []
        
        # Clean text
        text = text.strip()
        text = ' '.join(text.split())  # Normalize whitespace
        
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Find end of chunk
            end = start + self.chunk_size
            
            if end >= len(text):
                # Last chunk
                chunks.append(text[start:].strip())
                break
            
            # Try to break at sentence boundary
            break_point = self._find_break_point(text, start, end)
            
            chunk = text[start:break_point].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start with overlap
            start = break_point - self.chunk_overlap
            if start < 0:
                start = 0
            
            # Prevent infinite loop
            if start >= len(text) - 1:
                break
        
        return chunks
    
    def _find_break_point(self, text: str, start: int, end: int) -> int:
        """Find a good break point (sentence end) near the target end."""
        
        # Look for sentence endings near the end
        search_start = max(start, end - 200)
        search_text = text[search_start:end]
        
        # Try to find sentence boundary
        for sep in ['. ', '.\n', '! ', '? ', '\n\n']:
            last_sep = search_text.rfind(sep)
            if last_sep != -1:
                return search_start + last_sep + len(sep)
        
        # Try to find word boundary
        last_space = search_text.rfind(' ')
        if last_space != -1:
            return search_start + last_space + 1
        
        # Just use the end
        return end