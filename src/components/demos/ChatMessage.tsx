"use client";

import { cn } from "@/lib/utils";

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

  // Assistant — flush-left, no bubble, with orb mark in gutter
  return (
    <div className="flex gap-3">
      {/* Orb mark — small concentric ring + dot */}
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
        {/* Mono kicker */}
        <span className="mb-1 block text-[9px] font-mono uppercase tracking-[2px] text-[#94fcff]/50">
          NexApex AI
        </span>

        <div className="text-[14px] leading-[1.7] text-white/90">
          <span className="whitespace-pre-wrap break-words">{content}</span>
          {isStreaming && (
            <span
              aria-label="Generating"
              className="ml-1 inline-block h-[14px] w-[8px] translate-y-[2px] rounded-[1px] bg-[#94fcff] chat-cursor-blink"
            />
          )}
        </div>
      </div>
    </div>
  );
}
