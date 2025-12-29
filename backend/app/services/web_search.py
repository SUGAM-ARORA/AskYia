"""
Web Search Service - SerpAPI Integration
Askyia - No-Code AI Workflow Builder
"""

import asyncio
from typing import List, Dict, Any, Optional
import structlog
import httpx

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class WebSearchService:
    """
    Web Search Service using SerpAPI for Google Search results.
    """
    
    SERPAPI_URL = "https://serpapi.com/search"
    
    def __init__(self):
        self.api_key = settings.serpapi_api_key
        self.configured = bool(self.api_key)
        
        if self.configured:
            logger.info("SerpAPI web search initialized")
        else:
            logger.warning("SerpAPI key not configured - web search disabled")
    
    async def search(
        self,
        query: str,
        num_results: int = 5,
        search_type: str = "google"
    ) -> str:
        """
        Search the web and return formatted results.
        
        Args:
            query: Search query
            num_results: Number of results to return (max 10)
            search_type: Type of search (google, news, images)
        
        Returns:
            Formatted string with search results
        """
        
        if not self.configured:
            logger.warning("web_search_not_configured")
            return "Web search is not configured. Please set SERPAPI_API_KEY."
        
        if not query:
            return "No search query provided."
        
        logger.info("web_search_start", query=query[:100], num_results=num_results)
        
        try:
            results = await self._fetch_results(query, num_results, search_type)
            
            if not results:
                return f"No results found for: {query}"
            
            formatted = self._format_results(results)
            
            logger.info("web_search_success", query=query[:50], results_count=len(results))
            return formatted
            
        except Exception as e:
            logger.error("web_search_failed", error=str(e))
            return f"Web search failed: {str(e)}"
    
    async def search_structured(
        self,
        query: str,
        num_results: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search the web and return structured results.
        
        Returns:
            List of dicts with title, link, snippet
        """
        
        if not self.configured:
            return []
        
        try:
            return await self._fetch_results(query, num_results)
        except Exception as e:
            logger.error("web_search_structured_failed", error=str(e))
            return []
    
    async def _fetch_results(
        self,
        query: str,
        num_results: int,
        search_type: str = "google"
    ) -> List[Dict[str, Any]]:
        """Fetch results from SerpAPI."""
        
        params = {
            "q": query,
            "api_key": self.api_key,
            "engine": search_type,
            "num": min(num_results, 10),
            "hl": "en",
            "gl": "us"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.SERPAPI_URL, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Extract organic results
        organic_results = data.get("organic_results", [])
        
        results = []
        for item in organic_results[:num_results]:
            results.append({
                "title": item.get("title", "No title"),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", "No description"),
                "position": item.get("position", 0)
            })
        
        # Also check for answer box or knowledge graph
        if "answer_box" in data:
            answer_box = data["answer_box"]
            if "answer" in answer_box:
                results.insert(0, {
                    "title": "Featured Answer",
                    "link": answer_box.get("link", ""),
                    "snippet": answer_box.get("answer", ""),
                    "position": 0,
                    "featured": True
                })
            elif "snippet" in answer_box:
                results.insert(0, {
                    "title": answer_box.get("title", "Featured Result"),
                    "link": answer_box.get("link", ""),
                    "snippet": answer_box.get("snippet", ""),
                    "position": 0,
                    "featured": True
                })
        
        return results
    
    def _format_results(self, results: List[Dict[str, Any]]) -> str:
        """Format results into a readable string for LLM context."""
        
        if not results:
            return "No search results found."
        
        formatted_parts = []
        
        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            snippet = result.get("snippet", "No description")
            link = result.get("link", "")
            
            if result.get("featured"):
                formatted_parts.append(f"**Featured Answer:**\n{snippet}")
            else:
                formatted_parts.append(
                    f"{i}. **{title}**\n"
                    f"   {snippet}\n"
                    f"   Source: {link}"
                )
        
        return "\n\n".join(formatted_parts)


# Singleton
_web_search_service: Optional[WebSearchService] = None


def get_web_search_service() -> WebSearchService:
    """Get or create web search service singleton."""
    global _web_search_service
    if _web_search_service is None:
        _web_search_service = WebSearchService()
    return _web_search_service