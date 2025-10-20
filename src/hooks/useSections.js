import { useEffect, useState } from 'react';
import { getSections, upsertFromDocJSON, subscribeSections } from '../services/CriticService.js';
import { useDocSnapshot } from './useDoc.js';

export function useSections() {
  const { json } = useDocSnapshot();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (json) {
      try { upsertFromDocJSON(json); } catch (_) {}
      setSections(getSections());
    }
  }, [json]);

  // 订阅服务层的状态变化（ready/pending 等），即刻刷新 UI
  useEffect(() => {
    const off = subscribeSections(() => setSections(getSections()));
    return () => off && off();
  }, []);

  return sections;
}



