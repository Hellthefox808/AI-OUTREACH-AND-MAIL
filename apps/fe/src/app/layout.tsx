import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Career Intelligence OS — Premium Spatial Platform',
  description: 'Enterprise company research, recruiter discovery, and talent acquisition intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <body className="min-h-screen bg-[#080a0f] text-slate-100 bg-spatial-mesh antialiased relative selection:bg-sky-500/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
