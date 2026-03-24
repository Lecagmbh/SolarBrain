/**
 * Calendar API Functions
 */

import { getAccessToken } from '../../modules/auth/tokenStorage';
import type {
  CalendarAppointment,
  CalendarService,
  CalendarAvailability,
  CalendarBlockedDate,
  CalendarSettings,
  TimeSlot,
  AppointmentStatus,
} from './types';

const API_BASE = '/api/calendar';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | 'all';
  from?: string;
  to?: string;
  serviceId?: number;
  installationId?: number;
  limit?: number;
  offset?: number;
}

export async function getAppointments(filters: AppointmentFilters = {}): Promise<{
  appointments: CalendarAppointment[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.serviceId) params.append('serviceId', String(filters.serviceId));
  if (filters.installationId) params.append('installationId', String(filters.installationId));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));

  return fetchWithAuth(`${API_BASE}/appointments?${params}`);
}

export async function getAppointment(id: number): Promise<CalendarAppointment> {
  return fetchWithAuth(`${API_BASE}/appointments/${id}`);
}

export async function createAppointment(data: Partial<CalendarAppointment>): Promise<CalendarAppointment> {
  return fetchWithAuth(`${API_BASE}/appointments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(id: number, data: Partial<CalendarAppointment>): Promise<CalendarAppointment> {
  return fetchWithAuth(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAppointment(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/appointments/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════

export async function getServices(): Promise<CalendarService[]> {
  return fetchWithAuth(`${API_BASE}/services`);
}

export async function createService(data: Partial<CalendarService>): Promise<CalendarService> {
  return fetchWithAuth(`${API_BASE}/services`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(id: number, data: Partial<CalendarService>): Promise<CalendarService> {
  return fetchWithAuth(`${API_BASE}/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteService(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/services/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY
// ═══════════════════════════════════════════════════════════════════════════

export async function getAvailability(): Promise<CalendarAvailability[]> {
  return fetchWithAuth(`${API_BASE}/availability`);
}

export async function createAvailability(data: Partial<CalendarAvailability>): Promise<CalendarAvailability> {
  return fetchWithAuth(`${API_BASE}/availability`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAvailability(id: number, data: Partial<CalendarAvailability>): Promise<CalendarAvailability> {
  return fetchWithAuth(`${API_BASE}/availability/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAvailability(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/availability/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKED DATES
// ═══════════════════════════════════════════════════════════════════════════

export async function getBlockedDates(from?: string, to?: string): Promise<CalendarBlockedDate[]> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return fetchWithAuth(`${API_BASE}/blocked-dates?${params}`);
}

export async function createBlockedDate(data: Partial<CalendarBlockedDate>): Promise<CalendarBlockedDate> {
  return fetchWithAuth(`${API_BASE}/blocked-dates`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBlockedDate(id: number): Promise<void> {
  return fetchWithAuth(`${API_BASE}/blocked-dates/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLOTS
// ═══════════════════════════════════════════════════════════════════════════

export async function getSlots(month: string, serviceId?: number): Promise<{
  month: string;
  serviceId: number | null;
  serviceDuration: number;
  slots: TimeSlot[];
}> {
  const params = new URLSearchParams({ month });
  if (serviceId) params.append('serviceId', String(serviceId));
  return fetchWithAuth(`${API_BASE}/slots?${params}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export async function getSettings(): Promise<CalendarSettings> {
  return fetchWithAuth(`${API_BASE}/settings`);
}

export async function updateSettings(settings: CalendarSettings): Promise<void> {
  return fetchWithAuth(`${API_BASE}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
