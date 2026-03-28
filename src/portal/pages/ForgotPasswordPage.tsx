/**
 * Portal Forgot Password Page
 * ===========================
 * Passwort-vergessen-Seite für das Endkunden-Portal.
 */

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../../api/client";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export function PortalForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiPost("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      // Zeigen immer Erfolg an (um User-Enumeration zu verhindern)
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">E-Mail gesendet</h1>
          </div>

          {/* Success Message */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="text-center">
              <p className="text-zinc-300 mb-6">
                Falls ein Konto mit der E-Mail-Adresse{" "}
                <strong className="text-white">{email}</strong>{" "}
                existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Der Link ist für 1 Stunde gültig. Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>
              <Link
                to="/portal/login"
                className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-500/25"
              >
                <ArrowLeft size={18} />
                Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Passwort vergessen</h1>
          <p className="text-zinc-400 mt-2">
            Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
          </p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="ihre@email.de"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Wird gesendet...</span>
                </>
              ) : (
                <span>Link anfordern</span>
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/portal/login"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </div>
  );
}
