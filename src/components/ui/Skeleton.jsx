import React from 'react';
import clsx from 'clsx';

/**
 * Skeleton 组件 - 加载骨架屏
 *
 * @param {Object} props
 * @param {'text'|'title'|'avatar'|'card'} props.variant - 骨架屏变体
 * @param {string} props.className - 额外的 CSS 类名
 */
export default function Skeleton({ variant = 'text', className, ...rest }) {
  const baseStyles = 'animate-pulse bg-gray-200 rounded-[var(--radius-sm)]';

  const variantStyles = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-[var(--radius-md)]',
  };

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      {...rest}
    />
  );
}

/**
 * SkeletonGroup - 骨架屏组合
 */
export function SkeletonGroup({ count = 3, variant = 'text', spacing = 'md', className }) {
  const spacingStyles = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={clsx(spacingStyles[spacing], className)}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}
