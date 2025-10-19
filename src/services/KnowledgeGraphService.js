// 知识图谱服务：增量抽取、去重合并、筛选与持久化（与 UI 解耦）
// 设计目标：
// 1) 幂等增量：以 section.hash 为分片，重复输入不会产生重复节点/边
// 2) 合并去重：名称规范化为主，同义词作为别名累积
// 3) 筛选裁剪：在调用方做（例如 Top-K + 强度阈值），本服务维护“全量图”

import { detectSections } from './SectionDetector.js';
import { extractWithGleaning } from '../kg/extractWithGleaning.js';

const KG_KEY = 'kg:v0';

// 运行态
const subscribers = new Set();
const state = {
  // 全量图谱：
  // nodes: [{ id, label, type, aliases?: string[] }]
  // edges: [{ source, target, type, strength, description?: string }]
  graph: { nodes: [], edges: [] },
  // 章节元信息：id -> { hash, updatedAt }
  sectionsMeta: new Map(),
  // 版本号便于回滚/迁移
  version: 1,
};

function notify() {
  subscribers.forEach((fn) => { try { fn(state.graph); } catch (_) {} });
}

function save() {
  try {
    const payload = { version: state.version, graph: state.graph };
    localStorage.setItem(KG_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function load() {
  try {
    const raw = localStorage.getItem(KG_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && data.graph && Array.isArray(data.graph.nodes) && Array.isArray(data.graph.edges)) {
      state.graph = data.graph;
    }
  } catch (_) {}
}

load();

export function subscribeKG(listener) {
  subscribers.add(listener);
  try { listener(state.graph); } catch (_) {}
  return () => subscribers.delete(listener);
}

export function getGraph() {
  return state.graph;
}

// 规范化名（用于节点主键与边键）
function canonical(s) { return String(s || '').trim().toLowerCase(); }

// 将 LLM 输出的实体列表转本服务节点结构，并进行同名合并与别名累积
function normalizeAndMergeNodes(existingNodes, llmEntities) {
  const out = [...existingNodes];
  const byKey = new Map(out.map((n) => [canonical(n.label), n]));

  for (const ent of Array.isArray(llmEntities) ? llmEntities : []) {
    const name = ent.name || ent.label || '';
    const key = canonical(name);
    if (!key) continue;
    const type = ent.type || 'concept';
    const description = String(ent.description || '').trim();
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: key, // 以规范名作为稳定 id，便于跨批/跨章节合并
        label: name,
        type,
        aliases: description ? extractAliasesFromDescription(description) : [],
      });
    } else {
      const ex = byKey.get(key);
      if (description) {
        const add = extractAliasesFromDescription(description);
        if (add.length) {
          ex.aliases = Array.from(new Set([...(ex.aliases || []), ...add])).slice(0, 10);
        }
      }
    }
  }
  return Array.from(byKey.values());
}

function extractAliasesFromDescription(desc) {
  // 约定："别名:" 后面的逗号/顿号/斜线分隔，做一次温和抽取
  const m = /别名[:：]\s*([^\n]+)/i.exec(desc);
  if (!m) return [];
  return m[1].split(/[，,\/|]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
}

function mergeEdges(existingEdges, llmEdges, entityIdToCanonical) {
  const out = [...existingEdges];
  const keyOf = (e) => `${e.source}->${e.target}:${e.type}`;
  const seen = new Set(out.map(keyOf));

  for (const e of Array.isArray(llmEdges) ? llmEdges : []) {
    const rawSource = e.source || e.head || '';
    const rawTarget = e.target || e.tail || '';
    const src = entityIdToCanonical.get(rawSource) || canonical(rawSource);
    const tgt = entityIdToCanonical.get(rawTarget) || canonical(rawTarget);
    const type = e.type || 'rel';
    const strength = Math.max(1, Math.min(10, parseInt(e.strength) || 7));
    if (!src || !tgt) continue;
    const item = { source: src, target: tgt, type, strength, description: String(e.description || '').trim() };
    const k = keyOf(item);
    if (!seen.has(k)) { out.push(item); seen.add(k); }
  }
  return out;
}

export async function upsertKGFromDocJSON(docJson) {
  const sections = detectSections(docJson);
  for (const sec of sections) {
    const prev = state.sectionsMeta.get(sec.id);
    const changed = !prev || prev.hash !== sec.hash;
    state.sectionsMeta.set(sec.id, { hash: sec.hash, updatedAt: sec.updatedAt });
    if (!changed) continue;

    try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'kg.extract.start', sectionId: sec.id, hash: sec.hash, words: sec.wordCount }); } catch (_) {}

    // 调用抽取（二轮 Gleaning 内部兜底）
    let result = null;
    try {
      result = await extractWithGleaning(sec.text);
    } catch (_) { result = null; }
    if (!result) continue;

    // 规范化：将实体 id → 规范名 映射（便于边对齐）
    const id2key = new Map();
    for (const ent of Array.isArray(result.entities) ? result.entities : []) {
      const name = ent.name || ent.label || '';
      const key = canonical(name);
      if (ent.id) id2key.set(ent.id, key);
      id2key.set(name, key);
    }

    // 合并节点
    const mergedNodes = normalizeAndMergeNodes(state.graph.nodes, result.entities || []);
    // 合并边
    const mergedEdges = mergeEdges(state.graph.edges, result.relationships || [], id2key);

    state.graph = { nodes: mergedNodes, edges: mergedEdges };
    try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'kg.merge.done', nodes: mergedNodes.length, edges: mergedEdges.length }); } catch (_) {}
    save();
    notify();
  }
}


