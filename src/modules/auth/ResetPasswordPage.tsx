import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenError, setTokenError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Token verifizieren beim Laden
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setTokenError("Kein Token angegeben. Bitte fordern Sie einen neuen Link an.");
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/verify-reset-token/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.message || "Ungültiger oder abgelaufener Link.");
        }
      } catch {
        setTokenError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  // Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 67, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(212, 168, 67, ${0.1 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 3D Card Tilt
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Nach 3 Sekunden zum Login weiterleiten
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Ein Fehler ist aufgetreten.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  // Password Strength
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#22c55e", "#22c55e"];
  const strengthLabels = ["Sehr schwach", "Schwach", "Mittel", "Gut", "Stark", "Sehr stark"];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 168, 67, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 168, 67, 0.6); }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }

        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        .rp-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #060b18 0%, #0a1128 50%, #0a0f1a 100%);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .rp-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .rp-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .rp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          animation: float 8s ease-in-out infinite;
        }

        .rp-orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #D4A843 0%, transparent 70%);
          top: -100px;
          left: -100px;
        }

        .rp-orb-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #EAD068 0%, transparent 70%);
          bottom: -50px;
          right: -50px;
          animation-delay: -2s;
        }

        .rp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 48px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          transition: transform 0.1s ease-out, box-shadow 0.3s ease;
          animation: fade-in-up 0.8s ease-out;
          box-shadow:
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .rp-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .rp-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .rp-logo-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          animation: pulse-glow 3s ease-in-out infinite;
          box-shadow: 0 10px 40px rgba(212, 168, 67, 0.4);
        }

        .rp-logo-icon svg {
          width: 40px;
          height: 40px;
        }

        .rp-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
        }

        .rp-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .rp-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          color: #fca5a5;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.5s ease-in-out;
        }

        .rp-token-error {
          text-align: center;
          padding: 20px 0;
        }

        .rp-token-error-icon {
          width: 80px;
          height: 80px;
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .rp-token-error-icon svg {
          width: 40px;
          height: 40px;
          stroke: #ef4444;
        }

        .rp-token-error-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .rp-token-error-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .rp-success {
          text-align: center;
          padding: 20px 0;
        }

        .rp-success-icon {
          width: 80px;
          height: 80px;
          background: rgba(34, 197, 94, 0.1);
          border: 2px solid rgba(34, 197, 94, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .rp-success-icon svg {
          width: 40px;
          height: 40px;
          stroke: #22c55e;
          stroke-dasharray: 100;
          animation: checkmark 0.5s ease-out forwards;
        }

        .rp-success-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .rp-success-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .rp-form-group {
          margin-bottom: 20px;
        }

        .rp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .rp-input-wrapper {
          position: relative;
        }

        .rp-input {
          width: 100%;
          padding: 16px 20px;
          padding-left: 48px;
          padding-right: 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          transition: all 0.3s ease;
          outline: none;
        }

        .rp-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .rp-input:focus {
          border-color: rgba(212, 168, 67, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 4px rgba(212, 168, 67, 0.1);
        }

        .rp-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }

        .rp-password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .rp-password-toggle:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .rp-strength {
          margin-top: 12px;
        }

        .rp-strength-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .rp-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .rp-strength-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .rp-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #D4A843 0%, #EAD068 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(212, 168, 67, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }

        .rp-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(212, 168, 67, 0.5);
        }

        .rp-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .rp-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .rp-back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.2s;
        }

        .rp-back-link:hover {
          color: #D4A843;
        }

        .rp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
        }

        .rp-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(212, 168, 67, 0.2);
          border-top-color: #D4A843;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .rp-loading-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (max-width: 480px) {
          .rp-card {
            margin: 16px;
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="rp-container">
        <canvas ref={canvasRef} className="rp-canvas" />

        <div className="rp-orbs">
          <div className="rp-orb rp-orb-1" />
          <div className="rp-orb rp-orb-2" />
        </div>

        <div ref={cardRef} className="rp-card">
          <div className="rp-logo-container">
            <div className="rp-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h1 className="rp-title">Neues Passwort</h1>
            <p className="rp-subtitle">Wählen Sie ein sicheres neues Passwort</p>
          </div>

          {verifying ? (
            <div className="rp-loading">
              <div className="rp-loading-spinner" />
              <span className="rp-loading-text">Link wird überprüft...</span>
            </div>
          ) : tokenError ? (
            <div className="rp-token-error">
              <div className="rp-token-error-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="rp-token-error-title">Link ungültig</h2>
              <p className="rp-token-error-text">{safeString(tokenError)}</p>
              <Link to="/forgot-password" className="rp-back-link" style={{ marginTop: 32, color: "#D4A843" }}>
                Neuen Link anfordern
              </Link>
            </div>
          ) : success ? (
            <div className="rp-success">
              <div className="rp-success-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="rp-success-title">Passwort geändert!</h2>
              <p className="rp-success-text">
                Ihr Passwort wurde erfolgreich geändert.
                <br /><br />
                Sie werden automatisch zum Login weitergeleitet...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rp-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {safeString(error)}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="rp-form-group">
                  <label className="rp-label">Neues Passwort</label>
                  <div className="rp-input-wrapper">
                    <svg className="rp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="rp-input"
                      placeholder="Mindestens 8 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="rp-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {password && (
                    <div className="rp-strength">
                      <div className="rp-strength-bar">
                        <div
                          className="rp-strength-fill"
                          style={{
                            width: `${(passwordStrength / 6) * 100}%`,
                            background: strengthColors[passwordStrength - 1] || "#ef4444",
                          }}
                        />
                      </div>
                      <span className="rp-strength-label" style={{ color: strengthColors[passwordStrength - 1] }}>
                        {strengthLabels[passwordStrength - 1] || "Sehr schwach"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rp-form-group">
                  <label className="rp-label">Passwort bestätigen</label>
                  <div className="rp-input-wrapper">
                    <svg className="rp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="rp-input"
                      placeholder="Passwort wiederholen"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword && password === confirmPassword && (
                      <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#22c55e" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                <button type="submit" className="rp-button" disabled={loading || password.length < 8 || password !== confirmPassword}>
                  {loading ? (
                    <>
                      <div className="rp-spinner" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      Passwort ändern
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {!verifying && !success && (
            <Link to="/login" className="rp-back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Zurück zum Login
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
