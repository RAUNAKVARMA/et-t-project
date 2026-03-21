'use client';

import Link from 'next/link';
import ChatInterface from '../../components/ChatInterface';

export default function ChatPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, #0d1a2e 0%, #050510 60%, #000 100%)',
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem 1.25rem',
          background: 'rgba(5,5,16,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,229,255,0.1)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#00d4ff',
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(0,212,255,0.25)',
            transition: 'background 0.2s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Galaxy
        </Link>
        <span
          style={{
            marginLeft: 'auto',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Cosmic RAG
        </span>
      </nav>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ChatInterface />
      </main>
    </div>
  );
}
