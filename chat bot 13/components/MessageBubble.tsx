'use client';
import { memo } from 'react';

type Role = 'user' | 'assistant' | 'system';

export default memo(function MessageBubble({
  role, content,
}: { role: Role; content: string }) {
  const isUser = role === 'user';
  const who = role === 'user' ? 'Tú' : role === 'assistant' ? 'Asistente' : 'Sistema';
  return (
    <div className={`bubble-row ${isUser ? 'right' : 'left'}`}>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        <div className="bubble-who">{who}</div>
        <div>{content}</div>
      </div>
    </div>
  );
});
