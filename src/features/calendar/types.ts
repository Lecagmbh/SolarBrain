/**
 * Calendar System Types
 */

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface CalendarService {
  id: number;
  nameKey: string;
  description?: string;
  durationMin: number;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CalendarAvailability {
  id: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  isActive: boolean;
  userId?: number | null;
  user?: { id: number; name?: string; email: string };
}

export interface CalendarBlockedDate {
  id: number;
  date: string;
  reason?: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  userId?: number | null;
  user?: { id: number; name?: string; email: string };
}

export interface CalendarAppointment {
  id: number;
  serviceId: number;
  service?: CalendarService;
  installationId?: number;
  installation?: {
    id: number;
    publicId: string;
    customerName?: string;
    strasse?: string;
    hausNr?: string;
    plz?: string;
    ort?: string;
  };
  kundeId?: number;
  kunde?: {
    id: number;
    name: string;
    email?: string;
    telefon?: string;
  };
  title: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  scheduledAt: string;
  durationMin: number;
  timezone: string;
  status: AppointmentStatus;
  confirmToken?: string;
  confirmedAt?: string;
  cancelToken?: string;
  cancelledAt?: string;
  cancelReason?: string;
  assignedUserId?: number;
  assignedUser?: {
    id: number;
    name?: string;
    email: string;
  };
  adminNotes?: string;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdBy?: {
    id: number;
    name?: string;
  };
}

export interface TimeSlot {
  date: string;
  times: string[];
}

export interface CalendarSettings {
  slot_duration?: string;
  buffer_time?: string;
  min_advance_hours?: string;
  max_advance_days?: string;
  [key: string]: string | undefined;
}

// Status config for UI
export const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string;
  color: string;
  bg: string;
}> = {
  PENDING: { label: 'Ausstehend', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  CONFIRMED: { label: 'Bestätigt', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  CANCELLED: { label: 'Storniert', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  COMPLETED: { label: 'Erledigt', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  NO_SHOW: { label: 'Nicht erschienen', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

// Day names
export const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const DAY_NAMES_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
