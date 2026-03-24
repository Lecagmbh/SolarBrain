import { useState, useCallback } from 'react';
import { Sun, Battery, Loader2, Check } from 'lucide-react';
import { T } from '../styles';

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 6,
  fontSize: 11, fontWeight: 500, cursor: 'pointer',
  background: T.s3, color: T.t2,
  border: `1px solid ${T.ba}`, fontFamily: 'inherit',
};

export function MaStrMatchInline({ publicId, onMatched }: { publicId: string; onMatched?: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const handleMatch = useCallback(async () => {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch(`/api/mastr/installations/${publicId}/match`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const json = await res.json();
      setResult(json);
      setState(json.found ? 'success' : 'error');
      if (json.found) onMatched?.();
    } catch (err: any) {
      setResult({ message: err?.message || 'Fehler' });
      setState('error');
    }
  }, [publicId, onMatched]);

  return (
    <div style={{ padding: '6px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          style={{
            ...btnStyle,
            ...(state === 'success' ? { background: T.okBg, color: T.ok, borderColor: 'rgba(52,211,153,0.2)' } : {}),
          }}
          onClick={handleMatch}
          disabled={state === 'loading'}
        >
          {state === 'loading' ? <><Loader2 size={12} className="gnz-spin" /> Suche...</>
            : state === 'success' ? <><Check size={12} /> Verknüpft</>
            : 'MaStR Auto-Suche'}
        </button>
        {state === 'error' && (
          <span style={{ fontSize: 11, color: T.t3 }}>
            Kein Treffer ({result?.totalInPlz ?? 0} in PLZ)
          </span>
        )}
      </div>
      {result?.solar?.mastrNr && (
        <div style={{ fontSize: 11, color: T.t2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sun size={12} style={{ color: T.ok }} /> Solar: <span style={{ color: T.ok, fontFamily: T.mono, fontSize: 10 }}>{result.solar.mastrNr}</span>
        </div>
      )}
      {result?.speicher?.mastrNr && (
        <div style={{ fontSize: 11, color: T.t2, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Battery size={12} style={{ color: T.ok }} /> Speicher: <span style={{ color: T.ok, fontFamily: T.mono, fontSize: 10 }}>{result.speicher.mastrNr}</span>
        </div>
      )}
    </div>
  );
}

export function MaStrConfirmInline({ installId, hasStorage, onConfirmed }: { installId: number; hasStorage: boolean; onConfirmed?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    const mastrNrSolar = prompt('MaStR-Nr. Solar (SEE...):');
    if (!mastrNrSolar) return;
    if (!mastrNrSolar.trim().startsWith('SEE')) {
      alert('MaStR-Nr. Solar muss mit "SEE" beginnen.');
      return;
    }
    let mastrNrSpeicher: string | undefined;
    if (hasStorage) {
      const input = prompt('MaStR-Nr. Speicher (SSE..., optional):');
      if (input && input.trim()) {
        if (!input.trim().startsWith('SSE')) {
          alert('MaStR-Nr. Speicher muss mit "SSE" beginnen.');
          return;
        }
        mastrNrSpeicher = input.trim();
      }
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/installations/${installId}/confirm-mastr`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastrNrSolar: mastrNrSolar.trim(), mastrNrSpeicher }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fehler');
      onConfirmed?.();
    } catch (err: any) {
      alert(err?.message || 'Fehler beim Bestätigen der MaStR-Registrierung');
    } finally {
      setLoading(false);
    }
  }, [installId, hasStorage, onConfirmed]);

  return (
    <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        style={{
          ...btnStyle,
          ...(loading ? {} : { background: 'rgba(52,211,153,0.12)', color: T.ok, borderColor: 'rgba(52,211,153,0.2)' }),
        }}
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? <><Loader2 size={12} className="gnz-spin" /> Wird bestätigt...</> : 'MaStR-Registrierung bestätigen'}
      </button>
      <span style={{ fontSize: 10, color: T.t3 }}>Setzt IBN-Datum + MaStR-Status</span>
    </div>
  );
}
