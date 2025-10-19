import React, { Suspense } from 'react';
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

  return (
    <ErrorBoundary>
      <PanelGroup direction="vertical" style={{ height: '100vh' }}>
        <Panel defaultSize={100 - Math.round((savedGraph/(window.innerHeight||1))*100)} minSize={40}>
          <div className="mx-auto w-full max-w-[1600px] px-6 py-6" style={{ height: '100%', boxSizing:'border-box' }}>
            <PanelGroup direction="horizontal">
              <Panel minSize={16} defaultSize={22}>
                <aside className="h-full overflow-auto bg-panel rounded-l-[12px] border border-borderLight text-textSecondary"><CriticPanel /></aside>
              </Panel>
              <PanelResizeHandle className="Resizer vertical" />
              <Panel minSize={40} defaultSize={56}>
                <main className="h-full overflow-auto"><Editor /></main>
              </Panel>
              <PanelResizeHandle className="Resizer vertical" />
              <Panel minSize={18} defaultSize={22}>
                <aside className="h-full overflow-auto bg-panel rounded-r-[12px] border border-borderLight text-textSecondary"><ToolboxPanel /></aside>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <PanelResizeHandle className="Resizer horizontal" />
        <Panel minSize={10} defaultSize={Math.round((savedGraph/(window.innerHeight||1))*100)}>
          <div className="w-full bg-white border-t border-borderLight" style={{ height: '100%', boxSizing:'border-box' }}>
            <div className="mx-auto w-full max-w-[1600px] px-6 py-6 h-full" style={{ boxSizing:'border-box' }}>
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


