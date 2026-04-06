import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/auth-context";

const nevera = localFont({
  src: "../../../public/fonts/nevera-font/Nevera-Regular.otf",
  variable: "--font-display",
  display: "swap",
});

const nexa = localFont({
  src: [
    { path: "../../../public/fonts/Nexa-Font/NexaLight.otf", weight: "300" },
    { path: "../../../public/fonts/Nexa-Font/NexaRegular.otf", weight: "400" },
    { path: "../../../public/fonts/Nexa-Font/NexaBold.otf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexApex AI Studio",
  description: "Try real AI demos — computer vision, smart chat, and document intelligence.",
};

export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nevera.variable} ${nexa.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[#0e1418] text-[#f0f1ef]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
