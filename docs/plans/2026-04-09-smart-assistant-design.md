# Smart Assistant — Architecture Design

**Date:** 2026-04-09
**Branch:** nexapex-v3-demo
**Phase:** 2 (Tasks 9-10)
**PRD ref:** FR-003
**Status:** Approved

---

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| LLM runtime | `llama-cpp-python` | PRD spec, single-process, no infra overhead, GGUF native |
| Base model | Gemma 4 E4B (Unsloth fine-tuned) | 140 languages, SEA market knowledge, recommended over E2B |
| GGUF quantization | `q4_k_m` | Best quality/size tradeoff, ~2-3GB for E4B |
| Chat format | Auto-detect from GGUF metadata | Unsloth embeds `tokenizer.chat_template` in GGUF export |
| Streaming | FastAPI native `EventSourceResponse` (0.135+) | Already installed (0.135.3), zero extra deps |
| Blocking workaround | `asyncio.run_in_executor` + `Semaphore(1)` | llama-cpp holds process mutex; executor keeps event loop free |
| Conversation state | Stateless — frontend sends full history | No DB tables, mirrors OpenAI API pattern, simplest for MVP |
| Frontend-to-Backend | Direct browser → FastAPI (not proxied) | Avoids SSE buffering in Next.js API route proxy |
| Auth | Optional Bearer (same pattern as Vision) | Allows unauthenticated dev/demo testing |
| Demo limit | 20 messages per lead (per PRD) | Tracked via existing `chat_demos_used` column on `leads` table |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Browser (React Client Component)                         │
│  ChatInterface.tsx                                        │
│                                                           │
│  ┌─ Message State (useState) ──────────────────────────┐ │
│  │ [{role:"user", content:"..."}, ...]   ≤ 20 messages │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  fetch(POST) ──► FastAPI:8000/api/v1/chat/stream          │
│       ▲          (direct, NOT through Next.js proxy)      │
│       │                                                   │
│  ReadableStream ◄── SSE tokens                            │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  FastAPI Backend                                          │
│                                                           │
│  POST /api/v1/chat/stream                                 │
│  ┌───────────────────────────────────────────────┐       │
│  │ 1. Validate: messages[] ≤ 20, each ≤ 2000ch   │       │
│  │ 2. Check demo limit (optional auth)            │       │
│  │ 3. Prepend system prompt                       │       │
│  │ 4. asyncio.Semaphore(1) — serialize access     │       │
│  │ 5. run_in_executor:                            │       │
│  │    llm.create_chat_completion(                 │       │
│  │      messages=full_history,                    │       │
│  │      stream=True,                              │       │
│  │      temperature=1.0, top_p=0.95, top_k=64    │       │
│  │    )                                           │       │
│  │ 6. yield ServerSentEvent per token chunk       │       │
│  │ 7. yield ServerSentEvent("[DONE]")             │       │
│  │ 8. Increment chat_demos_used (if authed)       │       │
│  └───────────────────────────────────────────────┘       │
│                                                           │
│  Lifespan: load GGUF model at startup (graceful skip)     │
│  app.state.llm = Llama(model_path, n_ctx=4096)           │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow

1. User types message → frontend appends to local `messages[]` state
2. Frontend `POST`s `{ messages: [...], language: "en" }` to `FastAPI:8000/api/v1/chat/stream`
3. Backend validates (≤20 messages, each ≤2000 chars), prepends system prompt
4. `Semaphore` acquired → `run_in_executor` → `llm.create_chat_completion(stream=True)`
5. Each chunk yields `ServerSentEvent(data=token, event="token")`
6. Final event: `ServerSentEvent(data="[DONE]", event="done")`
7. Frontend appends tokens to assistant message bubble in real-time
8. If authenticated, increment `chat_demos_used` after stream completes

---

## Backend Structure

```
backend/app/chat/
├── __init__.py
├── router.py       # POST /chat/stream — SSE endpoint
├── service.py      # LLM wrapper: build_messages(), stream_chat()
└── schemas.py      # ChatRequest, ChatMessage, StreamChunk
```

### Endpoint: `POST /api/v1/chat/stream`

**Request body:**
```json
{
  "messages": [
    {"role": "user", "content": "How can AI help my restaurant?"},
    {"role": "assistant", "content": "Great question! ..."},
    {"role": "user", "content": "Tell me more about inventory"}
  ],
  "language": "en"
}
```

**Response:** `text/event-stream` (SSE)
```
event: token
data: {"token": "AI", "conversation_id": "uuid"}

event: token
data: {"token": " can", "conversation_id": "uuid"}

event: done
data: {"conversation_id": "uuid", "demos_remaining": 18}
```

### Schemas

```python
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)

class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=20)
    language: str = Field(default="en", pattern="^(en|my|th)$")

class StreamChunk(BaseModel):
    token: str
    conversation_id: str

class StreamDone(BaseModel):
    conversation_id: str
    demos_remaining: int
```

### Service: LLM Wrapper

```python
import asyncio
from functools import partial
from llama_cpp import Llama

# Module-level semaphore — one generation at a time
_llm_semaphore = asyncio.Semaphore(1)

SYSTEM_PROMPT = """You are NexApex AI, a business consultant specializing in AI solutions for small and medium enterprises in Southeast Asia. You help business owners understand how computer vision, custom AI assistants, and document automation can solve their operational challenges.

Your expertise covers these industries: manufacturing, food & beverage, retail, agriculture, and technology — with deep knowledge of Myanmar, Thailand, and broader SEA markets.

Rules:
- Keep responses concise (2-4 paragraphs max)
- Always give actionable suggestions, not generic advice
- When relevant, mention specific AI capabilities: object detection, quality inspection, inventory counting, document extraction, or chatbot automation
- End responses that discuss a solvable problem with: "This is exactly the kind of solution NexApex builds. Want to see how it would work for your business?"
- If asked about topics unrelated to business or AI, redirect: "I'm best at helping with business AI solutions. What challenges is your business facing?"
- Respond in the same language the user writes in
- Never generate code, URLs, or technical implementation details"""


def build_messages(messages: list[dict], language: str) -> list[dict]:
    """Prepend system prompt to conversation history."""
    lang_hint = {"en": "English", "my": "Burmese", "th": "Thai"}
    system = SYSTEM_PROMPT
    if language != "en":
        system += f"\n- The user prefers {lang_hint.get(language, 'English')}. Respond in that language."
    return [{"role": "system", "content": system}] + messages


def _sync_stream(llm: Llama, messages: list[dict]):
    """Blocking generator — runs in executor thread."""
    return llm.create_chat_completion(
        messages=messages,
        stream=True,
        max_tokens=512,
        temperature=1.0,
        top_p=0.95,
        top_k=64,
    )
```

### Router: SSE Endpoint

```python
from collections.abc import AsyncIterable
from fastapi import APIRouter, Request, HTTPException
from fastapi.sse import EventSourceResponse, ServerSentEvent

@router.post("/stream", response_class=EventSourceResponse)
async def chat_stream(
    body: ChatRequest,
    request: Request,
    lead: Lead | None = Depends(get_optional_lead),
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[ServerSentEvent]:
    llm = getattr(request.app.state, "llm", None)
    if llm is None:
        raise HTTPException(503, "Chat model not available")

    # Demo limit check
    if lead and lead.chat_demos_used >= 20:
        raise HTTPException(429, "Demo limit reached. Book a consultation.")

    messages = build_messages(
        [m.model_dump() for m in body.messages],
        body.language,
    )
    conversation_id = str(uuid.uuid4())

    async def generate():
        async with _llm_semaphore:
            loop = asyncio.get_event_loop()
            stream = await loop.run_in_executor(
                None, partial(_sync_stream, llm, messages)
            )
            for chunk in stream:
                delta = chunk["choices"][0].get("delta", {})
                token = delta.get("content", "")
                if token:
                    yield ServerSentEvent(
                        data=json.dumps({"token": token, "conversation_id": conversation_id}),
                        event="token",
                    )
            # Increment usage
            demos_remaining = 20
            if lead:
                await db.execute(...)  # increment chat_demos_used
                await db.commit()
                demos_remaining = max(0, 20 - lead.chat_demos_used - 1)

            yield ServerSentEvent(
                data=json.dumps({"conversation_id": conversation_id, "demos_remaining": demos_remaining}),
                event="done",
            )

    return EventSourceResponse(generate())
```

---

## Frontend Structure

```
src/components/demos/
├── ChatInterface.tsx    # Main client component — SSE consumer, message state
├── ChatMessage.tsx      # Single message bubble (user right / assistant left)
└── ChatSkeleton.tsx     # Loading skeleton

src/app/(studio)/demos/chat/
└── page.tsx             # Server component — dynamic() import ChatInterface
```

### UI States

| State | What's shown |
|-------|-------------|
| **Empty** | Welcome message from NexApex AI + 3-4 suggested prompt buttons |
| **Active** | Message thread with streaming response |
| **Streaming** | Assistant bubble grows token-by-token, typing indicator |
| **Limit reached** | Final message: "You've used all 20 messages. Book a consultation." |
| **Model unavailable** | "Smart Assistant is loading. Try again shortly." + sample conversation |

### Suggested Prompts (Empty State)

1. "How can AI help my restaurant reduce food waste?"
2. "I run a small factory. What can computer vision do for me?"
3. "Can AI automate my invoice processing?"
4. "What AI tools work for retail inventory management?"

### Frontend SSE Consumer Pattern

```typescript
const response = await fetch("http://localhost:8000/api/v1/chat/stream", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ messages, language }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  // Parse SSE lines: "event: token\ndata: {...}\n\n"
  for (const line of text.split("\n")) {
    if (line.startsWith("data: ")) {
      const payload = JSON.parse(line.slice(6));
      if (payload.token) appendToken(payload.token);
    }
  }
}
```

### Component Design

- **ChatMessage**: User messages right-aligned (dark gray bg), assistant left-aligned (cyan-left-border, dark bg)
- **Language selector**: EN / MY / TH toggle pills at top
- **Input**: Full-width text input with send button, disabled during streaming
- **Auto-scroll**: Scroll to bottom on new tokens
- **`prefers-reduced-motion`**: Skip typing animation, show tokens immediately

---

## Model Loading (Lifespan)

```python
# In main.py lifespan, alongside YOLO loading
try:
    from llama_cpp import Llama
    llm_path = settings.llm_model_path
    if Path(llm_path).exists():
        app.state.llm = Llama(
            model_path=llm_path,
            n_ctx=settings.llm_context_length,  # 4096
            n_gpu_layers=0,  # CPU for MVP
            verbose=False,
        )
        logger.info("LLM model loaded: %s", llm_path)
    else:
        app.state.llm = None
        logger.warning("LLM model not found at %s — chat disabled", llm_path)
except Exception as exc:
    logger.error("Failed to load LLM: %s", exc)
    app.state.llm = None
```

Graceful skip: if the GGUF file doesn't exist, chat returns 503 but vision/auth/admin still work.

---

## Inference Parameters (Gemma 4 Recommended)

| Parameter | Value | Source |
|-----------|-------|--------|
| `temperature` | 1.0 | Gemma 4 official recommendation |
| `top_p` | 0.95 | Gemma 4 official recommendation |
| `top_k` | 64 | Gemma 4 official recommendation |
| `max_tokens` | 512 | Keep responses concise per system prompt |
| `n_ctx` | 4096 | Sufficient for 20-turn conversation |

---

## System Prompt

```
You are NexApex AI, a business consultant specializing in AI solutions for small and medium enterprises in Southeast Asia. You help business owners understand how computer vision, custom AI assistants, and document automation can solve their operational challenges.

Your expertise covers these industries: manufacturing, food & beverage, retail, agriculture, and technology — with deep knowledge of Myanmar, Thailand, and broader SEA markets.

Rules:
- Keep responses concise (2-4 paragraphs max)
- Always give actionable suggestions, not generic advice
- When relevant, mention specific AI capabilities: object detection, quality inspection, inventory counting, document extraction, or chatbot automation
- End responses that discuss a solvable problem with: "This is exactly the kind of solution NexApex builds. Want to see how it would work for your business?"
- If asked about topics unrelated to business or AI, redirect: "I'm best at helping with business AI solutions. What challenges is your business facing?"
- Respond in the same language the user writes in
- Never generate code, URLs, or technical implementation details
```

---

## Error Handling

| Error | HTTP | Response |
|-------|------|----------|
| Model not loaded | 503 | `{"detail": "Chat model not available"}` |
| Semaphore timeout | 429 | `{"detail": "Model is busy, try again in a moment"}` |
| Message too long | 400 | `{"detail": "Message exceeds 2000 character limit"}` |
| Too many messages | 400 | `{"detail": "Conversation limit is 20 messages"}` |
| Demo limit reached | 429 | `{"detail": "Demo limit reached. Book a consultation."}` |

---

## CORS (Already Configured)

The existing CORS middleware in `main.py` allows `http://localhost:3000`. For production, add the deployed frontend origin. SSE requires no special CORS headers beyond standard configuration.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First token latency | < 1s |
| Total generation (512 tokens) | < 10s |
| Frontend JS bundle (chat) | < 30KB gzipped |
| Concurrent users | 1 active generation, others queued via semaphore |

---

## Memory Impact

| Component | RAM | Notes |
|-----------|-----|-------|
| Gemma 4 E4B Q4_K_M | ~2-3GB | Quantized GGUF |
| YOLO26n (existing) | ~6MB | Already loaded |
| **Total** | ~3GB | Fits in 8GB instance |

---

## Dependencies

**Backend (already in pyproject.toml `[ai]` extras):**
- `llama-cpp-python>=0.3.0` — already listed

**Frontend (new):**
- No new deps — uses native `fetch` + `ReadableStream`

**No new database tables or migrations required.**
