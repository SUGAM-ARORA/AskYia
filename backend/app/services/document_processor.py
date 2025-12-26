from typing import List


class DocumentProcessor:
    def extract_text(self, file_bytes: bytes) -> List[str]:
        # Placeholder extraction; replace with PyMuPDF integration.
        content = file_bytes.decode(errors="ignore")
        return [content]
