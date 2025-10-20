// 知识图谱数据契约与常量

/**
 * @typedef {{ id:string, label:string, type:'concept'|'method'|'person'|'application', aliases?:string[], description?:string }} KGNode
 * @typedef {{ source:string, target:string, type:'contains'|'causes'|'compares'|'applies_to'|'invented_by', strength:number, description?:string }} KGEdge
 * @typedef {{ nodes:KGNode[], edges:KGEdge[] }} KGGraph
 */

export const RELATION_TYPES = ['contains','causes','compares','applies_to','invented_by'];

// 中文显示标签
export const RELATION_LABEL_ZH = {
  contains: '包含',
  causes: '导致',
  compares: '对比',
  applies_to: '应用于',
  invented_by: '由…发明',
};

// 将多样的关系表述规整到标准键（英文），便于内部处理
export function coerceRelationType(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!s) return '';
  if (RELATION_TYPES.includes(s)) return s;
  // 常见中文 → 英文键
  if (/(包含|include)/.test(s)) return 'contains';
  if (/(导致|cause)/.test(s)) return 'causes';
  if (/(对比|比较|compare)/.test(s)) return 'compares';
  if (/(应用于|适用于|apply)/.test(s)) return 'applies_to';
  if (/(发明|由.*发明|invent)/.test(s)) return 'invented_by';
  return s; // 兜底：返回原值，后续过滤时会被剔除
}


