"use client";

import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-[14px] leading-relaxed text-white">
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
      </div>
    );
  }

  const isThinking = isStreaming && content.length === 0;

  return (
    <div className="flex gap-3">
      {/* Orb mark */}
      <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[#94fcff]/15" />
        <span className="absolute inset-1.5 rounded-full border border-[#94fcff]/30" />
        <span
          className={cn(
            "relative h-1.5 w-1.5 rounded-full bg-[#94fcff] shadow-[0_0_10px_rgba(148,252,255,0.5)]",
            isStreaming && "chat-orb-active"
          )}
        />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <span className="mb-1 block text-[9px] font-mono uppercase tracking-[2px] text-[#94fcff]/50">
          NexApex AI
        </span>

        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#94fcff]/60"
                style={{
                  animation: "chat-thinking 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-[14px] leading-[1.8] text-white/90">
            <Markdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 flex flex-col gap-2.5 last:mb-0">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 flex flex-col gap-2.5 last:mb-0">{children}</ol>
                ),
                li: ({ children, index }) => (
                  <li className="flex gap-2.5 leading-[1.7]">
                    <span className="mt-[6px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#94fcff]/15 bg-[#94fcff]/[0.04] text-[10px] font-mono font-medium text-[#94fcff]/60">
                      {(index ?? 0) + 1}
                    </span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                code: ({ children }) => (
                  <code className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[13px] text-[#94fcff]/80">
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </Markdown>
            {isStreaming && (
              <span
                aria-label="Generating"
                className="ml-1 inline-block h-[14px] w-[8px] translate-y-[2px] rounded-[1px] bg-[#94fcff] chat-cursor-blink"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
