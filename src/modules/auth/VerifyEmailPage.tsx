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

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Token verifizieren beim Laden
  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setError("Kein Token angegeben. Bitte verwenden Sie den Link aus der E-Mail.");
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          // Nach 3 Sekunden zum Dashboard weiterleiten
          setTimeout(() => navigate("/dashboard"), 3000);
        } else {
          setError(data.error || data.message || "Verifizierung fehlgeschlagen.");
        }
      } catch {
        setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      } finally {
        setVerifying(false);
      }
    }

    verifyEmail();
  }, [token, navigate]);

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
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${0.1 * (1 - dist / 150)})`;
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

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-glow-green {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); }
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

        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
        }

        .ve-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #060b18 0%, #0a1128 50%, #0a0f1a 100%);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .ve-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .ve-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .ve-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          animation: float 8s ease-in-out infinite;
        }

        .ve-orb-1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #22c55e 0%, transparent 70%);
          top: -100px;
          left: -100px;
        }

        .ve-orb-2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #16a34a 0%, transparent 70%);
          bottom: -50px;
          right: -50px;
          animation-delay: -2s;
        }

        .ve-card {
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

        .ve-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .ve-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .ve-logo-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          animation: pulse-glow-green 3s ease-in-out infinite;
          box-shadow: 0 10px 40px rgba(34, 197, 94, 0.4);
        }

        .ve-logo-icon svg {
          width: 40px;
          height: 40px;
        }

        .ve-title {
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
        }

        .ve-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .ve-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
        }

        .ve-loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(34, 197, 94, 0.2);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ve-loading-text {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
        }

        .ve-success {
          text-align: center;
          padding: 20px 0;
        }

        .ve-success-icon {
          width: 100px;
          height: 100px;
          background: rgba(34, 197, 94, 0.1);
          border: 3px solid rgba(34, 197, 94, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .ve-success-icon svg {
          width: 50px;
          height: 50px;
          stroke: #22c55e;
          stroke-dasharray: 100;
          animation: checkmark 0.5s ease-out forwards;
        }

        .ve-success-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .ve-success-text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .ve-error {
          text-align: center;
          padding: 20px 0;
        }

        .ve-error-icon {
          width: 100px;
          height: 100px;
          background: rgba(239, 68, 68, 0.1);
          border: 3px solid rgba(239, 68, 68, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .ve-error-icon svg {
          width: 50px;
          height: 50px;
          stroke: #ef4444;
        }

        .ve-error-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
        }

        .ve-error-text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .ve-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
          text-decoration: none;
          margin-top: 24px;
        }

        .ve-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
        }

        .ve-link {
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

        .ve-link:hover {
          color: #22c55e;
        }

        @media (max-width: 480px) {
          .ve-card {
            margin: 16px;
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="ve-container">
        <canvas ref={canvasRef} className="ve-canvas" />

        <div className="ve-orbs">
          <div className="ve-orb ve-orb-1" />
          <div className="ve-orb ve-orb-2" />
        </div>

        <div ref={cardRef} className="ve-card">
          <div className="ve-logo-container">
            <div className="ve-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h1 className="ve-title">E-Mail Verifizierung</h1>
            <p className="ve-subtitle">Baunity</p>
          </div>

          {verifying ? (
            <div className="ve-loading">
              <div className="ve-loading-spinner" />
              <span className="ve-loading-text">E-Mail wird verifiziert...</span>
            </div>
          ) : success ? (
            <div className="ve-success">
              <div className="ve-success-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="ve-success-title">E-Mail verifiziert!</h2>
              <p className="ve-success-text">
                Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
                <br /><br />
                Sie werden automatisch zum Dashboard weitergeleitet...
              </p>
              <Link to="/dashboard" className="ve-button">
                Zum Dashboard
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="ve-error">
              <div className="ve-error-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="ve-error-title">Verifizierung fehlgeschlagen</h2>
              <p className="ve-error-text">{safeString(error)}</p>
              <Link to="/resend-verification" className="ve-button" style={{ background: "linear-gradient(135deg, #D4A843 0%, #EAD068 100%)" }}>
                Neuen Link anfordern
              </Link>
              <Link to="/login" className="ve-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Zurück zum Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
