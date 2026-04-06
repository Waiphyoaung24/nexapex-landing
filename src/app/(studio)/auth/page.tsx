import { EmailGateForm } from "@/components/studio/EmailGateForm";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <img
          src="/images/Flat_white.png"
          alt="NexApex"
          className="mx-auto mb-6 h-12 w-12"
        />
        <h1 className="mb-2 text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
          AI Solutions Studio
        </h1>
        <p className="mb-8 text-sm text-white/50">
          Try real AI demos — computer vision, smart chat, and document
          intelligence.
        </p>
        <EmailGateForm />
      </div>
    </div>
  );
}
