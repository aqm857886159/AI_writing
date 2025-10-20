import React from 'react';
import { diag } from '../diag/logger.js';

export default function DebugPanel() {
  const [events, setEvents] = React.useState(diag.getAll());
  React.useEffect(() => diag.on(() => setEvents(diag.getAll())), []);

  const copy = () => {
    try { navigator.clipboard.writeText(JSON.stringify(diag.export(), null, 2)); } catch (_) {}
  };
  const download = () => {
    try {
      const blob = new Blob([JSON.stringify(diag.export())], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'diagnostics.json';
      a.click();
    } catch (_) {}
  };

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, width: 360, maxHeight: '50vh', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 12, zIndex: 1000 }}>
      <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong>调试面板</strong>
        <div>
          <button onClick={copy} style={{ marginRight: 8 }}>复制JSON</button>
          <button onClick={download}>下载JSON</button>
        </div>
      </div>
      <div style={{ padding: 8, overflow: 'auto', maxHeight: 'calc(50vh - 40px)' }}>
        {events.slice(-200).reverse().map((e, i) => (
          <pre key={i} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(e)}</pre>
        ))}
      </div>
    </div>
  );
}


