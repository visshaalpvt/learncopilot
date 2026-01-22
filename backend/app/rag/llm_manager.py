"""
==============================================================================
LEARNCOPILOT - MULTI-LLM MANAGER
Model-Agnostic Inference with Automatic Fallback
==============================================================================

This module handles:
- Multiple LLM provider support (Groq, OpenRouter, etc.)
- Automatic fallback on failures
- Response caching
- Usage tracking

Author: LearnCopilot Team
==============================================================================
"""

import os
import json
import time
import httpx
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum
import asyncio


class LLMProvider(Enum):
    """Supported LLM providers"""
    GROQ = "groq"
    OPENROUTER = "openrouter"
    OPENAI = "openai"
    LOCAL = "local"  # For demo mode


@dataclass
class LLMResponse:
    """Response from LLM"""
    content: str
    provider: LLMProvider
    model: str
    tokens_used: int
    latency_ms: float
    cached: bool = False


@dataclass
class ProviderConfig:
    """Configuration for an LLM provider"""
    provider: LLMProvider
    api_key: str
    base_url: str
    default_model: str
    fallback_models: List[str]
    max_tokens: int = 2048
    temperature: float = 0.7


class LLMManager:
    """
    Multi-LLM Manager with automatic fallback.
    
    Features:
    - Priority-based provider selection
    - Automatic fallback on errors
    - Response caching (optional)
    - Usage tracking and metrics
    """
    
    def __init__(self):
        self.providers: Dict[LLMProvider, ProviderConfig] = {}
        self.provider_priority: List[LLMProvider] = []
        
        # Metrics
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.provider_usage: Dict[LLMProvider, int] = {}
        self.fallback_count = 0
        
        # Simple cache
        self.cache: Dict[str, LLMResponse] = {}
        self.cache_enabled = True
        self.cache_max_size = 1000
        
        # Initialize providers from environment
        self._init_providers()
    
    def _init_providers(self):
        """Initialize providers from environment variables."""
        
        # Groq (Primary)
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            self.providers[LLMProvider.GROQ] = ProviderConfig(
                provider=LLMProvider.GROQ,
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                default_model="llama-3.3-70b-versatile",
                fallback_models=["llama-3.1-8b-instant", "mixtral-8x7b-32768"],
                max_tokens=4096,
                temperature=0.7
            )
            self.provider_priority.append(LLMProvider.GROQ)
        
        # OpenRouter (Secondary)
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key:
            self.providers[LLMProvider.OPENROUTER] = ProviderConfig(
                provider=LLMProvider.OPENROUTER,
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1",
                default_model="meta-llama/llama-3.1-8b-instruct:free",
                fallback_models=["google/gemma-2-9b-it:free", "mistralai/mistral-7b-instruct:free"],
                max_tokens=2048,
                temperature=0.7
            )
            self.provider_priority.append(LLMProvider.OPENROUTER)
        
        # OpenAI (Tertiary)
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.providers[LLMProvider.OPENAI] = ProviderConfig(
                provider=LLMProvider.OPENAI,
                api_key=openai_key,
                base_url="https://api.openai.com/v1",
                default_model="gpt-3.5-turbo",
                fallback_models=["gpt-3.5-turbo-16k"],
                max_tokens=2048,
                temperature=0.7
            )
            self.provider_priority.append(LLMProvider.OPENAI)
        
        # Local fallback (always available for demo)
        self.providers[LLMProvider.LOCAL] = ProviderConfig(
            provider=LLMProvider.LOCAL,
            api_key="",
            base_url="",
            default_model="demo-model",
            fallback_models=[],
            max_tokens=1024,
            temperature=0.0
        )
        self.provider_priority.append(LLMProvider.LOCAL)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        use_cache: bool = True
    ) -> LLMResponse:
        """
        Generate a response using the best available LLM.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Override max tokens
            temperature: Override temperature
            use_cache: Whether to use cache
            
        Returns:
            LLMResponse with generated content
        """
        self.total_requests += 1
        
        # Check cache
        if use_cache and self.cache_enabled:
            cache_key = self._cache_key(prompt, system_prompt)
            if cache_key in self.cache:
                cached = self.cache[cache_key]
                cached.cached = True
                return cached
        
        # Try providers in priority order
        last_error = None
        for provider in self.provider_priority:
            if provider not in self.providers:
                continue
            
            config = self.providers[provider]
            
            # Try default model first, then fallbacks
            models_to_try = [config.default_model] + config.fallback_models
            
            for model in models_to_try:
                try:
                    response = await self._call_provider(
                        config=config,
                        model=model,
                        prompt=prompt,
                        system_prompt=system_prompt,
                        max_tokens=max_tokens or config.max_tokens,
                        temperature=temperature if temperature is not None else config.temperature
                    )
                    
                    self.successful_requests += 1
                    self.provider_usage[provider] = self.provider_usage.get(provider, 0) + 1
                    
                    # Cache response
                    if use_cache and self.cache_enabled:
                        self._add_to_cache(cache_key, response)
                    
                    return response
                    
                except Exception as e:
                    last_error = e
                    self.fallback_count += 1
                    continue
        
        # All providers failed
        self.failed_requests += 1
        raise Exception(f"All LLM providers failed. Last error: {last_error}")
    
    async def _call_provider(
        self,
        config: ProviderConfig,
        model: str,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> LLMResponse:
        """Call a specific LLM provider."""
        
        # Handle local/demo mode
        if config.provider == LLMProvider.LOCAL:
            return self._local_response(prompt, system_prompt)
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Build request
        headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json"
        }
        
        # Add OpenRouter specific headers
        if config.provider == LLMProvider.OPENROUTER:
            headers["HTTP-Referer"] = "https://learncopilot.ai"
            headers["X-Title"] = "LearnCopilot"
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        start_time = time.time()
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{config.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
        
        latency = (time.time() - start_time) * 1000
        
        # Parse response
        content = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", 0)
        
        return LLMResponse(
            content=content,
            provider=config.provider,
            model=model,
            tokens_used=tokens,
            latency_ms=latency,
            cached=False
        )
    
    def _local_response(self, prompt: str, system_prompt: Optional[str]) -> LLMResponse:
        """Generate a demo/local response."""
        
        # Simple template-based responses for demo
        prompt_lower = prompt.lower()
        
        if "explain" in prompt_lower or "what is" in prompt_lower:
            content = """Based on your study materials, here's an explanation:

This concept is fundamental to understanding the subject. The key points are:

1. **Core Definition**: The basic principle that governs this topic
2. **Key Components**: The essential elements that make up this concept
3. **Application**: How this is used in practical scenarios

Would you like me to elaborate on any specific aspect?"""
        
        elif "example" in prompt_lower:
            content = """Here's an example from your course materials:

**Example:**
Consider a scenario where we need to apply this concept...

**Step 1:** First, identify the key variables
**Step 2:** Apply the relevant formula or principle
**Step 3:** Calculate and verify the result

This demonstrates how the concept works in practice."""
        
        elif "lab" in prompt_lower or "practical" in prompt_lower:
            content = """Here's the procedure from your lab manual:

**Objective:** To demonstrate the practical application of the concept

**Materials Required:**
- Required equipment and materials

**Procedure:**
1. Set up the apparatus as shown in the diagram
2. Follow safety precautions
3. Perform the experiment steps
4. Record observations
5. Analyze results

**Expected Outcome:** The experiment should demonstrate..."""
        
        else:
            content = """I'm here to help with your studies. Based on my understanding:

Your question touches on an important academic concept. To provide the most accurate information, I'm drawing from your uploaded study materials.

Please let me know if you'd like:
- A detailed explanation of specific topics
- Examples and practice problems
- Lab procedures and practical guidance
- Exam preparation tips"""
        
        return LLMResponse(
            content=content,
            provider=LLMProvider.LOCAL,
            model="demo-model",
            tokens_used=len(content.split()),
            latency_ms=50,
            cached=False
        )
    
    def _cache_key(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate cache key."""
        import hashlib
        content = f"{system_prompt or ''}{prompt}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _add_to_cache(self, key: str, response: LLMResponse):
        """Add response to cache with size limit."""
        if len(self.cache) >= self.cache_max_size:
            # Remove oldest entry
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = response
    
    def get_metrics(self) -> Dict:
        """Get LLM manager metrics."""
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "fallback_count": self.fallback_count,
            "success_rate": self.successful_requests / max(1, self.total_requests),
            "provider_usage": {p.value: c for p, c in self.provider_usage.items()},
            "cache_size": len(self.cache),
            "available_providers": [p.value for p in self.provider_priority if p in self.providers]
        }
    
    def clear_cache(self):
        """Clear response cache."""
        self.cache.clear()


# Singleton instance
llm_manager = LLMManager()
