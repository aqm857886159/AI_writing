// 统一 LLM 调用器：重试/降级/超时/错误可读

export async function llmCall({ model, messages, temperature = 0.25, max_tokens = 900, top_p = 0.9, response_format, signal }) {
  let fmt = response_format;
  const bodyBase = { model, temperature, top_p, max_tokens };

  const post = async () => {
    const body = { ...bodyBase, messages, ...(fmt ? { response_format: fmt } : {}) };
    const res = await fetch('/llm/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal
    });
    const raw = await res.text().catch(() => '');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0,200)}`);
    let data = {}; try { data = JSON.parse(raw); } catch (_) {}
    const msg = data?.choices?.[0]?.message || {};
    return (msg?.content || msg?.reasoning_content || '').trim();
  };

  for (let i = 0; i < 2; i++) {
    try { return await post(); }
    catch (e) {
      const m = String(e.message || '');
      if (fmt && /response_format|json/i.test(m)) { fmt = undefined; continue; }
      if (!/HTTP 429|HTTP 5\d{2}/.test(m)) throw e;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  return await post();
}


