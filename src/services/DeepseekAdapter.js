// DeepSeek API 适配层（OpenAI 兼容风格）
// 运行条件：提供 API Key（Vite: import.meta.env.VITE_DEEPSEEK_API_KEY，
// 或 window.DEEPSEEK_API_KEY，或 localStorage['DEEPSEEK_API_KEY']）。

// 走本地代理，避免浏览器跨域与前端暴露密钥
const DS_ENDPOINT = '/llm/v1/chat/completions';

// 临时硬编码 API Key（后续可由 .env.local / window / localStorage 覆盖）
const DS_API_KEY = 'sk-60e458bec2b64116a80ccef8b1edac57';
export function getApiKey() {
  // 1) Vite 环境变量
  let envKey = '';
  try {
    // eslint-disable-next-line no-undef
    envKey = import.meta?.env?.VITE_DEEPSEEK_API_KEY || '';
  } catch (_e) {}
  if (envKey) return envKey;

  // 2) window 注入
  try { if (typeof window !== 'undefined' && window.DEEPSEEK_API_KEY) return window.DEEPSEEK_API_KEY; } catch (_e) {}

  // 3) localStorage
  try { const ls = localStorage.getItem('DEEPSEEK_API_KEY'); if (ls) return ls; } catch (_e) {}

  // 4) 回退到硬编码
  return DS_API_KEY;
}

export function deepseekAvailable() {
  return Boolean(getApiKey());
}

function withTimeout(promise, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
  ]);
}

function buildMessages(systemContent, userContent) {
  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ];
}

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}

function normalizeItems(json) {
  const arr = json?.items || json || [];
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 3).map((x, i) => ({
    id: x.id || `ds_${i}_${Math.random().toString(36).slice(2,8)}`,
    type: x.type || 'logic',
    severity: x.severity || 'med',
    // 规范化信心度到 [0,1]，缺省给 0.6，避免 NaN/字符串导致排序与阈值判断失效
    confidence: (() => {
      const raw = Number(x.confidence);
      if (!Number.isFinite(raw)) return 0.6;
      return Math.max(0, Math.min(1, raw));
    })(),
    question: String(x.question || '').slice(0, 300),
    why: String(x.why || '').slice(0, 300),
    hints: Array.isArray(x.hints) ? x.hints.slice(0, 2) : [],
    followUps: Array.isArray(x.followUps) ? x.followUps.slice(0, 2) : [],
    status: 'open',
  })).filter(x => x.question);
}

// 解析 Q:/Why: 轻格式
function parseQWhyBlocks(text) {
  if (!text) return [];
  const lines = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const cards = [];
  for (let i = 0; i < lines.length && cards.length < 3; i++) {
    const qm = /^Q:\s*(.+)$/i.exec(lines[i]);
    if (!qm) continue;
    let why = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const wm = /^Why:\s*(.+)$/i.exec(lines[j]);
      if (wm) { why = wm[1].trim(); break; }
      if (/^Q:\s*/i.test(lines[j])) break;
    }
    const question = qm[1].trim();
    if (question) {
      cards.push({
        id: `ds_${cards.length}_${Math.random().toString(36).slice(2,8)}`,
        type: 'conceptual',
        severity: 'med',
        confidence: 0.6,
        question: /[?？]$/.test(question) ? question : `${question}?`,
        why: why || '基于轻格式解析得到的问题解释。',
        hints: [],
        followUps: [],
        status: 'open',
      });
    }
  }
  return cards;
}

async function callDeepseek(body) {
  try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'llm.request', model: body?.model, size: (body?.messages?.[1]?.content || '').length }); } catch (_) {}
  const res = await fetch(DS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });
  let raw = '';
  try { raw = await res.text(); } catch (_) {}
  let data = {};
  try { data = JSON.parse(raw); } catch (_) {}
  try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'llm.response', ok: res.ok, status: res.status }); } catch (_) {}
  if (!res.ok) {
    // 打印服务端错误便于定位（例如 400 Bad Request 的具体原因）
    // 不抛出异常以免打断调用方；返回空数组
    try { console.error('DeepSeek API error', res.status, data?.error || data); } catch (_) {}
    return [];
  }
  const msg = data?.choices?.[0]?.message || {};
  const content = (msg?.content || '').trim();
  const parsed = safeParseJSON(content);
  if (parsed) return normalizeItems(parsed);
  // 先尝试解析 Q/Why 轻格式
  const qwhy = parseQWhyBlocks(content);
  if (qwhy.length) return qwhy;
  // 退化到纯文本解析
  const text = content || String(msg?.reasoning_content || '').trim();
  if (!text) return [];
  const pieces = text
    .split(/\n|\r|。|？|\?|!/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return pieces.map((q, i) => ({
    id: `ds_${i}_${Math.random().toString(36).slice(2,8)}`,
    type: 'conceptual',
    severity: 'med',
    confidence: 0.6,
    question: /[?？]$/.test(q) ? q : `${q}?`,
    why: '基于自由文本解析得到的问题。',
    hints: [],
    followUps: [],
    status: 'open',
  }));
}

export async function askDeepseekV3(sectionText) {
  const system = [
    '你是苏格拉底式提问者。只提出问题与“为什么问”，不提供答案或改写。',
    '请严格用以下轻格式输出，最多 1–3 组，不要包含其它文本：',
    'Q: [问题1]',
    'Why: [为什么问，1–2 句话]',
    'Q: [问题2]',
    'Why: [...]',
    'Q: [问题3]',
    'Why: [...]',
  ].join('\n');
  const user = `请基于下文生成 1–3 组 Q/Why，保持原文语言：\n"""${sectionText.slice(0, 4000)}"""`;
  return withTimeout(
    (signal) =>
      callDeepseek(
        {
          model: 'deepseek-chat',
          temperature: 0.2,
          max_tokens: 400,
          // 部分环境下 response_format 可能不被支持，先移除以规避 400
          messages: buildMessages(system, user),
        },
        signal,
      ),
    20000,
  );
}

export async function askDeepseekR1(sectionText, seedItems = []) {
  const system = [
    '你是严苛的苏格拉底式审稿人。只输出问题与“为什么问”，禁止答案/改写。',
    '请严格使用以下轻格式补充 1–2 组更深的问题：',
    'Q: [问题]',
    'Why: [为什么问，1–2 句话]'
  ].join('\n');
  const user = `已有问题：${JSON.stringify({ items: seedItems }).slice(0, 800)}\n请基于下文补充 1–2 组 Q/Why：\n"""${sectionText.slice(0, 3500)}"""`;
  return withTimeout(
    (signal) =>
      callDeepseek(
        {
          model: 'deepseek-reasoner',
          temperature: 0.2,
          max_tokens: 450,
          // 同上：暂不指定 response_format
          messages: buildMessages(system, user),
        },
        signal,
      ),
    22000,
  );
}



