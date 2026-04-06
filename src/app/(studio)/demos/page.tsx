import { DemoCard } from "@/components/studio/DemoCard";
import { Eye, MessageCircle, FileText } from "lucide-react";

export default function DemoHubPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
          AI Demo Hub
        </h1>
        <p className="mx-auto max-w-2xl text-base text-white/50">
          Try real AI capabilities. Upload your own data and see results instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <DemoCard
          title="Vision Inspector"
          description="Upload an image or use your camera to detect objects with real-time computer vision."
          href="/demos/vision"
          icon={<Eye size={24} />}
          usageLabel="10 demos available"
          tags={["Manufacturing", "Retail", "QC"]}
        />
        <DemoCard
          title="Smart Assistant"
          description="Chat with an AI business consultant that understands Southeast Asian markets."
          href="/demos/chat"
          icon={<MessageCircle size={24} />}
          usageLabel="20 messages available"
          tags={["F&B", "Agriculture", "Tech"]}
        />
        <DemoCard
          title="Document Intelligence"
          description="Upload invoices, receipts, or documents to extract structured data automatically."
          href="/demos/docs"
          icon={<FileText size={24} />}
          usageLabel="5 documents available"
          tags={["Finance", "Admin", "Logistics"]}
        />
      </div>
    </div>
  );
}
