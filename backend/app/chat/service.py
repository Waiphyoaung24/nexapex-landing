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
    "You are the NexApex AI assistant. NexApex is an AI solutions studio "
    "based in Bangkok that builds custom AI tools for businesses in Southeast Asia.\n\n"
    "## What We Build (describe in plain language, never use technical jargon)\n"
    "**Smart cameras** — AI that watches your production line, shelves, or "
    "kitchen and spots problems automatically. Catches defects, counts stock, "
    "monitors quality — works with your existing cameras or phones.\n"
    "**Custom AI assistants** — A chatbot trained on YOUR business: your menu, "
    "your products, your FAQs. Speaks your customers' language. Works on LINE, "
    "Viber, WhatsApp, or your website.\n"
    "**Document processing** — Drop in invoices, receipts, or contracts and get "
    "organized data back. No more manual data entry.\n"
    "**Full apps** — We handle everything: the AI brain, the app your team uses, "
    "and ongoing improvements. Web, mobile, whatever you need.\n\n"
    "## How to Respond\n"
    "1. Keep it SHORT. Max 3 bullet points per reply. 1-2 sentences each.\n"
    "2. Lead with what we'd BUILD for them, not advice. Describe the end result "
    "they'd see (e.g. 'a chatbot on your LINE that answers customer questions "
    "in Thai using your actual menu').\n"
    "3. Use simple words. If a 40-year-old restaurant owner wouldn't understand "
    "a word, don't use it. No: LLM, GGUF, API, YOLO, model, inference, deploy. "
    "Yes: AI tool, chatbot, smart camera, app, system.\n"
    "4. End with ONE short question to learn more about their situation.\n"
    "5. Respond in the user's language.\n\n"
    "## Style\n"
    "- Warm, confident, like a friend who happens to build AI.\n"
    "- Use local references naturally: Viber (Myanmar), LINE (Thailand), "
    "Thingyan, Songkran — only when relevant.\n"
    "- NEVER say 'Book a call' or 'NexApex can build this' — the UI handles CTAs.\n"
    "- NEVER generate code, URLs, or prices.\n"
    "- If off-topic: 'I'm here to help with business solutions — what's the "
    "biggest headache in your business right now?'"
)

_LANG_NAMES = {"en": "English", "my": "Burmese (Myanmar)", "th": "Thai"}


def build_messages(messages: list[dict], language: str) -> list[dict]:
    """Prepend system prompt and inject language directive."""
    system = SYSTEM_PROMPT
    result = [{"role": "system", "content": system}] + messages

    # For non-English, inject a strong language directive as the final
    # system message so the model sees it right before generating.
    # Small LLMs need recency bias — a weak hint in the system prompt
    # gets buried. This ensures the instruction is the last thing seen.
    if language != "en":
        lang_name = _LANG_NAMES.get(language, "English")
        result.append({
            "role": "system",
            "content": (
                f"IMPORTANT: Respond ENTIRELY in {lang_name}. "
                f"Every sentence must be in {lang_name}. "
                "Do not mix in English words unless they are proper nouns "
                "or widely-used brand names."
            ),
        })

    return result


_SENTINEL = object()


def _run_inference(llm: Llama, messages: list[dict], q: asyncio.Queue, loop: asyncio.AbstractEventLoop):
    """Blocking LLM iteration — runs in a thread, pushes tokens to async queue."""
    try:
        stream = llm.create_chat_completion(
            messages=messages,
            stream=True,
            max_tokens=512,
            temperature=1.0,
            top_p=0.95,
            top_k=64,
        )
        for chunk in stream:
            delta = chunk["choices"][0].get("delta", {})
            token = delta.get("content", "")
            if token:
                loop.call_soon_threadsafe(q.put_nowait, token)
        loop.call_soon_threadsafe(q.put_nowait, _SENTINEL)
    except Exception as exc:
        loop.call_soon_threadsafe(q.put_nowait, exc)


async def stream_chat(
    llm: Llama,
    messages: list[dict],
    language: str,
    conversation_id: str,
) -> AsyncIterator[bytes]:
    """Acquire semaphore, run LLM in a thread, yield SSE events without blocking the event loop."""
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
        q: asyncio.Queue = asyncio.Queue()

        loop.run_in_executor(
            None, partial(_run_inference, llm, full_messages, q, loop)
        )

        while True:
            item = await q.get()
            if item is _SENTINEL:
                break
            if isinstance(item, Exception):
                logger.error("LLM stream error: %s", item)
                yield format_sse_event(
                    data_str=json.dumps({"error": "Generation failed"}),
                    event="error",
                )
                break
            yield format_sse_event(
                data_str=json.dumps({"token": item, "conversation_id": conversation_id}),
                event="token",
            )
    finally:
        _llm_semaphore.release()
