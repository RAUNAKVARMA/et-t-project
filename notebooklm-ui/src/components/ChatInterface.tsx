'use client';

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import DocumentUpload from './DocumentUpload';
import FileTypeIcon from './FileTypeIcon';
import { getApiBaseUrl } from '@/lib/api';
import { formatRelativeTime } from '@/lib/time';
import styles from './ChatInterface.module.css';

interface SourceRef {
  document?: string;
  score: number;
  chunk_index: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceRef[];
  timestamp: Date;
}

interface DocumentListItem {
  id: string;
  name: string;
  type: string;
  chunks: number;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, refreshRelativeTimes] = useReducer((n: number) => n + 1, 0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [docError, setDocError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBase = getApiBaseUrl();

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/documents`);
      if (!res.ok) {
        setDocError('Could not load documents.');
        return;
      }
      const data = (await res.json()) as DocumentListItem[];
      setDocuments(Array.isArray(data) ? data : []);
      setDocError(null);
    } catch {
      setDocError('Could not load documents.');
    }
  }, [apiBase]);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  useEffect(() => {
    const id = window.setInterval(() => refreshRelativeTimes(), 30000);
    return () => window.clearInterval(id);
  }, [refreshRelativeTimes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const data = (await res.json()) as {
        answer: string;
        sources?: SourceRef[];
        timestamp?: string;
      };

      let ts = new Date();
      if (data.timestamp) {
        const parsed = Date.parse(data.timestamp);
        if (!Number.isNaN(parsed)) {
          ts = new Date(parsed);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          timestamp: ts,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again in a moment.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setDocError(null);
    const allowed = /\.(pdf|docx|txt|md|csv)$/i;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowed.test(file.name)) {
        setDocError('Only PDF, DOCX, TXT, MD, and CSV files are supported.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setDocError('Each file must be 10 MB or smaller.');
        continue;
      }
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch(`${apiBase}/upload`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { detail?: unknown };
          let detail = 'Upload failed.';
          if (errBody.detail !== undefined) {
            const d = errBody.detail;
            detail = Array.isArray(d) ? d.map((x) => String(x)).join(' ') : String(d);
          }
          setDocError(detail);
          continue;
        }
        await refreshDocuments();
      } catch {
        setDocError('Upload failed. Check your connection and try again.');
      }
    }
  };

  const confirmClearHistory = () => {
    setIsClearing(true);
    window.setTimeout(() => {
      setMessages([]);
      setIsClearing(false);
      setShowClearConfirm(false);
    }, 300);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.clearBtn}
          disabled={messages.length === 0 || isClearing}
          onClick={() => setShowClearConfirm(true)}
          aria-label="Clear chat history"
        >
          Clear chat history
        </button>
      </div>

      {showClearConfirm && (
        <div
          className={styles.dialogWrap}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
        >
          <div className={styles.dialog}>
            <h3 id="clear-dialog-title">Clear all messages?</h3>
            <p>This removes the conversation from this screen. Your uploaded documents stay indexed.</p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogCancel} onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button type="button" className={styles.dialogConfirm} onClick={confirmClearHistory}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`${styles.chatPanel} ${isClearing ? styles.chatPanelFadeOut : ''}`}
        aria-live="polite"
      >
        {messages.map((msg, idx) => (
          <div key={`${msg.timestamp.getTime()}-${idx}`} className={styles.message}>
            <div className={styles.roleRow}>
              <span
                className={`${styles.roleLabel} ${msg.role === 'assistant' ? styles.roleLabelAssistant : ''}`}
              >
                {msg.role === 'user' ? 'You' : 'Cosmic AI'}
              </span>
              <span className={styles.time} suppressHydrationWarning>
                {formatRelativeTime(msg.timestamp)}
              </span>
            </div>
            <div className={styles.body}>
              {msg.content.split('\n').map((line, li) => (
                <span key={li}>
                  {line}
                  {li < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <details className={styles.sources}>
                <summary className={styles.sourcesSummary}>
                  {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} referenced
                </summary>
                <ul>
                  {msg.sources.map((src, i) => (
                    <li key={i} className={styles.sourceItem}>
                      <span className={styles.sourceDoc}>{src.document ?? 'Document'}</span>
                      <span className={styles.sourceMeta}>
                        {typeof src.score === 'number' && `score ${src.score.toFixed(2)} · `}
                        chunk {src.chunk_index}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
        {isLoading && (
          <div className={styles.typing} aria-live="polite">
            <span>AI is typing</span>
            <span className={styles.dots} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.form} onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the cosmos..."
          className={styles.input}
          disabled={isLoading}
          aria-label="Message"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className={styles.sendBtn}>
          Send
        </button>
      </form>

      <div className={styles.docSection}>
        <DocumentUpload onFileUpload={handleFileUpload} />
        {docError && (
          <p role="alert" style={{ color: '#ff80ab', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {docError}
          </p>
        )}
        {documents.length > 0 && (
          <ul className={styles.docList}>
            {documents.map((doc) => (
              <li key={doc.id} className={styles.docRow}>
                <FileTypeIcon type={doc.type} />
                <span className={styles.docName} title={doc.name}>
                  {doc.name}
                </span>
                <span className={styles.docMeta}>{doc.chunks} chunks</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
