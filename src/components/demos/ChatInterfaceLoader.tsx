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
