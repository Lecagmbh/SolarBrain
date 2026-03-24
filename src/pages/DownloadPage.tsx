import { Link } from 'react-router-dom';

export default function DownloadPage() {
  const desktopVersion = "1.4.0";
  const desktopFileSize = "128 MB";
  const desktopDownloadUrl = "/download/Baunity-Portal-Setup.exe";
  const macIntelUrl = "/desktop-updates/Baunity Portal-1.4.0-mac-x64.zip";
  const macArmUrl = "/desktop-updates/Baunity Portal-1.4.0-mac-arm64.zip";

  const androidApkUrl = "/downloads/GridFlow.apk";
  const androidVersion = "1.0.0";
  const androidFileSize = "94 MB";

  return (
    <>
      <style>{`
        .dl-page *, .dl-page *::before, .dl-page *::after { margin: 0; padding: 0; box-sizing: border-box; }
        .dl-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #030014;
          color: #e2e8f0;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Nav */
        .dl-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(3, 0, 20, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 255, 136, 0.15);
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .dl-nav-brand {
          display: flex; align-items: center; gap: 0.75rem;
          text-decoration: none; color: inherit;
        }
        .dl-nav-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #00FF88, #00D4FF);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; color: #030014;
          font-family: 'Space Grotesk', sans-serif;
        }
        .dl-nav-name { font-weight: 600; color: #fff; font-size: 1rem; }
        .dl-nav-links { display: flex; gap: 1.5rem; }
        .dl-nav-links a { font-size: 0.85rem; color: #8892B0; text-decoration: none; transition: color 0.2s; }
        .dl-nav-links a:hover { color: #00FF88; }

        /* Hero */
        .dl-hero {
          text-align: center;
          padding: 4rem 2rem 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .dl-hero::before {
          content: '';
          position: absolute;
          top: -100px; left: 50%; transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .dl-hero h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.8rem; font-weight: 700;
          background: linear-gradient(135deg, #00FF88, #00D4FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }
        .dl-hero p {
          color: #8892B0;
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Content */
        .dl-content {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 2rem 5rem;
          flex: 1;
          width: 100%;
        }

        /* Section Title */
        .dl-section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin: 2.5rem 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dl-section-title svg { flex-shrink: 0; }

        /* App Cards Grid */
        .dl-apps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        /* Card */
        .dl-card {
          background: rgba(10, 10, 26, 0.6);
          border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 1.25rem;
          padding: 2rem;
          transition: all 0.3s;
        }
        .dl-card:hover {
          border-color: rgba(0, 255, 136, 0.3);
          box-shadow: 0 8px 40px rgba(0, 255, 136, 0.05);
        }
        .dl-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .dl-card-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dl-card-icon--apple {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .dl-card-icon--android {
          background: rgba(61, 220, 132, 0.1);
          border: 1px solid rgba(61, 220, 132, 0.2);
        }
        .dl-card-icon--windows {
          background: rgba(0, 212, 255, 0.08);
          border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .dl-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #fff;
        }
        .dl-card-subtitle {
          font-size: 0.82rem;
          color: #8892B0;
          margin-top: 0.15rem;
        }
        .dl-card-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .dl-card-desc {
          font-size: 0.88rem;
          color: #8892B0;
          line-height: 1.6;
        }
        .dl-card-meta {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .dl-meta-item {
          display: flex; flex-direction: column; gap: 0.1rem;
        }
        .dl-meta-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5a6480;
          font-weight: 500;
        }
        .dl-meta-value {
          font-size: 0.9rem;
          color: #cbd5e1;
          font-weight: 500;
        }

        /* Store Buttons */
        .dl-store-btn {
          display: inline-flex; align-items: center; gap: 0.6rem;
          padding: 0.85rem 1.8rem;
          border-radius: 100px;
          font-weight: 600; font-size: 0.9rem;
          text-decoration: none;
          border: none; cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .dl-store-btn svg { flex-shrink: 0; }

        .dl-store-btn--apple {
          background: #fff;
          color: #000;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
        }
        .dl-store-btn--apple:hover {
          box-shadow: 0 6px 30px rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .dl-store-btn--android {
          background: linear-gradient(135deg, #3DDC84, #00C853);
          color: #000;
          box-shadow: 0 4px 20px rgba(61, 220, 132, 0.25);
        }
        .dl-store-btn--android:hover {
          box-shadow: 0 6px 30px rgba(61, 220, 132, 0.4);
          transform: translateY(-2px);
        }

        .dl-store-btn--coming-soon {
          background: rgba(255, 255, 255, 0.08);
          color: #8892B0;
          cursor: default;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dl-store-btn--coming-soon:hover {
          transform: none;
          box-shadow: none;
        }

        .dl-store-btn--download {
          background: linear-gradient(135deg, #00FF88, #00cc6a);
          color: #030014;
          box-shadow: 0 4px 20px rgba(0, 255, 136, 0.25);
        }
        .dl-store-btn--download:hover {
          box-shadow: 0 6px 30px rgba(0, 255, 136, 0.45);
          transform: translateY(-2px);
        }

        .dl-store-btn:active { transform: translateY(0); }

        /* Full-width Desktop Card */
        .dl-card--full {
          margin-top: 1.25rem;
        }
        .dl-card--full .dl-card-body {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        /* Features */
        .dl-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 2rem;
        }
        .dl-feature {
          background: rgba(10, 10, 26, 0.4);
          border: 1px solid rgba(0, 255, 136, 0.08);
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.3s;
        }
        .dl-feature:hover {
          border-color: rgba(0, 255, 136, 0.2);
          background: rgba(10, 10, 26, 0.6);
        }
        .dl-feature-icon {
          width: 36px; height: 36px;
          background: rgba(0, 255, 136, 0.06);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.75rem;
        }
        .dl-feature h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 0.3rem;
        }
        .dl-feature p {
          font-size: 0.8rem;
          color: #8892B0;
          line-height: 1.6;
        }

        /* PWA Hint */
        .dl-pwa-hint {
          margin-top: 2rem;
          padding: 1.5rem 2rem;
          background: rgba(212, 168, 67, 0.06);
          border: 1px solid rgba(212, 168, 67, 0.15);
          border-radius: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .dl-pwa-hint-icon {
          width: 40px; height: 40px;
          background: rgba(212, 168, 67, 0.1);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dl-pwa-hint h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 0.25rem;
        }
        .dl-pwa-hint p {
          font-size: 0.82rem;
          color: #8892B0;
          line-height: 1.6;
        }

        /* Footer */
        .dl-footer {
          border-top: 1px solid rgba(0, 255, 136, 0.1);
          padding: 2rem;
          text-align: center;
          color: #5a6480;
          font-size: 0.8rem;
          margin-top: auto;
        }
        .dl-footer-links {
          display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1rem;
        }
        .dl-footer-links a {
          color: #8892B0; text-decoration: none; font-size: 0.82rem;
          transition: color 0.2s;
        }
        .dl-footer-links a:hover { color: #00FF88; }

        /* Responsive */
        @media (max-width: 768px) {
          .dl-hero h1 { font-size: 2rem; }
          .dl-hero { padding: 3rem 1.5rem 2rem; }
          .dl-content { padding: 0 1.5rem 3rem; }
          .dl-apps-grid { grid-template-columns: 1fr; }
          .dl-card { padding: 1.5rem; }
          .dl-card--full .dl-card-body { flex-direction: column; align-items: flex-start; }
          .dl-features { grid-template-columns: 1fr; }
          .dl-store-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="dl-page">
        {/* Navigation */}
        <nav className="dl-nav">
          <Link to="/" className="dl-nav-brand">
            <div className="dl-nav-mark">GN</div>
            <span className="dl-nav-name">Baunity</span>
          </Link>
          <div className="dl-nav-links">
            <Link to="/login">Anmelden</Link>
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="dl-hero">
          <h1>Baunity herunterladen</h1>
          <p>Netzanmeldung und PV-Management auf allen Geräten. Mobile App für unterwegs, Desktop-App für maximale Produktivität.</p>
        </section>

        {/* Content */}
        <div className="dl-content">
          {/* Mobile Apps */}
          <h2 className="dl-section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Mobile Apps
          </h2>

          <div className="dl-apps-grid">
            {/* Android - APK Download */}
            <div className="dl-card">
              <div className="dl-card-header">
                <div className="dl-card-icon dl-card-icon--android">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#3DDC84">
                    <path d="M17.523 15.342c-.406 0-.736-.33-.736-.735s.33-.735.736-.735.736.33.736.735-.33.735-.736.735m-11.046 0c-.406 0-.736-.33-.736-.735s.33-.735.736-.735.736.33.736.735-.33.735-.736.735m11.4-6.292l2.006-3.469c.112-.193.046-.441-.148-.553-.193-.112-.441-.046-.553.148l-2.03 3.516C15.534 7.905 13.834 7.5 12 7.5c-1.834 0-3.534.405-5.152 1.192l-2.03-3.516c-.112-.194-.36-.26-.553-.148-.194.112-.26.36-.148.553l2.006 3.469C2.907 11.076 .907 14.534.907 18.5h22.186c0-3.966-2-7.424-5.216-9.45M12 20.5c-5.523 0-10-2.015-10-4.5h20c0 2.485-4.477 4.5-10 4.5"/>
                  </svg>
                </div>
                <div>
                  <div className="dl-card-title">Android</div>
                  <div className="dl-card-subtitle">Android 8.0 oder neuer</div>
                </div>
              </div>
              <div className="dl-card-body">
                <p className="dl-card-desc">GridFlow für Android — mit Fingerabdruck-Login, Push-Benachrichtigungen, Kamera-Scan und Offline-Modus.</p>
                <div className="dl-card-meta">
                  <div className="dl-meta-item">
                    <span className="dl-meta-label">Version</span>
                    <span className="dl-meta-value">v{androidVersion}</span>
                  </div>
                  <div className="dl-meta-item">
                    <span className="dl-meta-label">Dateigröße</span>
                    <span className="dl-meta-value">{androidFileSize}</span>
                  </div>
                  <div className="dl-meta-item">
                    <span className="dl-meta-label">Format</span>
                    <span className="dl-meta-value">APK</span>
                  </div>
                </div>
                <a href={androidApkUrl} className="dl-store-btn dl-store-btn--android" download>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Android App herunterladen
                </a>
                <p style={{fontSize: '0.75rem', color: '#5a6480', marginTop: '-0.5rem'}}>
                  Hinweis: Bei der Installation muss "Unbekannte Quellen" in den Android-Einstellungen aktiviert sein.
                </p>
              </div>
            </div>

            {/* iOS - Coming Soon */}
            <div className="dl-card">
              <div className="dl-card-header">
                <div className="dl-card-icon dl-card-icon--apple">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div>
                  <div className="dl-card-title">iPhone & iPad</div>
                  <div className="dl-card-subtitle">iOS 16.0 oder neuer</div>
                </div>
              </div>
              <div className="dl-card-body">
                <p className="dl-card-desc">GridFlow für iOS — mit Face ID, Push-Benachrichtigungen und Kamera-Scan für Typenschilder. Die App wird aktuell bei Apple geprüft.</p>
                <span className="dl-store-btn dl-store-btn--coming-soon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Demnächst im App Store
                </span>
                <p style={{fontSize: '0.75rem', color: '#5a6480', marginTop: '-0.5rem'}}>
                  Der iOS-Build wird erstellt und anschließend zur Prüfung bei Apple eingereicht.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop App */}
          <h2 className="dl-section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Desktop App
          </h2>

          <div className="dl-card dl-card--full">
            <div className="dl-card-header">
              <div className="dl-card-icon dl-card-icon--windows">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#00D4FF">
                  <path d="M3 5.548l7.207-0.994v6.961H3V5.548zm0 12.904l7.207 0.994v-6.961H3v5.967zm8.207 1.107L21 21v-8.515h-9.793v8.074zm0-14.118v8.074H21V3l-9.793 1.441z"/>
                </svg>
              </div>
              <div>
                <div className="dl-card-title">Windows</div>
                <div className="dl-card-subtitle">Setup-Installer mit Desktop-Verknüpfung und Auto-Updates</div>
              </div>
            </div>
            <div className="dl-card-body">
              <div className="dl-card-meta">
                <div className="dl-meta-item">
                  <span className="dl-meta-label">Version</span>
                  <span className="dl-meta-value">v{desktopVersion}</span>
                </div>
                <div className="dl-meta-item">
                  <span className="dl-meta-label">Dateigröße</span>
                  <span className="dl-meta-value">{desktopFileSize}</span>
                </div>
                <div className="dl-meta-item">
                  <span className="dl-meta-label">Plattform</span>
                  <span className="dl-meta-value">Windows 10/11</span>
                </div>
              </div>
              <a href={desktopDownloadUrl} className="dl-store-btn dl-store-btn--download" download>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Herunterladen
              </a>
              <p style={{fontSize: '0.75rem', color: '#5a6480', marginTop: '-0.5rem'}}>
                Hinweis: Windows SmartScreen zeigt beim ersten Start eine Warnung. Klicken Sie auf &quot;Weitere Informationen&quot; &rarr; &quot;Trotzdem ausführen&quot;.
              </p>
            </div>
          </div>

          {/* macOS */}
          <div className="dl-card dl-card--full">
            <div className="dl-card-header">
              <div className="dl-card-icon dl-card-icon--apple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <div className="dl-card-title">macOS Desktop</div>
                <div className="dl-card-subtitle">ZIP-Archiv — entpacken und in den Programme-Ordner ziehen</div>
              </div>
            </div>
            <div className="dl-card-body">
              <div className="dl-card-meta">
                <div className="dl-meta-item">
                  <span className="dl-meta-label">Version</span>
                  <span className="dl-meta-value">v{desktopVersion}</span>
                </div>
                <div className="dl-meta-item">
                  <span className="dl-meta-label">Plattform</span>
                  <span className="dl-meta-value">macOS 11+</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href={macArmUrl} className="dl-store-btn dl-store-btn--download" download>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Apple Silicon (M1–M4)
                </a>
                <a href={macIntelUrl} className="dl-store-btn dl-store-btn--download" style={{ background: 'linear-gradient(135deg, #00cc6a, #009e52)' }} download>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Intel Mac
                </a>
              </div>
              <p style={{fontSize: '0.75rem', color: '#5a6480', marginTop: '-0.5rem'}}>
                Hinweis: Beim ersten Start Rechtsklick &rarr; &quot;Öffnen&quot; &rarr; &quot;Öffnen&quot; bestätigen (Gatekeeper-Warnung, da nicht signiert).
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="dl-features">
            <div className="dl-feature">
              <div className="dl-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Echtzeit-Updates</h3>
              <p>Status-Änderungen und Nachrichten sofort auf allen Geräten.</p>
            </div>
            <div className="dl-feature">
              <div className="dl-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Biometrische Sicherheit</h3>
              <p>Face ID und Fingerabdruck für schnellen, sicheren Zugang.</p>
            </div>
            <div className="dl-feature">
              <div className="dl-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3>Kamera-Scan</h3>
              <p>Typenschilder fotografieren und automatisch erkennen lassen.</p>
            </div>
          </div>

          {/* PWA Hint */}
          <div className="dl-pwa-hint">
            <div className="dl-pwa-hint-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAD068" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h3>Web-App ohne Download</h3>
              <p>Sie können Baunity auch direkt im Browser nutzen unter <a href="https://baunity.de/portal" style={{color: '#a5b4fc', textDecoration: 'none'}}>baunity.de/portal</a>. Auf dem Smartphone: Tippen Sie auf "Zum Home-Bildschirm hinzufügen" für eine App-ähnliche Erfahrung.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="dl-footer">
          <div className="dl-footer-links">
            <Link to="/">Startseite</Link>
            <Link to="/login">Anmelden</Link>
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} LECA GmbH. Alle Rechte vorbehalten.</p>
        </footer>
      </div>
    </>
  );
}
