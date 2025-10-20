import React, { Suspense, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Editor from './components/Editor.jsx';
import CriticPanel from './components/CriticPanel.jsx';
import ToolboxPanel from './components/ToolboxPanel.jsx';
import KnowledgeGraphPanel from './components/KnowledgeGraphPanel.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
const DebugPanel = React.lazy(() => import('./components/DebugPanel.jsx'));

export default function App() {
  const showDebug = typeof window !== 'undefined' && /[?&]debug=1/.test(window.location.search);

  const savedGraph = (() => { try { return parseInt(localStorage.getItem('layout:graph')||'240',10); } catch(_) { return 240; }})();
  const savedCols = (() => { try { return JSON.parse(localStorage.getItem('layout:cols')||'null'); } catch(_) { return null; }})();

  // 中栏粘性：记录上次尺寸，并在出现“左右同时变化”时进行矫正
  const leftRef = useRef(null);
  const midRef = useRef(null);
  const rightRef = useRef(null);
  const lastSizesRef = useRef(savedCols || [22,56,22]);

  const onLayout = (sizes) => {
    try { localStorage.setItem('layout:cols', JSON.stringify(sizes)); } catch(_) {}
    const [l,m,r] = sizes;
    const [pl,pm,pr] = lastSizesRef.current;
    const eps = 0.5; // 判定变化的阈值（百分比）
    const changedLeft = Math.abs(l - pl) > eps;
    const changedRight = Math.abs(r - pr) > eps;
    if (changedLeft && changedRight) {
      // 谁变化更多，就按谁为“主拖动”，另一侧还原
      if (Math.abs(l - pl) >= Math.abs(r - pr)) {
        const wantR = pr;
        const wantM = Math.min(70, Math.max(44, 100 - l - wantR));
        try { rightRef.current?.resize(wantR); } catch(_) {}
        try { midRef.current?.resize(wantM); } catch(_) {}
        lastSizesRef.current = [l, wantM, wantR];
        return;
      } else {
        const wantL = pl;
        const wantM = Math.min(70, Math.max(44, 100 - wantL - r));
        try { leftRef.current?.resize(wantL); } catch(_) {}
        try { midRef.current?.resize(wantM); } catch(_) {}
        lastSizesRef.current = [wantL, wantM, r];
        return;
      }
    }
    // 单边变化：更新并记录
    lastSizesRef.current = [l,m,r];
  };

  return (
    <ErrorBoundary>
      <PanelGroup direction="vertical" style={{ height: '100vh' }}>
        <Panel defaultSize={100 - Math.round((savedGraph/(window.innerHeight||1))*100)} minSize={40}>
          <div className="w-full px-6 py-6" style={{ height: '100%', boxSizing:'border-box' }}>
            <PanelGroup direction="horizontal" onLayout={onLayout}>
              <Panel ref={leftRef} minSize={16} maxSize={34} collapsible collapsedSize={0} defaultSize={savedCols?.[0] ?? 22}>
                <aside className="h-full overflow-auto bg-panel rounded-l-[12px] border border-borderLight text-textSecondary"><CriticPanel /></aside>
              </Panel>
              <PanelResizeHandle className="Resizer vertical" />
              <Panel ref={midRef} minSize={44} maxSize={70} defaultSize={savedCols?.[1] ?? 56}>
                <main className="h-full overflow-hidden"><Editor /></main>
              </Panel>
              <PanelResizeHandle className="Resizer vertical" />
              <Panel ref={rightRef} minSize={18} maxSize={34} collapsible collapsedSize={0} defaultSize={savedCols?.[2] ?? 22}>
                <aside className="h-full overflow-auto bg-panel rounded-r-[12px] border border-borderLight text-textSecondary"><ToolboxPanel /></aside>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <PanelResizeHandle className="Resizer horizontal" />
        <Panel minSize={10} defaultSize={Math.round((savedGraph/(window.innerHeight||1))*100)}>
          <div className="w-full bg-white border-t border-borderLight" style={{ height: '100%', boxSizing:'border-box' }}>
            <div className="w-full px-6 py-6 h-full" style={{ boxSizing:'border-box' }}>
              <div className="rounded-b-[12px] h-full flex flex-col" style={{ minHeight: 0 }}>
                <KnowledgeGraphPanel />
              </div>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      {showDebug && (
        <Suspense fallback={null}><DebugPanel /></Suspense>
      )}
    </ErrorBoundary>
  );
}


