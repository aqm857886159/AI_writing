import { useEffect, useState } from 'react';
import { getYDoc, onSnapshot } from '../services/DocumentService.js';

export function useYDoc() {
  // 直接返回单例即可；保持 API 一致性
  return getYDoc();
}

export function useDocSnapshot() {
  const [snapshot, setSnapshot] = useState({ json: null, text: '' });

  useEffect(() => {
    const off = onSnapshot(setSnapshot);
    return () => off && off();
  }, []);

  return snapshot;
}


