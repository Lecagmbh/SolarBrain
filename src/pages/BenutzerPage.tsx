// src/pages/BenutzerPage.tsx
import React, { useEffect, useState } from "react";
import "../styles/admin.css";
import { getAccessToken } from "../modules/auth/tokenStorage";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

type UserItem = {
  id: number;
  email: string;
  role: "admin" | "mitarbeiter" | "servicepartner" | "partner" | "kunde";
};

type CreateUserPayload = {
  email: string;
  password: string;
  role: UserItem["role"];
};

const BenutzerPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateUserPayload>({
    email: "",
    password: "",
    role: "mitarbeiter",
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();
      const res = await fetch("/api/users", {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as UserItem[];
      setUsers(data);
    } catch (e) {
      console.error("Load users error", e);
      setError("Benutzerliste konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange =
    (key: keyof CreateUserPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value as any }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      alert("E-Mail und Passwort sind Pflichtfelder.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = getAccessToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setForm({
        email: "",
        password: "",
        role: "mitarbeiter",
      });
      await loadUsers();
    } catch (e) {
      console.error("Create user error", e);
      setError("Benutzer konnte nicht angelegt werden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Benutzerverwaltung</h1>
          <p className="admin-page-subtitle">
            Benutzer für das Baunity Verwaltungsportal anlegen und verwalten.
          </p>
        </div>
      </header>

      <section className="admin-card admin-card-wizard-full">
        <h2 className="admin-card-title">Neuen Benutzer anlegen</h2>
        <p className="admin-card-subtitle">
          Zugangsdaten werden direkt im Portal gespeichert. Rollen steuern, welche Anlagen ein Benutzer sieht.
        </p>

        <form className="admin-form-grid admin-form-grid-3" onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label>E-Mail *</label>
            <input
              className="admin-input"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="name@baunity.de"
            />
          </div>

          <div className="admin-form-field">
            <label>Passwort *</label>
            <input
              className="admin-input"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="mind. 8 Zeichen"
            />
          </div>

          <div className="admin-form-field">
            <label>Rolle *</label>
            <select
              className="admin-input"
              value={form.role}
              onChange={handleChange("role")}
            >
              <option value="admin">Admin</option>
              <option value="mitarbeiter">Mitarbeiter</option>
              <option value="servicepartner">Servicepartner</option>
              <option value="partner">Partner</option>
              <option value="kunde">Kunde</option>
            </select>
          </div>

          <div className="admin-form-field admin-form-field-span-3" style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving ? "Speichern…" : "Benutzer anlegen"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card admin-card-activity">
        <h2 className="admin-card-title">Bestehende Benutzer</h2>
        {loading && <p>Benutzer werden geladen …</p>}
        {error && <p style={{ color: "#f87171" }}>{safeString(error)}</p>}

        {!loading && !error && users.length === 0 && (
          <div className="admin-empty-state">
            <div className="admin-empty-pill">Keine Benutzer gefunden</div>
            Lege den ersten Benutzer oben über das Formular an.
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>E-Mail</th>
                  <th>Rolle</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default BenutzerPage;
