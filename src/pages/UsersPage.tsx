// src/pages/UsersPage.tsx
import { useEffect, useState } from "react";
import type { User } from "../api/types";
import { fetchUsers, toggleUser, createUser } from "../api/admin";

type UserFormState = {
  email: string;
  name: string;
  role: string;
  kunde_ref: string;
  password: string;

  // Rechnungsadresse
  billing_company: string;
  billing_street: string;
  billing_postcode: string;
  billing_city: string;
  billing_country: string;
  billing_vat_id: string;
  billing_email: string;
};

const emptyForm: UserFormState = {
  email: "",
  name: "",
  role: "",
  kunde_ref: "",
  password: "",

  billing_company: "",
  billing_street: "",
  billing_postcode: "",
  billing_city: "",
  billing_country: "Deutschland",
  billing_vat_id: "",
  billing_email: "",
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error("Fehler beim Laden der Benutzer", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔧 NEU: bekommt den ganzen User, berechnet !active und aktualisiert die Liste
  const handleToggle = async (user: User) => {
    try {
      const updated = await toggleUser(String(user.id), !user.active);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (e: any) {
      alert(e?.message || "Fehler beim Ändern des Status");
    }
  };

  const handleCreate = async () => {
    if (!form.email || !form.name || !form.role) {
      alert("Bitte E-Mail, Name und Rolle ausfüllen.");
      return;
    }

    try {
      await createUser(form); // ⬅️ schickt jetzt auch Billing-Felder mit
      setForm(emptyForm);
      setShowNew(false);
      await load();
      alert("Benutzer angelegt.");
    } catch (e: any) {
      alert(e.message || "Fehler beim Anlegen des Benutzers");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="admin-page-header mb-6">
        <div>
          <h1 className="admin-page-title">Benutzerverwaltung</h1>
          <p className="admin-page-subtitle">
            Zugänge zum Baunity Verwaltungsportal anlegen, Rollen vergeben und
            Mandanten/Kunden mit vollständiger Rechnungsadresse zuordnen.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="admin-btn admin-btn-primary"
        >
          + Neuen Benutzer anlegen
        </button>
      </header>

      {/* Liste */}
      <section className="admin-card">
        <div className="admin-activity-header">
          <div>
            <h2 className="admin-card-title">Benutzer &amp; Rollen</h2>
            <p className="admin-card-subtitle">
              Zuordnung zu Mandanten/Kunden für Abrechnung, Rechtevergabe und
              Sperrung einzelner Zugänge.
            </p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">E-Mail</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Rolle</th>
                <th className="px-3 py-2">Mandant / Kunde</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Lade Benutzer ...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Noch keine Benutzer angelegt.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-800/80">
                    <td className="px-3 py-1.5">{u.id}</td>
                    <td className="px-3 py-1.5">{u.email}</td>
                    <td className="px-3 py-1.5">{u.name || "-"}</td>
                    <td className="px-3 py-1.5">{u.role || "-"}</td>
                    <td className="px-3 py-1.5">
                      {u.kunde_name || u.kunde_id || "-"}
                    </td>
                    <td className="px-3 py-1.5">
                      {u.active ? "Aktiv" : "Gesperrt"}
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => handleToggle(u)} // 🔧 HIER angepasst
                        className="text-xs px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800"
                      >
                        {u.active ? "Sperren" : "Entsperren"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Neuen Benutzer anlegen */}
      {showNew && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Neuen Benutzer anlegen
                </h2>
                <p className="text-xs text-slate-400">
                  Zugangsdaten, Rolle und Mandant/Kunde festlegen – inkl.
                  vollständiger Rechnungsadresse.
                </p>
              </div>
              <button
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-xs"
                onClick={() => setShowNew(false)}
              >
                ✕
              </button>
            </div>

            {/* Zugang & Stammdaten */}
            <div className="mb-4">
              <div className="text-[11px] text-slate-400 uppercase tracking-[0.12em] mb-2">
                Zugang &amp; Stammdaten
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    E-Mail *
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Name *
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Rolle & Mandant/Kunde */}
            <div className="mb-4">
              <div className="text-[11px] text-slate-400 uppercase tracking-[0.12em] mb-2">
                Rolle &amp; Mandant / Kunde
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Rolle *
                  </label>
                  <select
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                  >
                    <option value="">Bitte wählen</option>
                    <option value="admin">Admin</option>
                    <option value="servicepartner">Servicepartner</option>
                    <option value="mitarbeiter">Mitarbeiter</option>
                    <option value="kunde">Kunde</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Rolle steuert, welche Anlagen und Bereiche der Benutzer im
                    Portal sieht.
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Mandant / Rechnungskunde (ID oder Name, optional)
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.kunde_ref}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kunde_ref: e.target.value,
                      })
                    }
                    placeholder="z. B. 12 oder 'Muster GmbH'"
                  />
                  <p className="text-[11px] text-slate-500">
                    Wird genutzt, um Benutzer einem Kunden/Mandanten zuzuordnen
                    und Auswertungen &amp; Rechnungsstellung nach Kunde zu
                    ermöglichen.
                  </p>
                </div>
              </div>
            </div>

            {/* Rechnungsadresse */}
            <div className="mb-4">
              <div className="text-[11px] text-slate-400 uppercase tracking-[0.12em] mb-2">
                Rechnungsadresse des Kunden
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Firma / Name (Rechnungsempfänger)
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.billing_company}
                    onChange={(e) =>
                      setForm({ ...form, billing_company: e.target.value })
                    }
                    placeholder="z. B. Baunity GmbH"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Rechnungs-E-Mail (optional)
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.billing_email}
                    onChange={(e) =>
                      setForm({ ...form, billing_email: e.target.value })
                    }
                    placeholder="rechnung@kunde.de"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    Straße &amp; Hausnummer
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.billing_street}
                    onChange={(e) =>
                      setForm({ ...form, billing_street: e.target.value })
                    }
                    placeholder="Musterstraße 1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    PLZ &amp; Ort
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm w-24"
                      value={form.billing_postcode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          billing_postcode: e.target.value,
                        })
                      }
                      placeholder="12345"
                    />
                    <input
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm flex-1"
                      value={form.billing_city}
                      onChange={(e) =>
                        setForm({ ...form, billing_city: e.target.value })
                      }
                      placeholder="Musterstadt"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">Land</label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.billing_country}
                    onChange={(e) =>
                      setForm({ ...form, billing_country: e.target.value })
                    }
                    placeholder="Deutschland"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400">
                    USt-IdNr. (optional)
                  </label>
                  <input
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                    value={form.billing_vat_id}
                    onChange={(e) =>
                      setForm({ ...form, billing_vat_id: e.target.value })
                    }
                    placeholder="DE123456789"
                  />
                </div>
              </div>
            </div>

            {/* Passwort */}
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[11px] text-slate-400">
                Initiales Passwort (optional, ansonsten automatisch)
              </label>
              <input
                type="password"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
              <p className="text-[11px] text-slate-500">
                Wenn leer, wird ein sicheres Passwort automatisch generiert
                und dem Benutzer separat mitgeteilt.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                className="text-xs px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500"
              >
                Benutzer speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
