import type { Metadata } from "next";
import DemoHubClient from "./DemoHubClient";

export const metadata: Metadata = {
  title: "AI Demo Hub — NexApex AI Studio",
  description: "Try real AI capabilities. Upload your own data and see results instantly.",
};

export default function DemoHubPage() {
  return <DemoHubClient />;
}
