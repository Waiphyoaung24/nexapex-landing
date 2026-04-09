# NexApex Persona Fine-Tuning Dataset — Design

**Date:** 2026-04-10
**Status:** Approved (ready for implementation)
**Owner:** Smart Assistant v3 (Task 9 — LLM fine-tuning prep)

## Goal

Produce a small, high-quality conversational dataset that fine-tunes a base LLM on the **NexApex AI consultant persona** defined in `backend/app/chat/service.py`. A prompt-only base model follows the persona loosely; fine-tuning on examples makes the voice, structure, CTA, and multilingual mirroring behavior stick reliably.

The dataset is the input to an Unsloth fine-tuning run (target base: Gemma 3 / Qwen 3 small-class) that will later replace the prompt-only Smart Assistant backend in `backend/app/chat/service.py`.

## Non-Goals

- Multi-turn conversations (deferred to v2)
- Image / vision-tool rows (separate dataset)
- Adversarial / jailbreak robustness (v2)
- Negative examples (what NOT to say)

## File Layout

| Path | Purpose |
|---|---|
| `backend/data/nexapex-train.jsonl` | The dataset — 160 rows, one JSON object per line |
| `backend/scripts/build_persona_dataset.py` | Deterministic generator — the source of truth; re-run to rebuild the JSONL |
| `docs/plans/2026-04-10-nexapex-persona-dataset-design.md` | This document |

The generator script owns the data. Edits to examples go in the script, not the JSONL. The JSONL is a build artifact — reproducible by running `python backend/scripts/build_persona_dataset.py`.

## Row Schema (Unsloth ChatML)

Verified against Unsloth docs via context7 (`/unslothai/unsloth`):

```json
{"conversations": [
  {"role": "system", "content": "<SYSTEM_PROMPT from service.py, verbatim + optional lang suffix>"},
  {"role": "user", "content": "<user question>"},
  {"role": "assistant", "content": "<on-brand NexApex response>"}
]}
```

### System prompt — verbatim match to production

The `system` turn is the **exact** `SYSTEM_PROMPT` string from `backend/app/chat/service.py:19-40` — copied into the generator script as a single constant. For non-English rows, the generator appends the same language suffix that `build_messages()` appends at inference time:

- EN: no suffix
- TH: `\n- The user prefers Thai. Respond in that language.`
- MY: `\n- The user prefers Burmese. Respond in that language.`

This guarantees training-time inputs look identical to inference-time inputs.

## Size & Distribution

**Total: 160 rows** — large enough to teach the persona, small enough to train on a consumer GPU via Unsloth in ~15-30 minutes.

### Language split

| Language | Rows | % |
|---|---|---|
| English | 100 | 62.5% |
| Thai | 30 | 18.75% |
| Burmese | 30 | 18.75% |

### Domain distribution (all 160 rows)

| Domain | Total | EN | TH | MY |
|---|---|---|---|---|
| Food & Beverage | 28 | 18 | 5 | 5 |
| Manufacturing | 28 | 18 | 5 | 5 |
| Retail | 22 | 14 | 4 | 4 |
| Agriculture | 20 | 12 | 4 | 4 |
| Logistics & warehousing | 18 | 10 | 4 | 4 |
| Document automation | 20 | 12 | 4 | 4 |
| Chatbot automation | 16 | 8 | 4 | 4 |
| Off-topic redirects | 8 | 8 | 0 | 0 |
| **Total** | **160** | **100** | **30** | **30** |

Off-topic redirects are English-only by design: the redirect line is short, identical across languages, and burning multilingual budget on paraphrases of "I'm best at helping with business AI solutions" provides no meaningful signal.

### Turn depth

All rows are **single-turn**: exactly three messages (`system`, `user`, `assistant`). SME first-contact queries are almost always single-shot, and multi-turn doubles per-row token cost for marginal gain at this stage.

## Quality Rules (enforced by generator & reviewed manually)

Every assistant response must satisfy:

1. **Length**: 2-4 paragraphs max, per system-prompt rule. Single-paragraph short answers allowed for off-topic redirects and trivially simple questions.
2. **Actionable specificity**: every response names at least one concrete AI capability from the allowed list (object detection, quality inspection, inventory counting, document extraction, chatbot automation, defect detection, OCR, demand forecasting, etc.). No generic "AI can help you" filler.
3. **SEA grounding**: where natural, anchor the response in a real SEA context — cities (Yangon, Mandalay, Bangkok, Chiang Mai, Hanoi, Ho Chi Minh City, Phnom Penh, Vientiane), business realities (mobile-first customers, cash-heavy ops, low single-digit margins, family-run SMEs), or currency/scale hints.
4. **Signature CTA** (verbatim): responses that discuss a solvable business problem end with exactly: `This is exactly the kind of solution NexApex builds. Want to see how it would work for your business?` — in English, even in TH/MY rows. This line is persona-defining and deliberately preserved in English to match real NexApex brand voice.
5. **Off-topic redirect line** (verbatim): the 8 off-topic rows end with exactly: `I'm best at helping with business AI solutions. What challenges is your business facing?` — and do NOT include the CTA line.
6. **No code, no URLs, no implementation details** — per the system prompt's final rule.
7. **Language mirroring**: TH user question → TH assistant body. MY user question → MY assistant body. The English CTA line is preserved verbatim in all languages.

### Variety rules (prevent overfitting to phrasing)

- **Question framings** rotate: "How can AI…", "I run a small…", "What's the cheapest way to…", "Is it worth it to…", "My problem is…", "We're losing money on…", "Can computer vision…", "What would you recommend for…"
- **Business sizes** rotate: micro (1-5 staff), small (10-50 staff), medium (50-200 staff)
- **Pain points** rotate per domain — no two rows in the same domain solve the identical problem

### De-duplication rules

- No two user questions share the same opening 4 words
- No two assistant responses within the same domain are paraphrases
- The generator script groups rows by domain so reviewers can spot near-duplicates visually

## Validation Checks (run after generation)

1. Line count equals 160
2. Every line parses as valid JSON
3. Every row has exactly 3 turns with roles `system`, `user`, `assistant` in that order
4. Every `system` content starts with the literal string `"You are NexApex AI"`
5. EN row count = 100, TH row count = 30, MY row count = 30 (detected by suffix presence in system prompt)
6. Off-topic redirect line appears in exactly 8 rows
7. CTA line appears in at least 140 rows (all solvable-problem rows)

## Out of Scope (v2 candidates)

- Multi-turn follow-up conversations (e.g., "How much would it cost?" after an initial pitch)
- Vision tool-use examples (system + image input + structured response)
- Adversarial rows (prompt injection attempts, off-topic persistence)
- Negative examples paired with corrections
- Evaluation harness with golden responses

## Rebuild

```bash
cd backend
python scripts/build_persona_dataset.py
# → writes data/nexapex-train.jsonl
```

The generator is pure-Python stdlib (no deps), deterministic, and idempotent.
