import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function PartnerPage() {
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
          --pp-primary: #1e40af;
          --pp-primary-light: #3b82f6;
          --pp-accent: #D4A843;
          --pp-bg: #030014;
          --pp-surface: #0A0A1A;
          --pp-text: #F1F5F9;
          --pp-text-soft: #94A3B8;
          --pp-border: rgba(30, 64, 175, 0.25);
          --pp-font-display: 'Space Grotesk', sans-serif;
          --pp-font-body: 'Inter', sans-serif;
        }
        .partner-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .partner-page {
          font-family: var(--pp-font-body);
          background: var(--pp-bg);
          color: var(--pp-text);
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        .partner-page a { color: var(--pp-primary-light); text-decoration: none; transition: color 0.2s; }
        .partner-page a:hover { color: var(--pp-accent); }

        .pp-bg-gradient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(30, 64, 175, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(212, 168, 67, 0.1), transparent);
        }

        /* Nav */
        .pp-nav { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; width: calc(100% - 40px); max-width: 1000px; }
        .pp-nav-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          padding: 0.75rem 1.5rem; background: rgba(10, 10, 26, 0.92); backdrop-filter: blur(20px);
          border: 1px solid var(--pp-border); border-radius: 100px;
        }
        .pp-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        .pp-nav-logo-mark {
          width: 36px; height: 36px; background: linear-gradient(135deg, var(--pp-primary), var(--pp-accent));
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: var(--pp-font-display); font-weight: 700; font-size: 0.85rem; color: #fff;
        }
        .pp-nav-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
        .pp-nav-logo-name { font-family: var(--pp-font-display); font-weight: 600; font-size: 1rem; }
        .pp-nav-logo-tagline { font-size: 0.7rem; color: var(--pp-text-soft); }
        .pp-nav-links { display: flex; align-items: center; gap: 2rem; }
        .pp-nav-link { font-size: 0.85rem; color: var(--pp-text-soft); transition: color 0.2s; }
        .pp-nav-link:hover { color: var(--pp-text); }
        .pp-nav-btn {
          padding: 0.5rem 1.25rem; border-radius: 100px; font-size: 0.85rem; font-weight: 600;
          transition: all 0.3s; display: flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, var(--pp-primary), var(--pp-accent)); color: #fff;
        }
        .pp-nav-btn:hover { box-shadow: 0 4px 20px rgba(30, 64, 175, 0.5); transform: translateY(-1px); color: #fff; }

        /* Sections */
        .pp-section { position: relative; z-index: 1; }
        .pp-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        /* Hero */
        .pp-hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 120px 1.5rem 80px; }
        .pp-hero-content { text-align: center; max-width: 900px; }
        .pp-hero-tag {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
          background: rgba(30, 64, 175, 0.12); border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 100px; font-size: 0.85rem; color: var(--pp-primary-light); margin-bottom: 1.5rem;
        }
        .pp-hero-title { font-family: var(--pp-font-display); font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 700; line-height: 1.1; margin-bottom: 1.5rem; }
        .pp-hero-title .pp-highlight { background: linear-gradient(135deg, var(--pp-primary-light), var(--pp-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .pp-hero-subtitle { font-size: 1.2rem; color: var(--pp-text-soft); margin-bottom: 2.5rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .pp-hero-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        /* Buttons */
        .pp-btn {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.75rem;
          border-radius: 100px; font-size: 0.95rem; font-weight: 500; transition: all 0.3s; border: none; cursor: pointer;
        }
        .pp-btn--primary { background: linear-gradient(135deg, var(--pp-primary), var(--pp-accent)); color: #fff; font-weight: 600; box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3); }
        .pp-btn--primary:hover { box-shadow: 0 6px 30px rgba(30, 64, 175, 0.5); transform: translateY(-2px); color: #fff; }
        .pp-btn--secondary { background: rgba(255,255,255, 0.05); border: 1px solid var(--pp-border); color: var(--pp-text); }
        .pp-btn--secondary:hover { background: rgba(255,255,255, 0.1); border-color: rgba(59, 130, 246, 0.4); }

        /* Section Header */
        .pp-section-padding { padding: 100px 0; }
        .pp-section-header { text-align: center; margin-bottom: 4rem; }
        .pp-section-tag {
          display: inline-flex; padding: 0.4rem 1rem;
          background: rgba(30, 64, 175, 0.12); border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 100px; font-size: 0.8rem; color: var(--pp-primary-light); margin-bottom: 1rem;
        }
        .pp-section-title { font-family: var(--pp-font-display); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 700; margin-bottom: 0.75rem; }
        .pp-section-subtitle { color: var(--pp-text-soft); font-size: 1rem; max-width: 600px; margin: 0 auto; }

        /* Benefits Bar */
        .pp-benefits-bar { display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap; }
        .pp-benefit-item { display: flex; align-items: center; gap: 0.5rem; color: var(--pp-text-soft); font-size: 0.9rem; }
        .pp-benefit-icon { color: var(--pp-primary-light); }

        /* Workflow Timeline */
        .pp-workflow-timeline { position: relative; max-width: 800px; margin: 0 auto; }
        .pp-workflow-line {
          position: absolute; left: 32px; top: 0; bottom: 0; width: 2px;
          background: linear-gradient(180deg, var(--pp-primary), var(--pp-accent), rgba(212, 168, 67, 0.2));
        }
        .pp-workflow-step {
          display: flex; gap: 1.5rem; margin-bottom: 2.5rem; position: relative;
        }
        .pp-workflow-step:last-child { margin-bottom: 0; }
        .pp-workflow-number {
          width: 64px; height: 64px; flex-shrink: 0;
          background: var(--pp-surface); border: 2px solid var(--pp-primary-light);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-family: var(--pp-font-display); font-weight: 700; font-size: 1.25rem; color: var(--pp-primary-light);
          box-shadow: 0 0 20px rgba(30, 64, 175, 0.25); z-index: 1;
        }
        .pp-workflow-content {
          background: rgba(10, 10, 26, 0.6); border: 1px solid var(--pp-border);
          border-radius: 1rem; padding: 1.5rem; flex: 1;
        }
        .pp-workflow-content h4 { font-family: var(--pp-font-display); font-size: 1.1rem; margin-bottom: 0.5rem; }
        .pp-workflow-content p { color: var(--pp-text-soft); font-size: 0.9rem; }
        .pp-badge {
          display: inline-block; padding: 0.2rem 0.6rem; border-radius: 100px;
          font-size: 0.7rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 0.05em;
        }
        .pp-badge--sie { background: rgba(59, 130, 246, 0.15); color: var(--pp-primary-light); border: 1px solid rgba(59, 130, 246, 0.3); }
        .pp-badge--wir { background: rgba(212, 168, 67, 0.15); color: var(--pp-accent); border: 1px solid rgba(212, 168, 67, 0.3); }
        .pp-badge--fertig { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }

        /* Advantages Box */
        .pp-advantages-box {
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(212, 168, 67, 0.08));
          border: 1px solid var(--pp-border); border-radius: 1.25rem; padding: 2rem;
          margin-top: 3rem; max-width: 800px; margin-left: auto; margin-right: auto;
        }
        .pp-advantages-box h3 { font-family: var(--pp-font-display); font-size: 1.15rem; text-align: center; margin-bottom: 1.5rem; }
        .pp-advantages-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .pp-advantage-item { text-align: center; }
        .pp-advantage-value { font-family: var(--pp-font-display); font-size: 1.75rem; font-weight: 700; color: var(--pp-primary-light); }
        .pp-advantage-label { font-size: 0.8rem; color: var(--pp-text-soft); }

        /* Checklist */
        .pp-checklist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .pp-checklist-group {
          background: rgba(10, 10, 26, 0.6); border: 1px solid var(--pp-border);
          border-radius: 1.25rem; padding: 1.75rem;
        }
        .pp-checklist-group h3 {
          font-family: var(--pp-font-display); font-size: 1rem; font-weight: 600;
          margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .pp-checklist-group-icon { color: var(--pp-primary-light); }
        .pp-checklist-items { list-style: none; }
        .pp-checklist-items li {
          display: flex; align-items: flex-start; gap: 0.6rem;
          color: var(--pp-text-soft); font-size: 0.85rem; margin-bottom: 0.5rem;
        }
        .pp-checkbox { color: var(--pp-primary-light); flex-shrink: 0; margin-top: 2px; }

        /* Downloads */
        .pp-downloads-row { display: flex; gap: 1.25rem; justify-content: center; flex-wrap: wrap; margin-top: 2.5rem; }
        .pp-dl-card {
          display: flex; align-items: center; gap: 1rem;
          background: rgba(10, 10, 26, 0.6); border: 1px solid var(--pp-border);
          border-radius: 1rem; padding: 1rem 1.5rem; transition: all 0.3s;
          text-decoration: none; color: var(--pp-text);
        }
        .pp-dl-card:hover { border-color: rgba(59, 130, 246, 0.4); transform: translateY(-2px); color: var(--pp-text); }
        .pp-dl-icon { color: var(--pp-primary-light); flex-shrink: 0; }
        .pp-dl-card span { font-size: 0.85rem; font-weight: 500; }
        .pp-dl-card small { display: block; font-size: 0.7rem; color: var(--pp-text-soft); }

        /* CTA */
        .pp-cta-section { padding: 80px 0; }
        .pp-cta-box {
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(212, 168, 67, 0.1));
          border: 1px solid var(--pp-border); border-radius: 1.5rem; padding: 3.5rem 2rem; text-align: center;
        }
        .pp-cta-box h2 { font-family: var(--pp-font-display); font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 1rem; }
        .pp-cta-box p { color: var(--pp-text-soft); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; }
        .pp-cta-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .pp-cta-contact { margin-top: 1.5rem; font-size: 0.9rem; color: var(--pp-text-soft); }
        .pp-cta-contact a { color: var(--pp-primary-light); font-weight: 500; }

        /* Footer */
        .pp-footer { border-top: 1px solid var(--pp-border); padding: 2.5rem 1.5rem; margin-top: 2rem; position: relative; z-index: 1; }
        .pp-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; }
        .pp-footer-brand { display: flex; align-items: center; gap: 0.75rem; }
        .pp-footer-logo-mark {
          width: 32px; height: 32px; background: linear-gradient(135deg, var(--pp-primary), var(--pp-accent));
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-family: var(--pp-font-display); font-weight: 700; font-size: 0.75rem; color: #fff;
        }
        .pp-footer-brand span { color: var(--pp-text-soft); font-size: 0.85rem; }
        .pp-footer-links { display: flex; gap: 1.5rem; font-size: 0.8rem; color: var(--pp-text-soft); }

        /* Responsive */
        @media (max-width: 968px) {
          .pp-nav-links { display: none; }
          .pp-advantages-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .pp-nav { width: calc(100% - 20px); top: 10px; }
          .pp-hero-buttons { flex-direction: column; align-items: center; }
          .pp-btn { width: 100%; max-width: 280px; justify-content: center; }
          .pp-checklist-grid { grid-template-columns: 1fr; }
          .pp-advantages-grid { grid-template-columns: 1fr; }
          .pp-footer-inner { flex-direction: column; text-align: center; }
          .pp-footer-links { justify-content: center; flex-wrap: wrap; }
          .pp-workflow-step { gap: 1rem; }
          .pp-workflow-number { width: 48px; height: 48px; font-size: 1rem; }
          .pp-workflow-line { left: 24px; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="partner-page">
        <div className="pp-bg-gradient"></div>

        {/* Navigation */}
        <header className="pp-nav">
          <div className="pp-nav-inner">
            <Link to="/" className="pp-nav-logo">
              <div className="pp-nav-logo-mark">GN</div>
              <div className="pp-nav-logo-text">
                <span className="pp-nav-logo-name">Baunity</span>
                <span className="pp-nav-logo-tagline">Partner-Programm</span>
              </div>
            </Link>
            <nav className="pp-nav-links">
              <a href="#leistungen" className="pp-nav-link">Leistungen</a>
              <a href="#workflow" className="pp-nav-link">Ablauf</a>
              <a href="#unterlagen" className="pp-nav-link">Unterlagen</a>
              <a href="#kontakt" className="pp-nav-link">Kontakt</a>
            </nav>
            <a href="#kontakt" className="pp-nav-btn">
              Jetzt Partner werden
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="pp-hero pp-section">
          <div className="pp-hero-content">
            <div className="pp-hero-tag">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              Partnerprogramm für Elektrofachbetriebe & Handelsvertreter
            </div>
            <h1 className="pp-hero-title">
              Netzanmeldungen abgeben.<br/>
              <span className="pp-highlight">Mehr Zeit für Ihr Kerngeschäft.</span>
            </h1>
            <p className="pp-hero-subtitle">
              Wir übernehmen den gesamten Netzanmeldungsprozess für Ihre PV-Anlagen, Speicher und Wallboxen.
              Transparent, schnell und zu fairen Preisen.
            </p>
            <div className="pp-hero-buttons">
              <a href="#kontakt" className="pp-btn pp-btn--primary">
                Erstgespräch vereinbaren
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="#leistungen" className="pp-btn pp-btn--secondary">Leistungen ansehen</a>
            </div>
          </div>
        </section>

        {/* Leistungen */}
        <section className="pp-section-padding pp-section" id="leistungen">
          <div className="pp-container">
            <div className="pp-section-header">
              <div className="pp-section-tag">Leistungen</div>
              <h2 className="pp-section-title">Was wir für Sie übernehmen</h2>
              <p className="pp-section-subtitle">Der komplette Netzanmeldungsprozess — von der Dokumentenerstellung bis zur Genehmigung.</p>
            </div>

            <div className="pp-checklist-grid">
              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Dokumentenerstellung
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Übersichtsschaltplan (technische Zeichnung)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Lageplan mit Satellitenansicht</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>VDE-Formulare (E.1 bis E.8)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Vollmacht Netzbetreiber</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Inbetriebnahmeprotokoll</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Netzbetreiber-Kommunikation
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Einreichung beim zuständigen NB</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Rückfragen beantworten & Korrekturen</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Status-Nachverfolgung bis Genehmigung</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>MaStR-Registrierung</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  Abgedeckte Anlagentypen
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>PV-Anlagen (Netzanmeldung)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Batteriespeicher (auch Nachrüstung)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Wallboxen (&gt; 11 kW)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Kombianlagen (PV + Speicher + Wallbox)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Inbetriebnahme-Meldungen</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  Ihr Portal-Zugang
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Echtzeit-Status aller Anlagen</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Dokumente zum Download</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>WhatsApp-Datenerfassung</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Persönlicher Ansprechpartner</li>
                </ul>
              </div>
            </div>

            {/* Benefits Bar */}
            <div className="pp-benefits-bar" style={{ marginTop: '2.5rem' }}>
              <div className="pp-benefit-item">
                <svg className="pp-benefit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                Keine Vertragsbindung
              </div>
              <div className="pp-benefit-item">
                <svg className="pp-benefit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                Abrechnung pro Anlage
              </div>
              <div className="pp-benefit-item">
                <svg className="pp-benefit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                Individuelle Konditionen
              </div>
              <div className="pp-benefit-item">
                <svg className="pp-benefit-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                Preise auf Anfrage
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="pp-section-padding pp-section" id="workflow" style={{ background: 'linear-gradient(180deg, transparent, rgba(30, 64, 175, 0.02), transparent)' }}>
          <div className="pp-container">
            <div className="pp-section-header">
              <div className="pp-section-tag">Ablauf</div>
              <h2 className="pp-section-title">So einfach funktioniert die Zusammenarbeit</h2>
              <p className="pp-section-subtitle">Von der Datenübergabe bis zur fertigen Genehmigung - wir kümmern uns um alles.</p>
            </div>

            <div className="pp-workflow-timeline">
              <div className="pp-workflow-line"></div>

              <div className="pp-workflow-step">
                <div className="pp-workflow-number">1</div>
                <div className="pp-workflow-content">
                  <div className="pp-badge pp-badge--sie">SIE</div>
                  <h4>Anlagendaten übermitteln</h4>
                  <p>Sie geben die Anlagendaten über unser Portal, per WhatsApp oder per Excel-Liste an uns weiter. Wir benötigen: Kundendaten, Anlagenkomponenten und Standort.</p>
                </div>
              </div>

              <div className="pp-workflow-step">
                <div className="pp-workflow-number">2</div>
                <div className="pp-workflow-content">
                  <div className="pp-badge pp-badge--wir">WIR</div>
                  <h4>Unterlagen erstellen</h4>
                  <p>Wir erstellen alle erforderlichen Dokumente: Übersichtsschaltplan, Lageplan, VDE-Formulare, Vollmacht und Datenblätter. Alles automatisiert und geprüft.</p>
                </div>
              </div>

              <div className="pp-workflow-step">
                <div className="pp-workflow-number">3</div>
                <div className="pp-workflow-content">
                  <div className="pp-badge pp-badge--wir">WIR</div>
                  <h4>Beim Netzbetreiber einreichen</h4>
                  <p>Wir reichen die Unterlagen beim zuständigen Netzbetreiber ein und kümmern uns um Rückfragen, fehlende Unterlagen und Korrekturen.</p>
                </div>
              </div>

              <div className="pp-workflow-step">
                <div className="pp-workflow-number">4</div>
                <div className="pp-workflow-content">
                  <div className="pp-badge pp-badge--wir">WIR</div>
                  <h4>Nachverfolgung & Kommunikation</h4>
                  <p>Wir verfolgen den Status aktiv und kommunizieren mit dem Netzbetreiber. Sie erhalten Echtzeit-Updates im Portal.</p>
                </div>
              </div>

              <div className="pp-workflow-step">
                <div className="pp-workflow-number">5</div>
                <div className="pp-workflow-content">
                  <div className="pp-badge pp-badge--fertig">FERTIG</div>
                  <h4>Genehmigung erhalten</h4>
                  <p>Sobald die Genehmigung vorliegt, werden Sie benachrichtigt. Alle Dokumente stehen im Portal zum Download bereit.</p>
                </div>
              </div>
            </div>

            {/* Vorteile */}
            <div className="pp-advantages-box">
              <h3>Ihre Vorteile auf einen Blick</h3>
              <div className="pp-advantages-grid">
                <div className="pp-advantage-item">
                  <div className="pp-advantage-value">2-5 Tage</div>
                  <div className="pp-advantage-label">Ø Bearbeitungszeit</div>
                </div>
                <div className="pp-advantage-item">
                  <div className="pp-advantage-value">850+</div>
                  <div className="pp-advantage-label">Netzbetreiber abgedeckt</div>
                </div>
                <div className="pp-advantage-item">
                  <div className="pp-advantage-value">98%</div>
                  <div className="pp-advantage-label">Erstgenehmigungsquote</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Unterlagen-Checkliste */}
        <section className="pp-section-padding pp-section" id="unterlagen">
          <div className="pp-container">
            <div className="pp-section-header">
              <div className="pp-section-tag">Checkliste</div>
              <h2 className="pp-section-title">Diese Unterlagen benötigen wir von Ihnen</h2>
              <p className="pp-section-subtitle">Je vollständiger Ihre Angaben, desto schneller die Bearbeitung.</p>
            </div>

            <div className="pp-checklist-grid">
              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  Kundendaten
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Name, Vorname (Anlagenbetreiber)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Adresse des Installationsorts</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Telefon & E-Mail</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Zählernummer / Zählpunkt (falls vorhanden)</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                  Anlagenkomponenten
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>PV-Module: Hersteller, Typ, Anzahl, kWp</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Wechselrichter: Hersteller, Typ, Anzahl</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Speicher: Hersteller, Typ, kWh (falls vorhanden)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Wallbox: Hersteller, Typ, kW (falls vorhanden)</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Technische Angaben
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Art der Einspeisung (Volleinspeisung / Überschuss)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Zählerplatz-Situation (HAK, Zählerschrank)</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Gewünschter Inbetriebnahme-Termin</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Vorhandene Erzeugungsanlagen (falls Erweiterung)</li>
                </ul>
              </div>

              <div className="pp-checklist-group">
                <h3>
                  <svg className="pp-checklist-group-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Optional (beschleunigt Bearbeitung)
                </h3>
                <ul className="pp-checklist-items">
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Lageplan / Grundriss</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Foto Zählerschrank</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>Bisherige Korrespondenz mit NB</li>
                  <li><svg className="pp-checkbox" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>EFK-Unterschrift (digital)</li>
                </ul>
              </div>
            </div>

            {/* PDF Downloads */}
            <div className="pp-downloads-row">
              <a href="/downloads/Baunity-Partnerprogramm-Info.pdf" download className="pp-dl-card">
                <svg className="pp-dl-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
                <div>
                  <span>Partnerprogramm Info</span>
                  <small>PDF herunterladen</small>
                </div>
              </a>
              <a href="/downloads/Baunity-Unterlagen-Checkliste.pdf" download className="pp-dl-card">
                <svg className="pp-dl-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>
                <div>
                  <span>Unterlagen-Checkliste</span>
                  <small>PDF herunterladen</small>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pp-cta-section pp-section" id="kontakt">
          <div className="pp-container">
            <div className="pp-cta-box">
              <h2>Bereit, Ihre Netzanmeldungen abzugeben?</h2>
              <p>Vereinbaren Sie ein kostenloses Erstgespräch und erfahren Sie, wie wir Sie unterstützen können.</p>
              <div className="pp-cta-buttons">
                <a href="mailto:info@baunity.de?subject=Partnerprogramm%20-%20Erstgespr%C3%A4ch" className="pp-btn pp-btn--primary">
                  Erstgespräch vereinbaren
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
                <Link to="/login" className="pp-btn pp-btn--secondary">
                  Portal Login
                </Link>
              </div>
              <div className="pp-cta-contact">
                <a href="mailto:info@baunity.de">info@baunity.de</a> &middot; <a href="https://www.baunity.de" target="_blank" rel="noopener noreferrer">www.baunity.de</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pp-footer">
          <div className="pp-footer-inner">
            <div className="pp-footer-brand">
              <div className="pp-footer-logo-mark">GN</div>
              <span>Baunity &middot; info@baunity.de &middot; www.baunity.de</span>
            </div>
            <div className="pp-footer-links">
              <Link to="/">Startseite</Link>
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
