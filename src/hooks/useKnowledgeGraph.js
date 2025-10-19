import { useEffect, useState } from 'react';
import { subscribeKG, getGraph, upsertKGFromDocJSON } from '../services/KnowledgeGraphService.js';
import { useDocSnapshot } from './useDoc.js';

export function useKnowledgeGraph() {
  const { json } = useDocSnapshot();
  const [graph, setGraph] = useState(getGraph());

  useEffect(() => {
    if (json) {
      try { upsertKGFromDocJSON(json); } catch (_) {}
    }
  }, [json]);

  useEffect(() => {
    const off = subscribeKG(() => setGraph(getGraph()));
    return () => off && off();
  }, []);

  return graph;
}


