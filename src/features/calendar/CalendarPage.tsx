/**
 * CALENDAR PAGE - Terminverwaltung
 * =================================
 * - Monatsansicht mit Terminen
 * - Termine erstellen/bearbeiten
 * - Verfügbarkeit & blockierte Tage
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock,
  User, MapPin, Phone, Mail, Building2, Settings, X, Check,
  AlertTriangle, Filter, Search, Trash2, Edit2, ExternalLink,
  CalendarDays, CalendarOff, List, Grid3X3, Link2, Copy
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../../modules/auth/AuthContext';
import * as api from './api';
import type { CalendarAppointment, CalendarService, AppointmentStatus, CalendarAvailability, CalendarBlockedDate } from './types';
import { STATUS_CONFIG, DAY_NAMES, DAY_NAMES_SHORT } from './types';
import './CalendarPage.css';

export function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // User role checks
  const userRole = (user as any)?.role?.toUpperCase() || 'KUNDE';
  const isAdmin = userRole === 'ADMIN';
  const isMitarbeiter = userRole === 'MITARBEITER';
  const isHandelsvertreter = userRole === 'HANDELSVERTRETER';
  const isStaff = isAdmin || isMitarbeiter;

  // View state
  const [view, setView] = useState<'month' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Data state
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [services, setServices] = useState<CalendarService[]>([]);
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [blockedDates, setBlockedDates] = useState<CalendarBlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<CalendarAppointment | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate booking link - JEDER Benutzer bekommt seinen eigenen Link
  const bookingLink = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    if (user && (user as any).id) {
      return `${baseUrl}/termin?user=${(user as any).id}`;
    }
    return `${baseUrl}/termin`;
  }, [user]);

  const handleCopyBookingLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Load data
  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const [appointmentsRes, servicesRes, availabilityRes, blockedRes] = await Promise.all([
        api.getAppointments({
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
          limit: 500,
        }),
        api.getServices(),
        api.getAvailability(),
        api.getBlockedDates(monthStart.toISOString(), monthEnd.toISOString()),
      ]);

      setAppointments(appointmentsRes.appointments);
      setServices(servicesRes);
      setAvailability(availabilityRes);
      setBlockedDates(blockedRes);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (serviceFilter && apt.serviceId !== serviceFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          apt.title?.toLowerCase().includes(searchLower) ||
          apt.contactName?.toLowerCase().includes(searchLower) ||
          apt.contactEmail?.toLowerCase().includes(searchLower) ||
          apt.installation?.customerName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, serviceFilter, search]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    filteredAppointments.forEach(apt => {
      const dateKey = format(parseISO(apt.scheduledAt), 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(apt);
    });
    return map;
  }, [filteredAppointments]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days at start
    const startPadding = monthStart.getDay();
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null);

    return [...paddedDays, ...days];
  }, [currentDate]);

  // Blocked date set
  const blockedDateSet = useMemo(() => {
    return new Set(blockedDates.filter(b => b.isAllDay).map(b => format(parseISO(b.date), 'yyyy-MM-dd')));
  }, [blockedDates]);

  // Availability by day
  const availabilityByDay = useMemo(() => {
    const map = new Map<number, CalendarAvailability[]>();
    availability.filter(a => a.isActive).forEach(a => {
      if (!map.has(a.dayOfWeek)) map.set(a.dayOfWeek, []);
      map.get(a.dayOfWeek)!.push(a);
    });
    return map;
  }, [availability]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    // Pre-fill the form with this date
    setEditingAppointment({
      scheduledAt: date.toISOString(),
      serviceId: services[0]?.id || 0,
    } as any);
    setShowModal(true);
  };

  const handleAppointmentClick = (apt: CalendarAppointment) => {
    setEditingAppointment(apt);
    setShowModal(true);
  };

  const handleSaveAppointment = async (data: Partial<CalendarAppointment>) => {
    try {
      if (editingAppointment?.id) {
        await api.updateAppointment(editingAppointment.id, data);
      } else {
        await api.createAppointment(data);
      }
      setShowModal(false);
      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm('Termin wirklich löschen?')) return;
    try {
      await api.deleteAppointment(id);
      setShowModal(false);
      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Fehler beim Löschen');
    }
  };

  const handleStatusChange = async (apt: CalendarAppointment, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointment(apt.id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="cal-page">
      {/* Header */}
      <div className="cal-header">
        <div className="cal-header__left">
          <CalendarIcon size={28} className="cal-header__icon" />
          <div>
            <h1 className="cal-header__title">
              {isHandelsvertreter ? 'Mein Kalender' : 'Terminkalender'}
            </h1>
            <p className="cal-header__subtitle">
              {filteredAppointments.length} {isHandelsvertreter ? 'meiner Termine' : 'Termine'} im {format(currentDate, 'MMMM yyyy', { locale: de })}
            </p>
          </div>
        </div>

        <div className="cal-header__actions">
          <button
            className={`cal-btn cal-btn--secondary ${linkCopied ? 'cal-btn--success' : ''}`}
            onClick={handleCopyBookingLink}
            title={bookingLink}
          >
            {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
            {linkCopied ? 'Kopiert!' : 'Buchungslink'}
          </button>
          <button className="cal-btn cal-btn--secondary" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} />
            Einstellungen
          </button>
          <button className="cal-btn cal-btn--primary" onClick={() => { setEditingAppointment(null); setShowModal(true); }}>
            <Plus size={16} />
            Neuer Termin
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar__nav">
          <button className="cal-nav-btn" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <button className="cal-nav-btn cal-nav-btn--today" onClick={handleToday}>
            Heute
          </button>
          <button className="cal-nav-btn" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
          <span className="cal-toolbar__month">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
        </div>

        <div className="cal-toolbar__filters">
          <div className="cal-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="cal-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Alle Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <select
            className="cal-select"
            value={serviceFilter || ''}
            onChange={(e) => setServiceFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Alle Terminarten</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.nameKey}</option>
            ))}
          </select>
        </div>

        <div className="cal-toolbar__view">
          <button
            className={`cal-view-btn ${view === 'month' ? 'cal-view-btn--active' : ''}`}
            onClick={() => setView('month')}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className={`cal-view-btn ${view === 'list' ? 'cal-view-btn--active' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="cal-grid">
          {/* Day headers */}
          <div className="cal-grid__header">
            {DAY_NAMES_SHORT.map((day, i) => (
              <div key={i} className="cal-grid__header-cell">{day}</div>
            ))}
          </div>

          {/* Days */}
          <div className="cal-grid__body">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="cal-day cal-day--empty" />;
              }

              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate.get(dateKey) || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isBlocked = blockedDateSet.has(dateKey);
              const dayOfWeek = day.getDay();
              const hasAvailability = availabilityByDay.has(dayOfWeek);

              return (
                <div
                  key={dateKey}
                  className={`cal-day ${isToday ? 'cal-day--today' : ''} ${!isCurrentMonth ? 'cal-day--other' : ''} ${isBlocked ? 'cal-day--blocked' : ''} ${!hasAvailability ? 'cal-day--unavailable' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="cal-day__header">
                    <span className="cal-day__number">{format(day, 'd')}</span>
                    {isBlocked && <CalendarOff size={12} className="cal-day__blocked-icon" />}
                  </div>
                  <div className="cal-day__appointments">
                    {dayAppointments.slice(0, 3).map(apt => {
                      const statusConfig = STATUS_CONFIG[apt.status];
                      const service = services.find(s => s.id === apt.serviceId);
                      return (
                        <div
                          key={apt.id}
                          className="cal-day__apt"
                          style={{
                            borderLeftColor: service?.color || statusConfig.color,
                            background: statusConfig.bg
                          }}
                          onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                        >
                          <span className="cal-day__apt-time">
                            {format(parseISO(apt.scheduledAt), 'HH:mm')}
                          </span>
                          <span className="cal-day__apt-title">{apt.title}</span>
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="cal-day__more">
                        +{dayAppointments.length - 3} weitere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="cal-list">
          {loading ? (
            <div className="cal-loading">Laden...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="cal-empty">
              <CalendarIcon size={48} />
              <p>Keine Termine gefunden</p>
            </div>
          ) : (
            <div className="cal-list__items">
              {filteredAppointments
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map(apt => {
                  const statusConfig = STATUS_CONFIG[apt.status];
                  const service = services.find(s => s.id === apt.serviceId);
                  return (
                    <div
                      key={apt.id}
                      className="cal-list__item"
                      onClick={() => handleAppointmentClick(apt)}
                    >
                      <div
                        className="cal-list__item-bar"
                        style={{ background: service?.color || statusConfig.color }}
                      />
                      <div className="cal-list__item-date">
                        <span className="cal-list__item-day">
                          {format(parseISO(apt.scheduledAt), 'dd')}
                        </span>
                        <span className="cal-list__item-month">
                          {format(parseISO(apt.scheduledAt), 'MMM', { locale: de })}
                        </span>
                      </div>
                      <div className="cal-list__item-content">
                        <div className="cal-list__item-header">
                          <span className="cal-list__item-title">{apt.title}</span>
                          <span
                            className="cal-list__item-status"
                            style={{ color: statusConfig.color, background: statusConfig.bg }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="cal-list__item-meta">
                          <span><Clock size={12} /> {format(parseISO(apt.scheduledAt), 'HH:mm')} - {apt.durationMin} min</span>
                          {apt.contactName && <span><User size={12} /> {apt.contactName}</span>}
                          {apt.location && <span><MapPin size={12} /> {apt.location}</span>}
                          {service && <span style={{ color: service.color }}>{service.nameKey}</span>}
                        </div>
                        {apt.status === 'CANCELLED' && apt.adminNotes?.includes('Absage-Link') && (
                          <div className="cal-list__cancel-banner">
                            <AlertTriangle size={12} />
                            <span>Vom Kunden über Absage-Link storniert</span>
                          </div>
                        )}
                      </div>
                      <div className="cal-list__item-actions">
                        <select
                          value={apt.status}
                          onChange={(e) => { e.stopPropagation(); handleStatusChange(apt, e.target.value as AppointmentStatus); }}
                          onClick={(e) => e.stopPropagation()}
                          className="cal-status-select"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      {showModal && (
        <AppointmentModal
          appointment={editingAppointment}
          services={services}
          onSave={handleSaveAppointment}
          onDelete={editingAppointment?.id ? () => handleDeleteAppointment(editingAppointment.id) : undefined}
          onClose={() => { setShowModal(false); setEditingAppointment(null); }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          availability={availability}
          blockedDates={blockedDates}
          services={services}
          isAdmin={isAdmin}
          isHandelsvertreter={isHandelsvertreter}
          onClose={() => setShowSettingsModal(false)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENT MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface AppointmentModalProps {
  appointment: CalendarAppointment | null;
  services: CalendarService[];
  onSave: (data: Partial<CalendarAppointment>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function AppointmentModal({ appointment, services, onSave, onDelete, onClose }: AppointmentModalProps) {
  const [form, setForm] = useState({
    title: appointment?.title || '',
    serviceId: appointment?.serviceId || services[0]?.id || 0,
    scheduledAt: appointment?.scheduledAt
      ? format(parseISO(appointment.scheduledAt), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    durationMin: appointment?.durationMin || services[0]?.durationMin || 60,
    contactName: appointment?.contactName || '',
    contactEmail: appointment?.contactEmail || '',
    contactPhone: appointment?.contactPhone || '',
    location: appointment?.location || '',
    description: appointment?.description || '',
    status: appointment?.status || 'PENDING',
    adminNotes: appointment?.adminNotes || '',
  });

  const handleServiceChange = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    setForm(f => ({
      ...f,
      serviceId,
      durationMin: service?.durationMin || f.durationMin,
      title: f.title || service?.nameKey || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    });
  };

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal__header">
          <h2>{appointment?.id ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
          <button className="cal-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {appointment?.status === 'CANCELLED' && appointment?.adminNotes?.includes('Absage-Link') && (
          <div className="cal-modal__cancel-banner">
            <AlertTriangle size={16} />
            <div>
              <div className="cal-modal__cancel-title">Vom Kunden abgesagt</div>
              <div className="cal-modal__cancel-text">
                {appointment.contactName || 'Der Kunde'} hat diesen Termin über den Absage-Link in der E-Mail storniert.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cal-modal__form">
          <div className="cal-form-row">
            <label>Terminart</label>
            <select
              value={form.serviceId}
              onChange={(e) => handleServiceChange(Number(e.target.value))}
              required
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.nameKey} ({s.durationMin} min)</option>
              ))}
            </select>
          </div>

          <div className="cal-form-row">
            <label>Titel</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="cal-form-grid">
            <div className="cal-form-row">
              <label>Datum & Uhrzeit</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                required
              />
            </div>
            <div className="cal-form-row">
              <label>Dauer (Min.)</label>
              <input
                type="number"
                value={form.durationMin}
                onChange={(e) => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
                min={15}
                step={15}
              />
            </div>
          </div>

          <div className="cal-form-row">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value as AppointmentStatus }))}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="cal-form-divider">Kontakt</div>

          <div className="cal-form-grid">
            <div className="cal-form-row">
              <label>Name</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))}
              />
            </div>
            <div className="cal-form-row">
              <label>Telefon</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm(f => ({ ...f, contactPhone: e.target.value }))}
              />
            </div>
          </div>

          <div className="cal-form-row">
            <label>E-Mail</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            />
          </div>

          <div className="cal-form-row">
            <label>Ort</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Adresse oder Online-Link"
            />
          </div>

          <div className="cal-form-row">
            <label>Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="cal-form-row">
            <label>Interne Notizen</label>
            <textarea
              value={form.adminNotes}
              onChange={(e) => setForm(f => ({ ...f, adminNotes: e.target.value }))}
              rows={2}
              placeholder="Nur für Mitarbeiter sichtbar"
            />
          </div>

          <div className="cal-modal__footer">
            {onDelete && (
              <button type="button" className="cal-btn cal-btn--danger" onClick={onDelete}>
                <Trash2 size={16} />
                Löschen
              </button>
            )}
            <div className="cal-modal__footer-right">
              <button type="button" className="cal-btn cal-btn--secondary" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="cal-btn cal-btn--primary">
                <Check size={16} />
                Speichern
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsModalProps {
  availability: CalendarAvailability[];
  blockedDates: CalendarBlockedDate[];
  services: CalendarService[];
  isAdmin: boolean;
  isHandelsvertreter: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// Generate time options (06:00 - 22:00 in 30min steps)
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

function SettingsModal({ availability, blockedDates, services, isAdmin, isHandelsvertreter, onClose, onRefresh }: SettingsModalProps) {
  const [tab, setTab] = useState<'availability' | 'blocked' | 'services'>('availability');
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const showSaveMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleAddAvailability = async (dayOfWeek: number) => {
    setSaving(true);
    try {
      await api.createAvailability({ dayOfWeek, startTime: '09:00', endTime: '17:00', isActive: true });
      await onRefresh();
      showSaveMessage('Zeitfenster hinzugefügt');
    } catch (error) {
      console.error('Error adding availability:', error);
      showSaveMessage('Fehler beim Hinzufügen');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAvailability = async (id: number, data: Partial<CalendarAvailability>) => {
    setSaving(true);
    try {
      await api.updateAvailability(id, data);
      await onRefresh();
      showSaveMessage('Gespeichert');
    } catch (error) {
      console.error('Error updating availability:', error);
      showSaveMessage('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id: number) => {
    setSaving(true);
    try {
      await api.deleteAvailability(id);
      await onRefresh();
      showSaveMessage('Gelöscht');
    } catch (error) {
      console.error('Error deleting availability:', error);
      showSaveMessage('Fehler beim Löschen');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate.date) return;
    try {
      await api.createBlockedDate({ date: newBlockedDate.date, reason: newBlockedDate.reason, isAllDay: true });
      setNewBlockedDate({ date: '', reason: '' });
      onRefresh();
    } catch (error) {
      console.error('Error adding blocked date:', error);
    }
  };

  const handleDeleteBlockedDate = async (id: number) => {
    try {
      await api.deleteBlockedDate(id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
    }
  };

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal cal-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="cal-modal__header">
          <h2>Kalender-Einstellungen</h2>
          {saveMessage && (
            <span className={`cal-save-message ${saveMessage.includes('Fehler') ? 'cal-save-message--error' : ''}`}>
              {saveMessage}
            </span>
          )}
          {saving && <span className="cal-saving">Speichern...</span>}
          <button className="cal-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cal-settings-tabs">
          <button
            className={`cal-settings-tab ${tab === 'availability' ? 'cal-settings-tab--active' : ''}`}
            onClick={() => setTab('availability')}
          >
            <Clock size={16} />
            {isHandelsvertreter ? 'Meine Verfügbarkeit' : 'Verfügbarkeit'}
          </button>
          <button
            className={`cal-settings-tab ${tab === 'blocked' ? 'cal-settings-tab--active' : ''}`}
            onClick={() => setTab('blocked')}
          >
            <CalendarOff size={16} />
            {isHandelsvertreter ? 'Meine blockierten Tage' : 'Blockierte Tage'}
          </button>
          {isAdmin && (
            <button
              className={`cal-settings-tab ${tab === 'services' ? 'cal-settings-tab--active' : ''}`}
              onClick={() => setTab('services')}
            >
              <CalendarDays size={16} />
              Terminarten
            </button>
          )}
        </div>

        <div className="cal-settings-content">
          {tab === 'availability' && (
            <div className="cal-availability">
              <p className="cal-settings-desc">
                {isHandelsvertreter
                  ? 'Legen Sie Ihre persönliche Verfügbarkeit fest - an welchen Tagen und zu welchen Zeiten Sie für Termine erreichbar sind.'
                  : 'Legen Sie fest, an welchen Tagen und zu welchen Zeiten Termine gebucht werden können.'
                }
              </p>
              {DAY_NAMES.map((dayName, dayIndex) => {
                const dayAvail = availability.filter(a => a.dayOfWeek === dayIndex);
                return (
                  <div key={dayIndex} className="cal-availability__day">
                    <div className="cal-availability__day-name">{dayName}</div>
                    <div className="cal-availability__slots">
                      {dayAvail.length === 0 ? (
                        <span className="cal-availability__none">Nicht verfügbar</span>
                      ) : (
                        dayAvail.map(av => (
                          <div key={av.id} className="cal-availability__slot">
                            <select
                              value={av.startTime}
                              onChange={(e) => handleUpdateAvailability(av.id, { startTime: e.target.value })}
                              className="cal-time-select"
                            >
                              {TIME_OPTIONS.map(time => (
                                <option key={time} value={time}>{time} Uhr</option>
                              ))}
                            </select>
                            <span className="cal-availability__separator">bis</span>
                            <select
                              value={av.endTime}
                              onChange={(e) => handleUpdateAvailability(av.id, { endTime: e.target.value })}
                              className="cal-time-select"
                            >
                              {TIME_OPTIONS.map(time => (
                                <option key={time} value={time}>{time} Uhr</option>
                              ))}
                            </select>
                            <button
                              className="cal-availability__delete"
                              onClick={() => handleDeleteAvailability(av.id)}
                              title="Zeitfenster löschen"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                      <button
                        className="cal-availability__add"
                        onClick={() => handleAddAvailability(dayIndex)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'blocked' && (
            <div className="cal-blocked">
              <p className="cal-settings-desc">
                {isHandelsvertreter
                  ? 'Blockieren Sie Tage, an denen Sie nicht verfügbar sind (z.B. Urlaub, private Termine).'
                  : 'Blockieren Sie einzelne Tage (z.B. Urlaub, Feiertage).'
                }
              </p>
              <div className="cal-blocked__add">
                <input
                  type="date"
                  value={newBlockedDate.date}
                  onChange={(e) => setNewBlockedDate(d => ({ ...d, date: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Grund (optional)"
                  value={newBlockedDate.reason}
                  onChange={(e) => setNewBlockedDate(d => ({ ...d, reason: e.target.value }))}
                />
                <button className="cal-btn cal-btn--primary" onClick={handleAddBlockedDate}>
                  <Plus size={16} />
                  Hinzufügen
                </button>
              </div>
              <div className="cal-blocked__list">
                {blockedDates.length === 0 ? (
                  <p className="cal-blocked__empty">Keine blockierten Tage</p>
                ) : (
                  blockedDates.map(bd => (
                    <div key={bd.id} className="cal-blocked__item">
                      <CalendarOff size={16} />
                      <span className="cal-blocked__date">
                        {format(parseISO(bd.date), 'dd.MM.yyyy')}
                      </span>
                      {bd.reason && <span className="cal-blocked__reason">{bd.reason}</span>}
                      <button onClick={() => handleDeleteBlockedDate(bd.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="cal-services">
              <p className="cal-settings-desc">
                Verwalten Sie die verfügbaren Terminarten.
              </p>
              <div className="cal-services__list">
                {services.map(s => (
                  <div key={s.id} className="cal-services__item">
                    <div
                      className="cal-services__color"
                      style={{ background: s.color || '#D4A843' }}
                    />
                    <div className="cal-services__info">
                      <span className="cal-services__name">{s.nameKey}</span>
                      <span className="cal-services__duration">{s.durationMin} Minuten</span>
                    </div>
                    <span className={`cal-services__status ${s.isActive ? '' : 'cal-services__status--inactive'}`}>
                      {s.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cal-modal__footer">
          <button className="cal-btn cal-btn--secondary" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
