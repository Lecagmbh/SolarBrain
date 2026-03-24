/**
 * DataGrid – Key-Value display grid
 */

import type { ReactNode } from 'react';
import { CopyableField } from './CopyableField';

export interface DataGridItem {
  label: string;
  value: string | number | ReactNode | null | undefined;
  /** Show copy button */
  copyable?: boolean;
  /** Render as link */
  link?: string;
  /** Monospace font */
  mono?: boolean;
  /** Blur the value (sensitive data) */
  sensitive?: boolean;
}

interface DataGridProps {
  data: DataGridItem[];
  columns?: 1 | 2;
}

export function DataGrid({ data, columns = 1 }: DataGridProps) {
  const gridCls = columns === 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5'
    : 'flex flex-col gap-2.5';

  return (
    <div className={gridCls}>
      {data.map((item, i) => {
        if (item.value === null || item.value === undefined || item.value === '') {
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                {item.label}
              </span>
              <span className="text-xs text-[var(--text-muted)]">–</span>
            </div>
          );
        }

        // String/number values
        const isText = typeof item.value === 'string' || typeof item.value === 'number';
        const textValue = isText ? String(item.value) : null;

        return (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
              {item.label}
            </span>
            {item.copyable && textValue ? (
              <CopyableField value={textValue} mono={item.mono} />
            ) : item.link && textValue ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline truncate"
              >
                {textValue}
              </a>
            ) : isText ? (
              <span
                className={`text-xs text-[var(--text-primary)] truncate ${item.mono ? 'font-mono' : ''} ${item.sensitive ? 'blur-sm hover:blur-none transition-all' : ''}`}
              >
                {textValue}
              </span>
            ) : (
              <div className="text-xs text-[var(--text-primary)]">{item.value}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
