import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talk to Your Data — Natural-Language Analytics',
  description: 'Ask questions about a CSV in plain English. The LLM writes SQL, runs it on an in-memory SQLite engine, and returns a table and chart.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
