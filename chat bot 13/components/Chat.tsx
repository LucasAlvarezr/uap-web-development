
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';

type Role = 'user' | 'assistant' | 'system';
type Msg = { id: string; role: Role; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState('');
  const [lastBodyPreview, setLastBodyPreview] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const typing = useMemo(() => isLoading, [isLoading]);

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorText(null);
    setLastStatus('');
    setLastBodyPreview('');

    const content = input.trim();
    if (!content || isLoading) return;


    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

   
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);


    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch('/api/chat?stream=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
        signal: controller.signal,
      });

      setLastStatus(`${res.status} ${res.statusText}`);

      
      if (!res.ok) {
        const raw = await res.text().catch(() => '');
        setLastBodyPreview(raw.slice(0, 1000));
        let errMsg = '';
        try {
          const j = JSON.parse(raw);
          errMsg = j?.error || raw;
        } catch {
          errMsg = raw || `HTTP ${res.status}`;
        }
        throw new Error(errMsg || `HTTP ${res.status}`);
      }

  
      const ct = res.headers.get('content-type') || '';
      let assistantText = '';

      if (ct.includes('application/json')) {
        const data = await res.json();
        assistantText = String(data?.text ?? data?.reply ?? data ?? '');
      } else {
        const raw = await res.text();
        try {
          const maybe = JSON.parse(raw);
          assistantText = String(maybe?.text ?? maybe?.reply ?? raw);
        } catch {
          assistantText = raw;
        }
      }

      if (!assistantText) throw new Error('Respuesta vacía del servidor.');

      
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m))
      );
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setErrorText('Se agotó el tiempo de espera (stream cortado).');
      } else {
        setErrorText(String(err?.message || 'Error procesando tu mensaje'));
      }
      
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">💡 Chat-bot </h1>
        <div className="subtitle">👍</div>
      </header>

      <main className="main">
        {messages.length === 0 && (
          <div className="empty-hint">
            Escribí tu primer mensaje.
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}

        {typing && <div className="typing">El asistente está escribiendo…</div>}
        <div ref={bottomRef} />
      </main>

      <form className="form" onSubmit={sendMessage}>
        {errorText && (
          <div className="error" style={{ whiteSpace: 'pre-wrap' }}>
            {errorText}
            {lastStatus ? `\nStatus: ${lastStatus}` : ''}
            {lastBodyPreview ? `\nBody: ${lastBodyPreview}` : ''}
          </div>
        )}

        <div className="form-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí tu mensaje…"
            className="textarea"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="button">
            Enviar
          </button>
          <button type="button" onClick={stop} disabled={!isLoading} className="button">
            Detener
          </button>
        </div>
      </form>
    </div>
  );
}
