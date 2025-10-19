// SectionDetector: 从 TipTap JSON 中识别 H2 章节（标题 level 2），
// 计算词数与内容 hash，供批判服务调度使用。

function extractText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractText).join('');
  return '';
}

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

function countWords(text) {
  if (!text) return 0;
  // 兼容中英文：中文按每个非空字符近似统计，英文按单词
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.replace(/[\u4e00-\u9fa5]/g, '').match(/[A-Za-z0-9']+/g) || []).length;
  return cn + en;
}

export function detectSections(docJson) {
  // 返回：[{ id, title, fromIndex, toIndex, text, wordCount, hash, updatedAt }]
  if (!docJson || !Array.isArray(docJson.content)) return [];

  const sections = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    const text = current.buffer.join('\n');
    const section = {
      id: `sec_${sections.length + 1}`,
      title: current.title || '无标题',
      fromIndex: 0, // V0 不做精确位置映射
      toIndex: 0,
      text,
      wordCount: countWords(text),
      hash: djb2Hash(text),
      updatedAt: Date.now(),
    };
    sections.push(section);
  };

  for (const node of docJson.content) {
    if (node.type === 'heading' && node.attrs && node.attrs.level === 2) {
      // 开新章节
      if (current) flush();
      current = { title: extractText(node), buffer: [] };
      continue;
    }
    if (!current) {
      // 在遇到第一个 H2 前的内容忽略（不纳入章节）
      continue;
    }
    // 累积文本
    const t = extractText(node);
    if (t && t.trim()) current.buffer.push(t);
  }

  if (current) flush();
  return sections;
}



