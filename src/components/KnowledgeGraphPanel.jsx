import React, { useEffect, useRef } from 'react';
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph.js';
import { RELATION_LABEL_ZH } from '../kg/kgSchema.js';

export default function KnowledgeGraphPanel() {
  const ref = useRef(null);
  const graph = useKnowledgeGraph();

  useEffect(() => {
    let cy = null;
    let disposed = false;
    let ro = null;
    async function mount() {
      if (!ref.current) return;
      let cytoscape = null;
      try {
        const mod = await import('cytoscape');
        cytoscape = mod.default || mod;
      } catch (_) {
        return;
      }
      if (disposed) return;

      const elements = [
        ...graph.nodes.map((n) => ({ data: { id: n.id, label: n.label, type: n.type } })),
        ...graph.edges.map((e) => ({
          data: {
            id: `${e.source}-${e.target}-${e.type}`,
            source: e.source,
            target: e.target,
            label: RELATION_LABEL_ZH[e.type] || e.type
          }
        }))
      ];

      const t0 = performance.now();
      cy = cytoscape({
        container: ref.current,
        elements,
        style: [
          { selector: 'node', style: { 'label': 'data(label)', 'text-valign': 'center', 'color': '#0f172a', 'background-color': '#fbbf24', 'width': 44, 'height': 44, 'font-size': 11, 'font-weight': 600 } },
          { selector: 'edge', style: { 'label': 'data(label)', 'font-size': 10, 'color': '#374151', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'line-color': '#94a3b8', 'target-arrow-color': '#94a3b8' } }
        ],
        layout: { name: 'cose', nodeRepulsion: 8000, nodeOverlap: 20, idealEdgeLength: 100, animate: false }
      });
      const t1 = performance.now();
      try { const mod = await import('../diag/logger.js'); mod.diag.emit({ type: 'kg.layout.ms', ms: Math.round(t1 - t0), nodes: graph.nodes.length, edges: graph.edges.length }); } catch (_) {}
      try { cy.fit(undefined, 20); } catch(_) {}

      // 监听容器尺寸变化，触发布局刷新，避免“面板变大但图不自适应”的问题
      try {
        let raf = 0;
        ro = new ResizeObserver(() => {
          if (!cy) return;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            try { cy.resize(); cy.fit(undefined, 20); } catch(_) {}
          });
        });
        ro.observe(ref.current);
      } catch (_) {}
    }
    mount();
    return () => {
      disposed = true;
      if (ro) { try { ro.disconnect(); } catch(_) {} }
      if (cy) { try { cy.destroy(); } catch (_) {} }
    };
  }, [graph]);

  return (
    <div className="px-6 py-6" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <h2 className="text-base font-semibold text-textMain mb-2">知识图谱</h2>
      <p className="text-sm text-textSecondary mb-3">（按章节增量合并，Top-K 过滤、强度阈值裁剪）</p>
      <div ref={ref} style={{ flex:1, minHeight:0 }} />
    </div>
  );
}


