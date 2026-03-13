import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    document: string;
    score: number;
    chunk_index: number;
  }>;
  timestamp: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setMessages([...messages, { role: 'user', content: input, timestamp: new Date() }]);
    // Call backend API
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Unable to get response.',
          timestamp: new Date(),
        },
      ]);
    }
    setInput('');
    setIsLoading(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '2rem auto' }}>
      <div style={{ minHeight: 300, background: '#222', borderRadius: 8, padding: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <b>{msg.role === 'user' ? 'You' : 'AI'}:</b> {msg.content}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ fontSize: '0.9em', color: '#aaa', marginTop: 4 }}>
                Sources:
                <ul>
                  {msg.sources.map((src, i) => (
                    <li key={i}>{src.document} (score: {src.score.toFixed(2)}, chunk: {src.chunk_index})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', marginTop: 16 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the cosmos..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: 'none' }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} style={{ marginLeft: 8, padding: '8px 16px', borderRadius: 4, background: '#1a237e', color: '#fff', border: 'none' }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
