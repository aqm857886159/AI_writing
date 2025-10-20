// 模型路由器：根据任务与上下文情况给出“本次调用计划”
import { getTaskDefaults } from './ModelRegistry.js';

export function routeLLM({ kind = 'chat', needJSON, needStreaming, inputLen = 0 } = {}) {
  const base = { ...getTaskDefaults(kind) };
  if (needJSON) base.response_format = { type: 'json_object' };
  if (needStreaming !== undefined) base.stream = !!needStreaming;
  // 简单启发：输入越长，温度越保守
  if (inputLen > 3000) base.temperature = Math.min(0.2, base.temperature || 0.25);
  base.fallbacks = Array.isArray(base.fallbacks) ? base.fallbacks : [];
  return base;
}


