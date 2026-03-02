/**
 * SpecForge — Root Layout
 * src/app/layout.tsx
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpecForge — Self-Assembling Product Engine',
  description: 'Transform your raw idea into a complete product package in minutes. Powered by 6 collaborating AI agents on Complete.dev.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">SF</div>
            <span className="text-white font-semibold text-sm">SpecForge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Powered by</span>
            <span className="text-purple-400 text-xs font-semibold">Complete.dev</span>
          </div>
        </nav>
        <div className="pt-16">{children}</div>
        <footer className="border-t border-white/10 py-8 mt-16">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <p className="text-slate-500 text-sm">Built with SpecForge · Powered by Complete.dev</p>
            <p className="text-slate-600 text-xs font-mono">Self-assembled in Complete.dev workspace</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
