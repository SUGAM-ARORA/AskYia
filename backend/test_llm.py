"""
Quick test script for LLM service
Run: python test_llm.py
"""

import asyncio
import os
import sys

# Add the app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.llm_service import LLMService, get_llm_service


async def test_llm():
    print("=" * 50)
    print("Testing LLM Service")
    print("=" * 50)
    
    llm = get_llm_service()
    
    # Check available providers
    providers = llm.get_available_providers()
    print(f"\n✅ Available providers: {providers}")
    
    if not providers:
        print("❌ No LLM providers configured! Set OPENAI_API_KEY or GEMINI_API_KEY")
        return
    
    # Test query
    test_query = "What is the capital of France? Answer in one sentence."
    
    # Test OpenAI (if available)
    if "openai" in providers:
        print(f"\n🔵 Testing OpenAI...")
        try:
            response = await llm.generate(
                query=test_query,
                provider="openai",
                model="gpt-4o-mini",
                temperature=0.7,
                max_tokens=100
            )
            print(f"✅ OpenAI Response: {response}")
        except Exception as e:
            print(f"❌ OpenAI Error: {e}")
    
    # Test Gemini (if available)
    if "gemini" in providers:
        print(f"\n🟢 Testing Gemini...")
        try:
            response = await llm.generate(
                query=test_query,
                provider="gemini",
                model="gemini-1.5-flash",
                temperature=0.7,
                max_tokens=100
            )
            print(f"✅ Gemini Response: {response}")
        except Exception as e:
            print(f"❌ Gemini Error: {e}")
    
    # Test fallback
    print(f"\n🔄 Testing Fallback (forcing OpenAI to fail)...")
    try:
        # This tests the fallback mechanism
        response = await llm.generate(
            query=test_query,
            temperature=0.7,
            max_tokens=100,
            enable_fallback=True
        )
        print(f"✅ Fallback Response: {response}")
    except Exception as e:
        print(f"❌ Fallback Error: {e}")
    
    print("\n" + "=" * 50)
    print("Test Complete!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_llm())