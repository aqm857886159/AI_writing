import React from 'react';
import clsx from 'clsx';

/**
 * Badge 组件 - 状态标签
 *
 * @param {Object} props
 * @param {'ready'|'thinking'|'dormant'|'error'|'success'|'warning'|'info'} props.variant - 标签变体
 * @param {'sm'|'md'} props.size - 标签大小
 * @param {React.ReactNode} props.children - 标签内容
 * @param {string} props.className - 额外的 CSS 类名
 */
export default function Badge({
  variant = 'dormant',
  size = 'md',
  children,
  className,
  ...rest
}) {
  const baseStyles = 'inline-flex items-center font-medium border rounded-[var(--radius-sm)] transition-colors';

  const variantStyles = {
    // AI 状态色
    ready: 'bg-green-50 text-ai-ready border-green-200',
    thinking: 'bg-orange-50 text-ai-thinking border-orange-200',
    dormant: 'bg-gray-50 text-ai-dormant border-gray-200',
    error: 'bg-red-50 text-ai-error border-red-200',

    // 通用语义色
    success: 'bg-green-50 text-success border-green-200',
    warning: 'bg-orange-50 text-warning border-orange-200',
    info: 'bg-blue-50 text-info border-blue-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
