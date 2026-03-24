/**
 * PANEL TEST PAGE – Isolierte Testseite für das Unified Panel System
 * Route: /panel-test
 */

import { useState } from 'react';
import { UnifiedDetailPanel } from '../core/panels/UnifiedDetailPanel';

export default function PanelTestPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div style={{ padding: 40, color: '#fff' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Panel Test Page</h1>
      <p style={{ marginBottom: 20, color: '#999' }}>
        Klicke einen Button um das UnifiedDetailPanel zu öffnen:
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[281, 569, 2152, 2151, 2150].map((id) => (
          <button
            key={id}
            onClick={() => setSelectedId(id)}
            style={{
              padding: '8px 16px',
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Installation #{id} öffnen
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 12, background: '#1a1a2e', borderRadius: 8, fontSize: 13 }}>
        <p><strong>selectedId:</strong> {selectedId ?? 'null'}</p>
        <p><strong>Panel sollte offen sein:</strong> {selectedId ? 'Ja' : 'Nein'}</p>
      </div>

      {selectedId && (
        <UnifiedDetailPanel
          installationId={selectedId}
          onClose={() => {
            console.log('[PanelTest] onClose called');
            setSelectedId(null);
          }}
          onUpdate={() => {
            console.log('[PanelTest] onUpdate called');
          }}
        />
      )}
    </div>
  );
}
