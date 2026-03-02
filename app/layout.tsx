import type { Metadata } from 'next';
import './globals.css';
import localFont from 'next/font/local';
import { Space_Grotesk, Rajdhani, Orbitron } from 'next/font/google';

/* ── Brand Primary Fonts (Local) ── */
const nevera = localFont({
  src: '../public/nevera-font/Nevera-Regular.otf',
  variable: '--font-nevera',
  display: 'swap',
});

const nexa = localFont({
  src: [
    { path: '../public/Nexa-Font/NexaThin.otf', weight: '100', style: 'normal' },
    { path: '../public/Nexa-Font/NexaThinItalic.otf', weight: '100', style: 'italic' },
    { path: '../public/Nexa-Font/NexaLight.otf', weight: '300', style: 'normal' },
    { path: '../public/Nexa-Font/NexaLightItalic.otf', weight: '300', style: 'italic' },
    { path: '../public/Nexa-Font/NexaRegular.otf', weight: '400', style: 'normal' },
    { path: '../public/Nexa-Font/NexaRegularItalic.otf', weight: '400', style: 'italic' },
    { path: '../public/Nexa-Font/NexaBook.otf', weight: '500', style: 'normal' },
    { path: '../public/Nexa-Font/NexaBookItalic.otf', weight: '500', style: 'italic' },
    { path: '../public/Nexa-Font/NexaBold.otf', weight: '700', style: 'normal' },
    { path: '../public/Nexa-Font/NexaBoldItalic.otf', weight: '700', style: 'italic' },
    { path: '../public/Nexa-Font/NexaXBold.otf', weight: '800', style: 'normal' },
    { path: '../public/Nexa-Font/NexaXBoldItalic.otf', weight: '800', style: 'italic' },
    { path: '../public/Nexa-Font/NexaHeavy.otf', weight: '900', style: 'normal' },
    { path: '../public/Nexa-Font/NexaHeavyItalic.otf', weight: '900', style: 'italic' },
    { path: '../public/Nexa-Font/NexaBlack.otf', weight: '950', style: 'normal' },
    { path: '../public/Nexa-Font/NexaBlackItalic.otf', weight: '950', style: 'italic' },
  ],
  variable: '--font-nexa',
  display: 'swap',
});

/* ── Fallback Fonts (Google) ── */
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron'
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk'
});

export const metadata: Metadata = {
  title: 'NEX APEX',
  description: 'AI Driven Premium Web Experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nevera.variable} ${nexa.variable} ${orbitron.variable} ${rajdhani.variable} ${spaceGrotesk.variable}`}>
      <body className="font-b bg-bg text-white overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
