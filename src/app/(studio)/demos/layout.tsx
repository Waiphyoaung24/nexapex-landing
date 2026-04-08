import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";
import { AuthGuard } from "@/components/studio/AuthGuard";

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[72px] md:pt-[88px]">
        <AuthGuard>{children}</AuthGuard>
      </main>
      <FooterSection />
    </div>
  );
}
