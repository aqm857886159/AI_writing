import React, { useEffect, useRef } from 'react';
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph.js';
import { RELATION_LABEL_ZH } from '../kg/kgSchema.js';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Network } from 'lucide-react';
import { Button } from './ui';
import EmptyState from './ui/EmptyState.jsx';

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

  const hasNodes = graph.nodes.length > 0;

  return (
    <div className="relative flex-1">
      {/* 顶部悬浮工具条：使用 Tailwind classes 替代 inline style */}
      <div className="absolute top-3 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
        <h2 className="text-base font-semibold text-text-primary pointer-events-none">知识图谱</h2>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            title="重布局"
            onClick={() => {
              try {
                const cy = cyRef.current; if (!cy) return;
                cy.layout({ name: 'cose', nodeRepulsion: 8000, nodeOverlap: 20, idealEdgeLength: 100, animate: false }).run();
                cy.fit(undefined, 20);
              } catch(_) {}
            }}
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="缩小"
            onClick={() => {
              try {
                const cy = cyRef.current; if (!cy) return;
                cy.zoom({ level: cy.zoom() / 1.15, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } });
              } catch(_) {}
            }}
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="放大"
            onClick={() => {
              try {
                const cy = cyRef.current; if (!cy) return;
                cy.zoom({ level: cy.zoom() * 1.15, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } });
              } catch(_) {}
            }}
          >
            <ZoomIn size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="居中"
            onClick={() => { try { cyRef.current?.fit(undefined, 20); } catch(_) {} }}
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      {/* 空状态：无节点时显示 */}
      {!hasNodes && (
        <div className="absolute inset-0 flex items-center justify-center">
          <EmptyState
            icon={Network}
            title="暂无知识图谱"
            description="完成一个 H2 章节（≥200 字）后，AI 将自动提取概念关系"
          />
        </div>
      )}

      {/* Cytoscape 容器：只在有节点时渲染，避免 z-index 冲突 */}
      {hasNodes && (
        <div ref={ref} className="absolute inset-0 min-h-0" />
      )}
    </div>
  );
}


