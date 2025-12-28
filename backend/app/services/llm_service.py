"""
LLM Service - OpenAI and Gemini with Fallback Support
Askyia - No-Code AI Workflow Builder
"""

import asyncio
from typing import Optional, Dict, Any, List
from enum import Enum
import structlog

# OpenAI
from openai import AsyncOpenAI, APIError as OpenAIError

# Google Gemini
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"


class LLMModel(str, Enum):
    # OpenAI Models
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4O = "gpt-4o"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo"
    GPT_35_TURBO = "gpt-3.5-turbo"
    
    # Gemini Models
    GEMINI_PRO = "gemini-pro"
    GEMINI_15_PRO = "gemini-1.5-pro"
    GEMINI_15_FLASH = "gemini-1.5-flash"


# Model to Provider mapping
MODEL_PROVIDER_MAP = {
    LLMModel.GPT_4O_MINI: LLMProvider.OPENAI,
    LLMModel.GPT_4O: LLMProvider.OPENAI,
    LLMModel.GPT_4: LLMProvider.OPENAI,
    LLMModel.GPT_4_TURBO: LLMProvider.OPENAI,
    LLMModel.GPT_35_TURBO: LLMProvider.OPENAI,
    LLMModel.GEMINI_PRO: LLMProvider.GEMINI,
    LLMModel.GEMINI_15_PRO: LLMProvider.GEMINI,
    LLMModel.GEMINI_15_FLASH: LLMProvider.GEMINI,
}


class LLMService:
    """
    Unified LLM Service supporting OpenAI and Gemini with automatic fallback.
    
    Usage:
        llm = LLMService()
        response = await llm.generate(
            query="What is AI?",
            context="AI is artificial intelligence...",
            prompt="You are a helpful assistant.",
            provider="openai",  # or "gemini"
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1024
        )
    """
    
    def __init__(self):
        # Initialize OpenAI client
        self.openai_client: Optional[AsyncOpenAI] = None
        if settings.openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
            logger.info("OpenAI client initialized")
        else:
            logger.warning("OpenAI API key not configured")
        
        # Initialize Gemini
        self.gemini_configured = False
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_configured = True
            logger.info("Gemini client initialized")
        else:
            logger.warning("Gemini API key not configured")
    
    async def generate(
        self,
        query: str,
        context: Optional[str] = None,
        prompt: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        enable_fallback: bool = True,
        **kwargs
    ) -> str:
        """
        Generate a response using the specified LLM provider.
        
        Args:
            query: The user's question/query
            context: Optional context from knowledge base or web search
            prompt: Optional system prompt
            provider: "openai" or "gemini" (auto-detected from model if not specified)
            model: Specific model to use
            temperature: Creativity parameter (0.0 - 1.0)
            max_tokens: Maximum tokens in response
            enable_fallback: If True, falls back to other provider on failure
            
        Returns:
            Generated response string
        """
        # Build the full prompt
        full_prompt = self._build_prompt(query, context, prompt)
        
        # Determine provider and model
        resolved_provider, resolved_model = self._resolve_provider_model(provider, model)
        
        logger.info(
            "llm_generate_request",
            provider=resolved_provider,
            model=resolved_model,
            query_length=len(query),
            has_context=bool(context),
            temperature=temperature
        )
        
        try:
            # Try primary provider
            if resolved_provider == LLMProvider.OPENAI:
                return await self._generate_openai(
                    full_prompt, resolved_model, temperature, max_tokens
                )
            else:
                return await self._generate_gemini(
                    full_prompt, resolved_model, temperature, max_tokens
                )
                
        except Exception as e:
            logger.error(
                "llm_primary_provider_failed",
                provider=resolved_provider,
                model=resolved_model,
                error=str(e)
            )
            
            # Fallback to other provider if enabled
            if enable_fallback:
                return await self._fallback_generate(
                    full_prompt, resolved_provider, temperature, max_tokens
                )
            else:
                raise
    
    def _build_prompt(
        self,
        query: str,
        context: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, str]:
        """Build structured prompt with system message and user message."""
        
        # Default system prompt
        if not system_prompt:
            system_prompt = (
                "You are a helpful AI assistant. Answer questions accurately and concisely. "
                "If context is provided, use it to inform your answer. "
                "If you don't know the answer, say so honestly."
            )
        
        # Build user message with context
        user_message = ""
        
        if context:
            user_message += f"### Context:\n{context}\n\n"
        
        user_message += f"### Question:\n{query}"
        
        return {
            "system": system_prompt,
            "user": user_message
        }
    
    def _resolve_provider_model(
        self,
        provider: Optional[str],
        model: Optional[str]
    ) -> tuple[LLMProvider, str]:
        """Resolve the provider and model to use."""
        
        # If model is specified, infer provider from model
        if model:
            model_lower = model.lower()
            
            # Check if it's a known model
            for llm_model in LLMModel:
                if llm_model.value == model_lower:
                    inferred_provider = MODEL_PROVIDER_MAP.get(llm_model, LLMProvider.OPENAI)
                    return (inferred_provider, model_lower)
            
            # Unknown model - try to infer from name
            if "gpt" in model_lower or "openai" in model_lower:
                return (LLMProvider.OPENAI, model_lower)
            elif "gemini" in model_lower:
                return (LLMProvider.GEMINI, model_lower)
        
        # If provider is specified
        if provider:
            provider_lower = provider.lower()
            if provider_lower == "gemini":
                return (LLMProvider.GEMINI, model or LLMModel.GEMINI_15_FLASH.value)
            else:
                return (LLMProvider.OPENAI, model or LLMModel.GPT_4O_MINI.value)
        
        # Default: OpenAI with gpt-4o-mini
        if self.openai_client:
            return (LLMProvider.OPENAI, LLMModel.GPT_4O_MINI.value)
        elif self.gemini_configured:
            return (LLMProvider.GEMINI, LLMModel.GEMINI_15_FLASH.value)
        else:
            raise ValueError("No LLM provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.")
    
    async def _generate_openai(
        self,
        prompt: Dict[str, str],
        model: str,
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using OpenAI."""
        
        if not self.openai_client:
            raise ValueError("OpenAI client not configured. Set OPENAI_API_KEY in environment.")
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": prompt["system"]},
                    {"role": "user", "content": prompt["user"]}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            result = response.choices[0].message.content
            
            logger.info(
                "openai_response_success",
                model=model,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                response_length=len(result) if result else 0
            )
            
            return result or "No response generated."
            
        except OpenAIError as e:
            logger.error("openai_api_error", error=str(e), model=model)
            raise
        except Exception as e:
            logger.error("openai_unexpected_error", error=str(e), model=model)
            raise
    
    async def _generate_gemini(
        self,
        prompt: Dict[str, str],
        model: str,
        temperature: float,
        max_tokens: int
    ) -> str:
        """Generate response using Google Gemini."""
        
        if not self.gemini_configured:
            raise ValueError("Gemini client not configured. Set GEMINI_API_KEY in environment.")
        
        try:
            # Create the model
            gemini_model = genai.GenerativeModel(
                model_name=model,
                system_instruction=prompt["system"]
            )
            
            # Generation config
            generation_config = GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            
            # Generate response (run in executor since it's sync)
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: gemini_model.generate_content(
                    prompt["user"],
                    generation_config=generation_config
                )
            )
            
            result = response.text
            
            logger.info(
                "gemini_response_success",
                model=model,
                response_length=len(result) if result else 0
            )
            
            return result or "No response generated."
            
        except Exception as e:
            logger.error("gemini_api_error", error=str(e), model=model)
            raise
    
    async def _fallback_generate(
        self,
        prompt: Dict[str, str],
        failed_provider: LLMProvider,
        temperature: float,
        max_tokens: int
    ) -> str:
        """Attempt to generate using fallback provider."""
        
        fallback_provider = (
            LLMProvider.GEMINI if failed_provider == LLMProvider.OPENAI 
            else LLMProvider.OPENAI
        )
        
        logger.info(
            "llm_fallback_attempt",
            failed_provider=failed_provider,
            fallback_provider=fallback_provider
        )
        
        try:
            if fallback_provider == LLMProvider.OPENAI and self.openai_client:
                return await self._generate_openai(
                    prompt, 
                    LLMModel.GPT_4O_MINI.value, 
                    temperature, 
                    max_tokens
                )
            elif fallback_provider == LLMProvider.GEMINI and self.gemini_configured:
                return await self._generate_gemini(
                    prompt,
                    LLMModel.GEMINI_15_FLASH.value,
                    temperature,
                    max_tokens
                )
            else:
                raise ValueError(f"Fallback provider {fallback_provider} not configured")
                
        except Exception as e:
            logger.error(
                "llm_fallback_failed",
                fallback_provider=fallback_provider,
                error=str(e)
            )
            raise ValueError(
                f"Both LLM providers failed. Primary: {failed_provider}, Fallback: {fallback_provider}. "
                f"Error: {str(e)}"
            )
    
    def get_available_providers(self) -> List[str]:
        """Return list of configured providers."""
        providers = []
        if self.openai_client:
            providers.append(LLMProvider.OPENAI.value)
        if self.gemini_configured:
            providers.append(LLMProvider.GEMINI.value)
        return providers
    
    def get_available_models(self, provider: Optional[str] = None) -> List[str]:
        """Return list of available models for a provider."""
        models = []
        
        if provider is None or provider.lower() == "openai":
            if self.openai_client:
                models.extend([
                    LLMModel.GPT_4O_MINI.value,
                    LLMModel.GPT_4O.value,
                    LLMModel.GPT_4.value,
                    LLMModel.GPT_4_TURBO.value,
                    LLMModel.GPT_35_TURBO.value,
                ])
        
        if provider is None or provider.lower() == "gemini":
            if self.gemini_configured:
                models.extend([
                    LLMModel.GEMINI_15_FLASH.value,
                    LLMModel.GEMINI_15_PRO.value,
                    LLMModel.GEMINI_PRO.value,
                ])
        
        return models


# Singleton instance for reuse
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service