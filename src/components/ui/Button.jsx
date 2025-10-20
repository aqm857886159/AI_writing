import React from 'react';
import clsx from 'clsx';

/**
 * Button 组件 - 统一的按钮样式系统
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} props.variant - 按钮变体
 * @param {'sm'|'md'|'lg'} props.size - 按钮大小
 * @param {boolean} props.disabled - 是否禁用
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {string} props.className - 额外的 CSS 类名
 * @param {Function} props.onClick - 点击事件
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className,
  onClick,
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-500',
    secondary: 'bg-panel border border-border-light text-text-primary hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-brand-500',
    ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary active:bg-gray-200 focus-visible:ring-brand-500',
    danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-error',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm rounded-[var(--radius-default)]',
    md: 'h-10 px-4 text-base rounded-[var(--radius-default)]',
    lg: 'h-12 px-6 text-lg rounded-[var(--radius-md)]',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
