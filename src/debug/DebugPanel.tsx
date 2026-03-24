import React, { useMemo, useState } from 'react';
import { useDebugLogs } from './store';
import type { LogLevel } from './logger';

type FilterLevel = 'all' | LogLevel;

const levelColor: Record<LogLevel, string> = {
  debug: '#9e9e9e',
  info: '#90caf9',
  warn: '#ffb74d',
  error: '#ef9a9a',
};

export const DebugPanel: React.FC = () => {
  const logs = useDebugLogs();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterLevel>('all');

  const visibleLogs = useMemo(
    () => logs.filter((l) => filter === 'all' || l.level === filter),
    [logs, filter]
  );

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid #ddd',
          background: '#ffffff',
          fontSize: 12,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {open ? 'Debug schließen' : 'Debug'}
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            width: 440,
            maxHeight: 360,
            background: '#050505',
            color: '#f5f5f5',
            padding: 8,
            borderRadius: 12,
            fontSize: 11,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'error', 'warn', 'info', 'debug'] as FilterLevel[]).map(
                (lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilter(lvl)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 10,
                      background:
                        filter === lvl ? '#333333' : '#1a1a1a',
                      color: '#f5f5f5',
                      opacity: filter === lvl ? 1 : 0.7,
                    }}
                  >
                    {lvl.toUpperCase()}
                  </button>
                )
              )}
            </div>
            <span style={{ opacity: 0.6 }}>
              {visibleLogs.length} / {logs.length} Einträge
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              borderRadius: 8,
              border: '1px solid #333',
              padding: 4,
              background: '#0a0a0a',
            }}
          >
            {visibleLogs.length === 0 && (
              <div style={{ opacity: 0.6, padding: 8 }}>
                Keine Logs vorhanden. Nutze z.B. DebugLogger.info('Nachricht').
              </div>
            )}

            {visibleLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  borderBottom: '1px solid #222',
                  padding: '4px 4px 6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: levelColor[log.level],
                      }}
                    />
                    <strong>[{log.level.toUpperCase()}]</strong>
                    <span
                      style={{ opacity: 0.7, fontSize: 10 }}
                    >
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.source && (
                    <span style={{ opacity: 0.6, fontSize: 10 }}>
                      {log.source}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 2 }}>{log.message}</div>
                {log.context && (
                  <details>
                    <summary
                      style={{ cursor: 'pointer', opacity: 0.8 }}
                    >
                      Kontext
                    </summary>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        marginTop: 2,
                        fontSize: 10,
                        background: '#050505',
                        padding: 4,
                        borderRadius: 4,
                        color: '#b3e5fc',
                      }}
                    >
                      {JSON.stringify(log.context, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
