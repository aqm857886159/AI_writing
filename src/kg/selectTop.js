// Top-K + 强度阈值的最小筛选

export function selectTop(graph, k = 15, minStrength = 7) {
  const degree = new Map();
  for (const n of graph.nodes || []) {
    degree.set(n.id || n.label, 0);
  }
  for (const e of graph.edges || []) {
    if ((e.strength || 0) < minStrength) continue;
    degree.set(e.source, (degree.get(e.source) || 0) + 1);
    degree.set(e.target, (degree.get(e.target) || 0) + 1);
  }
  const topIds = Array.from(degree.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([id]) => id);
  const keep = new Set(topIds);
  const nodes = (graph.nodes || []).filter((n) => keep.has(n.id || n.label));
  const edges = (graph.edges || []).filter((e) => keep.has(e.source) && keep.has(e.target) && (e.strength || 0) >= minStrength);
  return { nodes, edges };
}


