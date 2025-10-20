// 统一文本存储（单机离线）：Yjs Doc + IndexedDB 持久化
// 说明：使用 JS 实现，避免额外 TypeScript 依赖。后续需要可平滑迁移到 .ts。

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const DOC_NAME = 'main-document';

// 全局唯一文档
const yDoc = new Y.Doc();

// IndexedDB 持久化（离线优先）
// 自动增量保存/加载；首次启动会从本地恢复内容
// 注意：同域名下 DOC_NAME 相同的页面将共享一份文档
const persistence = new IndexeddbPersistence(DOC_NAME, yDoc);

// 简单的快照事件总线（供不直接操作 Yjs 的模块订阅）
let latestSnapshot = { json: null, text: '' };
const snapshotListeners = new Set();

export function getYDoc() {
  return yDoc;
}

export function onSnapshot(listener) {
  snapshotListeners.add(listener);
  // 立即推送一次当前快照，便于首屏渲染
  try {
    listener(latestSnapshot);
  } catch (_e) {}
  return () => snapshotListeners.delete(listener);
}

export function emitSnapshot(snapshot) {
  latestSnapshot = snapshot || { json: null, text: '' };
  snapshotListeners.forEach((fn) => {
    try {
      fn(latestSnapshot);
    } catch (_e) {}
  });
}

// 提供原始 yDoc 更新订阅（大多情况下订阅快照即可）
export function onYDocUpdate(listener) {
  const handler = () => listener(yDoc);
  yDoc.on('update', handler);
  return () => yDoc.off('update', handler);
}

// 可选导出/导入接口（占位，后续可接 TipTap 的转换或自定义格式）
export async function exportAsJSON() {
  return latestSnapshot.json;
}

export async function importFromJSON(_json) {
  // 这里可以在后续通过 ProseMirror JSON -> Yjs 的转换来实现
  // 当前版本先留空，避免引入额外复杂性
}


