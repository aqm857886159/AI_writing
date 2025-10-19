import React from 'react';
import { useSections } from '../hooks/useSections.js';
import { useCritiques } from '../hooks/useCritiques.js';

export default function CriticPanel() {
  const sections = useSections();

  return (
    <div className="p-6 pt-6">
      <div className="sticky top-6 bg-white z-10 pb-2">
        <h2 className="text-base font-semibold text-textMain">批判者视角（AI）</h2>
        <p className="text-sm text-textSecondary">章节完成后自动生成苏格拉底式问题（只读，不改写）。</p>
      </div>

      {/* 独立滚动容器：避免页面下沿遮挡 */}
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-2 space-y-4">
        {sections.length === 0 && (
          <div className="text-sm text-textSecondary">（暂无章节，写出一个 H2 标题将作为章节起点）</div>
        )}

        {sections.map(sec => (
          <SectionGroup key={sec.id} section={sec} />
        ))}
      </div>
    </div>
  );
}

function SectionGroup({ section }) {
  const critiques = useCritiques(section.id, [section.status, section.hash]);
  const badge = section.status === 'ready' ? 'bg-green-100 text-green-700' :
                section.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                section.status === 'dormant' ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700';

  return (
    <div className="border border-borderLight rounded-md p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium text-textMain truncate mr-2">{section.title}</div>
        <div className={`text-xs px-2 py-0.5 rounded ${badge}`}>{section.status}</div>
      </div>
      <div className="text-xs text-textSecondary mt-1">词数：{section.wordCount}</div>

      <ul className="mt-2 space-y-2">
        {critiques.length === 0 && (
          <li className="text-sm text-textSecondary">（等待条件满足后生成问题…）</li>
        )}
        {critiques.map(q => (
          <CritiqueItem key={q.id} q={q} />
        ))}
      </ul>
    </div>
  );
}

function CritiqueItem({ q }) {
  const [open, setOpen] = React.useState(false);
  const typeZh = (() => {
    const t = (q.type || '').toLowerCase();
    if (t === 'conceptual' || t === 'concept' || t === 'conceptuals') return '概念性';
    if (t === 'logic' || t === 'logical') return '逻辑性';
    if (t === 'evidence') return '证据性';
    if (t === 'clarity') return '清晰度';
    if (t === 'structure') return '结构性';
    return '概念性';
  })();
  return (
    <li className="text-sm text-textMain/90 break-words whitespace-pre-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-textSecondary">{typeZh}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">AI</span>
      </div>
      {/* 问题主体：始终完整展示，不截断 */}
      <div className="mt-0.5">{q.question}</div>
      {open && q.why && (
        <div className="mt-1 text-xs text-textSecondary">{q.why}</div>
      )}
      <div className="mt-1">
        <button className="text-[11px] text-brand hover:underline" onClick={() => setOpen(!open)}>
          {open ? '收起' : '展开'}
        </button>
      </div>
    </li>
  );
}


