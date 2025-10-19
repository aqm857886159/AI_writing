// 轻量诊断事件总线：内存 + localStorage 缓冲，可导出 JSON

const buffer = [];
const MAX = 500;
const subscribers = new Set();

export const diag = {
  version: 'diag-v1',
  flags: { debug: false },
  emit(event) {
    const e = { t: Date.now(), ...event };
    buffer.push(e);
    if (buffer.length > MAX) buffer.shift();
    try { localStorage.setItem('diag:buf', JSON.stringify(buffer.slice(-200))); } catch (_) {}
    subscribers.forEach((fn) => { try { fn(e); } catch (_) {} });
  },
  on(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
  getAll() { return [...buffer]; },
  export() {
    const env = {
      ua: (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      lang: (typeof navigator !== 'undefined' ? navigator.language : ''),
      vite: typeof window !== 'undefined' && !!window.__vite_plugin_react_preamble_installed,
    };
    const cfg = { flags: this.flags };
    return { env, cfg, events: this.getAll() };
  }
};


