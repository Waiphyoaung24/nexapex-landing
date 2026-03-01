import type { Metadata } from 'next';
import './globals.css';
import { Space_Grotesk, Rajdhani, Orbitron } from 'next/font/google';

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
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} ${spaceGrotesk.variable}`}>
      <body className="font-b bg-bg text-white overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
