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
    GOOGLE = "google"


class LLMService:
    """LLM Service - Gemini primary, OpenAI optional fallback."""

    def __init__(self):
        # Initialize Gemini (primary)
        self.gemini_configured = False
        self.working_model = None
        self.available_models = []

        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.gemini_configured = True
            logger.info("Gemini client initialized")

            # Discover available models at startup
            self._discover_available_models()
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

    def _discover_available_models(self):
        """Discover available Gemini models at startup."""
        try:
            self.available_models = []
            
            for model in genai.list_models():
                if "generateContent" in model.supported_generation_methods:
                    # Store both with and without 'models/' prefix
                    full_name = model.name  # e.g., "models/gemini-1.5-flash"
                    short_name = model.name.replace("models/", "")  # e.g., "gemini-1.5-flash"
                    
                    self.available_models.append(short_name)
                    logger.debug("gemini_model_available", model=short_name)

            logger.info("gemini_models_discovered", 
                       count=len(self.available_models),
                       models=self.available_models[:10])  # Log first 10

            # Set default working model (prefer latest)
            if self.available_models:
                # Priority order for default model
                preferred = [
                    "gemini-2.5-flash-preview-05-20",
                    "gemini-2.5-flash",
                    "gemini-2.5-pro-preview-05-06",
                    "gemini-2.5-pro",
                    "gemini-2.0-flash",
                    "gemini-2.0-flash-exp",
                    "gemini-1.5-flash-latest",
                    "gemini-1.5-flash",
                    "gemini-1.5-pro-latest",
                    "gemini-1.5-pro",
                ]
                
                for pref in preferred:
                    if pref in self.available_models:
                        self.working_model = pref
                        break
                
                if not self.working_model:
                    self.working_model = self.available_models[0]
                
                logger.info("gemini_default_model", model=self.working_model)

        except Exception as e:
            logger.error(f"Failed to discover Gemini models: {e}")
            self.working_model = "gemini-1.5-flash"

    def _normalize_model_name(self, model_name: str) -> str:
        """Normalize model name to match Gemini API format."""
        if not model_name:
            return self.working_model or "gemini-1.5-flash"
        
        # Remove 'models/' prefix if present
        normalized = model_name.replace("models/", "")
        
        # Handle UI display names (e.g., "Gemini 2.5 Flash ✨")
        # Convert to API format
        ui_to_api = {
            "Gemini 2.5 Flash": "gemini-2.5-flash-preview-05-20",
            "Gemini 2.5 Pro": "gemini-2.5-pro-preview-05-06",
            "Gemini 2.0 Flash": "gemini-2.0-flash",
            "Gemini 1.5 Flash": "gemini-1.5-flash",
            "Gemini 1.5 Pro": "gemini-1.5-pro",
            "Gemini Pro": "gemini-1.5-pro",
        }
        
        # Check if it's a UI display name
        for ui_name, api_name in ui_to_api.items():
            if ui_name.lower() in normalized.lower():
                logger.debug("model_ui_to_api", ui=normalized, api=api_name)
                return api_name
        
        return normalized

    def _get_model_fallbacks(self, requested_model: str) -> List[str]:
        """Get list of models to try, starting with requested model."""
        models_to_try = []
        
        # First, add the requested model
        if requested_model:
            models_to_try.append(requested_model)
        
        # Add variations of the requested model
        if requested_model:
            base = requested_model.split("-preview")[0]  # e.g., "gemini-2.5-flash"
            
            # Try with different suffixes
            variations = [
                requested_model,
                f"{base}-preview-05-20",
                f"{base}-preview-05-06",
                f"{base}-latest",
                base,
                f"{base}-exp",
            ]
            
            for v in variations:
                if v not in models_to_try and v in self.available_models:
                    models_to_try.append(v)
        
        # Add fallbacks from available models
        fallback_priority = [
            "gemini-2.5-flash-preview-05-20",
            "gemini-2.5-flash",
            "gemini-2.5-pro-preview-05-06",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro",
        ]
        
        for fb in fallback_priority:
            if fb not in models_to_try and fb in self.available_models:
                models_to_try.append(fb)
        
        # If still empty, add any available model
        if not models_to_try and self.available_models:
            models_to_try.extend(self.available_models[:3])
        
        return models_to_try

    async def generate(
        self,
        query: str,
        context: Optional[str] = None,
        prompt: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        **kwargs
    ) -> str:
        """Generate a response using Gemini (primary) or OpenAI (fallback)."""

        # Build prompt
        full_prompt = self._build_prompt(query, context, prompt)

        # Determine which provider to use
        use_gemini = True
        provider_lower = (provider or "google").lower()
        
        if provider_lower == "openai" and self.openai_client:
            use_gemini = False
        elif model and "gpt" in model.lower() and self.openai_client:
            use_gemini = False

        # Normalize model name
        normalized_model = self._normalize_model_name(model)

        logger.info(
            "llm_generate_request",
            provider="gemini" if use_gemini else "openai",
            requested_model=model,
            normalized_model=normalized_model,
            query_length=len(query),
            has_context=bool(context),
            temperature=temperature
        )

        # Try Gemini first (primary)
        if use_gemini and self.gemini_configured:
            try:
                return await self._generate_gemini(full_prompt, normalized_model, temperature, max_tokens)
            except Exception as e:
                error_str = str(e)
                logger.error("gemini_failed", error=error_str)
                
                # Try OpenAI as fallback
                if self.openai_client:
                    try:
                        logger.info("falling_back_to_openai")
                        return await self._generate_openai(full_prompt, None, temperature, max_tokens)
                    except Exception as e2:
                        raise ValueError(f"Both providers failed. Gemini: {error_str}. OpenAI: {str(e2)}")
                raise ValueError(f"Gemini error: {error_str}")

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
        """Generate using Google Gemini - tries requested model first, then fallbacks."""

        # Get list of models to try
        models_to_try = self._get_model_fallbacks(model)
        
        logger.info("gemini_models_to_try", models=models_to_try[:5])

        last_error = None

        for model_name in models_to_try:
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
                # Only log non-404 errors (404 means model not available)
                if "404" not in last_error:
                    logger.warning("gemini_model_error", model=model_name, error=last_error)
                continue

        # All models failed
        raise ValueError(f"All Gemini models failed. Tried: {models_to_try[:3]}. Last error: {last_error}")

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