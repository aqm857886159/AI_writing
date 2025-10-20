import React from 'react';
import clsx from 'clsx';

/**
 * AIThinking 组件 - AI 思考中动画（三个跳动圆点）
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size - 动画大小
 * @param {string} props.label - 提示文本
 * @param {string} props.className - 额外的 CSS 类名
 */
export default function AIThinking({ size = 'md', label = 'AI 分析中...', className }) {
  const sizeStyles = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const dotSize = sizeStyles[size];

  return (
    <div className={clsx('flex items-center gap-2 text-ai-thinking', className)}>
      <div className="flex gap-1">
        <span
          className={clsx(
            dotSize,
            'bg-current rounded-full animate-bounce'
          )}
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <span
          className={clsx(
            dotSize,
            'bg-current rounded-full animate-bounce'
          )}
          style={{ animationDelay: '150ms', animationDuration: '1s' }}
        />
        <span
          className={clsx(
            dotSize,
            'bg-current rounded-full animate-bounce'
          )}
          style={{ animationDelay: '300ms', animationDuration: '1s' }}
        />
      </div>
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  );
}
