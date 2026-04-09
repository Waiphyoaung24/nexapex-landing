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
