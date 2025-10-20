import React from 'react';
import clsx from 'clsx';

/**
 * Card 组件 - 统一的卡片容器
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.padding - 内边距大小
 * @param {boolean} props.hover - 是否启用 hover 效果
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} props.className - 额外的 CSS 类名
 */
export default function Card({
  padding = 'md',
  hover = false,
  children,
  className,
  ...rest
}) {
  const baseStyles = 'bg-elevated border border-border-light rounded-[var(--radius-md)] transition-shadow duration-200';

  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverStyles = hover
    ? 'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]'
    : 'shadow-[var(--shadow-sm)]';

  return (
    <div
      className={clsx(
        baseStyles,
        paddingStyles[padding],
        hoverStyles,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader - 卡片头部
 */
export function CardHeader({ children, className, ...rest }) {
  return (
    <div
      className={clsx('mb-3 border-b border-border-light pb-3', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle - 卡片标题
 */
export function CardTitle({ children, className, ...rest }) {
  return (
    <h3
      className={clsx('text-base font-semibold text-text-primary', className)}
      {...rest}
    >
      {children}
    </h3>
  );
}

/**
 * CardContent - 卡片内容区
 */
export function CardContent({ children, className, ...rest }) {
  return (
    <div className={clsx('text-sm text-text-secondary', className)} {...rest}>
      {children}
    </div>
  );
}
