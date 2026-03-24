import { Copy, Check } from 'lucide-react';
import { T } from '../styles';

interface CopyFieldProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  onCopy: (text: string, key: string) => void;
  isCopied: (key: string) => boolean;
  copyKey?: string;
}

export function CopyField({ label, value, mono, onCopy, isCopied, copyKey }: CopyFieldProps) {
  const displayValue = value != null ? String(value) : '—';
  const key = copyKey || `${label}:${displayValue}`;
  const copied = isCopied(key);
  const hasValue = value != null && String(value).trim() !== '';

  // Long values → vertical layout (label above value, full width for value)
  // Short values → horizontal layout (label left, value right)
  // Mono chars are wider, so lower threshold (16 vs 25)
  const isLong = hasValue && (displayValue.length > 25 || (mono && displayValue.length > 16));

  if (isLong) {
    return (
      <div
        onClick={() => onCopy(displayValue, key)}
        style={{
          padding: '6px 12px',
          cursor: 'pointer',
          background: copied ? T.acGlow : 'transparent',
          transition: 'background 0.12s',
          borderBottom: `1px solid ${T.bd}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: T.t3 }}>{label}</span>
          <span style={{ flexShrink: 0, opacity: copied ? 1 : 0.4, color: copied ? T.ok : T.t3, transition: 'all 0.15s' }}>
            {copied ? <Check size={10} /> : <Copy size={10} />}
          </span>
        </div>
        <span style={{
          fontSize: 12,
          color: T.t1,
          fontWeight: 500,
          fontFamily: mono ? T.mono : 'inherit',
          wordBreak: 'break-all' as const,
          lineHeight: 1.4,
          letterSpacing: mono ? -0.2 : undefined,
        }}>
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => hasValue && onCopy(displayValue, key)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 12px',
        gap: 6,
        cursor: hasValue ? 'pointer' : 'default',
        background: copied ? T.acGlow : 'transparent',
        transition: 'background 0.12s',
        minHeight: 28,
        borderBottom: `1px solid ${T.bd}`,
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 70,
        fontSize: 10,
        color: T.t3,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
      <span style={{
        flex: 1,
        fontSize: mono ? 11 : 12,
        fontFamily: mono ? T.mono : 'inherit',
        color: hasValue ? T.t1 : T.t3,
        fontWeight: hasValue ? 500 : 400,
        letterSpacing: mono ? -0.2 : undefined,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}>
        {displayValue}
      </span>
      {hasValue && (
        <span style={{ flexShrink: 0, opacity: copied ? 1 : 0.3, color: copied ? T.ok : T.t3, transition: 'all 0.15s' }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </span>
      )}
    </div>
  );
}
