import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cosmic RAG App',
  description: 'Explore the cosmos and chat with Groq/Mistral AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
