"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Copy,
  RefreshCcw,
  Check,
  Sparkles,
  Factory,
  Utensils,
  ShoppingBag,
  Code2,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const MAX_MESSAGES = 10;
// Booking destination — swap to Cal.com URL once Task 13 lands.
const BOOKING_HREF = "mailto:nexuslab.dev.mm@gmail.com?subject=NexApex%20AI%20Demo%20—%20Free%20Consultation";

const SUGGESTED_PROMPTS = [
  {
    code: "01",
    icon: Utensils,
    label: "F&B",
    prompt: "I run a restaurant and waste too much food every week",
  },
  {
    code: "02",
    icon: Factory,
    label: "Manufacturing",
    prompt: "My factory needs to catch product defects faster",
  },
  {
    code: "03",
    icon: ShoppingBag,
    label: "Retail",
    prompt: "I want a chatbot that knows my products and helps customers",
  },
  {
    code: "04",
    icon: Code2,
    label: "Tech",
    prompt: "I'm building an app and need to add AI features",
  },
] as const;

// Greeting shown in landing state, auto-typed character-by-character.
const GREETING_LINE_1 = "Hi! I'm NexApex AI.";
const GREETING_LINE_2 = "Tell me your problem — I'll show you exactly what we'd build.";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "my", label: "MY", name: "မြန်မာ" },
  { code: "th", label: "TH", name: "ไทย" },
] as const;

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isStreaming, setIsStreaming] = useState(false);
  const [demosRemaining, setDemosRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [langToast, setLangToast] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Lock body scroll — chat is a full-viewport app, page must not scroll ───
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Scroll ONLY the chat container — never call scrollIntoView, which would
  // walk up the DOM and scroll the page itself (revealing the footer below).
  const scrollChatToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    },
    []
  );

  // ─── Smart auto-scroll: pause when user scrolls away from bottom ───
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setAutoScroll(distanceFromBottom < 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Trap wheel events at scroll boundaries — prevent scroll chain leak ───
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      // Content doesn't overflow — swallow wheel so nothing else scrolls
      if (maxScroll <= 0) { e.preventDefault(); return; }
      // At top boundary scrolling up, or bottom boundary scrolling down
      if ((scrollTop <= 0 && e.deltaY < 0) ||
          (scrollTop >= maxScroll - 1 && e.deltaY > 0)) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (autoScroll) scrollChatToBottom("smooth");
  }, [messages, autoScroll, scrollChatToBottom]);

  // ─── Auto-resize textarea ───
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setAutoScroll(true);
      const userMessage: Message = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

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

  const switchLanguage = useCallback((code: string) => {
    if (code === language) return;
    setLanguage(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang) {
      setLangToast(lang.name);
      setTimeout(() => setLangToast(null), 1500);
    }
  }, [language]);

  const copyMessage = useCallback((index: number, content: string) => {
    navigator.clipboard?.writeText(content).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    });
  }, []);

  const regenerateLast = useCallback(() => {
    // Find last user message, drop everything after it, resend
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const lastUser = messages[realIdx];
    setMessages((prev) => prev.slice(0, realIdx));
    sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const isEmpty = messages.length === 0;
  const limitReached = demosRemaining !== null && demosRemaining <= 0;
  const messageCount = messages.filter((m) => m.role === "user").length;
  const progressPercent = useMemo(
    () => Math.min((messageCount / MAX_MESSAGES) * 100, 100),
    [messageCount]
  );
  const langIndex = LANGUAGES.findIndex((l) => l.code === language);

  return (
    <div className="relative flex h-full flex-col text-white">
      {/* ─── Ambient mesh background — composited only ─── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle at center, rgba(148,252,255,0.05) 0%, rgba(148,252,255,0.015) 35%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(198,53,24,0.04) 0%, transparent 65%)",
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(148,252,255,0.4) 0px, rgba(148,252,255,0.4) 1px, transparent 1px, transparent 4px)",
          }}
        />
      </div>

      {/* ─── Top toolbar — progress + language side by side on the right ─── */}
      <div className="flex items-center justify-end gap-3 border-b border-white/[0.06] px-4 py-3 md:px-6">
        {/* Progress counter */}
        {messageCount > 0 && (
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" className="-rotate-90">
              <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <circle
                cx="10" cy="10" r="8" fill="none" stroke="#94fcff" strokeWidth="1.5"
                strokeLinecap="round" strokeDasharray={50.27}
                strokeDashoffset={50.27 - (50.27 * progressPercent) / 100}
                style={{ transition: "stroke-dashoffset 400ms var(--ease-out-expo)" }}
              />
            </svg>
            <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-nex-dim">
              {MAX_MESSAGES - messageCount} chat remaining
            </span>
          </div>
        )}

        {/* Language segmented control */}
        <div className="relative flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {/* Sliding indicator */}
          <span
            aria-hidden
            className="absolute top-0.5 bottom-0.5 left-0.5 rounded-md bg-[#94fcff]/12 ring-1 ring-inset ring-[#94fcff]/30"
            style={{
              width: "40px",
              transform: `translateX(${langIndex * 40}px)`,
              transition: "transform 320ms var(--ease-out-expo)",
            }}
          />
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => switchLanguage(code)}
              className={cn(
                "relative z-10 flex h-8 w-10 cursor-pointer items-center justify-center rounded-md text-[11px] font-mono font-medium uppercase tracking-[1.5px] transition-colors duration-200",
                language === code
                  ? "text-[#94fcff]"
                  : "text-white/40 hover:text-white/70"
              )}
              aria-pressed={language === code}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Messages area / empty state ─── */}
      <div
        ref={scrollRef}
        className="chat-scrollbar flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth"
      >
        {isEmpty ? (
          <EmptyState onPick={(p) => sendMessage(p)} />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 md:px-6 md:py-10">
            {messages.map((msg, i) => {
              const streaming =
                isStreaming && i === messages.length - 1 && msg.role === "assistant";
              const showActions =
                msg.role === "assistant" && !streaming && msg.content.length > 0;
              const isLast = i === messages.length - 1;
              // CTA chip shown after a completed substantive assistant reply
              const showCta = showActions && msg.content.trim().length > 80;
              return (
                <div key={i} className="group">
                  <ChatMessage role={msg.role} content={msg.content} isStreaming={streaming} />
                  {showCta && (
                    <div className="mt-3 pl-11">
                      <a
                        href={BOOKING_HREF}
                        className="group/cta inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#94fcff]/25 bg-[#94fcff]/[0.04] px-3.5 py-1.5 text-[11px] font-medium text-[#94fcff] transition-all duration-300 hover:border-[#94fcff]/60 hover:bg-[#94fcff]/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60"
                        style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                      >
                        <Sparkles size={11} className="text-[#94fcff]" />
                        NexApex can build this
                        <span className="text-nex-dim/60">→</span>
                        <span className="font-mono text-[10px] uppercase tracking-[1.5px] transition-transform duration-300 group-hover/cta:translate-x-0.5">
                          Book a free call
                        </span>
                      </a>
                    </div>
                  )}
                  {showActions && (
                    <div className="mt-2 flex items-center gap-1 pl-11 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        onClick={() => copyMessage(i, msg.content)}
                        className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[10px] font-mono uppercase tracking-[1.5px] text-nex-dim transition-colors hover:bg-white/[0.04] hover:text-white"
                        aria-label="Copy message"
                      >
                        {copiedIndex === i ? (
                          <>
                            <Check size={12} className="text-[#94fcff]" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Copy
                          </>
                        )}
                      </button>
                      {isLast && (
                        <button
                          onClick={regenerateLast}
                          disabled={isStreaming}
                          className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[10px] font-mono uppercase tracking-[1.5px] text-nex-dim transition-colors hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Regenerate response"
                        >
                          <RefreshCcw size={12} />
                          Regenerate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Approaching-limit soft banner */}
            {demosRemaining !== null &&
              demosRemaining > 0 &&
              demosRemaining <= 2 &&
              !isStreaming && (
                <div className="mx-auto max-w-xl rounded-xl border border-[#94fcff]/15 bg-[#94fcff]/[0.025] px-4 py-2.5 text-center backdrop-blur-sm">
                  <span className="text-[11px] text-nex-dim">
                    <span className="font-mono uppercase tracking-[1.5px] text-[#94fcff]/80">
                      {demosRemaining} message{demosRemaining === 1 ? "" : "s"} remaining
                    </span>
                    {" — "}
                    enjoying the demo? Let&apos;s talk about your real project.
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* ─── Resume scroll affordance — only when paused ─── */}
      {!autoScroll && !isEmpty && (
        <button
          onClick={() => {
            setAutoScroll(true);
            scrollChatToBottom("smooth");
          }}
          className="absolute bottom-32 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full border border-[#94fcff]/20 bg-[#0e1418]/80 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[1.5px] text-[#94fcff] backdrop-blur-md transition-colors hover:bg-[#94fcff]/10"
          aria-label="Jump to latest"
        >
          ↓ Jump to latest
        </button>
      )}

      {/* ─── Language toast ─── */}
      {langToast && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2">
          <div className="rounded-lg border border-[#94fcff]/20 bg-[#0e1418]/90 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[1.5px] text-[#94fcff] shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            {langToast}
          </div>
        </div>
      )}

      {/* ─── Error toast ─── */}
      {error && (
        <div className="mx-auto mb-2 w-full max-w-3xl px-4 md:px-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-300/90 backdrop-blur-sm">
            <span className="font-mono uppercase tracking-[1.5px] text-red-400">Error</span>
            <span className="mx-2 text-red-500/40">|</span>
            {error}
          </div>
        </div>
      )}

      {/* ─── Composer ─── */}
      <div className="px-4 pb-5 pt-2 md:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          {limitReached ? (
            <LimitReachedCard />
          ) : (
            <Composer
              input={input}
              setInput={setInput}
              isStreaming={isStreaming}
              isFocused={isInputFocused}
              setFocused={setIsInputFocused}
              onSubmit={() => sendMessage(input)}
              onStop={stopGeneration}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
            />
          )}
          {/* Hint row */}
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[1.5px] text-nex-dim/60">
            <div className="flex items-center gap-3">
              <span className="hidden md:inline">
                <kbd className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-nex-dim">
                  ↵
                </kbd>{" "}
                send
              </span>
              <span className="hidden md:inline">
                <kbd className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-nex-dim">
                  ⇧↵
                </kbd>{" "}
                newline
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-[#94fcff]/50" />
              Powered by NexApex AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Empty State ─────────────────────── */

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  // Auto-typed greeting (skipped under prefers-reduced-motion).
  // Component is dynamic-imported with ssr:false → window is safe at first render.
  const fullGreeting = `${GREETING_LINE_1}\n${GREETING_LINE_2}`;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [typedLength, setTypedLength] = useState(
    reduceMotion ? fullGreeting.length : 0
  );
  const [chipsVisible, setChipsVisible] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;

    let i = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    let chipsTimer: ReturnType<typeof setTimeout> | null = null;

    const startDelay = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setTypedLength(i);
        if (i >= fullGreeting.length) {
          if (interval) clearInterval(interval);
          chipsTimer = setTimeout(() => setChipsVisible(true), 250);
        }
      }, 22);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      if (interval) clearInterval(interval);
      if (chipsTimer) clearTimeout(chipsTimer);
    };
  }, [fullGreeting.length, reduceMotion]);

  const isTyping = typedLength < fullGreeting.length;
  const typed = fullGreeting.slice(0, typedLength);
  const [line1Typed, line2Typed = ""] = typed.split("\n");

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12 md:py-16">
      {/* Greeting orb — concentric rings, breathing pulse */}
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[#94fcff]/15 chat-orb-pulse" />
        <span
          className="absolute inset-3 rounded-full border border-[#94fcff]/25 chat-orb-pulse"
          style={{ animationDelay: "0.3s" }}
        />
        <span
          className="absolute inset-6 rounded-full border border-[#94fcff]/40 chat-orb-pulse"
          style={{ animationDelay: "0.6s" }}
        />
        <span className="relative h-3 w-3 rounded-full bg-[#94fcff] shadow-[0_0_20px_rgba(148,252,255,0.6)]" />
      </div>

      {/* Mono kicker */}
      <span className="mb-4 text-[10px] font-mono uppercase tracking-[3px] text-[#94fcff]/60">
        {"// Smart Assistant"}
      </span>

      {/* Auto-typed greeting */}
      <div
        className="min-h-[120px] max-w-xl text-center font-[family-name:var(--font-display)] text-white"
        aria-live="polite"
      >
        <h2
          className="font-normal uppercase leading-[1.1] tracking-[-0.01em]"
          style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.25rem)" }}
        >
          {line1Typed}
        </h2>
        <p
          className="mt-3 leading-[1.4] text-white/80"
          style={{
            fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
            fontFamily: "var(--font-sans)",
            textTransform: "none",
            letterSpacing: "0",
            fontWeight: 400,
          }}
        >
          {line2Typed}
          {isTyping && (
            <span
              aria-hidden
              className="ml-1 inline-block h-[14px] w-[8px] translate-y-[2px] rounded-[1px] bg-[#94fcff] chat-cursor-blink"
            />
          )}
        </p>
      </div>

      {/* Industry command grid — fades in after typing completes */}
      <div
        className={cn(
          "mt-10 grid w-full max-w-2xl grid-cols-1 gap-2 transition-all duration-700 sm:grid-cols-2",
          chipsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        )}
        style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
      >
        {SUGGESTED_PROMPTS.map(({ code, icon: Icon, label, prompt }, i) => (
          <button
            key={code}
            onClick={() => onPick(prompt)}
            disabled={!chipsVisible}
            className="group/chip relative flex min-h-[68px] cursor-pointer items-start gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-left transition-all duration-300 hover:border-[#94fcff]/30 hover:bg-[#94fcff]/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 disabled:cursor-default"
            style={{
              transitionTimingFunction: "var(--ease-out-expo)",
              transitionDelay: chipsVisible ? `${i * 60}ms` : "0ms",
            }}
          >
            {/* Hover sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#94fcff]/[0.04] to-transparent transition-transform duration-700 group-hover/chip:translate-x-full"
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            />

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#94fcff]/15 bg-[#94fcff]/[0.04] text-[#94fcff] transition-colors group-hover/chip:border-[#94fcff]/30 group-hover/chip:bg-[#94fcff]/10">
              <Icon size={16} strokeWidth={1.5} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-[2px] text-[#94fcff]/40">
                  {code}
                </span>
                <span className="text-[12px] font-medium uppercase tracking-[1px] text-white font-[family-name:var(--font-display)]">
                  {label}
                </span>
              </div>
              <span className="line-clamp-2 text-[12px] leading-snug text-white/85">
                {prompt}
              </span>
            </div>
            <ChevronRight
              size={14}
              className="mt-1 shrink-0 -translate-x-1 text-nex-dim/40 opacity-0 transition-all duration-300 group-hover/chip:translate-x-0 group-hover/chip:text-[#94fcff] group-hover/chip:opacity-100"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Composer ─────────────────────── */

function Composer({
  input,
  setInput,
  isStreaming,
  isFocused,
  setFocused,
  onSubmit,
  onStop,
  onKeyDown,
  inputRef,
}: {
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  isFocused: boolean;
  setFocused: (v: boolean) => void;
  onSubmit: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const hasInput = input.trim().length > 0;

  return (
    <div
      className={cn(
        "group/composer relative rounded-2xl border bg-[#0e1418]/60 backdrop-blur-xl transition-all duration-300",
        isFocused
          ? "border-[#94fcff]/40 shadow-[0_0_0_1px_rgba(148,252,255,0.15),0_0_60px_-20px_rgba(148,252,255,0.4)]"
          : "border-white/[0.08] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]",
        isStreaming && "border-[#94fcff]/30 chat-composer-streaming"
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      {/* Breathing focus ring (composited) */}
      {isFocused && !isStreaming && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[#94fcff]/20 chat-focus-glow"
        />
      )}

      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isStreaming ? "Generating..." : "Ask about AI solutions for your business..."}
          rows={1}
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-white placeholder:text-nex-dim/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={{ maxHeight: "200px" }}
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:text-red-200"
            aria-label="Stop generation"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!hasInput}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              hasInput
                ? "cursor-pointer bg-[#94fcff] text-[#0e1418] shadow-[0_0_24px_-4px_rgba(148,252,255,0.5)] hover:bg-white"
                : "cursor-not-allowed bg-white/[0.04] text-nex-dim/40"
            )}
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Limit reached card ─────────────────────── */

function LimitReachedCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#94fcff]/25 bg-gradient-to-br from-[#94fcff]/[0.06] via-[#94fcff]/[0.02] to-transparent p-6 backdrop-blur-md md:p-8">
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(148,252,255,0.12) 0%, transparent 65%)",
        }}
      />

      <div className="relative">
        <span className="text-[10px] font-mono uppercase tracking-[3px] text-[#94fcff]/70">
          {"// Demo complete"}
        </span>
        <h3
          className="mt-3 font-[family-name:var(--font-display)] text-xl leading-[1.15] tracking-[-0.01em] text-white md:text-2xl"
        >
          You&apos;ve seen what&apos;s possible.
        </h3>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/70">
          Ready to build this for your actual business? Let&apos;s talk —
          a free 30-minute call, no pitch deck, just your problem and how
          we&apos;d solve it.
        </p>

        <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <a
            href={BOOKING_HREF}
            className="group/cta inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#94fcff] px-6 text-[12px] font-semibold uppercase tracking-[1.5px] text-[#0e1418] shadow-[0_0_32px_-8px_rgba(148,252,255,0.5)] transition-all duration-300 hover:bg-white hover:shadow-[0_0_48px_-4px_rgba(148,252,255,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <Calendar size={14} strokeWidth={2.2} />
            Book a Free Consultation
            <ChevronRight
              size={14}
              className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
            />
          </a>
          <span className="text-center text-[10px] font-mono uppercase tracking-[1.5px] text-nex-dim sm:text-left">
            30 min · no commitment
          </span>
        </div>
      </div>
    </div>
  );
}
