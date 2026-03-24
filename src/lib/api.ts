const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// Typen (Anlage/User/Rechnung) passend zu deinem Backend
export interface Anlage {
  id: number;
  bezeichnung?: string;
  betreiber_name?: string;
  netzbetreiber_name?: string;
  status?: string;
  status_code?: string;
  angelegt_am?: string;
}

export interface Rechnung {
  id: number;
  anlage_id: number;
  rechnungsnummer: string;
  beschreibung: string;
  betrag_gesamt: number | null;
  status: string | null;
  faellig_am: string | null;
  erstellt_am: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  kunde_name?: string | null;
  kunde_id?: number | null;
  active: boolean;
}

// ---- Anlagen (Portal) ----

export async function fetchAnlagen(): Promise<Anlage[]> {
  const res = await fetch(`${API_BASE}/portal/anlagen`);
  return handle<Anlage[]>(res);
}

export async function fetchAnlageDetail(id: number): Promise<Anlage & Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/portal/anlagen/${id}`);
  return handle<Anlage & Record<string, unknown>>(res);
}

// ---- Admin Status ----

export async function updateAnlageStatus(
  anlageId: number,
  status_code: string,
  kommentar?: string
) {
  const res = await fetch(`${API_BASE}/admin/anlagen/${anlageId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status_code,
      kommentar: kommentar ?? null,
      quelle: "ADMIN",
    }),
  });
  return handle<Record<string, unknown>>(res);
}

// ---- Admin Rechnungen ----

export async function fetchRechnungenForAnlage(
  anlageId: number
): Promise<Rechnung[]> {
  const res = await fetch(`${API_BASE}/admin/anlagen/${anlageId}/rechnungen`);
  return handle<Rechnung[]>(res);
}

export async function createRechnungForAnlage(params: {
  anlageId: number;
  betrag: number;
  beschreibung: string;
}) {
  const res = await fetch(
    `${API_BASE}/admin/anlagen/${params.anlageId}/rechnungen`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betrag: params.betrag,
        beschreibung: params.beschreibung,
      }),
    }
  );
  return handle<Rechnung>(res);
}

// ---- Admin Users ----

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`);
  return handle<User[]>(res);
}

export async function createUser(payload: {
  email: string;
  name: string;
  role: string;
  kunde_ref?: string;
  password?: string;
}) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<User>(res);
}

export async function toggleUser(id: number) {
  const res = await fetch(`${API_BASE}/admin/users/${id}/toggle`, {
    method: "POST",
  });
  return handle<{ id: number; active: boolean }>(res);
}
