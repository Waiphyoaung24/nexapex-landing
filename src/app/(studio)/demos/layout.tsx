import { StudioHeader } from "@/components/studio/StudioHeader";

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
