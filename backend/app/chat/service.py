from __future__ import annotations

import asyncio
import json
import logging
from functools import partial
from typing import TYPE_CHECKING, AsyncIterator

from fastapi.sse import format_sse_event

if TYPE_CHECKING:
    from llama_cpp import Llama

logger = logging.getLogger("uvicorn.error")

# Serialize LLM access — llama-cpp holds a process-wide mutex
_llm_semaphore = asyncio.Semaphore(1)

SYSTEM_PROMPT = (
    "You are NexApex AI, a business consultant specializing in AI solutions "
    "for small and medium enterprises in Southeast Asia. You help business "
    "owners understand how computer vision, custom AI assistants, and document "
    "automation can solve their operational challenges.\n\n"
    "Your expertise covers these industries: manufacturing, food & beverage, "
    "retail, agriculture, and technology — with deep knowledge of Myanmar, "
    "Thailand, and broader SEA markets.\n\n"
    "Rules:\n"
    "- Keep responses concise (2-4 paragraphs max)\n"
    "- Always give actionable suggestions, not generic advice\n"
    "- When relevant, mention specific AI capabilities: object detection, "
    "quality inspection, inventory counting, document extraction, or chatbot automation\n"
    '- End responses that discuss a solvable problem with: "This is exactly '
    "the kind of solution NexApex builds. Want to see how it would work for "
    'your business?"\n'
    "- If asked about topics unrelated to business or AI, redirect: "
    '"I\'m best at helping with business AI solutions. What challenges is '
    'your business facing?"\n'
    "- Respond in the same language the user writes in\n"
    "- Never generate code, URLs, or technical implementation details"
)

_LANG_NAMES = {"en": "English", "my": "Burmese", "th": "Thai"}


def build_messages(messages: list[dict], language: str) -> list[dict]:
    """Prepend system prompt to conversation history."""
    system = SYSTEM_PROMPT
    if language != "en":
        lang_name = _LANG_NAMES.get(language, "English")
        system += f"\n- The user prefers {lang_name}. Respond in that language."
    return [{"role": "system", "content": system}] + messages


def _sync_stream(llm: Llama, messages: list[dict]):
    """Blocking call — must run in executor thread."""
    return llm.create_chat_completion(
        messages=messages,
        stream=True,
        max_tokens=512,
        temperature=1.0,
        top_p=0.95,
        top_k=64,
    )


async def stream_chat(
    llm: Llama,
    messages: list[dict],
    language: str,
    conversation_id: str,
) -> AsyncIterator[bytes]:
    """Acquire semaphore, run LLM in executor, yield SSE events."""
    full_messages = build_messages(messages, language)

    try:
        async with asyncio.timeout(60):
            await _llm_semaphore.acquire()
    except TimeoutError:
        yield format_sse_event(
            data_str=json.dumps({"error": "Model is busy, try again in a moment"}),
            event="error",
        )
        return

    try:
        loop = asyncio.get_event_loop()
        stream = await loop.run_in_executor(
            None, partial(_sync_stream, llm, full_messages)
        )
        for chunk in stream:
            delta = chunk["choices"][0].get("delta", {})
            token = delta.get("content", "")
            if token:
                yield format_sse_event(
                    data_str=json.dumps({"token": token, "conversation_id": conversation_id}),
                    event="token",
                )
    except Exception as exc:
        logger.error("LLM stream error: %s", exc)
        yield format_sse_event(
            data_str=json.dumps({"error": "Generation failed"}),
            event="error",
        )
    finally:
        _llm_semaphore.release()
