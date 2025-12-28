"""
LLM Service - Gemini Primary (OpenAI as optional fallback)
Askyia - No-Code AI Workflow Builder
"""

import asyncio
from typing import Optional, List
from enum import Enum
import structlog

import google.generativeai as genai

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"


class LLMService:
    """LLM Service - Gemini primary, OpenAI optional fallback."""
    
    def __init__(self):
        # Initialize Gemini (primary)
        self.gemini_configured = False
        self.working_model = None  # Cache the working model name
        
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_configured = True
            logger.info("Gemini client initialized")
            
            # Try to find a working model at startup
            self._discover_working_model()
        else:
            logger.warning("Gemini API key not configured")
        
        # Initialize OpenAI (optional fallback)
        self.openai_client = None
        if settings.openai_api_key:
            try:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"OpenAI initialization failed: {e}")
    
    def _discover_working_model(self):
        """Discover available Gemini models at startup."""
        try:
            available_models = []
            for model in genai.list_models():
                if "generateContent" in model.supported_generation_methods:
                    available_models.append(model.name)
                    logger.debug("gemini_model_available", model=model.name)
            
            if available_models:
                # Prefer newer models
                preferred_order = [
                    "gemini-2.5-flash",
                    "gemini-2.5-pro", 
                    "gemini-2.0-flash",
                    "gemini-1.5-flash",
                    "gemini-1.5-pro",
                    "gemini-pro",
                ]
                
                for preferred in preferred_order:
                    for available in available_models:
                        if preferred in available:
                            self.working_model = available
                            logger.info("gemini_model_selected", model=self.working_model)
                            return
                
                # Use first available if no preferred match
                self.working_model = available_models[0]
                logger.info("gemini_model_selected", model=self.working_model)
            else:
                logger.warning("No Gemini models available")
                
        except Exception as e:
            logger.warning(f"Failed to discover Gemini models: {e}")
    
    async def generate(
        self,
        query: str,
        context: Optional[str] = None,
        prompt: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> str:
        """Generate a response using Gemini (primary) or OpenAI (fallback)."""
        
        # Build prompt
        full_prompt = self._build_prompt(query, context, prompt)
        
        # Determine which provider to use
        use_gemini = True
        if provider and provider.lower() == "openai" and self.openai_client:
            use_gemini = False
        elif model and "gpt" in model.lower() and self.openai_client:
            use_gemini = False
        
        logger.info(
            "llm_generate_request",
            provider="gemini" if use_gemini else "openai",
            query_length=len(query),
            has_context=bool(context)
        )
        
        # Try Gemini first (primary)
        if use_gemini and self.gemini_configured:
            try:
                return await self._generate_gemini(full_prompt, model, temperature, max_tokens)
            except Exception as e:
                logger.error("gemini_failed", error=str(e))
                # Try OpenAI as fallback
                if self.openai_client:
                    try:
                        return await self._generate_openai(full_prompt, model, temperature, max_tokens)
                    except Exception as e2:
                        raise ValueError(f"Both providers failed. Gemini: {str(e)}. OpenAI: {str(e2)}")
                raise ValueError(f"Gemini error: {str(e)}")
        
        # Try OpenAI if specified
        if self.openai_client:
            try:
                return await self._generate_openai(full_prompt, model, temperature, max_tokens)
            except Exception as e:
                raise ValueError(f"OpenAI error: {str(e)}")
        
        raise ValueError("No LLM provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.")
    
    def _build_prompt(self, query: str, context: Optional[str], system_prompt: Optional[str]) -> str:
        """Build a single combined prompt."""
        parts = []
        
        # System instruction
        if system_prompt:
            parts.append(f"Instructions: {system_prompt}")
        else:
            parts.append("Instructions: You are a helpful AI assistant. Answer questions accurately and concisely.")
        
        # Context if provided
        if context:
            parts.append(f"\nContext:\n{context}")
        
        # User query
        parts.append(f"\nQuestion: {query}")
        parts.append("\nAnswer:")
        
        return "\n".join(parts)
    
    async def _generate_gemini(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate using Google Gemini - uses discovered or tries multiple models."""
        
        # Model names to try (latest Gemini 2.5/2.0 + older versions)
        model_options = [
            # Gemini 2.5 series (latest stable)
            "gemini-2.5-flash-preview-05-20",
            "gemini-2.5-pro-preview-05-06",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            # Gemini 2.0 series
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-2.0-pro",
            # Gemini 1.5 series (fallback)
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
            # Legacy
            "gemini-pro",
            # With models/ prefix
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash", 
            "models/gemini-1.5-flash",
            "models/gemini-pro",
        ]
        
        # If we discovered a working model, try it first
        if self.working_model:
            model_options.insert(0, self.working_model)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_models = []
        for m in model_options:
            if m not in seen:
                seen.add(m)
                unique_models.append(m)
        
        last_error = None
        
        for model_name in unique_models:
            try:
                logger.debug("gemini_trying_model", model=model_name)
                
                gemini_model = genai.GenerativeModel(model_name=model_name)
                
                generation_config = {
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                }
                
                # Run sync API in executor
                def sync_generate():
                    return gemini_model.generate_content(
                        prompt,
                        generation_config=generation_config
                    )
                
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, sync_generate)
                
                # Extract text from response
                result = None
                
                if hasattr(response, 'text'):
                    result = response.text
                elif hasattr(response, 'parts') and response.parts:
                    result = ''.join(part.text for part in response.parts if hasattr(part, 'text'))
                elif hasattr(response, 'candidates') and response.candidates:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        result = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                    else:
                        result = str(response)
                else:
                    result = str(response)
                
                if result and result.strip():
                    # Cache this working model for future use
                    self.working_model = model_name
                    logger.info("gemini_success", model=model_name, response_length=len(result))
                    return result.strip()
                else:
                    logger.warning("gemini_empty_response", model=model_name)
                    continue
                    
            except Exception as e:
                last_error = str(e)
                # Don't log 404 errors as they're expected for unavailable models
                if "404" not in last_error:
                    logger.warning("gemini_model_failed", model=model_name, error=last_error)
                continue
        
        # All models failed
        raise ValueError(f"All Gemini models failed. Last error: {last_error}")
    
    async def _generate_openai(
        self,
        prompt: str,
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate using OpenAI (fallback)."""
        
        if not self.openai_client:
            raise ValueError("OpenAI not configured")
        
        model_name = model if model and "gpt" in model.lower() else "gpt-4o-mini"
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens
            )
            result = response.choices[0].message.content
            logger.info("openai_success", model=model_name)
            return result or "No response generated."
        except Exception as e:
            raise ValueError(f"OpenAI ({model_name}): {str(e)}")
    
    def get_available_providers(self) -> List[str]:
        providers = []
        if self.gemini_configured:
            providers.append("gemini")
        if self.openai_client:
            providers.append("openai")
        return providers


# Singleton
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service