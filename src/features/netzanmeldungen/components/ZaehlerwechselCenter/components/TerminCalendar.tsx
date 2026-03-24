import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { de } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import type { ParsedTermin } from '../types';

interface Props {
  termine: ParsedTermin[];
  onDayClick?: (date: string) => void;
}

export function TerminCalendar({ termine, onDayClick }: Props) {
  const terminDates = useMemo(() => {
    const dates: Date[] = [];
    for (const t of termine) {
      dates.push(new Date(t.datum + 'T00:00:00'));
    }
    return dates;
  }, [termine]);

  const modifiers = useMemo(() => ({
    terminDay: terminDates,
  }), [terminDates]);

  const modifiersStyles = useMemo(() => ({
    terminDay: {
      background: 'var(--zwc-accent-dim)',
      color: 'var(--zwc-accent)',
      fontWeight: 700,
      borderRadius: '8px',
    },
  }), []);

  return (
    <div className="zwc-calendar">
      <div className="zwc-panel-title">Terminkalender</div>
      <DayPicker
        locale={de}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        onDayClick={(day) => {
          if (onDayClick) {
            const iso = day.toISOString().split('T')[0];
            onDayClick(iso);
          }
        }}
      />
    </div>
  );
}
