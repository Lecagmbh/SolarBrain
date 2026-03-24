/**
 * PUBLIC BOOKING PAGE - Öffentliche Terminbuchung
 * ================================================
 * - Benutzer-spezifische Buchungsseite (jeder HV hat eigenen Link)
 * - Nur Beratungsgespräche buchbar
 * - Datum & Uhrzeit wählen
 * - Kontaktdaten eingeben
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, User, Mail, Phone, ChevronLeft,
  ChevronRight, Check, AlertCircle, CheckCircle2, Loader2, UserX
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, parseISO, isToday, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import './BookingPage.css';

interface BookingService {
  id: number;
  nameKey: string;
  description?: string;
  durationMin: number;
  color?: string;
}

interface BookingUser {
  id: number;
  name: string;
}

interface TimeSlot {
  date: string;
  times: string[];
}

const API_BASE = '/api/calendar/public';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user');

  // Steps
  const [step, setStep] = useState<'loading' | 'error' | 'datetime' | 'contact' | 'done'>('loading');

  // Data
  const [bookingUser, setBookingUser] = useState<BookingUser | null>(null);
  const [service, setService] = useState<BookingService | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Contact form
  const [contact, setContact] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Booking result
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  // Load slots when month changes
  useEffect(() => {
    if (service && bookingUser) {
      loadSlots();
    }
  }, [service, bookingUser, currentMonth]);

  const loadInitialData = async () => {
    // Check if user ID is provided
    if (!userId) {
      setError('Kein Buchungslink angegeben. Bitte verwenden Sie den Link, den Sie erhalten haben.');
      setStep('error');
      return;
    }

    try {
      // Load user info and services in parallel
      const [userRes, servicesRes] = await Promise.all([
        fetch(`${API_BASE}/user/${userId}`),
        fetch(`${API_BASE}/services`),
      ]);

      if (!userRes.ok) {
        setError('Der Buchungslink ist ungültig oder dieser Berater hat noch keine Verfügbarkeit eingerichtet.');
        setStep('error');
        return;
      }

      const userData = await userRes.json();
      const servicesData = await servicesRes.json();

      if (!servicesData || servicesData.length === 0) {
        setError('Derzeit sind keine Termine buchbar.');
        setStep('error');
        return;
      }

      setBookingUser(userData);
      setService(servicesData[0]); // Take first service (Beratungsgespräch)
      setStep('datetime');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Fehler beim Laden der Buchungsseite. Bitte versuchen Sie es später erneut.');
      setStep('error');
    }
  };

  const loadSlots = async () => {
    if (!service || !bookingUser) return;

    setSlotsLoading(true);
    try {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const params = new URLSearchParams({
        month: monthStr,
        serviceId: String(service.id),
        userId: String(bookingUser.id),
      });

      const res = await fetch(`${API_BASE}/slots?${params}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Error loading slots:', err);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = monthStart.getDay();
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null);

    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Available dates set
  const availableDates = useMemo(() => {
    return new Set(slots.map(s => s.date));
  }, [slots]);

  // Times for selected date
  const timesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const slot = slots.find(s => s.date === selectedDate);
    return slot?.times || [];
  }, [slots, selectedDate]);

  // Handlers
  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (availableDates.has(dateStr)) {
      setSelectedDate(dateStr);
      setSelectedTime(null);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinueToContact = () => {
    if (selectedDate && selectedTime) {
      setStep('contact');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !selectedDate || !selectedTime || !bookingUser) return;

    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00Z`);

      const res = await fetch(`${API_BASE}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          scheduledAt: scheduledAt.toISOString(),
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          description: contact.message,
          assignedUserId: bookingUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Buchung fehlgeschlagen');
      }

      setBookingResult(data);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Buchung');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="booking-page booking-page--loading">
        <Loader2 className="booking-spinner" />
        <p>Buchungsseite wird geladen...</p>
      </div>
    );
  }

  // Error state (no user or invalid user)
  if (step === 'error') {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-error-page">
            <UserX size={64} className="booking-error-page__icon" />
            <h1>Buchung nicht möglich</h1>
            <p>{error}</p>
            <p className="booking-error-page__hint">
              Bitte kontaktieren Sie Ihren Ansprechpartner für einen gültigen Buchungslink.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Header with User Info */}
        <div className="booking-header">
          <CalendarIcon size={32} className="booking-header__icon" />
          <div>
            <h1>Termin buchen</h1>
            <p>Beratungsgespräch mit <strong>{bookingUser?.name}</strong></p>
          </div>
        </div>

        {/* Progress */}
        <div className="booking-progress">
          <div className={`booking-progress__step ${step === 'datetime' ? 'active' : ''} ${['contact', 'done'].includes(step) ? 'done' : ''}`}>
            <span className="booking-progress__number">1</span>
            <span className="booking-progress__label">Datum & Zeit</span>
          </div>
          <div className="booking-progress__line" />
          <div className={`booking-progress__step ${step === 'contact' ? 'active' : ''} ${step === 'done' ? 'done' : ''}`}>
            <span className="booking-progress__number">2</span>
            <span className="booking-progress__label">Kontakt</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="booking-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Step 1: Date & Time Selection */}
        {step === 'datetime' && (
          <div className="booking-step">
            <div className="booking-user-card">
              <div className="booking-user-card__avatar">
                {bookingUser?.name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="booking-user-card__info">
                <span className="booking-user-card__name">{bookingUser?.name}</span>
                <span className="booking-user-card__service">
                  <Clock size={14} />
                  {service?.nameKey} • {service?.durationMin} Min.
                </span>
              </div>
            </div>

            <div className="booking-datetime">
              {/* Calendar */}
              <div className="booking-calendar">
                <div className="booking-calendar__header">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft size={20} />
                  </button>
                  <span>{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="booking-calendar__weekdays">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="booking-calendar__days">
                  {slotsLoading ? (
                    <div className="booking-calendar__loading">
                      <Loader2 className="booking-spinner" />
                    </div>
                  ) : (
                    calendarDays.map((day, i) => {
                      if (!day) {
                        return <div key={`empty-${i}`} className="booking-calendar__day booking-calendar__day--empty" />;
                      }

                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isAvailable = availableDates.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isPast = isBefore(day, new Date()) && !isToday(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);

                      return (
                        <button
                          key={dateStr}
                          className={`booking-calendar__day ${isAvailable ? 'available' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                          onClick={() => isAvailable && handleDateSelect(day)}
                          disabled={!isAvailable || isPast}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })
                  )}
                </div>

                {slots.length === 0 && !slotsLoading && (
                  <div className="booking-calendar__empty">
                    Keine verfügbaren Termine in diesem Monat
                  </div>
                )}
              </div>

              {/* Time slots */}
              <div className="booking-times">
                <h3>
                  {selectedDate
                    ? `Verfügbare Zeiten am ${format(parseISO(selectedDate), 'dd. MMMM', { locale: de })}`
                    : 'Wählen Sie ein Datum'
                  }
                </h3>

                {selectedDate && timesForSelectedDate.length > 0 ? (
                  <div className="booking-times__grid">
                    {timesForSelectedDate.map(time => (
                      <button
                        key={time}
                        className={`booking-time ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time} Uhr
                      </button>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <p className="booking-times__empty">Keine freien Zeiten an diesem Tag</p>
                ) : (
                  <p className="booking-times__hint">Bitte wählen Sie zuerst ein Datum im Kalender</p>
                )}

                {selectedDate && selectedTime && (
                  <button className="booking-btn booking-btn--primary" onClick={handleContinueToContact}>
                    Weiter zu Kontaktdaten
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Form */}
        {step === 'contact' && (
          <div className="booking-step">
            <button className="booking-back" onClick={() => setStep('datetime')}>
              <ChevronLeft size={18} />
              Zurück zur Terminauswahl
            </button>

            <div className="booking-summary">
              <h3>Ihre Terminauswahl</h3>
              <div className="booking-summary__item">
                <span className="booking-summary__label">Berater:</span>
                <span>{bookingUser?.name}</span>
              </div>
              <div className="booking-summary__item">
                <span className="booking-summary__label">Termin:</span>
                <span>{service?.nameKey}</span>
              </div>
              <div className="booking-summary__item">
                <span className="booking-summary__label">Datum:</span>
                <span>{selectedDate && format(parseISO(selectedDate), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
              </div>
              <div className="booking-summary__item">
                <span className="booking-summary__label">Uhrzeit:</span>
                <span>{selectedTime} Uhr</span>
              </div>
              <div className="booking-summary__item">
                <span className="booking-summary__label">Dauer:</span>
                <span>{service?.durationMin} Minuten</span>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <h3>Ihre Kontaktdaten</h3>

              <div className="booking-form__row">
                <label>
                  <User size={16} />
                  Name *
                </label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContact(c => ({ ...c, name: e.target.value }))}
                  placeholder="Ihr vollständiger Name"
                  required
                />
              </div>

              <div className="booking-form__row">
                <label>
                  <Mail size={16} />
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact(c => ({ ...c, email: e.target.value }))}
                  placeholder="ihre@email.de"
                  required
                />
              </div>

              <div className="booking-form__row">
                <label>
                  <Phone size={16} />
                  Telefon
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact(c => ({ ...c, phone: e.target.value }))}
                  placeholder="+49 123 456789"
                />
              </div>

              <div className="booking-form__row">
                <label>Nachricht (optional)</label>
                <textarea
                  value={contact.message}
                  onChange={(e) => setContact(c => ({ ...c, message: e.target.value }))}
                  placeholder="Worum geht es bei Ihrem Anliegen?"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="booking-btn booking-btn--primary booking-btn--large"
                disabled={submitting || !contact.name || !contact.email}
              >
                {submitting ? (
                  <>
                    <Loader2 className="booking-spinner" />
                    Wird gebucht...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Termin verbindlich buchen
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'done' && bookingResult && (
          <div className="booking-step booking-step--done">
            <div className="booking-success">
              <CheckCircle2 size={64} className="booking-success__icon" />
              <h2>Termin erfolgreich gebucht!</h2>
              <p>Vielen Dank für Ihre Buchung bei <strong>{bookingUser?.name}</strong>.</p>
              <p>Sie erhalten in Kürze eine Bestätigungs-E-Mail.</p>

              <div className="booking-success__details">
                <div className="booking-success__item">
                  <span>Termin:</span>
                  <strong>{bookingResult.appointment?.service?.name}</strong>
                </div>
                <div className="booking-success__item">
                  <span>Datum & Zeit:</span>
                  <strong>
                    {bookingResult.appointment?.scheduledAt &&
                      format(parseISO(bookingResult.appointment.scheduledAt), "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })
                    }
                  </strong>
                </div>
                <div className="booking-success__item">
                  <span>Berater:</span>
                  <strong>{bookingUser?.name}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
