// LLM 适配：严格 JSON 抽取的最小实现（复用 DeepSeek 兼容接口）
import { RELATION_TYPES, coerceRelationType } from './kgSchema.js';

function withTimeout(promiseFactory, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort('timeout'), ms);
  return Promise.race([
    promiseFactory(ctrl.signal).finally(() => clearTimeout(t))
  ]);
}

export async function askKGExtractRaw(system, user) {
  async function post(body, signal) {
    // 统一走本地代理，由代理注入 Authorization，避免前端跨域与密钥暴露
    const res = await fetch('/llm/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const text = await res.text().catch(() => '');
    return { res, text };
  }

  const base = { model: 'deepseek-chat', temperature: 0.1, max_tokens: 700, messages: [ { role: 'system', content: system }, { role: 'user', content: user } ] };
  let attempt = 1;
  let last = null;
  let parsed = null;
  await withTimeout(async (signal) => {
    // 尝试强制 JSON
    ({ res: last, text: parsed } = await post({ ...base, response_format: { type: 'json_object' } }, signal));
    // 400/不支持 或 解析失败 → 去掉 response_format 再试一次
    if (!last.ok || !looksJson(parsed)) {
      attempt = 2;
      ({ res: last, text: parsed } = await post(base, signal));
    }
  }, 22000).catch(() => {});

  try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'llm.kg.response', status: last?.status ?? 0, ok: !!last?.ok, parsedOk: looksJson(parsed) }); } catch (_) {}

  if (!parsed) return { entities: [], relationships: [] };
  // 先尝试解析整个响应为对象，优先取 choices[0].message.content
  let outer = null;
  try { outer = JSON.parse(parsed); } catch (_) {}
  const contentStr = outer?.choices?.[0]?.message?.content?.trim();

  // content 中若包含 JSON，优先解析；否则退化到整个响应体中提取 JSON 对象
  const obj = contentStr ? safePickJSONObject(contentStr) : safePickJSONObject(parsed);
  if (!obj) return { entities: [], relationships: [] };
  const entities = normalizeEntities(obj);
  const relationships = normalizeRelationships(obj);
  try {
    const mod = await import('../diag/logger.js');
    mod.diag.emit({ type: 'llm.kg.parsed', ents: entities.length, rels: relationships.length, keys: Object.keys(obj).slice(0,6), hasChoices: !!outer?.choices, hasContent: !!contentStr });
  } catch (_) {}
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


