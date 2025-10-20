import React from 'react';
import clsx from 'clsx';

/**
 * EmptyState 组件 - 空状态提示
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 图标（lucide-react 组件）
 * @param {string} props.title - 标题
 * @param {string} props.description - 描述文本
 * @param {React.ReactNode} props.action - 操作按钮（可选）
 * @param {string} props.className - 额外的 CSS 类名
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-text-tertiary" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
