import React from 'react';
import { onQuotes, clearQuotes } from '../services/ToolboxBus.js';
import { chatRequest } from '../services/ChatService.js';
import { onMessages, addMessage, getRecent } from '../services/ChatStore.js';

export default function ToolboxPanel() {
  const [quotes, setQuotes] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [input, setInput] = React.useState('');

  React.useEffect(() => onQuotes(setQuotes), []);
  React.useEffect(() => onMessages(setMessages), []);

  const send = async (userText) => {
    if (busy) return;
    setBusy(true);
    const content = (userText && userText.trim()) || '请根据引用进行讨论，给出你的建议。';
    addMessage({ role: 'user', content });
    try {
      const text = await chatRequest({ quotes, history: getRecent(12), input: content });
      addMessage({ role: 'ai', content: text });
    } finally {
      setBusy(false);
      setInput('');
    }
  };

  return (
    <div className="p-6 pt-6 h-full flex flex-col" style={{ minHeight: 0 }}>
      <h2 className="text-base font-semibold text-textMain mb-2">创作工具箱</h2>

      {/* 引用区 */}
      <div className="mb-2 flex flex-wrap gap-2">
        {quotes.map((q, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20 line-clamp-2">{q}</span>
        ))}
        {!!quotes.length && (
          <button className="text-xs text-[#64748b]" onClick={clearQuotes}>清空引用</button>
        )}
      </div>

      {/* 对话区 */}
      <div className="flex-1 overflow-auto space-y-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <MessageItem key={i} role={m.role} content={m.content} />
        ))}
        {!messages.length && (
          <div className="text-sm text-textSecondary">（选中文本后点击“引用”，然后点下面“发送”即可开始对话）</div>
        )}
      </div>

      {/* 底部：输入 + 发送 */}
      <div className="mt-3">
        <textarea
          className="w-full h-20 p-2 border border-borderLight rounded resize-none"
          placeholder="在此输入你的问题或指令…（Enter发送，Shift+Enter换行）"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
        />
        <div className="mt-2 flex justify-end">
          <button disabled={busy} className="h-9 px-3 rounded bg-[#2563EB] text-white disabled:opacity-50" onClick={() => send(input)}>
            {busy ? '发送中…' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({ role, content }) {
  const ref = React.useRef(null);
  const copy = () => {
    try { navigator.clipboard.writeText(content || ''); } catch (_) {}
  };
  return (
    <div ref={ref} className={role === 'ai' ? 'bg-white border border-borderLight rounded p-2' : 'text-textSecondary'}>
      <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
      {role === 'ai' && (
        <div className="mt-1 text-right">
          <button className="text-xs text-[#64748b] hover:underline" onClick={copy}>复制</button>
        </div>
      )}
    </div>
  );
}


