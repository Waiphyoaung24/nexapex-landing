# Smart Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an SSE-streaming chat demo powered by a Gemma 4 GGUF model (fine-tuned via Unsloth), with a conversion-focused NexApex AI business consultant persona.

**Architecture:** Stateless SSE — frontend sends full conversation history each request. FastAPI uses native `EventSourceResponse` (0.135+). `llama-cpp-python` generates tokens in a threadpool via `run_in_executor`, serialized by `asyncio.Semaphore(1)`. Frontend connects directly to FastAPI (not proxied) to avoid SSE buffering.

**Tech Stack:** FastAPI 0.135, llama-cpp-python, Gemma 4 E4B GGUF (q4_k_m), React 19, Next.js 16, Tailwind 4

**Design doc:** `docs/plans/2026-04-09-smart-assistant-design.md`

---

### Task 1: Backend Schemas

**Files:**
- Create: `backend/app/chat/__init__.py`
- Create: `backend/app/chat/schemas.py`

**Step 1: Create the chat module directory and init**

```python
# backend/app/chat/__init__.py
```

Empty file — makes `chat` a Python package.

**Step 2: Create schemas**

```python
# backend/app/chat/schemas.py
from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=20)
    language: str = Field(default="en", pattern=r"^(en|my|th)$")


class StreamChunk(BaseModel):
    token: str
    conversation_id: str


class StreamDone(BaseModel):
    conversation_id: str
    demos_remaining: int
```

**Step 3: Verify import works**

Run: `cd backend && python -c "from app.chat.schemas import ChatRequest; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add backend/app/chat/__init__.py backend/app/chat/schemas.py
git commit -m "feat(chat): add chat schemas — ChatRequest, ChatMessage, StreamChunk"
```

---

### Task 2: Backend Service (LLM Wrapper)

**Files:**
- Create: `backend/app/chat/service.py`

**Step 1: Create the service with system prompt and helpers**

```python
# backend/app/chat/service.py
from __future__ import annotations

import asyncio
import json
import logging
from functools import partial
from typing import TYPE_CHECKING, AsyncIterator

from fastapi.sse import ServerSentEvent

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
) -> AsyncIterator[ServerSentEvent]:
    """Acquire semaphore, run LLM in executor, yield SSE events."""
    full_messages = build_messages(messages, language)

    try:
        async with asyncio.timeout(60):
            await _llm_semaphore.acquire()
    except TimeoutError:
        yield ServerSentEvent(
            data=json.dumps({"error": "Model is busy, try again in a moment"}),
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
                yield ServerSentEvent(
                    data=json.dumps({"token": token, "conversation_id": conversation_id}),
                    event="token",
                )
    except Exception as exc:
        logger.error("LLM stream error: %s", exc)
        yield ServerSentEvent(
            data=json.dumps({"error": "Generation failed"}),
            event="error",
        )
    finally:
        _llm_semaphore.release()
```

**Step 2: Verify import works**

Run: `cd backend && python -c "from app.chat.service import build_messages, SYSTEM_PROMPT; print(len(SYSTEM_PROMPT), 'chars')"`
Expected: prints character count without errors

**Step 3: Test `build_messages` logic manually**

Run:
```bash
cd backend && python -c "
from app.chat.service import build_messages
msgs = build_messages([{'role': 'user', 'content': 'Hello'}], 'th')
assert msgs[0]['role'] == 'system'
assert 'Thai' in msgs[0]['content']
assert msgs[1]['content'] == 'Hello'
print('OK')
"
```
Expected: `OK`

**Step 4: Commit**

```bash
git add backend/app/chat/service.py
git commit -m "feat(chat): add LLM service — system prompt, build_messages, stream_chat"
```

---

### Task 3: Backend Router (SSE Endpoint)

**Files:**
- Create: `backend/app/chat/router.py`

**Step 1: Create the SSE streaming endpoint**

```python
# backend/app/chat/router.py
from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterable

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.sse import EventSourceResponse, ServerSentEvent
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.schemas import ChatRequest
from app.chat.service import stream_chat
from app.db.database import get_db
from app.db.models import Lead

router = APIRouter(prefix="/chat", tags=["chat"])

optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_lead(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> Lead | None:
    if credentials is None:
        return None
    from app.auth.jwt import verify_access_token

    payload = verify_access_token(credentials.credentials)
    if not payload:
        return None
    result = await db.execute(select(Lead).where(Lead.id == payload["sub"]))
    return result.scalar_one_or_none()


@router.post("/stream", response_class=EventSourceResponse)
async def chat_stream(
    body: ChatRequest,
    request: Request,
    lead: Lead | None = Depends(get_optional_lead),
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[ServerSentEvent]:
    # Check model is loaded
    llm = getattr(request.app.state, "llm", None)
    if llm is None:
        raise HTTPException(503, "Chat model not available")

    # Check demo limit (only if authenticated)
    if lead and lead.chat_demos_used >= 20:
        raise HTTPException(429, "Demo limit reached. Book a consultation to continue.")

    conversation_id = str(uuid.uuid4())
    messages = [m.model_dump() for m in body.messages]

    async def generate():
        async for event in stream_chat(llm, messages, body.language, conversation_id):
            yield event

        # Increment usage after stream completes
        demos_remaining = 20
        if lead:
            await db.execute(
                update(Lead)
                .where(Lead.id == lead.id)
                .values(chat_demos_used=Lead.chat_demos_used + 1)
            )
            await db.commit()
            demos_remaining = max(0, 20 - lead.chat_demos_used - 1)

        yield ServerSentEvent(
            data=json.dumps({
                "conversation_id": conversation_id,
                "demos_remaining": demos_remaining,
            }),
            event="done",
        )

    return EventSourceResponse(generate())
```

**Step 2: Verify import**

Run: `cd backend && python -c "from app.chat.router import router; print('routes:', len(router.routes))"`
Expected: `routes: 1`

**Step 3: Commit**

```bash
git add backend/app/chat/router.py
git commit -m "feat(chat): add SSE streaming endpoint POST /chat/stream"
```

---

### Task 4: Register Chat Router + LLM Loading in main.py

**Files:**
- Modify: `backend/app/main.py`

**Step 1: Add chat router import and LLM loading to lifespan**

Add to imports (after existing router imports):
```python
from app.chat.router import router as chat_router
```

In the `lifespan` function, after the YOLO loading block, add LLM loading:
```python
    # Load LLM model for chat (optional — graceful skip if model not found)
    try:
        from pathlib import Path
        from llama_cpp import Llama

        llm_path = settings.llm_model_path
        if Path(llm_path).exists():
            logger.info("Loading LLM model from: %s", llm_path)
            app.state.llm = Llama(
                model_path=llm_path,
                n_ctx=settings.llm_context_length,
                n_gpu_layers=0,
                verbose=False,
            )
            logger.info("LLM model loaded successfully")
        else:
            app.state.llm = None
            logger.warning("LLM model not found at %s — chat disabled", llm_path)
    except Exception as exc:
        logger.error("Failed to load LLM: %s", exc)
        app.state.llm = None
```

In the lifespan cleanup (after `del app.state.yolo_model`):
```python
    if getattr(app.state, "llm", None):
        del app.state.llm
```

Register the router (after the existing `app.include_router` calls):
```python
app.include_router(chat_router, prefix=settings.api_prefix)
```

Update the health endpoint to include LLM status:
```python
    return {
        "status": "ok",
        "models_loaded": app.state.models_loaded,
        "llm_loaded": getattr(app.state, "llm", None) is not None,
        "memory": {
            "total_mb": round(mem.total / 1024 / 1024),
            "used_mb": round(mem.used / 1024 / 1024),
            "percent": mem.percent,
        },
    }
```

**Step 2: Start the server and verify health**

Run: `cd backend && uvicorn app.main:app --port 8000`

The server should start. If no GGUF model file exists at `backend/models/nexapex-llm.gguf`, the log should show:
```
WARNING: LLM model not found at ... — chat disabled
```

Check health: `curl http://localhost:8000/health`
Expected: `{"status": "ok", "models_loaded": ..., "llm_loaded": false, ...}`

Check Swagger: open `http://localhost:8000/docs` — should show `/api/v1/chat/stream` endpoint.

**Step 3: Test chat endpoint returns 503 when model not loaded**

Run: `curl -X POST http://localhost:8000/api/v1/chat/stream -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello"}]}'`

Expected: `{"detail":"Chat model not available"}` with status 503.

**Step 4: Commit**

```bash
git add backend/app/main.py
git commit -m "feat(chat): register chat router + LLM loading in lifespan"
```

---

### Task 5: Backend Integration Test (with model)

This task is for testing when you have the GGUF model file. Skip if model is not yet ready.

**Files:**
- No new files

**Step 1: Place GGUF model**

Place your Unsloth-exported Gemma 4 GGUF at `backend/models/nexapex-llm.gguf` (the path configured in `config.py`).

**Step 2: Start server and verify model loads**

Run: `cd backend && uvicorn app.main:app --port 8000`

Look for: `INFO: LLM model loaded successfully`

Check health: `curl http://localhost:8000/health`
Expected: `"llm_loaded": true`

**Step 3: Test SSE streaming with curl**

Run:
```bash
curl -N -X POST http://localhost:8000/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How can AI help my restaurant?"}]}'
```

Expected: Stream of SSE events:
```
event: token
data: {"token": "...", "conversation_id": "..."}

event: done
data: {"conversation_id": "...", "demos_remaining": 20}
```

**Step 4: Test validation — message too long**

Run:
```bash
python -c "
import json
long_msg = 'x' * 2001
print(json.dumps({'messages':[{'role':'user','content': long_msg}]}))
" | curl -X POST http://localhost:8000/api/v1/chat/stream \
  -H "Content-Type: application/json" -d @-
```

Expected: 422 validation error (content exceeds max_length).

**Step 5: Test validation — too many messages**

Run:
```bash
python -c "
import json
msgs = [{'role':'user','content':'hi'}] * 21
print(json.dumps({'messages': msgs}))
" | curl -X POST http://localhost:8000/api/v1/chat/stream \
  -H "Content-Type: application/json" -d @-
```

Expected: 422 validation error (messages exceeds max_length).

---

### Task 6: Frontend — ChatMessage Component

**Files:**
- Create: `src/components/demos/ChatMessage.tsx`

**Step 1: Create the message bubble component**

```tsx
// src/components/demos/ChatMessage.tsx
"use client";

import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-white/[0.06]"
            : "bg-[#94fcff]/10"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white/50" />
        ) : (
          <Bot size={14} className="text-[#94fcff]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white/[0.06] text-white"
            : "border border-[#94fcff]/10 bg-[#94fcff]/[0.03] text-nex-text/90"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#94fcff]/60" />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/demos/ChatMessage.tsx
git commit -m "feat(chat): add ChatMessage bubble component"
```

---

### Task 7: Frontend — ChatSkeleton Component

**Files:**
- Create: `src/components/demos/ChatSkeleton.tsx`

**Step 1: Create loading skeleton**

```tsx
// src/components/demos/ChatSkeleton.tsx
export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-white/[0.04]" />
            <div
              className={`h-16 animate-pulse rounded-2xl bg-white/[0.04] ${
                i % 2 === 0 ? "w-1/3" : "w-2/3"
              }`}
            />
          </div>
        ))}
      </div>
      {/* Input skeleton */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/demos/ChatSkeleton.tsx
git commit -m "feat(chat): add ChatSkeleton loading component"
```

---

### Task 8: Frontend — ChatInterface Component

**Files:**
- Create: `src/components/demos/ChatInterface.tsx`

**Step 1: Create the main chat interface with SSE streaming**

```tsx
// src/components/demos/ChatInterface.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Square, MessageCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const MAX_MESSAGES = 20;

const SUGGESTED_PROMPTS = [
  "How can AI help my restaurant reduce food waste?",
  "I run a small factory. What can computer vision do for me?",
  "Can AI automate my invoice processing?",
  "What AI tools work for retail inventory management?",
] as const;

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "my", label: "MY" },
  { code: "th", label: "TH" },
] as const;

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isStreaming, setIsStreaming] = useState(false);
  const [demosRemaining, setDemosRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      const userMessage: Message = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      // Add empty assistant message for streaming
      const assistantIndex = updatedMessages.length;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({ role, content })),
            language,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail || `Server error (${response.status})`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const payload = JSON.parse(line.slice(6));

                if (payload.token) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      content: updated[assistantIndex].content + payload.token,
                    };
                    return updated;
                  });
                }

                if (payload.demos_remaining !== undefined) {
                  setDemosRemaining(payload.demos_remaining);
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled — keep partial response
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong");
          // Remove empty assistant message on error
          setMessages((prev) => {
            if (prev[assistantIndex]?.content === "") {
              return prev.slice(0, assistantIndex);
            }
            return prev;
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [messages, language, isStreaming]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;
  const limitReached = demosRemaining !== null && demosRemaining <= 0;
  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex h-full flex-col">
      {/* Language selector */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-1">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-mono uppercase tracking-[1.5px] transition-colors ${
                language === code
                  ? "bg-[#94fcff]/10 text-[#94fcff]"
                  : "text-nex-dim hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {messageCount > 0 && (
          <span className="text-[10px] font-mono text-nex-dim">
            {messageCount}/{MAX_MESSAGES} messages
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#94fcff]/10">
              <MessageCircle size={24} className="text-[#94fcff]" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
                NexApex AI
              </h2>
              <p className="mt-1 text-sm text-nex-dim">
                Ask me how AI can help your business
              </p>
            </div>
            <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-xs leading-relaxed text-nex-dim transition-colors hover:border-[#94fcff]/20 hover:bg-[#94fcff]/[0.03] hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/[0.06] p-4">
        {limitReached ? (
          <div className="rounded-xl border border-[#94fcff]/20 bg-[#94fcff]/[0.03] p-4 text-center">
            <p className="text-sm text-white">You&apos;ve used all {MAX_MESSAGES} messages.</p>
            <a
              href="/demos"
              className="mt-2 inline-block text-xs text-[#94fcff] underline underline-offset-2 hover:text-white"
            >
              Book a consultation to continue
            </a>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AI solutions for your business..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none disabled:opacity-50"
            />
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
                aria-label="Stop generation"
              >
                <Square size={16} />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#94fcff]/10 text-[#94fcff] transition-colors hover:bg-[#94fcff]/20 disabled:opacity-30 disabled:hover:bg-[#94fcff]/10"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/demos/ChatInterface.tsx
git commit -m "feat(chat): add ChatInterface with SSE streaming, language selector, suggested prompts"
```

---

### Task 9: Frontend — ChatInterfaceLoader + Update Chat Page

**Files:**
- Create: `src/components/demos/ChatInterfaceLoader.tsx`
- Modify: `src/app/(studio)/demos/chat/page.tsx`

**Step 1: Create the dynamic loader (same pattern as VisionInspectorLoader)**

```tsx
// src/components/demos/ChatInterfaceLoader.tsx
"use client";

import dynamic from "next/dynamic";
import { ChatSkeleton } from "./ChatSkeleton";

const ChatInterface = dynamic(
  () =>
    import("@/components/demos/ChatInterface").then((m) => ({
      default: m.ChatInterface,
    })),
  {
    ssr: false,
    loading: () => <ChatSkeleton />,
  }
);

export function ChatInterfaceLoader() {
  return <ChatInterface />;
}
```

**Step 2: Update the chat page (replace "Coming soon" placeholder)**

Replace the entire content of `src/app/(studio)/demos/chat/page.tsx` with:

```tsx
// src/app/(studio)/demos/chat/page.tsx
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ChatInterfaceLoader } from "@/components/demos/ChatInterfaceLoader";

export default function ChatPage() {
  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col">
      {/* Ambient gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[#94fcff]/[0.02] blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-[#94fcff]/[0.015] blur-[100px]" />
      </div>

      {/* Breadcrumb toolbar */}
      <div className="glass-panel flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex cursor-pointer items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-sm"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Smart Assistant
        </span>
      </div>

      {/* Chat workspace — takes full remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatInterfaceLoader />
      </div>
    </div>
  );
}
```

**Step 3: Start dev server and verify page loads**

Run: `npm run dev`

Open `http://localhost:3000/demos/chat` — should show:
- Breadcrumb: Demos / Smart Assistant
- NexApex AI welcome message with 4 suggested prompts
- Language selector (EN / MY / TH)
- Message input at bottom

**Step 4: Commit**

```bash
git add src/components/demos/ChatInterfaceLoader.tsx src/app/\(studio\)/demos/chat/page.tsx
git commit -m "feat(chat): wire up ChatInterface to chat page with dynamic loader"
```

---

### Task 10: Environment Config — NEXT_PUBLIC_BACKEND_URL

**Files:**
- Modify: `.env.local` (or create if not exists)
- Modify: `.env.example` (if exists at project root)

**Step 1: Add backend URL env var**

Add to `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

If a `.env.example` exists at project root, add the same variable there.

**Step 2: Commit env example (not .env.local)**

```bash
git add .env.example 2>/dev/null || true
git commit -m "chore: add NEXT_PUBLIC_BACKEND_URL to env config" --allow-empty
```

---

### Task 11: End-to-End Smoke Test

**Prerequisites:** Backend running with GGUF model + Frontend dev server running.

**Step 1: Start backend**

```bash
cd backend && source venv/Scripts/activate && uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` returns `"llm_loaded": true`

**Step 2: Start frontend**

```bash
npm run dev
```

**Step 3: Test the full flow**

1. Open `http://localhost:3000/demos/chat`
2. Verify empty state shows NexApex AI welcome + 4 suggested prompts + language toggle
3. Click a suggested prompt — message appears on right, assistant response streams on left
4. Type a follow-up message — conversation context maintained (assistant references prior messages)
5. Toggle language to TH — send a message, verify response attempts Thai
6. Send 2-3 messages rapidly — verify semaphore queues them (no crashes)
7. Click Stop button during streaming — verify partial response is kept

**Step 4: Test error states**

1. Stop the backend → send a message → verify error message shows
2. Restart backend without GGUF → send a message → verify "Chat model not available" error

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Smart Assistant — Gemma 4 GGUF chat with SSE streaming (Tasks 9-10)"
```
