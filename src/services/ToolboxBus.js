// 右侧创作工具箱的“引用”事件总线（借鉴 open-webui/lobe-chat 的会话/总线模式）
// API: onQuotes(cb) -> off; pushQuote(text); clearQuotes()

const listeners = new Set();
let quotes = [];

export function onQuotes(cb) {
  listeners.add(cb);
  try { cb([...quotes]); } catch (_) {}
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((fn) => { try { fn([...quotes]); } catch (_) {} });
}

export function pushQuote(text) {
  const t = String(text || '').trim();
  if (!t) return;
  if (!quotes.includes(t)) {
    quotes = [...quotes, t].slice(-6);
    try { localStorage.setItem('toolbox:quotes', JSON.stringify(quotes)); } catch (_) {}
    emit();
  }
}

export function clearQuotes() {
  quotes = [];
  try { localStorage.removeItem('toolbox:quotes'); } catch (_) {}
  emit();
}

// 初始化加载
(function load() {
  try { quotes = JSON.parse(localStorage.getItem('toolbox:quotes') || '[]') || []; } catch (_) { quotes = []; }
})();


