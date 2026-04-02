import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nevera = localFont({
  src: "../../public/fonts/nevera-font/Nevera-Regular.otf",
  variable: "--font-display",
  display: "swap",
});

const nexa = localFont({
  src: [
    { path: "../../public/fonts/Nexa-Font/NexaLight.otf", weight: "300" },
    { path: "../../public/fonts/Nexa-Font/NexaRegular.otf", weight: "400" },
    { path: "../../public/fonts/Nexa-Font/NexaBold.otf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexApex - Where AI Reaches Its Peak",
  description: "NEX APEX is an AI tech solutions company driving businesses to the pinnacle of technological capability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nevera.variable} ${nexa.variable} dark h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-[#0e1418] text-[#f0f1ef] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
