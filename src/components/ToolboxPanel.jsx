import React from 'react';
import { useDocSnapshot } from '../hooks/useDoc.js';

export default function ToolboxPanel() {
  const { text } = useDocSnapshot();
  const preview = (text || '').slice(-160);

  return (
    <div className="p-6 pt-6">
      <h2 className="text-base font-semibold text-textMain mb-2">创作工具箱</h2>
      <p className="text-sm text-textSecondary mb-3">（接入统一文本源，随时可供工具调用）</p>
      <div className="text-sm text-textMain/80 break-words">{preview || '（暂无内容）'}</div>
    </div>
  );
}


