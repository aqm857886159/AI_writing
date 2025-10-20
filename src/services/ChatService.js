// 通用对话服务：引用优先 + 最近窗口消息 + 本次指令
// 对标：LobeChat / Open WebUI / ChatGPT-Next-Web

import { askChat } from './ChatAdapter.js';

export async function chatRequest({ system, quotes = [], history = [], input = '' }) {
  const sys = (system || [
    '你是严谨的中文写作助手：',
    '— 优先依据【引用】回答；若引用不足，请先提出需要的补充信息；',
    '— 保持术语/事实准确，保留原段落/列表/Markdown 格式；',
    '— 结构清晰、简洁，不编造引用中没有的细节。'
  ].join('\n'));

  const MAX_CH = 2000;
  const joinedQuotes = quotes.map((q,i)=>`[${i+1}] ${String(q||'').trim()}`).join('\n').slice(0, MAX_CH);
  const messages = [
    { role: 'system', content: sys },
    joinedQuotes && { role: 'user', content: `【引用】\n${joinedQuotes}` },
    ...(history || []).slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 800) })),
    { role: 'user', content: `【问题/指令】\n${(String(input||'请基于引用给出你的建议。')).trim()}` }
  ].filter(Boolean);

  try {
    return await askChat(messages, { temperature: 0.25, max_tokens: 900, top_p: 0.9 });
  } catch (e) {
    return `（调用失败）${e.message || e}`;
  }
}


