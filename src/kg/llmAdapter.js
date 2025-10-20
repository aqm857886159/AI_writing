// LLM 适配：严格 JSON 抽取的最小实现（复用 DeepSeek 兼容接口）
import { RELATION_TYPES, coerceRelationType } from './kgSchema.js';
import { routeLLM } from '../services/ModelRouter.js';
import { llmCall } from '../services/LLMAdapter.js';

function withTimeout(promiseFactory, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), ms);
  return Promise.race([
    promiseFactory(ctrl.signal).finally(() => clearTimeout(t))
  ]);
}

export async function askKGExtractRaw(system, user) {
  const messages = [ { role: 'system', content: system }, { role: 'user', content: user } ];
  let text = '';
  try {
    const plan = routeLLM({ kind: 'kg_extract_json', needJSON: true, inputLen: user.length });
    text = await withTimeout((signal) => llmCall({ ...plan, messages, signal }), 22000);
  } catch (_) {
    // 已在 llmCall 做过降级与重试，这里不再抛出
  }
  if (!text) return { entities: [], relationships: [] };
  const obj = safePickJSONObject(text);
  if (!obj) return { entities: [], relationships: [] };
  const entities = normalizeEntities(obj);
  const relationships = normalizeRelationships(obj);
  return { entities, relationships };
}

function looksJson(s) {
  if (!s) return false;
  const t = String(s).trim();
  return t.startsWith('{') && t.endsWith('}');
}

function safePickJSONObject(s) {
  if (!s) return null;
  const str = String(s);
  // 尝试直接 JSON.parse
  try { return JSON.parse(str); } catch (_) {}
  // 回退：提取首个花括号对象再 parse
  const m = str.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (_) { return null; }
}

function normalizeEntities(obj) {
  const arr = Array.isArray(obj.entities) ? obj.entities : (Array.isArray(obj.nodes) ? obj.nodes : []);
  return arr.slice(0, 10).map((e, i) => ({
    id: e.id || `e_${i+1}`,
    name: e.name || e.label || '',
    type: e.type || 'concept',
    description: e.description || ''
  })).filter(e => e.name);
}

function normalizeRelationships(obj) {
  let rels = [];
  if (Array.isArray(obj.relationships)) rels = obj.relationships;
  else if (Array.isArray(obj.relations)) rels = obj.relations.map(r => ({ source: r.source || r.head, target: r.target || r.tail, type: r.type || r.relation, strength: r.strength || r.confidence || 7, description: r.description || '' }));
  else rels = [];
  return rels
    .map(r => ({
      source: r.source || r.head || r.from || '',
      target: r.target || r.tail || r.to || '',
      type: coerceRelationType(r.type || r.relation || ''),
      strength: Math.max(1, Math.min(10, parseInt(r.strength || r.confidence || 7))) ,
      description: r.description || ''
    }))
    .filter(r => r.source && r.target && RELATION_TYPES.includes(String(r.type)));
}


