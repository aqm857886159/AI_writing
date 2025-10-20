import React, { useEffect, useRef } from 'react';
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph.js';
import { RELATION_LABEL_ZH } from '../kg/kgSchema.js';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

export default function KnowledgeGraphPanel() {
  const ref = useRef(null);
  const cyRef = useRef(null);
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
      cyRef.current = cy;
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
      cyRef.current = null;
    };
  }, [graph]);

  return (
    <div className="h-full" style={{ position:'relative', height:'100%' }}>
      {/* 顶部悬浮工具条：不占用纵向空间，仅覆盖少量上边缘区域 */}
      <div
        style={{ position:'absolute', top:12, left:24, right:24, display:'flex', alignItems:'center', justifyContent:'space-between', pointerEvents:'none' }}
      >
        <h2 className="text-base font-semibold text-textMain" style={{ pointerEvents:'none' }}>知识图谱</h2>
        <div className="inline-flex items-center gap-1.5" style={{ pointerEvents:'auto' }}>
          <GhostBtn title="重布局" onClick={() => {
            try {
              const cy = cyRef.current; if (!cy) return;
              cy.layout({ name: 'cose', nodeRepulsion: 8000, nodeOverlap: 20, idealEdgeLength: 100, animate: false }).run();
              cy.fit(undefined, 20);
            } catch(_) {}
          }}><RefreshCw size={16} /></GhostBtn>
          <GhostBtn title="缩小" onClick={() => {
            try {
              const cy = cyRef.current; if (!cy) return;
              cy.zoom({ level: cy.zoom() / 1.15, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } });
            } catch(_) {}
          }}><ZoomOut size={16} /></GhostBtn>
          <GhostBtn title="放大" onClick={() => {
            try {
              const cy = cyRef.current; if (!cy) return;
              cy.zoom({ level: cy.zoom() * 1.15, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } });
            } catch(_) {}
          }}><ZoomIn size={16} /></GhostBtn>
          <GhostBtn title="居中" onClick={() => { try { cyRef.current?.fit(undefined, 20); } catch(_) {} }}><Maximize2 size={16} /></GhostBtn>
        </div>
      </div>

      {/* Cytoscape 容器：绝对填充，获得最大可用空间 */}
      <div ref={ref} style={{ position:'absolute', inset:0, minHeight:0 }} />
    </div>
  );
}

function GhostBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="h-8 px-2 inline-flex items-center justify-center rounded-md text-[#475569] hover:text-[#1f2937] bg-white/60 hover:bg-white border border-borderLight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
    >
      {children}
    </button>
  );
}


