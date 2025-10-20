// 通用聊天适配器（OpenAI 兼容）：返回纯文本内容

export async function askChat(messages, { temperature = 0.25, max_tokens = 900, top_p = 0.9 } = {}) {
  const body = { model: 'deepseek-chat', temperature, top_p, max_tokens, messages };
  const res = await fetch('/llm/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const raw = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`LLM ${res.status}: ${raw.slice(0,200)}`);
  let data = {};
  try { data = JSON.parse(raw); } catch (_) {}
  const msg = data?.choices?.[0]?.message || {};
  const text = (msg?.content || msg?.reasoning_content || '').trim();
  return text;
}


