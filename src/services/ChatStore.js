// 极简会话存储：本地持久化 + 订阅（借鉴 ChatGPT-Next-Web 的本地会话思路）

const listeners = new Set();
let messages = [];

export function onMessages(cb) {
  listeners.add(cb);
  try { cb([...messages]); } catch (_) {}
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((fn) => { try { fn([...messages]); } catch (_) {} });
}

export function getRecent(n = 12) {
  return messages.slice(-n);
}

export function addMessage(msg) {
  const item = { role: msg.role || 'user', content: String(msg.content || ''), ts: Date.now() };
  messages = [...messages, item].slice(-200);
  try { localStorage.setItem('chat:messages', JSON.stringify(messages)); } catch (_) {}
  emit();
}

export function clearMessages() {
  messages = [];
  try { localStorage.removeItem('chat:messages'); } catch (_) {}
  emit();
}

// 初始化加载
(function load() {
  try { messages = JSON.parse(localStorage.getItem('chat:messages') || '[]') || []; } catch (_) { messages = []; }
})();


