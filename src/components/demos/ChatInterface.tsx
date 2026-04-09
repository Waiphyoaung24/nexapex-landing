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
