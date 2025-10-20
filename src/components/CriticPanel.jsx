import React from 'react';
import { useSections } from '../hooks/useSections.js';
import { useCritiques } from '../hooks/useCritiques.js';
import { Card, Badge, AIThinking, EmptyState } from './ui';
import { MessageCircleQuestion } from 'lucide-react';

export default function CriticPanel() {
  const sections = useSections();

  return (
    <div className="p-6 pt-6">
      <div className="sticky top-6 bg-white z-10 pb-2">
        <h2 className="text-sm font-semibold text-text-primary">批判者视角（AI）</h2>
        <p className="text-xs text-text-secondary mt-1">章节完成后自动生成苏格拉底式问题（只读，不改写）。</p>
      </div>

      {/* 独立滚动容器 */}
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto pr-2 space-y-3 mt-4">
        {sections.length === 0 && (
          <EmptyState
            icon={MessageCircleQuestion}
            title="暂无章节"
            description="写出一个 H2 标题将作为章节起点"
          />
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

  // 状态映射
  const statusVariant = {
    ready: 'ready',
    pending: 'thinking',
    dormant: 'dormant',
    error: 'error'
  }[section.status] || 'dormant';

  const statusLabel = {
    ready: '就绪',
    pending: '分析中',
    dormant: '等待中',
    error: '错误'
  }[section.status] || '等待中';

  return (
    <Card padding="md" hover className="transition-all">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary truncate mr-2">
          {section.title}
        </h3>
        <Badge variant={statusVariant} size="sm">
          {statusLabel}
        </Badge>
      </div>

      {/* 元信息 */}
      <div className="text-xs text-text-tertiary mb-3">
        词数：{section.wordCount}
      </div>

      {/* 加载状态 */}
      {section.status === 'pending' && (
        <div className="py-2">
          <AIThinking size="sm" label="AI 批判分析中..." />
        </div>
      )}

      {/* 批判列表 */}
      {section.status !== 'pending' && (
        <ul className="space-y-2">
          {critiques.length === 0 && section.status === 'dormant' && (
            <li className="text-xs text-text-secondary py-2">
              {section.wordCount < 200
                ? `（还需 ${200 - section.wordCount} 字触发分析）`
                : '（等待 10 秒空闲后自动分析）'}
            </li>
          )}
          {critiques.map(q => (
            <CritiqueItem key={q.id} q={q} />
          ))}
        </ul>
      )}
    </Card>
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
    <li className="text-xs text-text-primary break-words">
      {/* 类型标签 */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-text-tertiary">{typeZh}</span>
        <Badge variant="info" size="sm">AI</Badge>
      </div>

      {/* 问题主体 */}
      <div className="text-sm leading-relaxed mb-1">{q.question}</div>

      {/* Why 展开 */}
      {open && q.why && (
        <div className="mt-1 text-xs text-text-secondary bg-gray-50 rounded-[var(--radius-sm)] p-2">
          {q.why}
        </div>
      )}

      {/* 展开/收起按钮 */}
      {q.why && (
        <button
          className="text-[10px] text-brand-500 hover:text-brand-600 hover:underline mt-1"
          onClick={() => setOpen(!open)}
        >
          {open ? '收起' : '为什么问？'}
        </button>
      )}
    </li>
  );
}
