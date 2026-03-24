import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function UnternehmenPage() {
  const yearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (yearRef.current) {
      yearRef.current.textContent = new Date().getFullYear().toString();
    }
  }, []);

  return (
    <>
      <style>{`
        :root {
          --up-primary: #22C55E;
          --up-primary-light: #4ADE80;
          --up-secondary: #38BDF8;
          --up-bg: #030014;
          --up-surface: #0A0A1A;
          --up-text: #F1F5F9;
          --up-text-soft: #94A3B8;
          --up-border: rgba(34, 197, 94, 0.2);
          --up-font-display: 'Space Grotesk', sans-serif;
          --up-font-body: 'Inter', sans-serif;
        }
        .up-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .up-page {
          font-family: var(--up-font-body);
          background: var(--up-bg);
          color: var(--up-text);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        .up-page a { color: var(--up-secondary); text-decoration: none; transition: color 0.2s; }
        .up-page a:hover { color: var(--up-primary); }

        .up-bg-gradient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 197, 94, 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(56, 189, 248, 0.08), transparent);
        }

        /* Nav */
        .up-nav { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; width: calc(100% - 40px); max-width: 1000px; }
        .up-nav-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          padding: 0.75rem 1.5rem; background: rgba(10, 10, 26, 0.92); backdrop-filter: blur(20px);
          border: 1px solid var(--up-border); border-radius: 100px;
        }
        .up-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        .up-nav-logo-mark {
          width: 36px; height: 36px; background: linear-gradient(135deg, var(--up-primary), var(--up-secondary));
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: var(--up-font-display); font-weight: 700; font-size: 0.85rem; color: #fff;
        }
        .up-nav-logo-name { font-family: var(--up-font-display); font-weight: 600; font-size: 1rem; }
        .up-nav-links { display: flex; align-items: center; gap: 2rem; }
        .up-nav-link { font-size: 0.85rem; color: var(--up-text-soft); transition: color 0.2s; }
        .up-nav-link:hover { color: var(--up-text); }
        .up-nav-btn {
          padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.85rem; font-weight: 600;
          transition: all 0.3s; display: flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, var(--up-primary), #16A34A); color: #fff;
        }
        .up-nav-btn:hover { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4); transform: translateY(-1px); color: #fff; }

        /* Layout */
        .up-section { position: relative; z-index: 1; }
        .up-container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
        .up-section-padding { padding: 80px 0; }

        /* Hero */
        .up-hero { padding: 160px 1.5rem 80px; text-align: center; }
        .up-hero-tag {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px; font-size: 0.85rem; color: var(--up-primary); margin-bottom: 1.5rem;
        }
        .up-hero h1 {
          font-family: var(--up-font-display); font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 700; line-height: 1.15; margin-bottom: 1.25rem;
        }
        .up-hero h1 .up-hl {
          background: linear-gradient(135deg, var(--up-primary), var(--up-secondary));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .up-hero-sub { font-size: 1.15rem; color: var(--up-text-soft); max-width: 700px; margin: 0 auto 2.5rem; }

        /* Stats */
        .up-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .up-stat { text-align: center; }
        .up-stat-num { font-family: var(--up-font-display); font-size: 2.25rem; font-weight: 700; color: var(--up-primary); }
        .up-stat-label { font-size: 0.8rem; color: var(--up-text-soft); }

        /* Section Header */
        .up-sh { text-align: center; margin-bottom: 3rem; }
        .up-sh-tag {
          display: inline-flex; padding: 0.4rem 1rem;
          background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px; font-size: 0.8rem; color: var(--up-primary); margin-bottom: 1rem;
        }
        .up-sh h2 { font-family: var(--up-font-display); font-size: clamp(1.5rem, 3.5vw, 2.25rem); font-weight: 700; margin-bottom: 0.5rem; }
        .up-sh p { color: var(--up-text-soft); font-size: 0.95rem; max-width: 600px; margin: 0 auto; }

        /* Cards Grid */
        .up-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .up-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        .up-card {
          background: rgba(10, 10, 26, 0.6); backdrop-filter: blur(10px);
          border: 1px solid var(--up-border); border-radius: 1.25rem; padding: 2rem;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .up-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--up-primary), var(--up-secondary)); opacity: 0; transition: opacity 0.3s;
        }
        .up-card:hover { transform: translateY(-3px); border-color: rgba(34, 197, 94, 0.3); }
        .up-card:hover::before { opacity: 1; }
        .up-card-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(56, 189, 248, 0.2));
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem; color: var(--up-primary);
        }
        .up-card h3 { font-family: var(--up-font-display); font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; }
        .up-card p { color: var(--up-text-soft); font-size: 0.85rem; }

        /* Process Steps */
        .up-process { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .up-step { text-align: center; padding: 1.5rem 1rem; position: relative; }
        .up-step::after {
          content: ''; position: absolute; top: 36px; right: -8px; width: 16px; height: 2px;
          background: linear-gradient(90deg, var(--up-primary), transparent);
        }
        .up-step:last-child::after { display: none; }
        .up-step-num {
          width: 48px; height: 48px; background: var(--up-surface);
          border: 2px solid var(--up-primary); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--up-font-display); font-weight: 700; font-size: 1.1rem;
          color: var(--up-primary); margin: 0 auto 0.75rem;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
        }
        .up-step h4 { font-family: var(--up-font-display); font-size: 0.9rem; margin-bottom: 0.35rem; }
        .up-step p { color: var(--up-text-soft); font-size: 0.8rem; }

        /* Target Groups */
        .up-tg-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; max-width: 800px; margin: 0 auto; }
        .up-tg-item {
          display: flex; align-items: center; gap: 0.75rem;
          background: rgba(10, 10, 26, 0.5); border: 1px solid var(--up-border);
          border-radius: 1rem; padding: 1.25rem 1.5rem;
        }
        .up-tg-icon { color: var(--up-primary); flex-shrink: 0; }
        .up-tg-item strong { display: block; font-size: 0.95rem; margin-bottom: 0.15rem; }
        .up-tg-item span { font-size: 0.8rem; color: var(--up-text-soft); }

        /* CTA */
        .up-cta-box {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(56, 189, 248, 0.1));
          border: 1px solid var(--up-border); border-radius: 1.5rem; padding: 3rem 2rem; text-align: center;
        }
        .up-cta-box h2 { font-family: var(--up-font-display); font-size: clamp(1.4rem, 3vw, 1.85rem); margin-bottom: 0.75rem; }
        .up-cta-box p { color: var(--up-text-soft); margin-bottom: 1.75rem; max-width: 500px; margin-left: auto; margin-right: auto; }
        .up-cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .up-btn {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.5rem;
          border-radius: 100px; font-size: 0.9rem; font-weight: 500; transition: all 0.3s; border: none; cursor: pointer;
        }
        .up-btn--primary { background: linear-gradient(135deg, var(--up-primary), #16A34A); color: #fff; font-weight: 600; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3); }
        .up-btn--primary:hover { box-shadow: 0 6px 30px rgba(34, 197, 94, 0.5); transform: translateY(-2px); color: #fff; }
        .up-btn--secondary { background: rgba(255,255,255,0.05); border: 1px solid var(--up-border); color: var(--up-text); }
        .up-btn--secondary:hover { background: rgba(255,255,255,0.1); }

        /* Footer */
        .up-footer { border-top: 1px solid var(--up-border); padding: 2rem 1.5rem; margin-top: 2rem; position: relative; z-index: 1; }
        .up-footer-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; }
        .up-footer-brand { display: flex; align-items: center; gap: 0.75rem; }
        .up-footer-mark {
          width: 28px; height: 28px; background: linear-gradient(135deg, var(--up-primary), var(--up-secondary));
          border-radius: 7px; display: flex; align-items: center; justify-content: center;
          font-family: var(--up-font-display); font-weight: 700; font-size: 0.65rem; color: #fff;
        }
        .up-footer-brand span { color: var(--up-text-soft); font-size: 0.8rem; }
        .up-footer-links { display: flex; gap: 1.25rem; font-size: 0.8rem; }
        .up-footer-links a { color: var(--up-text-soft); }

        /* Responsive */
        @media (max-width: 968px) {
          .up-nav-links { display: none; }
          .up-grid-3 { grid-template-columns: 1fr; }
          .up-process { grid-template-columns: repeat(2, 1fr); }
          .up-step::after { display: none; }
        }
        @media (max-width: 768px) {
          .up-nav { width: calc(100% - 20px); top: 10px; }
          .up-grid-2, .up-tg-list { grid-template-columns: 1fr; }
          .up-process { grid-template-columns: 1fr; }
          .up-stats { gap: 1.5rem; }
          .up-footer-inner { flex-direction: column; text-align: center; }
          .up-footer-links { justify-content: center; flex-wrap: wrap; }
          .up-cta-btns { flex-direction: column; align-items: center; }
          .up-btn { width: 100%; max-width: 280px; justify-content: center; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="up-page">
        <div className="up-bg-gradient"></div>

        {/* Nav */}
        <header className="up-nav">
          <div className="up-nav-inner">
            <Link to="/" className="up-nav-logo">
              <div className="up-nav-logo-mark">GN</div>
              <span className="up-nav-logo-name">Baunity</span>
            </Link>
            <nav className="up-nav-links">
              <a href="#was-wir-machen" className="up-nav-link">Leistungen</a>
              <a href="#wie-es-funktioniert" className="up-nav-link">Ablauf</a>
              <a href="#zielgruppe" className="up-nav-link">Zielgruppe</a>
              <Link to="/partner" className="up-nav-link">Partner</Link>
            </nav>
            <Link to="/login" className="up-nav-btn">
              Portal Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="up-hero up-section">
          <div className="up-container">
            <div className="up-hero-tag">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Wer wir sind & was wir machen
            </div>
            <h1>
              Netzanmeldungen.<br/><span className="up-hl">Komplett digital. Komplett automatisiert.</span>
            </h1>
            <p className="up-hero-sub">
              Baunity ist die zentrale Plattform für die digitale Abwicklung von Netzanmeldungen
              in Deutschland. Wir übernehmen den kompletten Prozess — von der Dokumentenerstellung
              bis zur Genehmigung durch den Netzbetreiber.
            </p>
            <div className="up-stats">
              <div className="up-stat">
                <div className="up-stat-num">850+</div>
                <div className="up-stat-label">Netzbetreiber</div>
              </div>
              <div className="up-stat">
                <div className="up-stat-num">15.000+</div>
                <div className="up-stat-label">Produkte in der DB</div>
              </div>
              <div className="up-stat">
                <div className="up-stat-num">100%</div>
                <div className="up-stat-label">Digital & automatisiert</div>
              </div>
              <div className="up-stat">
                <div className="up-stat-num">B2B</div>
                <div className="up-stat-label">Nur Fachbetriebe</div>
              </div>
            </div>
          </div>
        </section>

        {/* Was wir machen */}
        <section className="up-section-padding up-section" id="was-wir-machen">
          <div className="up-container">
            <div className="up-sh">
              <div className="up-sh-tag">Unsere Leistungen</div>
              <h2>Was wir machen</h2>
              <p>Alles rund um die Netzanmeldung von PV-Anlagen, Speichern und Wallboxen — aus einer Hand.</p>
            </div>

            <div className="up-grid-3">
              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3>Dokumentenerstellung</h3>
                <p>Automatische Generierung aller erforderlichen Unterlagen: Übersichtsschaltplan, Lageplan, VDE-Formulare (E.1–E.8), Vollmacht und Inbetriebnahmeprotokoll.</p>
              </div>

              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3>Netzbetreiber-Kommunikation</h3>
                <p>Wir reichen die Unterlagen beim zuständigen Netzbetreiber ein, beantworten Rückfragen und verfolgen den Status bis zur finalen Genehmigung.</p>
              </div>

              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                </div>
                <h3>Produktdatenbank</h3>
                <p>Über 15.000 Komponenten (PV-Module, Wechselrichter, Speicher, Wallboxen) mit ZEREZ-IDs, technischen Daten und Datenblättern.</p>
              </div>

              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <h3>Tracking & Portal</h3>
                <p>Echtzeit-Statusverfolgung aller Anlagen im Web-Portal mit Kanban-Board, Priorisierung, Benachrichtigungen und Export-Funktionen.</p>
              </div>

              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h3>KI-Email-System</h3>
                <p>Automatische Klassifikation eingehender Netzbetreiber-Emails, intelligente Rückfragen-Erkennung und Antwort-Drafts mit Dual-LLM-Architektur.</p>
              </div>

              <div className="up-card">
                <div className="up-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <h3>Partner & Teams</h3>
                <p>Rollen-basiertes System für Kunden, Handelsvertreter, Subunternehmer und Mitarbeiter mit White-Label-Option und Provisionsabrechnung.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Wie es funktioniert */}
        <section className="up-section-padding up-section" id="wie-es-funktioniert" style={{ background: 'linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.02), transparent)' }}>
          <div className="up-container">
            <div className="up-sh">
              <div className="up-sh-tag">Ablauf</div>
              <h2>Wie es funktioniert</h2>
              <p>Der vollautomatische Prozess — vom Dateneingang bis zur Genehmigung.</p>
            </div>

            {/* Erfassungswege */}
            <div className="up-grid-3" style={{ marginBottom: '3rem' }}>
              <div className="up-card" style={{ textAlign: 'center' }}>
                <div className="up-card-icon" style={{ margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                </div>
                <h3>Web-Portal</h3>
                <p>Schritt-für-Schritt Wizard mit automatischer Komponentenerkennung und Validierung.</p>
              </div>
              <div className="up-card" style={{ textAlign: 'center' }}>
                <div className="up-card-icon" style={{ margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <h3>WhatsApp</h3>
                <p>KI-gestützte Datenerfassung per Chat — unser Assistent erkennt Anlagendaten automatisch.</p>
              </div>
              <div className="up-card" style={{ textAlign: 'center' }}>
                <div className="up-card-icon" style={{ margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                </div>
                <h3>GridFlow App</h3>
                <p>Native Mobile App für iOS & Android — Anlagen direkt von der Baustelle erfassen.</p>
              </div>
            </div>

            {/* Prozessschritte */}
            <div className="up-process">
              <div className="up-step">
                <div className="up-step-num">1</div>
                <h4>Daten erfassen</h4>
                <p>Anlagendaten über einen der drei Kanäle eingeben</p>
              </div>
              <div className="up-step">
                <div className="up-step-num">2</div>
                <h4>Dokumente generieren</h4>
                <p>Automatische Erstellung aller NB-Unterlagen</p>
              </div>
              <div className="up-step">
                <div className="up-step-num">3</div>
                <h4>Einreichen & verfolgen</h4>
                <p>Einreichung beim NB inkl. Rückfragen-Management</p>
              </div>
              <div className="up-step">
                <div className="up-step-num">4</div>
                <h4>Genehmigung</h4>
                <p>Fertige Dokumente im Portal zum Download</p>
              </div>
            </div>
          </div>
        </section>

        {/* Zielgruppe */}
        <section className="up-section-padding up-section" id="zielgruppe">
          <div className="up-container">
            <div className="up-sh">
              <div className="up-sh-tag">Zielgruppe</div>
              <h2>Für wen wir arbeiten</h2>
              <p>Baunity ist ein B2B-Service — ausschließlich für gewerbliche Kunden aus der Energiebranche.</p>
            </div>

            <div className="up-tg-list">
              <div className="up-tg-item">
                <svg className="up-tg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <div>
                  <strong>Elektrofachbetriebe</strong>
                  <span>PV-Installateure, die Netzanmeldungen auslagern wollen</span>
                </div>
              </div>
              <div className="up-tg-item">
                <svg className="up-tg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                <div>
                  <strong>Handelsvertreter</strong>
                  <span>Vertriebspartner mit eigenen Kunden und Provisionsabrechnung</span>
                </div>
              </div>
              <div className="up-tg-item">
                <svg className="up-tg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                <div>
                  <strong>Solar-Unternehmen</strong>
                  <span>Firmen mit hohem Anlagenvolumen — White-Label & API möglich</span>
                </div>
              </div>
              <div className="up-tg-item">
                <svg className="up-tg-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                <div>
                  <strong>Subunternehmer</strong>
                  <span>Arbeiten unter dem Branding ihres White-Label-Partners</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technologie */}
        <section className="up-section-padding up-section" style={{ background: 'linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.02), transparent)' }}>
          <div className="up-container">
            <div className="up-sh">
              <div className="up-sh-tag">Technologie</div>
              <h2>Was unter der Haube steckt</h2>
            </div>

            <div className="up-grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="up-card">
                <h3>Enterprise RAG</h3>
                <p>KI-gestütztes Retrieval-Augmented-Generation-System mit 25.000+ Embeddings über 29 Kategorien. Automatische Netzbetreiber-Erkennung, Dokument-Routing und intelligente Suchvorschläge.</p>
              </div>
              <div className="up-card">
                <h3>Dual-LLM Email-Klassifikation</h3>
                <p>Eingehende Netzbetreiber-Emails werden parallel von zwei KI-Modellen klassifiziert. Automatische Erkennung von Rückfragen, fehlenden Unterlagen und Genehmigungen.</p>
              </div>
              <div className="up-card">
                <h3>850+ Netzbetreiber-Profile</h3>
                <p>Jeder deutsche Netzbetreiber mit PLZ-Zuordnung, Kontaktdaten, Portal-Zugängen und spezifischen Anforderungen hinterlegt. Verknüpfung mit VNBdigital.de.</p>
              </div>
              <div className="up-card">
                <h3>Auto-Resolve Engine</h3>
                <p>Automatische Analyse und Beantwortung von NB-Beanstandungen. Cross-Projekt-Learning erkennt wiederkehrende Muster pro Netzbetreiber.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="up-section-padding up-section">
          <div className="up-container">
            <div className="up-cta-box">
              <h2>Interesse an einer Zusammenarbeit?</h2>
              <p>Erfahren Sie mehr über unser Partnerprogramm oder testen Sie das Portal direkt.</p>
              <div className="up-cta-btns">
                <Link to="/partner" className="up-btn up-btn--primary">
                  Partnerprogramm ansehen
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/login" className="up-btn up-btn--secondary">Portal Login</Link>
                <a href="mailto:info@baunity.de" className="up-btn up-btn--secondary">Kontakt aufnehmen</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="up-footer">
          <div className="up-footer-inner">
            <div className="up-footer-brand">
              <div className="up-footer-mark">GN</div>
              <span>Baunity &middot; Südstraße 31, 47475 Kamp-Lintfort &middot; info@baunity.de</span>
            </div>
            <div className="up-footer-links">
              <Link to="/">Startseite</Link>
              <Link to="/partner">Partner</Link>
              <Link to="/impressum">Impressum</Link>
              <Link to="/datenschutz">Datenschutz</Link>
              <Link to="/agb">AGB</Link>
              <span>&copy; <span ref={yearRef}></span> Baunity</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
