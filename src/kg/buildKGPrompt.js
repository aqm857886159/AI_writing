// 构造 GraphRAG 风格的强约束 JSON 抽取提示

export function buildKGPrompt(sectionText) {
  const system = [
    '你是信息抽取器。只输出严格JSON，不要解释。',
    '实体≤10；类型∈{concept,method,person,application}；关系类型∈{contains,causes,compares,applies_to,invented_by}；strength=1-10整数。',
    '语言要求：所有名称与关系类型说明必须用中文输出；若原文是英文专名，请给出中文常用译名，不确定时保留原名并在 description 中标注英文别名。',
    '同义词仅保留一个规范名，别名写入description（例如："别名: AI, 人工智能"）。',
  ].join('\n');

  const user = [
    '从下文抽取实体与关系：',
    String(sectionText || '').slice(0, 4000),
    '输出：',
    JSON.stringify({
      entities: [{ id: 'e1', name: '...', type: 'concept', description: '别名: ...' }],
      relationships: [{ source: 'e1', target: 'e2', type: 'contains', strength: 8, description: '...' }]
    })
  ].join('\n');

  return { system, user };
}


