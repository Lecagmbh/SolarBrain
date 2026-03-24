import { Link } from 'react-router-dom';
import { COMPANY } from '../config/company';

export default function ImpressumPage() {
  return (
    <>
      <style>{`
        .legal-page * { margin: 0; padding: 0; box-sizing: border-box; }
        .legal-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #030014;
          color: #e2e8f0;
          line-height: 1.8;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        .legal-page a { color: #00D4FF; text-decoration: none; transition: color 0.2s; }
        .legal-page a:hover { color: #00FF88; }
        .legal-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(3, 0, 20, 0.95); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 255, 136, 0.15);
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .legal-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: inherit; }
        .legal-nav-mark {
          width: 36px; height: 36px; background: linear-gradient(135deg, #00FF88, #00D4FF);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; color: #030014;
        }
        .legal-nav-name { font-weight: 600; font-size: 1rem; color: #fff; }
        .legal-nav-links { display: flex; gap: 1.5rem; }
        .legal-nav-links a { font-size: 0.85rem; color: #8892B0; }
        .legal-nav-links a:hover { color: #fff; }
        .legal-container { max-width: 900px; margin: 0 auto; padding: 3rem 2rem 5rem; }
        .legal-header { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(0, 255, 136, 0.15); }
        .legal-header h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2.5rem; font-weight: 700; margin-bottom: 0.75rem;
          background: linear-gradient(135deg, #00FF88, #00D4FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .legal-header .subtitle { color: #8892B0; font-size: 0.95rem; }
        .legal-section { margin-bottom: 2.5rem; }
        .legal-section h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.35rem; font-weight: 600; color: #fff;
          margin-bottom: 1rem; padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .legal-section h3 {
          font-size: 1.05rem; font-weight: 600; color: #cbd5e1;
          margin: 1.25rem 0 0.5rem;
        }
        .legal-section p { margin-bottom: 0.75rem; color: #b0b8c8; font-size: 0.92rem; }
        .legal-section ul, .legal-section ol {
          margin: 0.5rem 0 1rem 1.5rem; color: #b0b8c8; font-size: 0.92rem;
        }
        .legal-section li { margin-bottom: 0.4rem; }
        .legal-footer {
          border-top: 1px solid rgba(0, 255, 136, 0.15);
          padding: 2rem; text-align: center; color: #8892B0; font-size: 0.8rem;
        }
        .legal-footer-links { display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1rem; }
        .impressum-card {
          background: rgba(10, 10, 26, 0.6); border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 1rem; padding: 2rem; margin-bottom: 1.5rem;
        }
        .impressum-card p { margin-bottom: 0.3rem; }
        .legal-muted {
          color: #4a5568; font-size: 0.78rem; line-height: 1.6;
        }
        .legal-muted p { color: #4a5568; font-size: 0.78rem; margin-bottom: 0.2rem; }
        .legal-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.03);
          margin: 3rem 0 1.5rem;
        }
        @media (max-width: 768px) {
          .legal-container { padding: 2rem 1rem 3rem; }
          .legal-header h1 { font-size: 1.75rem; }
          .legal-nav-links { display: none; }
        }
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div className="legal-page">
        <nav className="legal-nav">
          <Link to="/" className="legal-nav-logo">
            <div className="legal-nav-mark">GN</div>
            <span className="legal-nav-name">Baunity</span>
          </Link>
          <div className="legal-nav-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">AGB</Link>
          </div>
        </nav>

        <div className="legal-container">
          <div className="legal-header">
            <h1>Impressum</h1>
            <p className="subtitle">Angaben gemäß § 5 DDG (ehemals TMG), § 18 Abs. 2 MStV</p>
          </div>

          <div className="legal-section">
            <h2>Diensteanbieter</h2>
            <div className="impressum-card">
              <p><strong>Baunity</strong></p>
              <p>Südstraße 31</p>
              <p>47475 Kamp-Lintfort</p>
              <p>Deutschland</p>
            </div>
          </div>

          <div className="legal-section">
            <h2>Kontakt</h2>
            <div className="impressum-card">
              <p><strong>E-Mail:</strong> {COMPANY.email || 'info@baunity.de'}</p>
              <p><strong>Website:</strong> {COMPANY.website}</p>
            </div>
          </div>

          <div className="legal-section">
            <h2>Verantwortlich</h2>
            <p style={{ color: '#8892B0', fontSize: '0.88rem' }}>
              Vertretungsberechtigt und inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV:<br />
              {COMPANY.geschaeftsfuehrer || 'Die Geschäftsleitung'}, Südstraße 31, 47475 Kamp-Lintfort
            </p>
          </div>

          <div className="legal-section">
            <h2>EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr</a>.
            </p>
            <p>
              Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen, da sich unser Angebot ausschließlich
              an gewerbliche Kunden (B2B) richtet.
            </p>
          </div>

          <div className="legal-section">
            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind
              wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
              fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach
              den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung
              ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
              möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
              Inhalte umgehend entfernen.
            </p>
          </div>

          <div className="legal-section">
            <h2>Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
              zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
              Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
              konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden
              von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </div>

          <div className="legal-section">
            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
              Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden
              die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam
              werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </div>

          <div className="legal-section">
            <h2>Hinweis zur geschlechtsneutralen Sprache</h2>
            <p>
              Aus Gründen der besseren Lesbarkeit wird auf die gleichzeitige Verwendung
              der Sprachformen männlich, weiblich und divers (m/w/d) verzichtet. Sämtliche
              Personenbezeichnungen gelten gleichermaßen für alle Geschlechter.
            </p>
          </div>

          <div className="legal-section">
            <h2>Bildnachweise</h2>
            <p>
              Soweit auf dieser Website Bildmaterial verwendet wird, werden die jeweiligen
              Urheberrechte beachtet. Eigenproduktionen sind entsprechend gekennzeichnet.
              Für Fragen zu Bildnachweisen wenden Sie sich bitte an {COMPANY.email || 'info@baunity.de'}.
            </p>
          </div>

          <div className="legal-section">
            <h2>Datenschutz</h2>
            <p>
              Informationen zur Erhebung und Verarbeitung personenbezogener Daten finden Sie
              in unserer <Link to="/datenschutz">Datenschutzerklärung</Link>.
            </p>
          </div>

          <div className="legal-section">
            <h2>Allgemeine Geschäftsbedingungen</h2>
            <p>
              Unsere Allgemeinen Geschäftsbedingungen finden Sie <Link to="/agb">hier</Link>.
            </p>
          </div>

          {/* Gesellschaftsrechtliche Pflichtangaben - visuell dezent */}
          <hr className="legal-divider" />
          <div className="legal-muted">
            <p>Baunity, Südstraße 31, 47475 Kamp-Lintfort, Deutschland.</p>
          </div>

          <div className="legal-section" style={{ marginTop: '1.5rem' }}>
            <p style={{ color: '#4a5568', fontSize: '0.78rem', fontStyle: 'italic' }}>
              Stand: Februar 2026
            </p>
          </div>
        </div>

        <footer className="legal-footer">
          <div className="legal-footer-links">
            <Link to="/">Startseite</Link>
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutz</Link>
            <Link to="/agb">AGB</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Baunity. Alle Rechte vorbehalten.</p>
        </footer>
      </div>
    </>
  );
}
