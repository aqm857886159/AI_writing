// 任务→默认模型/参数 注册表（可被本地覆盖）

export const TaskDefaults = {
  chat:            { model: 'deepseek-chat',     temperature: 0.25, stream: true },
  translate:       { model: 'deepseek-chat',     temperature: 0.2 },
  summarize:       { model: 'deepseek-chat',     temperature: 0.2 },
  outline:         { model: 'deepseek-chat',     temperature: 0.25 },
  critic_qwhy:     { model: 'deepseek-reasoner', temperature: 0.2, fallbacks: ['deepseek-chat'] },
  kg_extract_json: { model: 'deepseek-chat',     temperature: 0.1, response_format: { type: 'json_object' } },
};

export function getTaskDefaults(kind) {
  const base = TaskDefaults[kind] || TaskDefaults.chat;
  // 本地覆盖（可选）
  try {
    const overrides = JSON.parse(localStorage.getItem('model:overrides') || '{}');
    if (overrides && overrides[kind] && overrides[kind].model) {
      return { ...base, model: overrides[kind].model };
    }
  } catch (_) {}
  return base;
}


