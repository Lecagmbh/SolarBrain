/**
 * MeterChangeScheduler – Zählerwechsel-Terminplanung
 */

import { useState, useCallback, useEffect } from 'react';
import { Calendar, Clock, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionCard } from '../../primitives/SectionCard';
import { StatusBadge } from '../../primitives/StatusBadge';

interface Appointment {
  id: number;
  status: string;
  scheduledAt: string;
  confirmedAt: string | null;
  createdAt: string;
  description: string | null;
}

interface MeterChangeSchedulerProps {
  installationId: number;
  existingDatum?: string;
  existingUhrzeit?: string;
  existingKommentar?: string;
  onSchedule: (data: { datum: string; uhrzeit: string; kommentar?: string }) => Promise<{
    notificationsSent: { errichterEmail: boolean; endkundeEmail: boolean; endkundeWhatsapp: boolean };
  }>;
  onCancel: () => Promise<unknown>;
  onGetAppointment: () => Promise<{ appointment: Appointment | null }>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onUpdate: () => void;
}

export function MeterChangeScheduler({
  installationId,
  existingDatum,
  existingUhrzeit,
  existingKommentar,
  onSchedule,
  onCancel,
  onGetAppointment,
  showToast,
  onUpdate,
}: MeterChangeSchedulerProps) {
  const [editing, setEditing] = useState(false);
  const [datum, setDatum] = useState(existingDatum ? existingDatum.split('T')[0] : '');
  const [uhrzeit, setUhrzeit] = useState(existingUhrzeit || '09:00');
  const [kommentar, setKommentar] = useState(existingKommentar || '');
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const loadAppointment = useCallback(async () => {
    try {
      const res = await onGetAppointment();
      setAppointment(res.appointment);
    } catch { /* ignore */ }
  }, [onGetAppointment]);

  useEffect(() => {
    if (existingDatum) loadAppointment();
  }, [existingDatum, loadAppointment]);

  const handleSchedule = async () => {
    if (!datum) {
      showToast('Bitte Datum angeben', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await onSchedule({ datum, uhrzeit, kommentar: kommentar || undefined });
      const msgs: string[] = [];
      if (res.notificationsSent.errichterEmail) msgs.push('Errichter-Email');
      if (res.notificationsSent.endkundeEmail) msgs.push('Endkunde-Email');
      if (res.notificationsSent.endkundeWhatsapp) msgs.push('Endkunde-WhatsApp');
      showToast(
        msgs.length > 0
          ? `Termin geplant! Benachrichtigung: ${msgs.join(' + ')}`
          : 'Termin geplant (keine Benachrichtigung gesendet)',
        'success',
      );
      setEditing(false);
      onUpdate();
      loadAppointment();
    } catch (err: any) {
      showToast(err.message || 'Fehler beim Planen', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Zählerwechsel-Termin wirklich absagen?')) return;
    setSaving(true);
    try {
      await onCancel();
      showToast('Termin abgesagt', 'success');
      setAppointment(null);
      setDatum('');
      setUhrzeit('09:00');
      setKommentar('');
      onUpdate();
    } catch (err: any) {
      showToast(err.message || 'Fehler', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <SectionCard title="Zählerwechsel-Termin">
      <div className="flex flex-col gap-2">
        {/* Existing appointment */}
        {appointment && !editing && (
          <>
            <div className="flex items-center gap-2 text-xs">
              <Calendar size={14} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-primary)]">{fmt(appointment.scheduledAt)}</span>
              <StatusBadge
                label={appointment.status === 'confirmed' ? 'Bestätigt' : appointment.status === 'cancelled' ? 'Abgesagt' : 'Geplant'}
                variant={appointment.status === 'confirmed' ? 'success' : appointment.status === 'cancelled' ? 'danger' : 'warning'}
                dot
              />
            </div>
            {appointment.confirmedAt && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle size={12} />
                <span>Bestätigt am {fmt(appointment.confirmedAt)}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="text-xs text-blue-400 hover:text-blue-300"
                onClick={() => setEditing(true)}
              >
                Ändern
              </button>
              <button
                className="text-xs text-red-400 hover:text-red-300"
                onClick={handleCancel}
                disabled={saving}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : 'Absagen'}
              </button>
            </div>
          </>
        )}

        {/* No appointment yet */}
        {!appointment && !editing && (
          <button
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            onClick={() => setEditing(true)}
          >
            <Calendar size={12} /> Termin planen
          </button>
        )}

        {/* Edit form */}
        {editing && (
          <>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Datum</label>
                <input
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
                />
              </div>
              <div className="w-24">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Uhrzeit</label>
                <input
                  type="time"
                  value={uhrzeit}
                  onChange={(e) => setUhrzeit(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <input
              type="text"
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
              placeholder="Kommentar (optional)"
              className="w-full px-2 py-1 text-xs bg-[var(--gray-800)] border border-[var(--panel-border)] rounded-md text-[var(--text-primary)] outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1 h-7 px-3 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50"
                onClick={handleSchedule}
                disabled={saving}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                Planen
              </button>
              <button
                className="flex items-center gap-1 h-7 px-2 text-xs text-[var(--text-secondary)] hover:bg-white/5 rounded-md"
                onClick={() => setEditing(false)}
              >
                <X size={12} /> Abbrechen
              </button>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
