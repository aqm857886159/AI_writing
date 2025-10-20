// CriticService：订阅文稿快照，基于章节的慢节奏调度与“苏格拉底式问题”（AI 优先）。
// 结果持久化 localStorage（可换 IndexedDB）。

import { detectSections } from './SectionDetector.js';
import { deepseekAvailable, askDeepseekV3 } from './DeepseekAdapter.js';
import { routeLLM } from './ModelRouter.js';
import { llmCall } from './LLMAdapter.js';

const CRITIC_KEY = 'critic:v0';
// 触发阈值（按原设计：字数≥200，空闲≥20s）
const IDLE_MS = 20000;
const WORDS_MIN = 200;
// 已去除规则层与复杂阈值，AI 必调（V3）
const pendingTimers = new Map();
const subscribers = new Set();

const state = {
  sections: [], // {id,title,text,wordCount,hash,updatedAt,status}
  critiquesBySection: new Map(), // id -> Critique[]
  lastRunAt: 0,
};

function loadPersist() {
  try {
    const raw = localStorage.getItem(CRITIC_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.sections) state.sections = data.sections;
    if (data.critiques) state.critiquesBySection = new Map(data.critiques);
  } catch (_) {}
}

function savePersist() {
  try {
    const payload = {
      sections: state.sections,
      critiques: Array.from(state.critiquesBySection.entries()),
    };
    localStorage.setItem(CRITIC_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function now() { return Date.now(); }


function shouldQueue(section) {
  const enoughWords = section.wordCount >= WORDS_MIN;
  const idleMs = now() - section.updatedAt;
  return enoughWords && idleMs >= IDLE_MS;
}

let debounceTimer = null;

export function upsertFromDocJSON(docJson) {
  // 1) 章节检测
  const detected = detectSections(docJson);
  const oldById = new Map(state.sections.map(s => [s.id, s]));
  state.sections = detected.map((s, idx) => ({ ...s, id: `sec_${idx+1}`, status: 'dormant' }));

  // 2) 标记就绪/过期
  for (const sec of state.sections) {
    const prev = oldById.get(sec.id);
    if (!prev) continue;
    if (prev.hash !== sec.hash) {
      // 内容变化：刷新该章节的最后编辑时间，并使旧批判过期
      sec.updatedAt = Date.now();
      const arr = state.critiquesBySection.get(sec.id) || [];
      if (arr.length) state.critiquesBySection.set(sec.id, arr.map(c => ({ ...c, status: 'outdated' })));
      sec.status = 'dormant';
    } else {
      // 内容未变化：沿用之前的更新时间与状态，避免被其他章节的输入“刷新”
      sec.updatedAt = prev.updatedAt ?? sec.updatedAt;
      sec.status = prev.status;
    }
  }

  // 3) 防抖后调度
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runScheduler, 1500);

  // 4) 安排每章节到达空闲阈值后的再检查
  for (const sec of state.sections) {
    const left = Math.max(0, IDLE_MS - (now() - sec.updatedAt)) + 250;
    const old = pendingTimers.get(sec.id);
    if (old) clearTimeout(old);
    pendingTimers.set(sec.id, setTimeout(runScheduler, left));
  }

  // 通知订阅者（让 UI 立即拿到最新 sections 状态）
  notify();
}

async function runScheduler() {
  const queue = state.sections.filter(shouldQueue);
  if (!queue.length) return;
  for (const sec of queue) {
    sec.status = 'pending';
    let aiOut = [];
    if (deepseekAvailable()) {
      try {
        const plan = routeLLM({ kind: 'critic_qwhy', inputLen: sec.text.length });
        const system = [
          '你是苏格拉底式审稿人。只提出问题与“为什么问”，不提供答案或改写。',
          '请严格使用以下轻格式输出，最多 1–3 组：',
          'Q: [问题]',
          'Why: [为什么问，1–2 句话]'
        ].join('\n');
        const user = `请基于下文生成 1–3 组 Q/Why（保持原文语言）：\n"""${sec.text.slice(0, 3500)}"""`;
        const text = await llmCall({ ...plan, messages: [ { role:'system', content: system }, { role:'user', content: user } ] });
        const items = parseQWhy(text).map(x => ({ ...x, source: 'ai' }));
        aiOut = aiOut.concat(items);
      } catch (_) {}
    }
    const merged = [...aiOut];
    state.critiquesBySection.set(sec.id, merged.slice(0, 3));
    sec.status = 'ready';
    savePersist();
    notify();
  }
}

export function getSections() {
  return state.sections;
}

export function getCritiques(sectionId) {
  return state.critiquesBySection.get(sectionId) || [];
}

// 初始化持久化
loadPersist();

function notify() {
  subscribers.forEach((fn) => {
    try { fn(); } catch (_) {}
  });
}

export function subscribeSections(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function parseQWhy(s) {
  if (!s) return [];
  const lines = String(s).split(/\r?\n/).map(t => t.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const qm = /^Q:\s*(.+)$/i.exec(lines[i]);
    if (!qm) continue;
    let why = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
      const wm = /^Why:\s*(.+)$/i.exec(lines[j]);
      if (wm) { why = wm[1].trim(); break; }
      if (/^Q:\s*/i.test(lines[j])) break;
    }
    out.push({ id: `ds_${out.length}_${Math.random().toString(36).slice(2,8)}`, type: 'conceptual', severity: 'med', confidence: 0.6, question: /[?？]$/.test(qm[1]) ? qm[1] : `${qm[1]}?`, why });
  }
  return out;
}
