import { Link } from 'react-router-dom';
import { COMPANY } from '../config/company';

export default function DatenschutzPage() {
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
        .legal-section table {
          width: 100%; border-collapse: collapse; margin: 1rem 0;
          font-size: 0.85rem; color: #b0b8c8;
        }
        .legal-section table th, .legal-section table td {
          border: 1px solid rgba(255,255,255,0.08); padding: 0.6rem 0.8rem; text-align: left;
        }
        .legal-section table th { background: rgba(0, 255, 136, 0.05); color: #cbd5e1; font-weight: 600; }
        .legal-footer {
          border-top: 1px solid rgba(0, 255, 136, 0.15);
          padding: 2rem; text-align: center; color: #8892B0; font-size: 0.8rem;
        }
        .legal-footer-links { display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1rem; }
        @media (max-width: 768px) {
          .legal-container { padding: 2rem 1rem 3rem; }
          .legal-header h1 { font-size: 1.75rem; }
          .legal-nav-links { display: none; }
          .legal-section table { font-size: 0.78rem; }
          .legal-section table th, .legal-section table td { padding: 0.35rem; }
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
            <h1>Datenschutzerklärung</h1>
            <p className="subtitle">Baunity — Stand: Februar 2026</p>
          </div>

          {/* ===================== 1. VERANTWORTLICHER ===================== */}
          <div className="legal-section">
            <h2>1. Verantwortlicher und EU-Vertreter</h2>
            <h3>1.1 Verantwortlicher im Sinne der DSGVO</h3>
            <p>
              <strong>Baunity</strong><br />
              Südstraße 31<br />
              47475 Kamp-Lintfort<br />
              Deutschland<br />
              E-Mail: {COMPANY.email || 'info@baunity.de'}<br />
              Website: {COMPANY.website}
            </p>
            <h3>1.2 EU-Vertreter gemäß Art. 27 DSGVO</h3>
            <p>
              Als Ansprechpartner für datenschutzrechtliche Angelegenheiten in der Europäischen Union
              steht Ihnen unser europäisches Büro zur Verfügung:<br />
              Baunity — Südstraße 31, 47475 Kamp-Lintfort, Deutschland<br />
              E-Mail: datenschutz@baunity.de
            </p>
          </div>

          {/* ===================== 2. DATENSCHUTZBEAUFTRAGTER (NEU) ===================== */}
          <div className="legal-section">
            <h2>2. Datenschutzbeauftragter</h2>
            <h3>2.1 Benennung</h3>
            <p>
              Sofern eine gesetzliche Pflicht zur Benennung eines Datenschutzbeauftragten
              besteht (§ 38 BDSG), benennen wir einen internen oder externen Datenschutzbeauftragten.
              Die Kontaktdaten des Datenschutzbeauftragten lauten:
            </p>
            <p>
              Datenschutzbeauftragter<br />
              Baunity — Südstraße 31, 47475 Kamp-Lintfort, Deutschland<br />
              E-Mail: dsb@baunity.de
            </p>
            <h3>2.2 Aufgaben</h3>
            <p>
              Der Datenschutzbeauftragte überwacht die Einhaltung der datenschutzrechtlichen
              Vorschriften, berät die Geschäftsleitung in Datenschutzfragen, führt
              Datenschutz-Folgenabschätzungen durch und ist Ansprechpartner für betroffene
              Personen und die Aufsichtsbehörde. Der Datenschutzbeauftragte ist an die
              Geheimhaltung und Vertraulichkeit gebunden (§ 38 Abs. 2 i. V. m. § 6 Abs. 5
              Satz 2 BDSG).
            </p>
            <h3>2.3 Erreichbarkeit</h3>
            <p>
              Sie können sich jederzeit direkt an unseren Datenschutzbeauftragten wenden,
              wenn Sie Fragen zum Datenschutz haben, Ihre Betroffenenrechte ausüben möchten
              oder eine Datenschutzverletzung melden wollen.
            </p>
          </div>

          {/* ===================== 3. ALLGEMEINES ===================== */}
          <div className="legal-section">
            <h2>3. Allgemeines zur Datenverarbeitung</h2>
            <h3>3.1 Umfang der Verarbeitung</h3>
            <p>
              Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit
              dies zur Bereitstellung einer funktionsfähigen Plattform, zur Erbringung unserer
              Dienstleistungen sowie zur Bereitstellung unserer Inhalte und Leistungen
              erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig
              nur nach Einwilligung des Nutzers oder wenn die Verarbeitung durch gesetzliche
              Vorschriften gestattet ist.
            </p>
            <h3>3.2 Rechtsgrundlagen</h3>
            <p>Wir verarbeiten personenbezogene Daten auf Grundlage folgender Rechtsgrundlagen:</p>
            <ul>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO:</strong> Einwilligung des Betroffenen</li>
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO:</strong> Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO:</strong> Erfüllung einer rechtlichen Verpflichtung</li>
              <li><strong>Art. 6 Abs. 1 lit. d DSGVO:</strong> Schutz lebenswichtiger Interessen</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO:</strong> Wahrung berechtigter Interessen, sofern nicht die Interessen oder Grundrechte des Betroffenen überwiegen</li>
            </ul>
            <h3>3.3 Löschung und Speicherdauer</h3>
            <p>
              Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt,
              sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus
              erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in
              unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften vorgesehen ist.
            </p>
            <p>Insbesondere gelten folgende gesetzliche Aufbewahrungsfristen:</p>
            <ul>
              <li><strong>10 Jahre:</strong> Handels- und steuerrechtliche Aufbewahrungspflichten gemäß §§ 147 AO, 257 HGB (Buchungsbelege, Jahresabschlüsse, Rechnungen)</li>
              <li><strong>6 Jahre:</strong> Handels- und steuerrechtliche Aufbewahrungspflichten gemäß §§ 147 AO, 257 HGB (Handelsbriefe, Geschäftskorrespondenz)</li>
              <li><strong>3 Jahre:</strong> Allgemeine zivilrechtliche Verjährungsfrist gemäß §§ 195, 199 BGB</li>
            </ul>
          </div>

          {/* ===================== 4. BESONDERE KATEGORIEN ART. 9 (NEU) ===================== */}
          <div className="legal-section">
            <h2>4. Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO)</h2>
            <h3>4.1 Negativerklärung</h3>
            <p>
              Wir verarbeiten grundsätzlich keine besonderen Kategorien personenbezogener Daten
              im Sinne des Art. 9 Abs. 1 DSGVO. Dies umfasst insbesondere keine Daten, aus denen
              die rassische oder ethnische Herkunft, politische Meinungen, religiöse oder
              weltanschauliche Überzeugungen, die Gewerkschaftszugehörigkeit, genetische Daten,
              biometrische Daten zur eindeutigen Identifizierung, Gesundheitsdaten oder Daten
              zum Sexualleben oder der sexuellen Orientierung hervorgehen.
            </p>
            <h3>4.2 Zufällige Übermittlung</h3>
            <p>
              Sollten uns im Rahmen der Plattformnutzung (z. B. über Freitextfelder, Dokumente
              oder Fotos) versehentlich besondere Kategorien personenbezogener Daten übermittelt
              werden, werden diese nicht gezielt ausgewertet. Wir empfehlen dem Auftraggeber,
              keine besonderen Kategorien personenbezogener Daten über die Plattform zu
              übermitteln, soweit dies für die Netzanmeldung nicht zwingend erforderlich ist.
            </p>
            <h3>4.3 Biometrische Daten</h3>
            <p>
              Die Plattform verwendet keine biometrischen Verfahren zur Identifizierung oder
              Authentifizierung von Nutzern. Sofern die mobile App biometrische Verfahren des
              Geräts (Face ID, Fingerprint) zur App-Entsperrung nutzt, werden die biometrischen
              Daten ausschließlich lokal auf dem Endgerät des Nutzers verarbeitet und nicht
              an unsere Server übermittelt.
            </p>
          </div>

          {/* ===================== 5. WEBSITE ===================== */}
          <div className="legal-section">
            <h2>5. Datenverarbeitung beim Besuch unserer Website</h2>
            <h3>5.1 Server-Logfiles</h3>
            <p>
              Bei jedem Aufruf unserer Internetseite erfasst unser System automatisiert
              Daten und Informationen des aufrufenden Rechnersystems:
            </p>
            <ul>
              <li>IP-Adresse des zugreifenden Rechners (wird nach 7 Tagen anonymisiert)</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Aufgerufene URL und Referrer-URL</li>
              <li>Übertragene Datenmenge und HTTP-Statuscode</li>
              <li>Verwendeter Browser, Browserversion und Betriebssystem</li>
              <li>Name des Internet-Service-Providers</li>
              <li>Bildschirmauflösung und Gerätetype (Desktop, Tablet, Mobil)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse
              liegt in der Sicherstellung des störungsfreien Betriebs, der Gewährleistung der
              Systemsicherheit, der Erkennung und Abwehr von Angriffen und der Optimierung unseres Angebots.
            </p>
            <p><strong>Speicherdauer:</strong> Die Logfiles werden nach 7 Tagen automatisch gelöscht. IP-Adressen werden nach 7 Tagen irreversibel anonymisiert.</p>
            <h3>5.2 SSL-/TLS-Verschlüsselung</h3>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
              vertraulicher Inhalte eine SSL-/TLS-Verschlüsselung (mindestens TLS 1.2).
              Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des
              Browsers von „http://" auf „https://" wechselt und an dem Schloss-Symbol.
            </p>
            <h3>5.3 Content Delivery Network (CDN)</h3>
            <p>
              Zur performanten Auslieferung statischer Inhalte (Bilder, Stylesheets, Schriftarten)
              kann ein Content Delivery Network eingesetzt werden. Dabei wird die IP-Adresse des
              Nutzers an den CDN-Anbieter übermittelt. Der CDN-Anbieter ist als Auftragsverarbeiter
              gemäß Art. 28 DSGVO eingebunden.
            </p>
          </div>

          {/* ===================== 6. COOKIES ===================== */}
          <div className="legal-section">
            <h2>6. Cookies und lokale Speichertechnologien</h2>
            <h3>6.1 Technisch notwendige Cookies</h3>
            <p>
              Unsere Website und Plattform verwenden technisch notwendige Cookies. Für technisch
              notwendige Cookies ist gemäß § 25 Abs. 2 TDDDG (ehemals TTDSG) keine Einwilligung
              erforderlich. Folgende technisch notwendige Cookies setzen wir ein:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Cookie-Name</th>
                  <th>Zweck</th>
                  <th>Laufzeit</th>
                  <th>Anbieter</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>session_id</td>
                  <td>Aufrechterhaltung der Sitzung nach dem Login</td>
                  <td>Sitzung / max. 24 Std.</td>
                  <td>Baunity (First-Party)</td>
                </tr>
                <tr>
                  <td>auth_token</td>
                  <td>Sichere Identifizierung des Nutzers (JWT)</td>
                  <td>Max. 30 Tage bei „Angemeldet bleiben"</td>
                  <td>Baunity (First-Party)</td>
                </tr>
                <tr>
                  <td>csrf_token</td>
                  <td>Schutz vor Cross-Site-Request-Forgery-Angriffen</td>
                  <td>Sitzungsdauer</td>
                  <td>Baunity (First-Party)</td>
                </tr>
                <tr>
                  <td>cookie_consent</td>
                  <td>Speicherung der Cookie-Präferenzen des Nutzers</td>
                  <td>1 Jahr</td>
                  <td>Baunity (First-Party)</td>
                </tr>
                <tr>
                  <td>lang</td>
                  <td>Speicherung der bevorzugten Sprache</td>
                  <td>1 Jahr</td>
                  <td>Baunity (First-Party)</td>
                </tr>
                <tr>
                  <td>sidebar_collapsed</td>
                  <td>UI-Präferenz: Seitenleiste ein-/ausgeklappt</td>
                  <td>1 Jahr</td>
                  <td>Baunity (First-Party)</td>
                </tr>
              </tbody>
            </table>
            <p>
              <strong>Rechtsgrundlage:</strong> § 25 Abs. 2 TDDDG i. V. m. Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an der technischen Funktionsfähigkeit).
            </p>
            <h3>6.2 Local Storage und Session Storage</h3>
            <p>
              Neben Cookies nutzt die Plattform die Web Storage API (localStorage und sessionStorage)
              des Browsers zur Speicherung von Nutzereinstellungen und temporären Anwendungsdaten.
              Diese Daten verlassen nicht den Browser des Nutzers und werden nicht an unsere Server
              übermittelt. § 25 TDDDG findet entsprechend Anwendung.
            </p>
            <h3>6.3 Analyse- und Marketing-Cookies</h3>
            <p>
              Wir setzen derzeit keine Analyse- oder Marketing-Cookies von Drittanbietern ein.
              Sollten zukünftig solche Cookies eingesetzt werden, wird dies nur nach vorheriger
              ausdrücklicher Einwilligung des Nutzers gemäß Art. 6 Abs. 1 lit. a DSGVO i. V. m.
              § 25 Abs. 1 TDDDG über ein Cookie-Consent-Banner erfolgen. Die Einwilligung kann
              jederzeit mit Wirkung für die Zukunft widerrufen werden.
            </p>
          </div>

          {/* ===================== 7. REGISTRIERUNG ===================== */}
          <div className="legal-section">
            <h2>7. Registrierung und Nutzerkonto</h2>
            <h3>7.1 Erhobene Daten bei der Registrierung</h3>
            <table>
              <thead>
                <tr>
                  <th>Datenkategorie</th>
                  <th>Beispiele</th>
                  <th>Rechtsgrundlage</th>
                  <th>Speicherdauer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stammdaten</td>
                  <td>Vorname, Nachname, Firmenname, Rechtsform</td>
                  <td>Art. 6 Abs. 1 lit. b DSGVO</td>
                  <td>Vertragsdauer + 10 Jahre</td>
                </tr>
                <tr>
                  <td>Kontaktdaten</td>
                  <td>E-Mail-Adresse, Telefonnummer, Geschäftsadresse</td>
                  <td>Art. 6 Abs. 1 lit. b DSGVO</td>
                  <td>Vertragsdauer + 10 Jahre</td>
                </tr>
                <tr>
                  <td>Zugangsdaten</td>
                  <td>Benutzername, verschlüsseltes Passwort (Bcrypt/Argon2)</td>
                  <td>Art. 6 Abs. 1 lit. b DSGVO</td>
                  <td>Vertragsdauer + 30 Tage</td>
                </tr>
                <tr>
                  <td>Unternehmensdaten</td>
                  <td>USt-IdNr., Handelsregisternummer, Installateurausweis-Nr.</td>
                  <td>Art. 6 Abs. 1 lit. b DSGVO</td>
                  <td>Vertragsdauer + 10 Jahre</td>
                </tr>
                <tr>
                  <td>Bankdaten</td>
                  <td>IBAN, BIC, Kreditinstitut (bei SEPA-Lastschrift)</td>
                  <td>Art. 6 Abs. 1 lit. b DSGVO</td>
                  <td>Vertragsdauer + 10 Jahre</td>
                </tr>
                <tr>
                  <td>Profilbild</td>
                  <td>Optionales Profilbild des Nutzers</td>
                  <td>Art. 6 Abs. 1 lit. a DSGVO</td>
                  <td>Bis zum Widerruf / Löschung</td>
                </tr>
              </tbody>
            </table>
            <h3>7.2 Nutzung der Plattform</h3>
            <p>Bei der Nutzung der Plattform werden zusätzlich folgende Daten verarbeitet:</p>
            <ul>
              <li><strong>Anlagendaten:</strong> Technische Daten der erfassten Energieanlagen (Leistung, Typ, Komponenten, Standort, GPS-Koordinaten)</li>
              <li><strong>Endkundendaten:</strong> Name, Adresse, Kontaktdaten, Zählerdaten der Endkunden des Auftraggebers</li>
              <li><strong>Dokumentendaten:</strong> Hochgeladene und generierte Dokumente (Schaltpläne, Vollmachten, VDE-Formulare, Fotos)</li>
              <li><strong>Kommunikationsdaten:</strong> E-Mail-Verkehr, Nachrichten über die Plattform, WhatsApp-Nachrichten</li>
              <li><strong>Nutzungsdaten:</strong> Login-Zeitpunkte, aufgerufene Seiten, durchgeführte Aktionen, IP-Adressen, Session-Dauer</li>
              <li><strong>Abrechnungsdaten:</strong> Rechnungen, Zahlungseingänge, Kontingentnutzung</li>
              <li><strong>Audit-Logs:</strong> Protokollierung sicherheitsrelevanter Aktionen (Login, Datenänderungen, Dokumentenzugriff)</li>
            </ul>
          </div>

          {/* ===================== 8. KONTAKTAUFNAHME ===================== */}
          <div className="legal-section">
            <h2>8. Datenverarbeitung bei Kontaktaufnahme</h2>
            <h3>8.1 E-Mail und Kontaktformular</h3>
            <p>
              Bei der Kontaktaufnahme per E-Mail oder über ein Kontaktformular werden die
              vom Nutzer übermittelten personenbezogenen Daten (Name, E-Mail-Adresse,
              Unternehmen, Telefonnummer, Inhalt der Anfrage) zur Bearbeitung der Anfrage
              verarbeitet und gespeichert.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen)
              bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).
            </p>
            <p><strong>Speicherdauer:</strong> Die Daten werden nach abschließender Bearbeitung der Anfrage gelöscht, sofern nicht gesetzliche Aufbewahrungspflichten entgegenstehen.</p>
            <h3>8.2 WhatsApp Business</h3>
            <p>Sofern der Auftraggeber den WhatsApp-Erfassungskanal nutzt, werden folgende Daten erhoben:</p>
            <ul>
              <li>WhatsApp-Telefonnummer und Profilname</li>
              <li>Inhalt der Nachrichten (Text, Bilder, Dokumente, Sprachnachrichten)</li>
              <li>Zeitstempel der Nachrichten</li>
              <li>Vom KI-System extrahierte und strukturierte Anlagendaten</li>
              <li>Lesebestätigungen und Zustellstatus</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              Hinweis: WhatsApp (Meta Platforms Ireland Ltd.) ist als Unterauftragsverarbeiter
              eingebunden. Eine Datenübermittlung in Drittländer kann erfolgen (siehe Abschnitt 12).
            </p>
            <h3>8.3 Terminbuchung</h3>
            <p>
              Bei Nutzung der Terminbuchungsfunktion werden Name, E-Mail-Adresse, Telefonnummer,
              gewünschter Terminzeitpunkt und optionale Nachricht verarbeitet.
            </p>
            <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen).</p>
            <p><strong>Speicherdauer:</strong> Bis zur Durchführung oder Absage des Termins, mindestens jedoch 6 Monate.</p>
          </div>

          {/* ===================== 9. E-MAIL ===================== */}
          <div className="legal-section">
            <h2>9. E-Mail-Kommunikation und Newsletter</h2>
            <h3>9.1 Transaktions-E-Mails</h3>
            <p>Im Rahmen der Vertragsabwicklung versenden wir folgende systemgenerierte E-Mails:</p>
            <ul>
              <li>Registrierungsbestätigung und E-Mail-Verifizierung</li>
              <li>Statusänderungen bei Netzanmeldungen</li>
              <li>Netzbetreiber-Rückmeldungen und -Rückfragen</li>
              <li>Rechnungen und Zahlungsbestätigungen</li>
              <li>Passwort-Reset und Sicherheitsmeldungen</li>
              <li>Systembenachrichtigungen, Wartungshinweise und Plattform-Updates</li>
              <li>Erinnerungen bei offenen Aufgaben und Fristen</li>
              <li>Benachrichtigungen bei neuen Nachrichten (Endkunden-Portal)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO. Diese E-Mails sind für die
              Vertragserfüllung erforderlich und können nicht abbestellt werden.
            </p>
            <h3>9.2 Informations-E-Mails</h3>
            <p>
              Darüber hinaus können wir Informations-E-Mails zu Produktneuheiten, Updates
              und Funktionserweiterungen versenden. Der Versand erfolgt nur mit vorheriger
              Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a DSGVO) oder im Rahmen des
              § 7 Abs. 3 UWG (Bestandskundenprivileg für eigene ähnliche Produkte).
            </p>
            <p>
              Jede Informations-E-Mail enthält einen Abmeldelink, über den der Empfänger
              den Versand jederzeit mit Wirkung für die Zukunft abbestellen kann.
            </p>
            <h3>9.3 E-Mail-Tracking</h3>
            <p>
              Wir verwenden derzeit kein E-Mail-Tracking (Zählpixel, Öffnungsraten-Messung)
              in unseren E-Mails. Sollte dies zukünftig eingeführt werden, erfolgt dies nur
              auf Basis einer Einwilligung.
            </p>
          </div>

          {/* ===================== 10. WEITERGABE ===================== */}
          <div className="legal-section">
            <h2>10. Weitergabe von Daten an Dritte</h2>
            <h3>10.1 Kategorien von Empfängern</h3>
            <p>Eine Weitergabe personenbezogener Daten an Dritte erfolgt nur in folgenden Fällen:</p>
            <ul>
              <li><strong>Netzbetreiber:</strong> Übermittlung von Endkundendaten und Anlagendaten im Rahmen der Netzanmeldung auf Weisung des Auftraggebers (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>Hosting-Provider:</strong> Server in Deutschland/EU, eingebunden als Auftragsverarbeiter gem. Art. 28 DSGVO</li>
              <li><strong>E-Mail-Dienstleister:</strong> Für den Versand von E-Mails, eingebunden als Auftragsverarbeiter gem. Art. 28 DSGVO</li>
              <li><strong>Zahlungsdienstleister:</strong> Für die Abwicklung von Zahlungen (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>CDN-Anbieter:</strong> Für die performante Auslieferung statischer Inhalte (Art. 6 Abs. 1 lit. f DSGVO)</li>
              <li><strong>KI-Dienstleister:</strong> Für die Verarbeitung von Nachrichten im WhatsApp-Kanal (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li><strong>Steuerberater und Wirtschaftsprüfer:</strong> Soweit gesetzlich erforderlich (Art. 6 Abs. 1 lit. c DSGVO)</li>
              <li><strong>Behörden:</strong> Soweit eine gesetzliche Verpflichtung zur Auskunft besteht (Art. 6 Abs. 1 lit. c DSGVO)</li>
              <li><strong>Rechtsanwälte:</strong> Zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen (Art. 6 Abs. 1 lit. f DSGVO)</li>
              <li><strong>Inkassounternehmen:</strong> Im Falle des Zahlungsverzugs (Art. 6 Abs. 1 lit. f DSGVO)</li>
            </ul>
            <h3>10.2 Auftragsverarbeiter-Übersicht</h3>
            <p>Folgende Kategorien von Auftragsverarbeitern setzen wir ein:</p>
            <table>
              <thead>
                <tr>
                  <th>Kategorie</th>
                  <th>Zweck</th>
                  <th>Serverstandort</th>
                  <th>AVV vorhanden</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hosting / Infrastructure</td>
                  <td>Betrieb der Plattform, Datenbanken, Backups</td>
                  <td>Deutschland / EU</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>E-Mail-Versand</td>
                  <td>Transaktions- und Informations-E-Mails</td>
                  <td>EU</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>WhatsApp Business API</td>
                  <td>Nachrichtenverarbeitung WhatsApp-Kanal</td>
                  <td>EU / USA (DPF)</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>KI / Machine Learning</td>
                  <td>Automatisierte Datenerfassung aus Nachrichten</td>
                  <td>EU</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>Zahlungsabwicklung</td>
                  <td>SEPA-Lastschrift, Rechnungsversand</td>
                  <td>Deutschland</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>Monitoring / Logging</td>
                  <td>Fehlerüberwachung, Performance-Monitoring</td>
                  <td>EU</td>
                  <td>Ja</td>
                </tr>
                <tr>
                  <td>Backup-Speicher</td>
                  <td>Verschlüsselte Datensicherung</td>
                  <td>Deutschland / EU</td>
                  <td>Ja</td>
                </tr>
              </tbody>
            </table>
            <p>
              Eine aktuelle, namentliche Auflistung aller Auftragsverarbeiter kann auf Anfrage
              per E-Mail an datenschutz@baunity.de angefordert werden.
            </p>
            <h3>10.3 Auftragsverarbeitung durch den Anbieter</h3>
            <p>
              Soweit wir personenbezogene Daten (insbesondere Endkundendaten) im Auftrag
              des Auftraggebers verarbeiten, handeln wir als Auftragsverarbeiter im Sinne
              des Art. 28 DSGVO. In diesem Fall ist der Auftraggeber Verantwortlicher
              im Sinne der DSGVO. Die Einzelheiten werden in einem gesonderten
              Auftragsverarbeitungsvertrag (AVV) geregelt.
            </p>
          </div>

          {/* ===================== 11. DATENSICHERHEIT ===================== */}
          <div className="legal-section">
            <h2>11. Datensicherheit und technisch-organisatorische Maßnahmen</h2>
            <h3>11.1 Technische Maßnahmen (TOM)</h3>
            <p>Wir setzen umfangreiche technische Maßnahmen zum Schutz Ihrer Daten ein:</p>
            <ul>
              <li>Verschlüsselung aller Datenübertragungen mittels TLS 1.2+ (HSTS aktiviert)</li>
              <li>Verschlüsselung sensibler Daten in der Datenbank (AES-256-GCM)</li>
              <li>Sichere Passwort-Speicherung mittels Bcrypt/Argon2-Hashing mit individuellem Salt</li>
              <li>Web Application Firewall (WAF) und DDoS-Schutz</li>
              <li>Intrusion Detection / Prevention Systems (IDS/IPS)</li>
              <li>Regelmäßige automatisierte Sicherheitsupdates und Patch-Management</li>
              <li>Automatische Session-Timeouts nach 30 Minuten Inaktivität</li>
              <li>CSRF-Schutz, Content-Security-Policy (CSP) und X-Content-Type-Options Header</li>
              <li>Rate-Limiting und Brute-Force-Schutz bei Login-Versuchen</li>
              <li>Regelmäßige automatisierte Backups mit AES-256-Verschlüsselung</li>
              <li>Netzwerksegmentierung und Firewall-Regeln</li>
              <li>Automatisierte Schwachstellenscans und regelmäßige Penetrationstests</li>
              <li>Secure Development Lifecycle (SDLC) mit Code-Reviews</li>
            </ul>
            <h3>11.2 Organisatorische Maßnahmen</h3>
            <ul>
              <li>Zugriffskontrolle nach dem Need-to-Know- und Least-Privilege-Prinzip</li>
              <li>Rollenbasierte Zugriffsverwaltung (RBAC) mit regelmäßiger Überprüfung</li>
              <li>Protokollierung sicherheitsrelevanter Vorgänge (Audit-Logs) mit Aufbewahrung für 1 Jahr</li>
              <li>Regelmäßige Schulung der Mitarbeiter zum Datenschutz und zur IT-Sicherheit</li>
              <li>Dokumentierte Prozesse für den Umgang mit Datenschutzvorfällen (Data Breach Response Plan)</li>
              <li>Vertraulichkeitsverpflichtung aller Mitarbeiter gemäß Art. 28 Abs. 3 lit. b DSGVO</li>
              <li>Clean-Desk-Policy und Zutrittskontrolle zu Serverräumen</li>
              <li>Regelmäßige Datenschutz-Audits und Wirksamkeitsprüfungen</li>
            </ul>
          </div>

          {/* ===================== 12. DRITTLAND ===================== */}
          <div className="legal-section">
            <h2>12. Datenübermittlung in Drittländer</h2>
            <h3>12.1 Grundsatz</h3>
            <p>
              Wir verarbeiten Daten grundsätzlich auf Servern innerhalb der EU/EWR.
              Unsere Hauptserver befinden sich in Deutschland.
            </p>
            <h3>12.2 Drittlandtransfers</h3>
            <p>In folgenden Fällen kann eine Übermittlung in Drittländer stattfinden:</p>
            <ul>
              <li><strong>WhatsApp Business API:</strong> Meta Platforms Ireland Ltd. kann Daten an Meta Platforms Inc. (USA) übermitteln. Grundlage: EU-US Data Privacy Framework (Angemessenheitsbeschluss Art. 45 DSGVO) und Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).</li>
              <li><strong>Cloud-Dienste:</strong> Sofern einzelne Cloud-Dienste von Anbietern mit Sitz in den USA genutzt werden, erfolgt die Übermittlung auf Basis des EU-US Data Privacy Framework oder von Standardvertragsklauseln mit zusätzlichen Schutzmaßnahmen.</li>
            </ul>
            <h3>12.3 Garantien bei Drittlandtransfers</h3>
            <p>Bei Datenübermittlungen in Drittländer stellen wir sicher, dass ein angemessenes Datenschutzniveau gewährleistet ist durch:</p>
            <ul>
              <li>Angemessenheitsbeschlüsse der EU-Kommission gemäß Art. 45 DSGVO</li>
              <li>Standardvertragsklauseln (SCC) gemäß Art. 46 Abs. 2 lit. c DSGVO in der aktuellen Fassung (Durchführungsbeschluss (EU) 2021/914)</li>
              <li>Transfer Impact Assessments (TIA) zur Bewertung des Datenschutzniveaus im Empfängerland</li>
              <li>Zusätzliche technische Schutzmaßnahmen (Verschlüsselung, Pseudonymisierung, Zugangsbeschränkungen)</li>
            </ul>
          </div>

          {/* ===================== 13. KI / PROFILING ===================== */}
          <div className="legal-section">
            <h2>13. Automatisierte Entscheidungsfindung, KI und Profiling</h2>
            <h3>13.1 KI-gestützte Datenerfassung</h3>
            <p>
              Im Rahmen der WhatsApp-Integration und anderer Erfassungskanäle setzen wir
              KI-basierte Systeme ein, die übermittelte Informationen automatisch extrahieren
              und strukturieren (z. B. Erkennung von Anlagentypen, Leistungsdaten und
              Komponenteninformationen aus Textnachrichten und Bildern).
            </p>
            <p>
              Diese automatisierte Verarbeitung dient ausschließlich der Unterstützung der
              Datenerfassung. Es erfolgt keine automatisierte Entscheidungsfindung im Sinne
              des Art. 22 DSGVO, die rechtliche Wirkung entfaltet oder den Betroffenen in
              ähnlicher Weise erheblich beeinträchtigt. Alle automatisiert erfassten Daten
              werden vor der Weiterverarbeitung vom Nutzer überprüft und bestätigt.
            </p>
            <h3>13.2 KI-Modelle und Training</h3>
            <p>
              Die eingesetzten KI-Modelle werden nicht mit personenbezogenen Daten unserer
              Nutzer trainiert, es sei denn, der Nutzer hat hierzu seine ausdrückliche
              Einwilligung erteilt. Für das Training werden ausschließlich anonymisierte
              oder synthetische Datensätze verwendet.
            </p>
            <h3>13.3 Profiling</h3>
            <p>
              Wir führen kein Profiling im Sinne des Art. 4 Nr. 4 DSGVO durch, das zu
              einer automatisierten Entscheidung führt. Anonymisierte Nutzungsstatistiken
              zur Verbesserung der Plattform stellen kein Profiling dar.
            </p>
            <h3>13.4 Datenschutz-Folgenabschätzung (DSFA)</h3>
            <p>
              Für die KI-gestützte Datenverarbeitung haben wir eine Datenschutz-Folgenabschätzung
              gemäß Art. 35 DSGVO durchgeführt. Die DSFA hat ergeben, dass bei Einhaltung der
              implementierten Schutzmaßnahmen kein hohes Risiko für die Rechte und Freiheiten
              der betroffenen Personen besteht.
            </p>
          </div>

          {/* ===================== 14. DATA BREACH ===================== */}
          <div className="legal-section">
            <h2>14. Meldung von Datenschutzverletzungen (Data Breach)</h2>
            <h3>14.1 Meldung an die Aufsichtsbehörde</h3>
            <p>
              Im Falle einer Verletzung des Schutzes personenbezogener Daten (Data Breach)
              werden wir die zuständige Aufsichtsbehörde unverzüglich und möglichst innerhalb
              von 72 Stunden nach Bekanntwerden der Verletzung benachrichtigen, sofern die
              Verletzung voraussichtlich zu einem Risiko für die Rechte und Freiheiten
              natürlicher Personen führt (Art. 33 DSGVO).
            </p>
            <h3>14.2 Benachrichtigung der Betroffenen</h3>
            <p>
              Wenn die Verletzung des Schutzes personenbezogener Daten voraussichtlich ein
              hohes Risiko für die persönlichen Rechte und Freiheiten natürlicher Personen
              zur Folge hat, werden wir die betroffenen Personen unverzüglich benachrichtigen
              (Art. 34 DSGVO). Die Benachrichtigung erfolgt per E-Mail und/oder über die Plattform.
            </p>
            <h3>14.3 Dokumentation</h3>
            <p>
              Jede Datenschutzverletzung wird unabhängig von der Meldepflicht intern dokumentiert,
              einschließlich der Fakten, der Auswirkungen und der ergriffenen Abhilfemaßnahmen
              (Art. 33 Abs. 5 DSGVO).
            </p>
            <h3>14.4 Mitwirkungspflicht des Auftraggebers</h3>
            <p>
              Soweit wir als Auftragsverarbeiter für den Auftraggeber tätig sind, werden wir
              den Auftraggeber unverzüglich über eine Datenschutzverletzung informieren, damit
              dieser seinen Meldepflichten gemäß Art. 33 und 34 DSGVO nachkommen kann.
            </p>
          </div>

          {/* ===================== 15. BETROFFENENRECHTE ===================== */}
          <div className="legal-section">
            <h2>15. Rechte der betroffenen Personen</h2>
            <p>
              Als betroffene Person stehen Ihnen folgende Rechte gegenüber dem Verantwortlichen zu.
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an datenschutz@baunity.de oder
              postalisch an die unter Abschnitt 1 genannte Adresse.
            </p>
            <h3>15.1 Auskunftsrecht (Art. 15 DSGVO)</h3>
            <p>
              Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob personenbezogene
              Daten verarbeitet werden, sowie Auskunft über diese Daten und folgende Informationen:
            </p>
            <ul>
              <li>Die Verarbeitungszwecke</li>
              <li>Die Kategorien personenbezogener Daten</li>
              <li>Die Empfänger oder Kategorien von Empfängern</li>
              <li>Die geplante Speicherdauer oder die Kriterien für deren Festlegung</li>
              <li>Das Bestehen eines Rechts auf Berichtigung, Löschung, Einschränkung oder Widerspruch</li>
              <li>Das Bestehen eines Beschwerderechts bei einer Aufsichtsbehörde</li>
              <li>Informationen über die Herkunft der Daten</li>
              <li>Das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling</li>
              <li>Bei Drittlandtransfers: Informationen über die geeigneten Garantien</li>
            </ul>
            <h3>15.2 Recht auf Kopie (Art. 15 Abs. 3 DSGVO)</h3>
            <p>
              Sie haben das Recht, eine Kopie der personenbezogenen Daten, die Gegenstand der
              Verarbeitung sind, zu erhalten. Für alle weiteren Kopien, die Sie beantragen,
              können wir ein angemessenes Entgelt auf der Grundlage der Verwaltungskosten verlangen.
              Die Kopie wird in einem gängigen elektronischen Format bereitgestellt, sofern
              Sie den Antrag elektronisch stellen.
            </p>
            <h3>15.3 Recht auf Berichtigung (Art. 16 DSGVO)</h3>
            <p>
              Sie haben das Recht, unverzüglich die Berichtigung unrichtiger personenbezogener
              Daten sowie die Vervollständigung unvollständiger Daten zu verlangen.
            </p>
            <h3>15.4 Recht auf Löschung (Art. 17 DSGVO)</h3>
            <p>Sie haben das Recht auf Löschung, sofern einer der folgenden Gründe zutrifft:</p>
            <ul>
              <li>Die Daten sind für die Zwecke, für die sie erhoben wurden, nicht mehr notwendig.</li>
              <li>Sie widerrufen Ihre Einwilligung und es fehlt an einer anderweitigen Rechtsgrundlage.</li>
              <li>Sie legen Widerspruch ein und es liegen keine vorrangigen berechtigten Gründe vor.</li>
              <li>Die Daten wurden unrechtmäßig verarbeitet.</li>
              <li>Die Löschung ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich.</li>
            </ul>
            <p>
              Das Recht auf Löschung besteht nicht, soweit die Verarbeitung zur Erfüllung einer
              rechtlichen Verpflichtung, zur Geltendmachung von Rechtsansprüchen oder aus
              Gründen des öffentlichen Interesses erforderlich ist.
            </p>
            <h3>15.5 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
            <p>Sie haben das Recht auf Einschränkung, wenn:</p>
            <ul>
              <li>Die Richtigkeit der Daten bestritten wird (für die Dauer der Überprüfung)</li>
              <li>Die Verarbeitung unrechtmäßig ist und Sie statt der Löschung die Einschränkung verlangen</li>
              <li>Wir die Daten nicht mehr benötigen, Sie diese aber zur Geltendmachung von Rechtsansprüchen brauchen</li>
              <li>Sie Widerspruch eingelegt haben (bis zur Feststellung, ob unsere Gründe überwiegen)</li>
            </ul>
            <h3>15.6 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h3>
            <p>
              Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen und
              maschinenlesbaren Format (CSV, JSON, XML) zu erhalten und diese einem anderen
              Verantwortlichen ohne Behinderung zu übermitteln.
            </p>
            <h3>15.7 Widerspruchsrecht (Art. 21 DSGVO)</h3>
            <p>
              <strong>Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation
              ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener
              Daten, die auf Art. 6 Abs. 1 lit. e oder lit. f DSGVO beruht, Widerspruch
              einzulegen. Dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.</strong>
            </p>
            <p>
              Nach Eingang des Widerspruchs werden wir die Daten nicht mehr verarbeiten,
              es sei denn, wir weisen zwingende schutzwürdige Gründe nach oder die Verarbeitung
              dient der Geltendmachung von Rechtsansprüchen.
            </p>
            <h3>15.8 Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</h3>
            <p>
              Soweit die Verarbeitung auf einer Einwilligung beruht, können Sie diese jederzeit
              mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis zum Widerruf
              erfolgten Verarbeitung wird hierdurch nicht berührt.
            </p>
            <h3>15.9 Bearbeitungsfrist</h3>
            <p>
              Wir bearbeiten Ihre Anfragen unverzüglich, spätestens jedoch innerhalb eines (1)
              Monats nach Eingang. In komplexen Fällen kann die Frist um weitere zwei (2) Monate
              verlängert werden. Über eine Fristverlängerung werden Sie unter Angabe der Gründe
              innerhalb des ersten Monats informiert (Art. 12 Abs. 3 DSGVO).
            </p>
          </div>

          {/* ===================== 16. ART. 14 DRITTERHEBUNG (NEU) ===================== */}
          <div className="legal-section">
            <h2>16. Informationspflichten bei Dritterhebung (Art. 14 DSGVO)</h2>
            <h3>16.1 Datenquellen</h3>
            <p>
              Soweit wir personenbezogene Daten nicht direkt bei der betroffenen Person
              erheben, kann dies aus folgenden Quellen stammen:
            </p>
            <ul>
              <li><strong>Auftraggeber:</strong> Endkundendaten, die der Auftraggeber im Rahmen der Plattformnutzung erfasst und an uns übermittelt</li>
              <li><strong>Netzbetreiber:</strong> Rückmeldungen, Statusdaten und technische Informationen zu Netzanmeldungen</li>
              <li><strong>Öffentliche Verzeichnisse:</strong> Handelsregisterdaten, Marktstammdatenregister der Bundesnetzagentur, Installateurverzeichnisse</li>
              <li><strong>Drittanbieter-Integrationen:</strong> Daten aus vom Auftraggeber autorisierten Integrationen (CRM, ERP)</li>
            </ul>
            <h3>16.2 Kategorien der Daten</h3>
            <p>
              Bei der Dritterhebung können folgende Kategorien personenbezogener Daten
              verarbeitet werden: Stammdaten (Name, Adresse), Kontaktdaten (E-Mail, Telefon),
              technische Anlagendaten, Zähler- und Netzdaten sowie unternehmensbezogene
              Daten (Registernummer, Installateursausweis).
            </p>
            <h3>16.3 Informationspflicht</h3>
            <p>
              Soweit die Daten nicht direkt bei der betroffenen Person erhoben werden,
              informieren wir die betroffene Person gemäß Art. 14 DSGVO innerhalb eines
              angemessenen Zeitraums nach Erlangung der Daten, spätestens jedoch innerhalb
              eines Monats, über die Verarbeitung — es sei denn, eine der Ausnahmen des
              Art. 14 Abs. 5 DSGVO greift (z. B. unverhältnismäßiger Aufwand bei
              Verarbeitung für im öffentlichen Interesse liegende Archivzwecke).
            </p>
          </div>

          {/* ===================== 17. ART. 17 ABS. 2 (NEU) ===================== */}
          <div className="legal-section">
            <h2>17. Weiterleitungspflicht bei Löschung (Art. 17 Abs. 2 DSGVO)</h2>
            <h3>17.1 Informierung Dritter</h3>
            <p>
              Haben wir personenbezogene Daten öffentlich gemacht oder an Dritte weitergegeben
              und sind wir zu deren Löschung verpflichtet, so treffen wir unter Berücksichtigung
              der verfügbaren Technologie und der Implementierungskosten angemessene Maßnahmen,
              um die Dritten, die die Daten verarbeiten, darüber zu informieren, dass die
              betroffene Person die Löschung aller Links zu diesen Daten oder von Kopien
              oder Replikationen verlangt hat.
            </p>
            <h3>17.2 Umsetzung</h3>
            <p>
              Konkret bedeutet dies, dass wir bei einer Löschungsanfrage alle Auftragsverarbeiter
              und Empfänger, an die wir die betreffenden Daten weitergegeben haben, über das
              Löschungsersuchen informieren. Dies umfasst insbesondere Hosting-Provider,
              Backup-Systeme und — soweit technisch möglich — Netzbetreiber, an die Daten
              im Rahmen von Netzanmeldungen übermittelt wurden.
            </p>
          </div>

          {/* ===================== 18. AUFSICHTSBEHÖRDE ===================== */}
          <div className="legal-section">
            <h2>18. Beschwerderecht bei einer Aufsichtsbehörde</h2>
            <p>
              Unbeschadet eines anderweitigen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde
              bei einer Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts,
              Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
            </p>
            <p>Die für uns zuständige Aufsichtsbehörde ist:</p>
            <p>
              Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit
              Baden-Württemberg<br />
              Lautenschlagerstraße 20, 70173 Stuttgart<br />
              Telefon: 0711/615541-0<br />
              E-Mail: poststelle@lfdi.bwl.de<br />
              Website: https://www.baden-wuerttemberg.datenschutz.de
            </p>
          </div>

          {/* ===================== 19. SPEICHERDAUER ===================== */}
          <div className="legal-section">
            <h2>19. Speicherdauer im Detail</h2>
            <table>
              <thead>
                <tr>
                  <th>Datenkategorie</th>
                  <th>Speicherdauer</th>
                  <th>Rechtsgrund</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Server-Logfiles</td><td>7 Tage (IP anonymisiert)</td><td>Sicherheit, Fehleranalyse</td></tr>
                <tr><td>Registrierungsdaten</td><td>Vertragsdauer + 10 Jahre</td><td>§§ 147 AO, 257 HGB</td></tr>
                <tr><td>Anlagendaten</td><td>Vertragsdauer + 30 Tage</td><td>Vertragserfüllung, Datenexport</td></tr>
                <tr><td>Endkundendaten</td><td>Vertragsdauer + 30 Tage</td><td>Auftragsverarbeitung</td></tr>
                <tr><td>Rechnungsdaten</td><td>10 Jahre ab Rechnungsstellung</td><td>§§ 147 AO, 257 HGB</td></tr>
                <tr><td>E-Mail-Korrespondenz</td><td>6 Jahre</td><td>§ 257 HGB (Handelsbrief)</td></tr>
                <tr><td>WhatsApp-Nachrichten</td><td>Vertragsdauer + 30 Tage</td><td>Vertragserfüllung</td></tr>
                <tr><td>Audit-Logs</td><td>1 Jahr</td><td>Sicherheit, Nachvollziehbarkeit</td></tr>
                <tr><td>Cookie-Consent-Daten</td><td>1 Jahr</td><td>Nachweispflicht § 25 TDDDG</td></tr>
                <tr><td>Terminbuchungsdaten</td><td>6 Monate nach Termin</td><td>Vertragsanbahnung</td></tr>
                <tr><td>Bewerberdaten</td><td>6 Monate nach Verfahrensende</td><td>§ 15 Abs. 4 AGG</td></tr>
                <tr><td>Backup-Daten</td><td>Max. 90 Tage (Rolling Backup)</td><td>Disaster Recovery</td></tr>
              </tbody>
            </table>
          </div>

          {/* ===================== 20. AUTOMATISIERTE LÖSCHKONZEPTE (NEU) ===================== */}
          <div className="legal-section">
            <h2>20. Automatisierte Löschkonzepte</h2>
            <h3>20.1 Löschkonzept</h3>
            <p>
              Wir haben ein dokumentiertes Löschkonzept implementiert, das sicherstellt, dass
              personenbezogene Daten automatisch gelöscht werden, sobald der Speicherzweck
              entfällt und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
            <h3>20.2 Automatisierte Löschroutinen</h3>
            <p>Folgende automatisierte Löschroutinen sind implementiert:</p>
            <ul>
              <li><strong>Server-Logfiles:</strong> Automatische Löschung nach 7 Tagen, IP-Anonymisierung in Echtzeit nach 7 Tagen</li>
              <li><strong>Inaktive Accounts:</strong> Benachrichtigung nach 12 Monaten Inaktivität, Löschung nach weiteren 3 Monaten ohne Reaktion</li>
              <li><strong>Testdaten/Demo-Accounts:</strong> Automatische Löschung nach 30 Tagen Inaktivität</li>
              <li><strong>Temporäre Uploads:</strong> Automatische Löschung nicht zugeordneter Dateien nach 24 Stunden</li>
              <li><strong>Session-Daten:</strong> Automatische Löschung nach Session-Ablauf (max. 24 Stunden)</li>
              <li><strong>Backup-Rotation:</strong> Automatische Löschung gemäß dem Rotationsschema (30 Tage täglich, 12 Wochen wöchentlich, 12 Monate monatlich)</li>
            </ul>
            <h3>20.3 Manuelle Löschprozesse</h3>
            <p>
              Für Daten, die nicht automatisiert gelöscht werden können (z. B. Daten in
              Papierform, Daten bei Drittanbietern), bestehen dokumentierte manuelle Löschprozesse
              mit definierten Verantwortlichkeiten und Fristen.
            </p>
            <h3>20.4 Protokollierung der Löschung</h3>
            <p>
              Jede Löschung personenbezogener Daten wird protokolliert (Datum, Datenkategorie,
              Löschgrund), um die Einhaltung der Löschpflichten nachweisen zu können. Die
              Löschprotokolle selbst werden für drei (3) Jahre aufbewahrt.
            </p>
          </div>

          {/* ===================== 21. ENDKUNDEN-PORTAL ===================== */}
          <div className="legal-section">
            <h2>21. Endkunden-Portal</h2>
            <p>
              Sofern der Auftraggeber das Endkunden-Portal aktiviert, werden folgende Daten verarbeitet:
            </p>
            <ul>
              <li>Name, E-Mail-Adresse (zur Erstellung des Portal-Zugangs)</li>
              <li>Zugangsdaten (verschlüsseltes Passwort)</li>
              <li>Einsicht in die vom Auftraggeber erfassten Anlagendaten</li>
              <li>Hochgeladene und heruntergeladene Dokumente</li>
              <li>Nachrichtenverkehr mit dem Auftraggeber</li>
              <li>Login-Zeitpunkte und Nutzungsaktivitäten</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO. Der Auftraggeber ist
              Verantwortlicher für die Endkundendaten. Wir handeln als Auftragsverarbeiter.
            </p>
          </div>

          {/* ===================== 22. GRIDFLOW APP ===================== */}
          <div className="legal-section">
            <h2>22. GridFlow App (Mobile Anwendung)</h2>
            <p>Bei Nutzung der GridFlow App werden zusätzlich folgende Daten verarbeitet:</p>
            <ul>
              <li><strong>Geräte-Informationen:</strong> Gerätetyp, Betriebssystem, App-Version, eindeutige Geräte-ID (zur Sicherstellung der Kompatibilität und für Push-Benachrichtigungen)</li>
              <li><strong>Push-Token:</strong> Für den Versand von Push-Benachrichtigungen (nur mit Einwilligung, Art. 6 Abs. 1 lit. a DSGVO)</li>
              <li><strong>Kamera-Zugriff:</strong> Zum Fotografieren von Anlagen, Zählern und Dokumenten (nur mit Einwilligung, Speicherung auf unseren Servern)</li>
              <li><strong>Standortdaten:</strong> Nur bei ausdrücklicher Freigabe, zur automatischen Erfassung des Anlagenstandorts (Art. 6 Abs. 1 lit. a DSGVO)</li>
              <li><strong>Offline-Daten:</strong> Lokal auf dem Gerät zwischengespeicherte Anlagendaten, verschlüsselt gespeichert, Synchronisierung bei Internetverbindung</li>
              <li><strong>Crash-Reports:</strong> Anonymisierte Absturzberichte zur Verbesserung der App-Stabilität (Art. 6 Abs. 1 lit. f DSGVO)</li>
            </ul>
            <p>
              Berechtigungen (Kamera, Standort, Push) können jederzeit in den Geräteeinstellungen
              widerrufen werden. Die Funktionalität der App kann dadurch eingeschränkt sein.
            </p>
          </div>

          {/* ===================== 23. DIENSTE DRITTER ===================== */}
          <div className="legal-section">
            <h2>23. Eingebundene Dienste Dritter</h2>
            <h3>23.1 Google Fonts</h3>
            <p>
              Unsere Website nutzt Schriftarten von Google Fonts. Die Einbindung erfolgt
              lokal von unseren Servern (Self-Hosting), sodass keine Verbindung zu
              Google-Servern hergestellt wird und keine Daten an Google übermittelt werden.
            </p>
            <h3>23.2 Kartendienste und Satellitenbilder</h3>
            <p>
              Für die Darstellung von Lageplänen und die automatische Lageplanerstellung können
              Kartendienste und Satellitenbilder-APIs eingebunden werden. Dabei werden die
              Geokoordinaten des Anlagenstandorts an den jeweiligen Dienst übermittelt.
            </p>
            <p>
              Sofern Google Maps verwendet wird, erfolgt die Einbindung nur mit vorheriger
              Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Bei Nutzung von OpenStreetMap erfolgt
              keine Übermittlung personenbezogener Daten an Dritte, da die Kartendaten lokal
              verarbeitet werden.
            </p>
            <h3>23.3 Videokonferenz-Tools</h3>
            <p>
              Für Online-Meetings und Support-Gespräche können Videokonferenz-Tools (z. B. Zoom,
              Microsoft Teams, Google Meet) eingesetzt werden. Die Teilnahme an Videokonferenzen
              ist freiwillig. Dabei können folgende Daten verarbeitet werden:
            </p>
            <ul>
              <li>Name, E-Mail-Adresse der Teilnehmer</li>
              <li>IP-Adresse und Geräte-Informationen</li>
              <li>Audio- und Videodaten (nicht aufgezeichnet, sofern nicht ausdrücklich angekündigt und mit Einwilligung)</li>
              <li>Chat-Nachrichten während der Konferenz</li>
              <li>Zeitpunkt und Dauer der Teilnahme</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw.
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effektiver Kommunikation).
              Bei Aufzeichnungen: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
            </p>
          </div>

          {/* ===================== 24. BOT-SCHUTZ / CAPTCHA (NEU) ===================== */}
          <div className="legal-section">
            <h2>24. Bot-Schutz und Captcha</h2>
            <h3>24.1 Einsatz von Bot-Schutz</h3>
            <p>
              Zum Schutz unserer Plattform vor automatisierten Angriffen (Bots, Scraping,
              Brute-Force-Angriffe) setzen wir technische Schutzmaßnahmen ein. Dies kann
              die Einbindung eines Captcha-Dienstes umfassen.
            </p>
            <h3>24.2 Verarbeitete Daten</h3>
            <p>
              Im Rahmen des Bot-Schutzes können folgende Daten verarbeitet werden:
            </p>
            <ul>
              <li>IP-Adresse und Geräte-Fingerprint</li>
              <li>Mausbewegungen und Scrollverhalten (zur Unterscheidung von Menschen und Bots)</li>
              <li>Browser- und Betriebssystem-Informationen</li>
              <li>Zeitstempel und Häufigkeit der Zugriffe</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
              der Sicherheit der Plattform) i. V. m. § 25 Abs. 2 TDDDG (technisch erforderlicher
              Zugriff auf das Endgerät).
            </p>
            <h3>24.3 Datenschutzfreundliche Lösung</h3>
            <p>
              Wir setzen nach Möglichkeit datenschutzfreundliche Bot-Schutz-Lösungen ein, die
              keine Daten an Drittanbieter übermitteln (Server-seitiges Rate-Limiting,
              honeypot-basierte Lösungen). Sollte ein externer Captcha-Dienst eingesetzt
              werden, wird der Nutzer hierüber vorab informiert.
            </p>
          </div>

          {/* ===================== 25. SOCIAL MEDIA ===================== */}
          <div className="legal-section">
            <h2>25. Social-Media-Präsenzen</h2>
            <p>
              Wir unterhalten Präsenzen auf sozialen Netzwerken (z. B. LinkedIn, Instagram, Facebook),
              um mit Kunden und Interessenten zu kommunizieren. Beim Besuch unserer
              Social-Media-Seiten werden Daten durch den jeweiligen Plattformbetreiber verarbeitet.
            </p>
            <p>
              Wir weisen darauf hin, dass Ihre Daten dabei auch außerhalb der EU/des EWR verarbeitet
              werden können. Hinsichtlich Facebook/Instagram besteht gemäß Art. 26 DSGVO eine
              gemeinsame Verantwortlichkeit (Joint Controllership) mit Meta Platforms Ireland Ltd.
              für die Verarbeitung von Insights-Daten (Seitenstatistiken).
            </p>
            <p>
              Wir haben mit Meta eine Vereinbarung gemäß Art. 26 DSGVO geschlossen
              (Page Insights Addendum). Betroffene können ihre Rechte sowohl gegenüber uns
              als auch gegenüber dem Plattformbetreiber geltend machen.
            </p>
            <p>
              Wir empfehlen, die Datenschutzeinstellungen der jeweiligen Plattform regelmäßig
              zu überprüfen und anzupassen.
            </p>
          </div>

          {/* ===================== 26. BEWERBUNGEN ===================== */}
          <div className="legal-section">
            <h2>26. Datenschutz bei Bewerbungen</h2>
            <h3>26.1 Verarbeitung von Bewerberdaten</h3>
            <p>
              Sofern Sie sich bei uns bewerben, verarbeiten wir folgende Daten:
            </p>
            <ul>
              <li>Anschreiben, Lebenslauf, Zeugnisse und Zertifikate</li>
              <li>Kontaktdaten (Name, E-Mail, Telefonnummer, Adresse)</li>
              <li>Berufserfahrung und Qualifikationen</li>
              <li>Gehaltsvorstellungen und frühester Eintrittstermin</li>
              <li>Freiwillige Angaben (Foto, Hobbys, Ehrenamt)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> § 26 BDSG i. V. m. Art. 88 DSGVO (Durchführung des
              Bewerbungsverfahrens).
            </p>
            <h3>26.2 Speicherdauer</h3>
            <p>
              Bei Absage werden die Bewerbungsunterlagen sechs (6) Monate nach Abschluss des
              Verfahrens gelöscht (§ 15 Abs. 4 AGG). Mit Ihrer Einwilligung können die
              Unterlagen bis zu zwölf (12) Monate in unseren Talentpool aufgenommen werden.
              Bei Einstellung werden die Daten in die Personalakte übernommen.
            </p>
            <h3>26.3 Bewerbung per E-Mail</h3>
            <p>
              Bitte beachten Sie, dass unverschlüsselte E-Mails nicht gegen den Zugriff Dritter
              geschützt sind. Wir empfehlen für die Übersendung vertraulicher Bewerbungsunterlagen
              die Verwendung verschlüsselter E-Mails oder die postalische Bewerbung.
            </p>
          </div>

          {/* ===================== 27. MINDERJÄHRIGE ===================== */}
          <div className="legal-section">
            <h2>27. Datenverarbeitung von Minderjährigen</h2>
            <p>
              Unsere Plattform richtet sich ausschließlich an gewerbliche Kunden (B2B) und nicht
              an Kinder und Jugendliche unter 16 Jahren. Wir erheben wissentlich keine
              personenbezogenen Daten von Minderjährigen. Sollten wir Kenntnis davon erlangen,
              dass Daten eines Minderjährigen ohne Einwilligung des Erziehungsberechtigten
              verarbeitet werden, werden wir diese Daten unverzüglich löschen.
            </p>
          </div>

          {/* ===================== 28. DSFA ===================== */}
          <div className="legal-section">
            <h2>28. Datenschutz-Folgenabschätzung (DSFA)</h2>
            <p>
              Für Verarbeitungstätigkeiten, die voraussichtlich ein hohes Risiko für die
              Rechte und Freiheiten natürlicher Personen zur Folge haben, führen wir
              Datenschutz-Folgenabschätzungen gemäß Art. 35 DSGVO durch. Dies betrifft
              insbesondere:
            </p>
            <ul>
              <li>Die KI-gestützte Verarbeitung von Anlagendaten und Bildern</li>
              <li>Die Verarbeitung großer Mengen von Endkundendaten im Rahmen der Auftragsverarbeitung</li>
              <li>Die systematische Überwachung öffentlich zugänglicher Bereiche (sofern Satellitenbilder personenbezogene Daten enthalten)</li>
            </ul>
            <p>
              Die Ergebnisse der DSFA werden dokumentiert und regelmäßig überprüft.
              Bei Bedarf werden zusätzliche Schutzmaßnahmen implementiert oder eine
              Konsultation der Aufsichtsbehörde gemäß Art. 36 DSGVO durchgeführt.
            </p>
          </div>

          {/* ===================== 29. PRIVACY BY DESIGN (NEU) ===================== */}
          <div className="legal-section">
            <h2>29. Privacy by Design und Privacy by Default (Art. 25 DSGVO)</h2>
            <h3>29.1 Privacy by Design</h3>
            <p>
              Wir berücksichtigen den Datenschutz bereits bei der Entwicklung und Gestaltung
              unserer Plattform (Privacy by Design, Art. 25 Abs. 1 DSGVO). Dies umfasst
              insbesondere:
            </p>
            <ul>
              <li>Datenminimierung: Wir erheben nur die Daten, die für den jeweiligen Zweck tatsächlich erforderlich sind</li>
              <li>Pseudonymisierung: Wo möglich, werden personenbezogene Daten pseudonymisiert verarbeitet</li>
              <li>Verschlüsselung: Alle sensiblen Daten werden verschlüsselt gespeichert und übertragen</li>
              <li>Zugriffskontrolle: Strikte rollenbasierte Zugriffsbeschränkungen (Least Privilege)</li>
              <li>Zweckbindung: Daten werden nur für den spezifischen Zweck verarbeitet, für den sie erhoben wurden</li>
              <li>Löschkonzept: Automatisierte Löschroutinen stellen die fristgerechte Löschung sicher</li>
            </ul>
            <h3>29.2 Privacy by Default</h3>
            <p>
              Unsere Plattform ist standardmäßig so konfiguriert, dass nur die für den
              jeweiligen Zweck erforderlichen personenbezogenen Daten verarbeitet werden
              (Privacy by Default, Art. 25 Abs. 2 DSGVO). Insbesondere:
            </p>
            <ul>
              <li>Optionale Datenfelder sind standardmäßig nicht ausgefüllt</li>
              <li>Marketing-Einwilligungen sind standardmäßig nicht erteilt (Opt-In-Verfahren)</li>
              <li>Push-Benachrichtigungen und Standortfreigabe sind standardmäßig deaktiviert</li>
              <li>Profilbild und weitere optionale Informationen werden nicht standardmäßig erhoben</li>
              <li>Die Sichtbarkeit von Nutzerdaten ist auf das Minimum beschränkt</li>
            </ul>
          </div>

          {/* ===================== 30. DO NOT TRACK (NEU) ===================== */}
          <div className="legal-section">
            <h2>30. Do Not Track (DNT)</h2>
            <p>
              Unsere Plattform respektiert das „Do Not Track"-Signal (DNT) des Browsers.
              Da wir grundsätzlich kein Tracking über Drittanbieter-Cookies einsetzen, hat
              das DNT-Signal derzeit keine praktische Auswirkung auf die Datenverarbeitung.
              Sollten wir zukünftig Tracking-Technologien einsetzen, werden wir das DNT-Signal
              entsprechend berücksichtigen.
            </p>
            <p>
              Wir empfehlen Nutzern dennoch, die DNT-Funktion in ihren Browsereinstellungen
              zu aktivieren, um generell gegenüber Websites ihre Präferenz bezüglich Tracking
              zum Ausdruck zu bringen.
            </p>
          </div>

          {/* ===================== 31. REMARKETING / A/B / AFFILIATE (NEU) ===================== */}
          <div className="legal-section">
            <h2>31. Remarketing, A/B-Testing und Affiliate-Tracking</h2>
            <h3>31.1 Remarketing und Retargeting</h3>
            <p>
              Wir setzen derzeit keine Remarketing- oder Retargeting-Technologien ein
              (z. B. Google Ads Remarketing, Facebook Custom Audiences). Sollte dies
              zukünftig erfolgen, geschieht dies ausschließlich auf Basis einer vorherigen
              ausdrücklichen Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO i. V. m.
              § 25 Abs. 1 TDDDG.
            </p>
            <h3>31.2 A/B-Testing</h3>
            <p>
              Zur Optimierung unserer Plattform können wir A/B-Tests durchführen, bei denen
              verschiedene Versionen einer Seite oder Funktion an unterschiedliche Nutzergruppen
              ausgespielt werden. Die Zuordnung zu Testgruppen erfolgt anonymisiert oder
              pseudonymisiert. Es werden keine personenbezogenen Daten für A/B-Tests an
              Dritte übermittelt.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              an der Verbesserung der Benutzerfreundlichkeit). Sofern hierfür Cookies oder
              lokale Speichertechnologien eingesetzt werden: § 25 Abs. 2 TDDDG (technisch
              erforderlich) oder § 25 Abs. 1 TDDDG (mit Einwilligung).
            </p>
            <h3>31.3 Affiliate-Tracking</h3>
            <p>
              Wir setzen derzeit kein Affiliate-Tracking ein. Sollte dies zukünftig eingeführt
              werden, wird der Nutzer hierüber im Rahmen der Cookie-Einwilligung informiert.
              Affiliate-Cookies werden nur mit vorheriger Einwilligung gesetzt.
            </p>
          </div>

          {/* ===================== 32. SSO (NEU) ===================== */}
          <div className="legal-section">
            <h2>32. Single Sign-On (SSO) und externe Authentifizierung</h2>
            <h3>32.1 SSO-Angebote</h3>
            <p>
              Wir können dem Auftraggeber die Möglichkeit bieten, sich über externe
              Identitätsanbieter (Identity Provider, IdP) anzumelden, z. B. über
              SAML 2.0 oder OpenID Connect. Die Nutzung von SSO ist freiwillig.
            </p>
            <h3>32.2 Verarbeitete Daten bei SSO</h3>
            <p>Bei Nutzung von SSO werden folgende Daten vom Identitätsanbieter an uns übermittelt:</p>
            <ul>
              <li>Eindeutige Nutzer-ID (Subject Identifier)</li>
              <li>E-Mail-Adresse</li>
              <li>Vorname und Nachname (sofern vom IdP bereitgestellt)</li>
              <li>Gruppenzugehörigkeiten (sofern für die Rollenzuordnung konfiguriert)</li>
            </ul>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              Die Datenverarbeitung durch den externen Identitätsanbieter unterliegt dessen
              eigener Datenschutzerklärung.
            </p>
            <h3>32.3 Verantwortlichkeit</h3>
            <p>
              Der Auftraggeber ist für die Konfiguration und Sicherheit seines Identitätsanbieters
              selbst verantwortlich. Der Anbieter haftet nicht für Sicherheitsvorfälle, die
              auf einer Kompromittierung des externen Identitätsanbieters beruhen.
            </p>
          </div>

          {/* ===================== 33. BROWSER-OPT-OUT (NEU) ===================== */}
          <div className="legal-section">
            <h2>33. Browser-basierte Opt-Out-Möglichkeiten</h2>
            <h3>33.1 Cookie-Einstellungen</h3>
            <p>
              Sie können die Speicherung von Cookies über die Einstellungen Ihres Browsers
              verhindern. Die meisten Browser ermöglichen es, Cookies automatisch zu blockieren
              oder bei jedem Cookie eine Abfrage anzuzeigen. Bitte beachten Sie, dass die
              Einschränkung von Cookies die Funktionalität der Plattform beeinträchtigen kann.
            </p>
            <h3>33.2 Opt-Out-Links für gängige Browser</h3>
            <p>
              Anleitungen zur Verwaltung und Löschung von Cookies finden Sie in der Hilfe
              Ihres Browsers. Für die gängigsten Browser:
            </p>
            <ul>
              <li><strong>Google Chrome:</strong> Einstellungen → Datenschutz und Sicherheit → Cookies und andere Websitedaten</li>
              <li><strong>Mozilla Firefox:</strong> Einstellungen → Datenschutz & Sicherheit → Cookies und Website-Daten</li>
              <li><strong>Apple Safari:</strong> Einstellungen → Datenschutz → Cookies und Websitedaten verwalten</li>
              <li><strong>Microsoft Edge:</strong> Einstellungen → Cookies und Websiteberechtigungen</li>
            </ul>
            <h3>33.3 JavaScript und lokale Speicher</h3>
            <p>
              Die Plattform benötigt JavaScript und Zugriff auf den lokalen Speicher (localStorage)
              des Browsers, um ordnungsgemäß zu funktionieren. Das Deaktivieren von JavaScript
              oder das Blockieren des lokalen Speichers führt dazu, dass die Plattform nicht
              nutzbar ist.
            </p>
          </div>

          {/* ===================== 34. ZERTIFIZIERUNGEN (NEU) ===================== */}
          <div className="legal-section">
            <h2>34. Zertifizierungen und Verhaltensregeln</h2>
            <h3>34.1 Zertifizierungen</h3>
            <p>
              Der Anbieter strebt die Zertifizierung nach anerkannten Standards an, insbesondere:
            </p>
            <ul>
              <li><strong>ISO/IEC 27001:</strong> Informationssicherheits-Managementsystem (ISMS)</li>
              <li><strong>ISO/IEC 27701:</strong> Erweiterung für Datenschutz-Managementsysteme (PIMS)</li>
              <li><strong>SOC 2 Type II:</strong> Service Organization Controls für Sicherheit, Verfügbarkeit und Vertraulichkeit</li>
            </ul>
            <p>
              Der aktuelle Stand der Zertifizierungen kann auf Anfrage mitgeteilt werden.
              Zertifikate und Auditberichte können dem Auftraggeber im Rahmen der
              Audit-Regelungen zur Verfügung gestellt werden.
            </p>
            <h3>34.2 Verhaltensregeln (Art. 40 DSGVO)</h3>
            <p>
              Der Anbieter kann sich genehmigten Verhaltensregeln gemäß Art. 40 DSGVO
              unterwerfen, sofern branchenspezifische Verhaltensregeln für SaaS-Anbieter
              oder die Energiewirtschaft vorliegen. Der Auftraggeber wird über eine solche
              Unterwerfung informiert.
            </p>
            <h3>34.3 Datenschutz-Siegel</h3>
            <p>
              Der Anbieter kann Datenschutz-Siegel oder -Zertifizierungen gemäß Art. 42 DSGVO
              erwerben, um die Einhaltung der DSGVO bei Verarbeitungsvorgängen nachzuweisen.
              Solche Zertifizierungen ersetzen jedoch nicht die Pflichten des Anbieters aus
              der DSGVO und haben keine bindende Wirkung für die Aufsichtsbehörden.
            </p>
          </div>

          {/* ===================== 35. VERZEICHNIS ===================== */}
          <div className="legal-section">
            <h2>35. Verzeichnis von Verarbeitungstätigkeiten</h2>
            <p>
              Wir führen ein Verzeichnis von Verarbeitungstätigkeiten gemäß Art. 30 DSGVO.
              Dieses Verzeichnis enthält insbesondere Angaben zu den Zwecken der Verarbeitung,
              den Kategorien betroffener Personen und personenbezogener Daten, den Empfängern,
              den vorgesehenen Löschfristen und einer allgemeinen Beschreibung der technischen
              und organisatorischen Maßnahmen. Das Verzeichnis wird auf Anfrage der
              Aufsichtsbehörde zur Verfügung gestellt.
            </p>
          </div>

          {/* ===================== 36. ÄNDERUNGEN ===================== */}
          <div className="legal-section">
            <h2>36. Änderung dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei technischen
              Weiterentwicklungen, Änderungen unserer Dienstleistungen oder bei Änderungen
              der Rechtslage anzupassen. Die jeweils aktuelle Fassung ist stets unter
              https://baunity.de/datenschutz abrufbar.
            </p>
            <p>
              Bei wesentlichen Änderungen, die Ihre Rechte als betroffene Person betreffen,
              werden wir Sie gesondert per E-Mail oder über die Plattform mindestens vier (4)
              Wochen vor Inkrafttreten der Änderungen informieren.
            </p>
          </div>

          <div className="legal-section">
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Stand dieser Datenschutzerklärung: Februar 2026 — Baunity, Südstraße 31, 47475 Kamp-Lintfort
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
