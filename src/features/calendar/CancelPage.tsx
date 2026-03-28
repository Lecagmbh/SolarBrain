/**
 * PUBLIC CANCEL PAGE - Terminabsage über Token-Link
 * ==================================================
 * Erreichbar unter /termin/absagen?token=xxx
 * Kein Login nötig — Token-basierte Authentifizierung.
 */

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertTriangle, Calendar, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

type CancelState = "loading" | "confirm" | "success" | "already" | "error";

interface CancelResult {
  success: boolean;
  alreadyCancelled?: boolean;
  message: string;
  bookingUrl?: string;
  cancelledAppointment?: {
    title: string;
    scheduledAt: string;
    contactName: string;
  };
}

export function CancelPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<CancelState>(token ? "confirm" : "error");
  const [result, setResult] = useState<CancelResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Kein gültiger Absage-Link. Bitte verwenden Sie den Link aus Ihrer E-Mail.");
    }
  }, [token]);

  const handleCancel = async () => {
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/calendar/public/cancel/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: CancelResult = await res.json();

      if (!res.ok) {
        throw new Error((data as any).error || "Absage fehlgeschlagen");
      }

      setResult(data);
      setState(data.alreadyCancelled ? "already" : "success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      setState("error");
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0f1020] to-[#060b18] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black text-white tracking-tight">
            Grid<span className="text-amber-400">Netz</span>
          </div>
          <div className="text-zinc-500 text-sm mt-1">Terminverwaltung</div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Confirm State */}
          {state === "confirm" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-3">Termin absagen?</h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Möchten Sie Ihren Termin wirklich absagen? Sie können anschließend direkt einen neuen Termin buchen.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleCancel}
                  className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Ja, Termin absagen
                </button>
                <Link
                  to="/"
                  className="block w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors text-center"
                >
                  Abbrechen
                </Link>
              </div>
            </div>
          )}

          {/* Loading State */}
          {state === "loading" && (
            <div className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Termin wird abgesagt...</p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-3">Termin abgesagt</h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                {result?.message || "Ihr Termin wurde erfolgreich abgesagt."}
              </p>

              {result?.cancelledAppointment && (
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 mb-6 text-left">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Abgesagter Termin</div>
                  <div className="text-white font-medium text-sm">{result.cancelledAppointment.title}</div>
                  <div className="text-zinc-400 text-xs mt-1">
                    {formatDate(result.cancelledAppointment.scheduledAt)}
                  </div>
                </div>
              )}

              <Link
                to="/termin"
                className="inline-flex items-center gap-2 py-3 px-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Neuen Termin buchen
              </Link>
            </div>
          )}

          {/* Already Cancelled */}
          {state === "already" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-3">Bereits abgesagt</h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Dieser Termin wurde bereits abgesagt.
              </p>
              <Link
                to="/termin"
                className="inline-flex items-center gap-2 py-3 px-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Neuen Termin buchen
              </Link>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-3">Fehler</h1>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {errorMsg || "Der Absage-Link ist ungültig oder abgelaufen."}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 py-3 px-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
              >
                Zur Startseite
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-zinc-600">
          Bei Fragen: <a href="mailto:info@lecagmbh.de" className="text-amber-400 hover:text-amber-300">info@lecagmbh.de</a>
        </div>
      </div>
    </div>
  );
}
