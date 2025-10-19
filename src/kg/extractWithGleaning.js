// 二轮 Gleaning：首轮抽取不足则补遗，再合并与去重
import { buildKGPrompt } from './buildKGPrompt.js';
import { askKGExtractRaw } from './llmAdapter.js';

export async function extractWithGleaning(text) {
  const { system, user } = buildKGPrompt(text);
  const round1 = await askKGExtractRaw(system, user);
  const ents = (round1?.entities || []).length;
  if (ents >= 6) return round1;

  const gleanSys = system;
  const gleanUser = [
    '之前可能遗漏了重要实体，请再补充2-3个核心实体与关键关系：',
    String(text || '').slice(0, 4000)
  ].join('\n');
  const round2 = await askKGExtractRaw(gleanSys, gleanUser);
  return mergeKG(round1, round2);
}

function keyName(s){ return String(s||'').trim().toLowerCase(); }

function mergeKG(a = {}, b = {}) {
  const entities = dedupEntities([...(a.entities || []), ...(b.entities || [])]);
  const relationships = dedupEdges([...(a.relationships || []), ...(b.relationships || [])]);
  return { entities, relationships };
}

function dedupEntities(arr){
  const m = new Map();
  for (const e of arr || []) {
    const k = keyName(e.name || e.label);
    if (!k) continue;
    if (!m.has(k)) m.set(k, { id: e.id || `e_${m.size + 1}`, name: e.name || e.label, type: e.type || 'concept', description: String(e.description || '').slice(0, 300) });
    else {
      const ex = m.get(k);
      const merged = [ex.description, e.description].filter(Boolean).join(' | ');
      ex.description = merged.slice(0, 300);
    }
  }
  return Array.from(m.values());
}

function dedupEdges(arr){
  const norm = (e) => `${keyName(e.source || e.head)}->${keyName(e.target || e.tail)}:${e.type}`;
  const seen = new Set();
  const out = [];
  for (const e of arr || []) {
    const k = norm(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ source: e.source || e.head, target: e.target || e.tail, type: e.type, strength: Math.max(1, Math.min(10, parseInt(e.strength) || 7)), description: String(e.description || '').trim() });
  }
  return out;
}


