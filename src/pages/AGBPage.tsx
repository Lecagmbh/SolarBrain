import { Link } from 'react-router-dom';

export default function AGBPage() {
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
            <h1>Allgemeine Geschäftsbedingungen</h1>
            <p className="subtitle">Baunity — Stand: Februar 2026</p>
          </div>

          {/* ===================== PRÄAMBEL ===================== */}
          <div className="legal-section">
            <h2>Präambel</h2>
            <p>
              Baunity (nachfolgend „Anbieter", „wir" oder „Baunity"), mit europäischer
              Geschäftsadresse in Südstraße 31, 47475 Kamp-Lintfort, Deutschland, betreibt eine
              Software-as-a-Service-Plattform (SaaS) für die digitale Abwicklung von Netzanmeldungen
              im Bereich erneuerbarer Energien. Die Plattform richtet sich ausschließlich an gewerbliche
              Kunden (B2B), insbesondere Elektro-Fachbetriebe, Installateure, Solarteure, Planungsbüros
              und sonstige Unternehmen der Energiewirtschaft (nachfolgend „Auftraggeber" oder „Kunde").
            </p>
            <p>
              Die nachfolgenden Allgemeinen Geschäftsbedingungen (AGB) regeln das Vertragsverhältnis
              zwischen dem Anbieter und dem Auftraggeber für die Nutzung der Baunity-Plattform
              einschließlich aller damit verbundenen Dienstleistungen, Applikationen und Schnittstellen.
            </p>
          </div>

          {/* ===================== § 1 ===================== */}
          <div className="legal-section">
            <h2>§ 1 Geltungsbereich und Begriffsbestimmungen</h2>
            <h3>1.1 Geltungsbereich</h3>
            <p>
              Diese AGB gelten für sämtliche Geschäftsbeziehungen zwischen dem Anbieter und dem
              Auftraggeber, die im Zusammenhang mit der Nutzung der Baunity-Plattform stehen.
              Dies umfasst insbesondere:
            </p>
            <ul>
              <li>Die Bereitstellung und Nutzung des Baunity-Webportals</li>
              <li>Die Nutzung der GridFlow-App (iOS und Android)</li>
              <li>Die Nutzung des WhatsApp-Erfassungskanals</li>
              <li>Die Nutzung des Endkunden-Portals</li>
              <li>Die Bereitstellung von API-Schnittstellen</li>
              <li>White-Label-Lösungen</li>
              <li>Sämtliche damit verbundene Beratungs-, Konfigurations- und Supportleistungen</li>
              <li>Beta- und Testfunktionen, soweit diese dem Auftraggeber zugänglich gemacht werden</li>
            </ul>
            <h3>1.2 Ausschluss abweichender Bedingungen</h3>
            <p>
              Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen des
              Auftraggebers werden nicht Vertragsbestandteil, es sei denn, der Anbieter hat ihrer
              Geltung ausdrücklich und schriftlich zugestimmt. Dies gilt auch dann, wenn der Anbieter
              in Kenntnis entgegenstehender oder abweichender Bedingungen des Auftraggebers
              Leistungen vorbehaltlos erbringt. Das Schweigen des Anbieters auf abweichende
              Bedingungen des Auftraggebers gilt in keinem Fall als Zustimmung.
            </p>
            <h3>1.3 Begriffsbestimmungen</h3>
            <p>Im Sinne dieser AGB gelten folgende Definitionen:</p>
            <ul>
              <li><strong>Plattform:</strong> Die Baunity-Software einschließlich Webportal, mobile Applikationen, APIs und alle zugehörigen Dienste.</li>
              <li><strong>Netzanmeldung:</strong> Der Prozess der Anmeldung einer Energieanlage (z. B. PV-Anlage, Speicher, Wallbox, Wärmepumpe) bei dem zuständigen Netzbetreiber.</li>
              <li><strong>Netzbetreiber (NB):</strong> Der zuständige Verteilnetzbetreiber im Sinne des EnWG.</li>
              <li><strong>Endkunde:</strong> Der Anlagenbetreiber bzw. Eigentümer der Energieanlage, für den der Auftraggeber die Netzanmeldung durchführt.</li>
              <li><strong>Nutzer:</strong> Jede natürliche Person, die vom Auftraggeber zur Nutzung der Plattform berechtigt wurde.</li>
              <li><strong>Anlage:</strong> Eine in der Plattform erfasste Energieerzeugungsanlage, Speicher- oder Ladeeinrichtung.</li>
              <li><strong>White-Label:</strong> Eine individuell gebrandete Version der Plattform unter der Marke des Auftraggebers.</li>
              <li><strong>API:</strong> Application Programming Interface — Programmierschnittstelle zum automatisierten Datenaustausch mit der Plattform.</li>
              <li><strong>SLA:</strong> Service Level Agreement — Vereinbarung über die Qualität und Verfügbarkeit der Plattform.</li>
              <li><strong>Beta-Funktion:</strong> Eine Funktion, die sich in der Erprobungsphase befindet und als „Beta", „Vorschau" oder „experimentell" gekennzeichnet ist.</li>
              <li><strong>Wartungsfenster:</strong> Ein vorab angekündigter Zeitraum, in dem die Plattform ganz oder teilweise nicht verfügbar ist.</li>
              <li><strong>Subunternehmer:</strong> Dritte, die der Anbieter zur Erbringung von Teilleistungen einsetzt.</li>
            </ul>
            <h3>1.4 Maßgebliche Fassung</h3>
            <p>
              Es gilt die zum Zeitpunkt des Vertragsschlusses bzw. der jeweiligen Bestellung gültige
              Fassung dieser AGB. Die jeweils aktuelle Version ist unter https://baunity.de/agb abrufbar.
            </p>
            <h3>1.5 Vorrang von Individualvereinbarungen</h3>
            <p>
              Individuelle Vereinbarungen zwischen dem Anbieter und dem Auftraggeber (z. B. in einem
              Rahmenvertrag, einer Auftragsbestätigung oder einem Service Level Agreement) haben
              Vorrang vor diesen AGB, soweit sie von den Regelungen dieser AGB abweichen.
            </p>
          </div>

          {/* ===================== § 2 ===================== */}
          <div className="legal-section">
            <h2>§ 2 Leistungsgegenstand</h2>
            <h3>2.1 Kernleistungen</h3>
            <p>
              Der Anbieter stellt dem Auftraggeber eine webbasierte SaaS-Plattform zur Verfügung,
              die folgende Kernleistungen umfasst:
            </p>
            <ul>
              <li>Erfassung und Verwaltung von Anlagendaten (PV-Anlagen, Batteriespeicher, Wallboxen, Wärmepumpen und weitere Energieanlagen)</li>
              <li>Automatische Erstellung von Netzanmeldungsunterlagen, einschließlich Übersichtsschaltpläne, Lagepläne, VDE-Formulare (E.1 bis E.8), Vollmachten und Inbetriebnahmeprotokolle</li>
              <li>Zugriff auf eine Produktdatenbank mit über 15.000 Komponenten (PV-Module, Wechselrichter, Speicher, Wallboxen) inkl. technischer Datenblätter und ZEREZ-IDs</li>
              <li>Automatische Zuordnung und Kommunikation mit über 850 deutschen Netzbetreibern</li>
              <li>Status-Tracking und Dashboard-Funktionen (Kanban, Tabelle, Kartenansicht)</li>
              <li>Team- und Rollenverwaltung (Admin, Mitarbeiter, Handelsvertreter, Endkunde)</li>
              <li>E-Mail-Automatisierung und Benachrichtigungssystem</li>
              <li>Dokumentenmanagement und -archivierung</li>
              <li>Rechnungsverwaltung und Buchhaltungsmodul</li>
              <li>Kalender- und Terminbuchungsfunktionen</li>
              <li>Intelligence-Dashboard und Analytik-Funktionen</li>
              <li>Regelbasierte Automatisierungen und Workflows</li>
            </ul>
            <h3>2.2 Zusätzliche Kanäle</h3>
            <p>Neben dem Webportal bietet der Anbieter folgende zusätzliche Erfassungskanäle:</p>
            <ul>
              <li><strong>GridFlow App:</strong> Native Mobile-App für iOS und Android zur Erfassung von Anlagendaten direkt vor Ort, einschließlich Offline-Funktionalität und Kameranutzung.</li>
              <li><strong>WhatsApp-Integration:</strong> KI-gestützter Erfassungskanal über WhatsApp Business API zur automatisierten Datenerfassung per Chat.</li>
              <li><strong>Endkunden-Portal:</strong> Separates Portal für Endkunden mit Zugriff auf Dokumenten-Download, Statusanzeige und Nachrichtenfunktion.</li>
              <li><strong>API-Schnittstelle:</strong> RESTful API für die Integration mit Drittanbieter-Software (ERP, CRM, PV-Planungstools).</li>
            </ul>
            <h3>2.3 Leistungsausschlüsse</h3>
            <p>Nicht Gegenstand der Leistungen des Anbieters sind insbesondere:</p>
            <ul>
              <li>Elektrotechnische Planungen, Berechnungen oder Installationen</li>
              <li>Baugenehmigungen, Statik-Nachweise oder sonstige behördliche Genehmigungen</li>
              <li>Die physische Installation, Inbetriebnahme oder Wartung von Anlagen</li>
              <li>Rechtsberatung, Steuerberatung oder Wirtschaftsprüfung</li>
              <li>Die Garantie für die Erteilung einer Netzanschlusszusage durch den Netzbetreiber</li>
              <li>Die Überprüfung der technischen Richtigkeit der vom Auftraggeber bereitgestellten Daten</li>
              <li>Die Beschaffung von Materialien, Komponenten oder Beistellpflichten des Auftraggebers</li>
              <li>Die Bereitstellung von Hardware, Endgeräten oder Internetzugängen</li>
              <li>Individuelle Softwareentwicklung, es sei denn, dies wird gesondert vereinbart</li>
            </ul>
          </div>

          {/* ===================== § 3 NUTZUNGSLIMITS (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 3 Nutzungslimits und Fair-Use</h2>
            <h3>3.1 Tarifabhängige Limits</h3>
            <p>
              Die Nutzung der Plattform unterliegt tarifabhängigen Nutzungslimits. Die konkreten
              Limits (maximale Anzahl Nutzerkonten, Speicherplatz, Netzanmeldungen pro Monat,
              API-Aufrufe) ergeben sich aus dem jeweils vereinbarten Tarif bzw. der individuellen
              Vereinbarung. Der Anbieter stellt dem Auftraggeber eine Übersicht seiner aktuellen
              Kontingente über die Plattform zur Verfügung.
            </p>
            <h3>3.2 Speicher- und Upload-Limits</h3>
            <p>
              Pro Account gelten folgende Standardlimits, sofern nicht individuell abweichend vereinbart:
            </p>
            <ul>
              <li>Maximale Dateigröße pro Upload: 50 MB</li>
              <li>Maximaler Gesamtspeicher pro Account: gemäß Tarifvereinbarung</li>
              <li>Zulässige Dateiformate: PDF, JPG, PNG, TIFF, CSV, XML, JSON und weitere gängige Formate</li>
              <li>Maximale Anzahl gleichzeitiger API-Verbindungen: gemäß API-Dokumentation</li>
            </ul>
            <h3>3.3 Fair-Use-Policy</h3>
            <p>
              Der Auftraggeber verpflichtet sich, die Plattform im Rahmen einer angemessenen
              geschäftlichen Nutzung zu verwenden. Eine Nutzung, die deutlich über das übliche Maß
              hinausgeht und die Plattformperformance für andere Nutzer beeinträchtigt, stellt
              einen Verstoß gegen die Fair-Use-Policy dar. Der Anbieter wird den Auftraggeber
              vor Ergreifung von Maßnahmen informieren und eine angemessene Frist zur Abhilfe setzen.
            </p>
            <h3>3.4 Überschreitung von Kontingenten</h3>
            <p>
              Bei Überschreitung der vereinbarten Kontingente wird der Auftraggeber per E-Mail
              und/oder über die Plattform benachrichtigt. Der Anbieter kann bei wiederholter
              Überschreitung ein Upgrade auf einen höheren Tarif anbieten oder die über das
              Kontingent hinausgehende Nutzung nach der jeweils gültigen Preisliste gesondert abrechnen.
            </p>
          </div>

          {/* ===================== § 4 SLA ===================== */}
          <div className="legal-section">
            <h2>§ 4 Verfügbarkeit und Service Level</h2>
            <h3>4.1 Verfügbarkeitsziel</h3>
            <p>
              Der Anbieter bemüht sich um eine Verfügbarkeit der Plattform von 99,5 % im
              Jahresmittel, gemessen am Kalendermonat. Die Verfügbarkeit berechnet sich
              nach folgender Formel: Verfügbarkeit (%) = ((Gesamtminuten im Monat – Ausfallminuten)
              / Gesamtminuten im Monat) × 100.
            </p>
            <h3>4.2 Ausnahmen von der Verfügbarkeitsberechnung</h3>
            <p>Folgende Zeiten werden nicht als Ausfallzeiten gewertet:</p>
            <ul>
              <li>Geplante Wartungsfenster gemäß § 4.3</li>
              <li>Ausfälle aufgrund höherer Gewalt gemäß § 27</li>
              <li>Ausfälle, die durch den Auftraggeber oder dessen Nutzer verursacht werden</li>
              <li>Ausfälle aufgrund von Störungen bei Drittdiensten (z. B. Netzbetreiber-Portale, Cloud-Provider, DNS-Anbieter)</li>
              <li>Ausfälle aufgrund von behördlichen Anordnungen</li>
              <li>DDoS-Angriffe oder sonstige Cyberangriffe, sofern der Anbieter angemessene Schutzmaßnahmen getroffen hat</li>
              <li>Ausfälle einzelner Beta-Funktionen gemäß § 8</li>
            </ul>
            <h3>4.3 Wartungsfenster</h3>
            <p>
              Geplante Wartungsarbeiten werden mindestens 48 Stunden im Voraus per E-Mail oder
              über die Plattform angekündigt. Der Anbieter ist bestrebt, Wartungsarbeiten
              außerhalb der üblichen Geschäftszeiten (Montag bis Freitag, 08:00–18:00 Uhr MEZ/MESZ)
              durchzuführen. In dringenden Fällen (z. B. kritische Sicherheitsupdates) kann die
              Ankündigungsfrist auf 4 Stunden verkürzt werden.
            </p>
            <h3>4.4 Notfallwartung</h3>
            <p>
              Der Anbieter ist berechtigt, ungeplante Notfallwartungen durchzuführen, wenn die
              Sicherheit, Integrität oder Stabilität der Plattform unmittelbar gefährdet ist.
              Der Auftraggeber wird unverzüglich über den Beginn und die voraussichtliche Dauer
              der Notfallwartung informiert.
            </p>
            <h3>4.5 Support</h3>
            <p>
              Der Anbieter bietet Support per E-Mail während der Geschäftszeiten (Montag bis
              Freitag, 09:00–17:00 Uhr MEZ/MESZ, ausgenommen gesetzliche Feiertage in
              Baden-Württemberg). Reaktionszeiten sind abhängig von der Priorität:
            </p>
            <ul>
              <li><strong>Kritisch</strong> (Plattform vollständig nicht nutzbar): Reaktion innerhalb von 4 Stunden</li>
              <li><strong>Hoch</strong> (wesentliche Funktionen eingeschränkt): Reaktion innerhalb von 8 Stunden</li>
              <li><strong>Normal</strong> (einzelne Funktionen betroffen): Reaktion innerhalb von 2 Werktagen</li>
              <li><strong>Niedrig</strong> (Fragen, Wünsche, kosmetische Fehler): Reaktion innerhalb von 5 Werktagen</li>
            </ul>
            <p>
              Reaktionszeit bedeutet die erste qualifizierte Rückmeldung, nicht die Behebung.
              Die genannten Zeiten sind Richtwerte, sofern kein individuelles SLA vereinbart wurde.
            </p>
            <h3>4.6 Individuelles SLA</h3>
            <p>
              Abweichende Verfügbarkeitsziele, garantierte Reaktionszeiten und Eskalationsstufen
              können in einem individuellen SLA vereinbart werden. Solche Vereinbarungen gehen diesen AGB vor.
            </p>
          </div>

          {/* ===================== § 5 SERVICE-CREDITS (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 5 Service-Credits bei SLA-Verletzung</h2>
            <h3>5.1 Voraussetzungen</h3>
            <p>
              Sofern ein individuelles SLA mit verbindlichen Verfügbarkeitsgarantien vereinbart wurde
              und die tatsächliche Verfügbarkeit in einem Kalendermonat die vereinbarte Verfügbarkeit
              unterschreitet, hat der Auftraggeber Anspruch auf Service-Credits in Form einer
              Gutschrift auf die nächste Monatsrechnung.
            </p>
            <h3>5.2 Höhe der Service-Credits</h3>
            <ul>
              <li>Verfügbarkeit 99,0 % – 99,49 %: Gutschrift von 5 % der monatlichen Vergütung</li>
              <li>Verfügbarkeit 95,0 % – 98,99 %: Gutschrift von 10 % der monatlichen Vergütung</li>
              <li>Verfügbarkeit unter 95,0 %: Gutschrift von 15 % der monatlichen Vergütung</li>
            </ul>
            <h3>5.3 Geltendmachung und Begrenzung</h3>
            <p>
              Service-Credits müssen innerhalb von dreißig (30) Tagen nach Ende des betroffenen
              Kalendermonats schriftlich geltend gemacht werden. Die maximale Gutschrift pro
              Kalendermonat beträgt 15 % der monatlichen Vergütung. Service-Credits stellen
              den alleinigen und ausschließlichen Rechtsbehelf für SLA-Verletzungen dar, soweit
              gesetzlich zulässig. Ein Anspruch auf Barauszahlung besteht nicht. Service-Credits
              verfallen, wenn sie nicht innerhalb von sechs (6) Monaten eingelöst werden.
            </p>
          </div>

          {/* ===================== § 6 VERTRAGSSCHLUSS ===================== */}
          <div className="legal-section">
            <h2>§ 6 Vertragsschluss und Registrierung</h2>
            <h3>6.1 Vertragsschluss</h3>
            <p>Der Vertrag über die Nutzung der Plattform kommt zustande durch:</p>
            <ul>
              <li>Abschluss eines schriftlichen oder elektronischen Vertrags (Auftragsbestätigung, Rahmenvertrag oder Einzelauftrag)</li>
              <li>Registrierung auf der Plattform und Annahme dieser AGB</li>
              <li>Beauftragung per E-Mail mit Bestätigung durch den Anbieter</li>
              <li>Konkludentes Handeln, insbesondere durch Einreichen von Unterlagen zur Netzanmeldung über die Plattform</li>
            </ul>
            <h3>6.2 Registrierung</h3>
            <p>
              Die Nutzung der Plattform setzt eine Registrierung voraus. Der Auftraggeber ist verpflichtet,
              bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen, insbesondere
              Firmenname, Rechtsform, Geschäftsadresse, Ansprechpartner mit Kontaktdaten,
              USt-IdNr. (sofern vorhanden) und Eintragungsnummer im Installateurverzeichnis.
            </p>
            <h3>6.3 Kontoverwaltung und Zugangssicherheit</h3>
            <p>
              Der Auftraggeber ist für die Sicherheit seiner Zugangsdaten allein verantwortlich.
              Er haftet für sämtliche Aktivitäten unter seinen Zugangsdaten, es sei denn, er weist
              einen Missbrauch durch Dritte ohne eigenes Verschulden nach. Der Auftraggeber hat
              angemessene Sicherheitsmaßnahmen zu treffen (starke Passwörter mit mindestens 12 Zeichen,
              regelmäßige Änderung, Zwei-Faktor-Authentifizierung sofern verfügbar).
            </p>
            <h3>6.4 Mehrere Nutzerkonten</h3>
            <p>
              Der Auftraggeber kann mehrere Nutzerkonten für seine Mitarbeiter anlegen und ist
              verantwortlich für die regelmäßige Überprüfung der Zugriffsrechte sowie die
              unverzügliche Deaktivierung bei Ausscheiden eines Mitarbeiters.
            </p>
          </div>

          {/* ===================== § 7 SCHULUNG (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 7 Schulung und Onboarding</h2>
            <h3>7.1 Dokumentation und Selbstschulung</h3>
            <p>
              Der Anbieter stellt dem Auftraggeber eine umfassende Dokumentation zur Verfügung,
              einschließlich Online-Hilfe, Video-Tutorials, FAQ und einer Wissensdatenbank.
              Der Auftraggeber ist verpflichtet, sich und seine Nutzer mit der Bedienung der
              Plattform vertraut zu machen.
            </p>
            <h3>7.2 Onboarding-Phase</h3>
            <p>
              Nach Vertragsschluss bietet der Anbieter eine Onboarding-Phase von bis zu dreißig (30)
              Tagen, in der der Auftraggeber eine erweiterte Unterstützung bei der Einrichtung
              und Erstnutzung der Plattform erhält. Der Umfang des Onboardings richtet sich
              nach dem vereinbarten Tarif.
            </p>
            <h3>7.3 Individuelle Schulungen</h3>
            <p>
              Individuelle Schulungen (vor Ort oder per Videokonferenz) können gegen gesonderte
              Vergütung nach den jeweils gültigen Stundensätzen des Anbieters vereinbart werden.
              Reisekosten für Vor-Ort-Schulungen trägt der Auftraggeber.
            </p>
            <h3>7.4 Verantwortung des Auftraggebers</h3>
            <p>
              Der Auftraggeber ist allein verantwortlich für die Schulung seiner eigenen
              Mitarbeiter und Nutzer. Der Anbieter haftet nicht für Fehler, die auf mangelnde
              Kenntnis der Plattform zurückzuführen sind.
            </p>
          </div>

          {/* ===================== § 8 BETA ===================== */}
          <div className="legal-section">
            <h2>§ 8 Beta-Funktionen und Testumgebungen</h2>
            <h3>8.1 Kennzeichnung</h3>
            <p>
              Der Anbieter kann dem Auftraggeber Funktionen zur Verfügung stellen, die sich in
              der Erprobungsphase befinden. Diese werden als „Beta", „Vorschau", „Preview",
              „experimentell" oder in ähnlicher Weise gekennzeichnet.
            </p>
            <h3>8.2 Haftungsausschluss für Beta-Funktionen</h3>
            <p>
              Beta-Funktionen werden „wie besehen" (as-is) ohne jegliche Gewährleistung
              bereitgestellt. Der Anbieter übernimmt keine Garantie für Fehlerfreiheit,
              Vollständigkeit, Verfügbarkeit oder Eignung. Die Nutzung erfolgt auf eigenes
              Risiko. Die Haftung ist ausgeschlossen, soweit gesetzlich zulässig.
            </p>
            <h3>8.3 Änderung und Einstellung</h3>
            <p>
              Der Anbieter behält sich vor, Beta-Funktionen jederzeit ohne Vorankündigung zu
              ändern, einzuschränken oder einzustellen. Daten, die ausschließlich im
              Rahmen von Beta-Funktionen erfasst wurden, können bei deren Einstellung verloren gehen.
            </p>
            <h3>8.4 Feedback</h3>
            <p>
              Der Auftraggeber erklärt sich damit einverstanden, dass Feedback und Verbesserungsvorschläge
              zu Beta-Funktionen unentgeltlich und unbeschränkt zur Weiterentwicklung verwendet werden dürfen.
            </p>
          </div>

          {/* ===================== § 9 TEST-/DEMOBETRIEB (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 9 Test- und Demobetrieb</h2>
            <h3>9.1 Testumgebung (Sandbox)</h3>
            <p>
              Der Anbieter kann dem Auftraggeber auf Anfrage eine separate Testumgebung
              (Sandbox) bereitstellen. In der Testumgebung können Funktionen der Plattform
              ohne Auswirkung auf Produktivdaten erprobt werden.
            </p>
            <h3>9.2 Testdaten</h3>
            <p>
              Testdaten dürfen keine echten personenbezogenen Daten von Endkunden enthalten,
              sofern nicht ein gesonderter Auftragsverarbeitungsvertrag auch die Testumgebung
              umfasst. Der Anbieter behält sich vor, Testdaten nach dreißig (30) Tagen
              Inaktivität automatisch zu löschen.
            </p>
            <h3>9.3 Demo-Accounts</h3>
            <p>
              Demo-Accounts werden zeitlich befristet für maximal vierzehn (14) Tage
              bereitgestellt, sofern nicht individuell abweichend vereinbart. Nach Ablauf
              der Demo-Phase werden Account und Daten automatisch gelöscht. Der Anbieter
              übernimmt keine Haftung für Datenverluste in Demo-Accounts.
            </p>
            <h3>9.4 Keine Verfügbarkeitsgarantie</h3>
            <p>
              Für Test- und Demoumgebungen gelten keine Verfügbarkeitsgarantien gemäß § 4.
              Der Anbieter kann Testumgebungen jederzeit ohne Vorankündigung einschränken oder abschalten.
            </p>
          </div>

          {/* ===================== § 10 DREIECKSVERHÄLTNIS ===================== */}
          <div className="legal-section">
            <h2>§ 10 Dreiecksverhältnis Auftraggeber – Endkunde – Netzbetreiber</h2>
            <h3>10.1 Rolle des Anbieters</h3>
            <p>
              Der Anbieter fungiert als technischer Dienstleister und Plattformbetreiber. Er wird
              nicht Vertragspartner der Endkunden des Auftraggebers und übernimmt keine Pflichten
              aus dem Verhältnis zwischen Auftraggeber und Endkunde.
            </p>
            <h3>10.2 Vollmachten</h3>
            <p>
              Der Auftraggeber stellt sicher, dass er über die erforderlichen Vollmachten und
              Einwilligungen der Endkunden verfügt, bevor er deren Daten auf der Plattform
              erfasst und an Netzbetreiber übermittelt. Der Anbieter überprüft die Wirksamkeit
              der Vollmachten nicht und haftet nicht für das Fehlen oder die Unwirksamkeit von
              Vollmachten.
            </p>
            <h3>10.3 Kommunikation mit Netzbetreibern</h3>
            <p>
              Soweit die Plattform eine automatische Kommunikation mit Netzbetreibern ermöglicht
              (z. B. E-Mail-Versand, Portal-Upload), handelt der Anbieter ausschließlich auf
              Weisung und im Namen des Auftraggebers. Der Anbieter haftet nicht für die
              Entscheidungen, Reaktionszeiten oder Ablehnungen seitens der Netzbetreiber.
            </p>
            <h3>10.4 Verantwortlichkeit für Datenrichtigkeit</h3>
            <p>
              Der Auftraggeber trägt die alleinige Verantwortung für die Richtigkeit, Vollständigkeit
              und Aktualität aller in die Plattform eingegebenen Daten. Der Anbieter führt keine
              inhaltliche Prüfung der eingegebenen Daten durch und haftet nicht für fehlerhafte
              Netzanmeldungen, die auf unrichtigen oder unvollständigen Eingaben beruhen.
            </p>
          </div>

          {/* ===================== § 11 MITWIRKUNGSPFLICHTEN ===================== */}
          <div className="legal-section">
            <h2>§ 11 Mitwirkungspflichten des Auftraggebers</h2>
            <h3>11.1 Allgemeine Mitwirkungspflichten</h3>
            <p>Der Auftraggeber ist verpflichtet:</p>
            <ul>
              <li>Die Plattform bestimmungsgemäß und unter Beachtung der Dokumentation zu nutzen</li>
              <li>Vollständige und korrekte Daten bereitzustellen</li>
              <li>Änderungen seiner Stammdaten (Firmierung, Adresse, Ansprechpartner) unverzüglich in der Plattform zu aktualisieren</li>
              <li>Zugangsdaten geheim zu halten und den Missbrauch durch Dritte zu verhindern</li>
              <li>Sicherheitsvorfälle und Auffälligkeiten unverzüglich dem Anbieter mitzuteilen</li>
              <li>Notwendige Systemvoraussetzungen (aktueller Browser, stabile Internetverbindung) vorzuhalten</li>
              <li>Den Anbieter bei der Fehlersuche angemessen zu unterstützen</li>
              <li>Eigenverantwortliche Sicherungskopien seiner Daten zu erstellen</li>
            </ul>
            <h3>11.2 Folgen der Verletzung von Mitwirkungspflichten</h3>
            <p>
              Verletzt der Auftraggeber seine Mitwirkungspflichten, ist der Anbieter von der
              Leistungspflicht befreit, soweit die Leistungserbringung durch die fehlende Mitwirkung
              beeinträchtigt wird. Mehrkosten, die durch fehlende oder verspätete Mitwirkung
              entstehen, trägt der Auftraggeber. Schadensersatzansprüche des Auftraggebers sind
              insoweit ausgeschlossen.
            </p>
            <h3>11.3 Besondere Pflichten bei Netzanmeldungen</h3>
            <p>
              Für die Durchführung von Netzanmeldungen ist der Auftraggeber insbesondere verpflichtet,
              die technischen Daten der Anlage korrekt und vollständig zu erfassen, die erforderlichen
              Vollmachten der Endkunden einzuholen und die geltenden Normen und Vorschriften
              (VDE, TAB, NAV, EEG) eigenverantwortlich einzuhalten.
            </p>
          </div>

          {/* ===================== § 12 MONITORING (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 12 Plattform-Monitoring und Benachrichtigungen</h2>
            <h3>12.1 Systemmonitoring</h3>
            <p>
              Der Anbieter überwacht die Plattform kontinuierlich hinsichtlich Verfügbarkeit,
              Performance und Sicherheit. Monitoring-Daten werden anonymisiert und ausschließlich
              zur Verbesserung der Plattformqualität und zur Erkennung von Störungen verwendet.
            </p>
            <h3>12.2 Statusseite</h3>
            <p>
              Der Anbieter kann eine öffentliche oder für registrierte Nutzer zugängliche Statusseite
              bereitstellen, auf der der aktuelle Betriebszustand der Plattform, geplante
              Wartungsarbeiten und aktuelle Störungen einsehbar sind.
            </p>
            <h3>12.3 Benachrichtigungen</h3>
            <p>
              Der Auftraggeber erhält automatisierte Benachrichtigungen bei folgenden Ereignissen,
              sofern die jeweilige Benachrichtigungsfunktion aktiviert ist:
            </p>
            <ul>
              <li>Statusänderungen von Netzanmeldungen</li>
              <li>Rückmeldungen und Rückfragen von Netzbetreibern</li>
              <li>Fristablauf oder drohende Fristüberschreitungen</li>
              <li>Neue Nachrichten im Endkunden-Portal</li>
              <li>Sicherheitsrelevante Ereignisse (z. B. Login von neuem Gerät, fehlgeschlagene Login-Versuche)</li>
              <li>Kontingent-Warnungen bei Annäherung an Nutzungslimits</li>
              <li>Systemwartungen und Plattform-Updates</li>
            </ul>
            <h3>12.4 Konfigurierbarkeit</h3>
            <p>
              Der Auftraggeber kann die Benachrichtigungseinstellungen in den Kontoeinstellungen
              individuell konfigurieren. Sicherheitsrelevante Benachrichtigungen können nicht
              deaktiviert werden.
            </p>
          </div>

          {/* ===================== § 13 KONTOSPERRUNG (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 13 Kontosperrung und Zugangsbeschränkungen</h2>
            <h3>13.1 Gründe für eine Sperrung</h3>
            <p>Der Anbieter ist berechtigt, den Zugang des Auftraggebers zur Plattform ganz oder teilweise zu sperren, wenn:</p>
            <ul>
              <li>Ein begründeter Verdacht auf Missbrauch der Plattform besteht</li>
              <li>Der Auftraggeber gegen wesentliche Bestimmungen dieser AGB verstößt</li>
              <li>Der Auftraggeber mit Zahlungen trotz Mahnung und angemessener Nachfrist in Verzug ist</li>
              <li>Sicherheitsbedenken bestehen (z. B. kompromittierte Zugangsdaten, verdächtige Aktivitäten)</li>
              <li>Behördliche oder gerichtliche Anordnungen dies erfordern</li>
              <li>Die Nutzung die Fair-Use-Policy gemäß § 3.3 nachhaltig verletzt und der Auftraggeber trotz Abmahnung keine Abhilfe schafft</li>
            </ul>
            <h3>13.2 Verfahren</h3>
            <p>
              Der Anbieter wird den Auftraggeber vor einer Sperrung informieren und eine angemessene
              Frist zur Abhilfe setzen, es sei denn, die sofortige Sperrung ist zur Abwehr einer
              unmittelbaren Gefahr erforderlich. Bei einer Sperrung wegen Zahlungsverzugs beträgt
              die Nachfrist mindestens vierzehn (14) Tage.
            </p>
            <h3>13.3 Wirkung der Sperrung</h3>
            <p>
              Während der Sperrung bleibt die Vergütungspflicht des Auftraggebers bestehen.
              Der Auftraggeber kann weiterhin einen Export seiner Daten anfordern. Die Sperrung
              wird unverzüglich aufgehoben, sobald der Sperrgrund entfällt.
            </p>
            <h3>13.4 Kündigung bei dauerhafter Sperrung</h3>
            <p>
              Wird der Zugang für mehr als dreißig (30) Tage gesperrt und liegt der Sperrgrund
              im Verantwortungsbereich des Auftraggebers, ist der Anbieter zur außerordentlichen
              Kündigung gemäß § 38.4 berechtigt.
            </p>
          </div>

          {/* ===================== § 14 API ===================== */}
          <div className="legal-section">
            <h2>§ 14 API-Nutzung und Integration</h2>
            <h3>14.1 API-Zugang</h3>
            <p>
              Der Anbieter stellt dem Auftraggeber nach gesonderter Freischaltung eine RESTful
              API zur Verfügung. Die Nutzung der API ist an das Vorliegen eines gültigen Vertrags
              und die Einhaltung der API-Dokumentation gebunden.
            </p>
            <h3>14.2 API-Schlüssel und Authentifizierung</h3>
            <p>
              Der Zugriff auf die API erfolgt über API-Schlüssel (API-Keys) und/oder OAuth 2.0.
              Der Auftraggeber ist für die sichere Verwahrung seiner API-Schlüssel verantwortlich.
              Bei Verdacht auf Kompromittierung ist der API-Schlüssel unverzüglich zu regenerieren
              und der Anbieter zu informieren.
            </p>
            <h3>14.3 Rate-Limiting</h3>
            <p>
              Die API unterliegt Rate-Limiting gemäß der jeweils gültigen API-Dokumentation.
              Bei Überschreitung der Limits werden Anfragen temporär abgelehnt (HTTP 429).
              Der Anbieter ist berechtigt, die Rate-Limits anzupassen.
            </p>
            <h3>14.4 Verfügbarkeit der API</h3>
            <p>
              Die Verfügbarkeit der API richtet sich nach § 4. Der Anbieter behält sich vor,
              die API weiterzuentwickeln und veraltete Endpunkte nach angemessener Vorankündigung
              (mindestens 90 Tage) abzuschalten (API-Deprecation-Policy). Breaking Changes werden
              über eine neue API-Version bereitgestellt.
            </p>
            <h3>14.5 Haftung bei API-Integration</h3>
            <p>
              Der Anbieter haftet nicht für Fehler, die auf fehlerhafter Implementierung der
              API durch den Auftraggeber, auf der Nichtbeachtung der API-Dokumentation oder
              auf dem Einsatz nicht unterstützter API-Versionen beruhen.
            </p>
          </div>

          {/* ===================== § 15 WHITE-LABEL ===================== */}
          <div className="legal-section">
            <h2>§ 15 White-Label-Lösungen</h2>
            <h3>15.1 Gegenstand</h3>
            <p>
              Der Anbieter kann dem Auftraggeber eine individuell gebrandete Version der Plattform
              unter der Marke des Auftraggebers bereitstellen (White-Label). Die Einzelheiten
              werden in einer gesonderten Vereinbarung geregelt.
            </p>
            <h3>15.2 Branding und Gestaltung</h3>
            <p>
              Der Auftraggeber erhält die Möglichkeit, Logo, Farbschema, Domain und ggf.
              E-Mail-Templates anzupassen. Der Anbieter stellt sicher, dass die technische
              Funktionalität durch das Branding nicht beeinträchtigt wird.
            </p>
            <h3>15.3 Pflichten des Auftraggebers</h3>
            <p>
              Der Auftraggeber stellt sicher, dass er über alle erforderlichen Rechte an dem
              für das White-Label verwendeten Markenmaterial verfügt. Er stellt den Anbieter
              von Ansprüchen Dritter frei, die aus der Verwendung des Brandings resultieren.
            </p>
            <h3>15.4 Kennzeichnung</h3>
            <p>
              White-Label-Instanzen müssen im Impressum und in der Datenschutzerklärung
              den tatsächlichen technischen Betreiber (Baunity) als Auftragsverarbeiter
              kenntlich machen, sofern gesetzlich erforderlich.
            </p>
          </div>

          {/* ===================== § 16 PREISE ===================== */}
          <div className="legal-section">
            <h2>§ 16 Preise und Vergütung</h2>
            <h3>16.1 Vergütung</h3>
            <p>
              Die Vergütung richtet sich nach dem jeweils vereinbarten Tarif oder der individuellen
              Vereinbarung. Alle Preise verstehen sich in Euro und zuzüglich der jeweils gültigen
              gesetzlichen Umsatzsteuer, sofern nicht ausdrücklich als Brutto-Preis ausgewiesen.
            </p>
            <h3>16.2 Preisänderungen</h3>
            <p>
              Der Anbieter ist berechtigt, die Preise mit einer Ankündigungsfrist von mindestens
              sechs (6) Wochen zum Ende eines Abrechnungszeitraums anzupassen. Preiserhöhungen
              von mehr als 5 % pro Kalenderjahr berechtigen den Auftraggeber zur außerordentlichen
              Kündigung zum Zeitpunkt des Inkrafttretens der Preiserhöhung, sofern die Kündigung
              innerhalb von vier (4) Wochen nach Mitteilung der Preiserhöhung erklärt wird.
            </p>
            <h3>16.3 Kostenlose Funktionen</h3>
            <p>
              Soweit der Anbieter einzelne Funktionen oder Kontingente kostenfrei bereitstellt,
              besteht kein Rechtsanspruch auf deren dauerhafte Verfügbarkeit. Der Anbieter kann
              kostenlose Funktionen mit angemessener Vorankündigung (mindestens 30 Tage)
              einstellen oder in kostenpflichtige Funktionen überführen.
            </p>
            <h3>16.4 Preisliste</h3>
            <p>
              Die jeweils aktuelle Preisliste ist auf der Website des Anbieters einsehbar oder
              kann auf Anfrage angefordert werden.
            </p>
          </div>

          {/* ===================== § 17 MINDESTABNAHMEMENGEN (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 17 Mindestabnahmemengen und Staffelpreise</h2>
            <h3>17.1 Mindestabnahme</h3>
            <p>
              Sofern in der individuellen Vereinbarung oder dem gewählten Tarif eine monatliche
              oder jährliche Mindestabnahmemenge vereinbart ist, ist der Auftraggeber zur
              Zahlung der entsprechenden Mindestgebühr verpflichtet, auch wenn die tatsächliche
              Nutzung darunter liegt.
            </p>
            <h3>17.2 Staffelpreise</h3>
            <p>
              Bei volumenabhängigen Tarifen gelten die in der Preisliste definierten Staffelpreise.
              Die Staffelung kann sich auf die Anzahl der Netzanmeldungen, Nutzerkonten,
              API-Aufrufe oder den genutzten Speicherplatz beziehen. Die jeweils günstigste
              Staffel wird automatisch auf den gesamten Abrechnungszeitraum angewendet.
            </p>
            <h3>17.3 Überschreitungszuschläge</h3>
            <p>
              Überschreitet der Auftraggeber die in seinem Tarif enthaltenen Kontingente, werden
              die darüber hinausgehenden Einheiten nach den Überschreitungszuschlägen der
              jeweils gültigen Preisliste abgerechnet. Der Auftraggeber wird bei Erreichen von
              80 % und 100 % seines Kontingents automatisch benachrichtigt.
            </p>
          </div>

          {/* ===================== § 18 ZAHLUNGSBEDINGUNGEN ===================== */}
          <div className="legal-section">
            <h2>§ 18 Zahlungsbedingungen</h2>
            <h3>18.1 Abrechnung</h3>
            <p>
              Die Abrechnung erfolgt monatlich oder jährlich im Voraus, sofern nicht individuell
              anders vereinbart. Rechnungen werden elektronisch im PDF-Format per E-Mail oder
              über die Plattform bereitgestellt. Der Auftraggeber stimmt dem Empfang
              elektronischer Rechnungen zu.
            </p>
            <h3>18.2 Fälligkeit</h3>
            <p>
              Rechnungsbeträge sind innerhalb von vierzehn (14) Tagen nach Rechnungsstellung
              ohne Abzug fällig, sofern nicht anders vereinbart. Bei SEPA-Lastschrift erfolgt
              die Abbuchung automatisch mit einer Pre-Notification von mindestens fünf (5)
              Werktagen. Die erste Abbuchung nach Erteilung des Mandats erfolgt mit einer
              Frist von mindestens zehn (10) Werktagen.
            </p>
            <h3>18.3 Zahlungsverzug</h3>
            <p>
              Befindet sich der Auftraggeber mit einer Zahlung in Verzug, ist der Anbieter
              berechtigt, Verzugszinsen in Höhe von 9 Prozentpunkten über dem Basiszinssatz
              (§ 288 Abs. 2 BGB) zu berechnen. Die Geltendmachung eines weitergehenden
              Verzugsschadens bleibt vorbehalten. Pro Mahnung kann eine Mahngebühr von
              5,00 EUR netto erhoben werden.
            </p>
            <h3>18.4 Aufrechnung und Zurückbehaltung</h3>
            <p>
              Dem Auftraggeber steht ein Zurückbehaltungs- oder Aufrechnungsrecht nur zu,
              wenn seine Gegenansprüche rechtskräftig festgestellt, unbestritten oder
              vom Anbieter anerkannt sind.
            </p>
          </div>

          {/* ===================== § 19 LEISTUNGSZEIT ===================== */}
          <div className="legal-section">
            <h2>§ 19 Leistungszeit und Verzug</h2>
            <h3>19.1 Leistungszeiten</h3>
            <p>
              Vom Anbieter genannte Leistungszeiträume und Termine sind unverbindlich,
              sofern nicht ausdrücklich als verbindlich vereinbart. Der Anbieter ist bemüht,
              vereinbarte Zeitpläne einzuhalten, und wird den Auftraggeber frühzeitig über
              absehbare Verzögerungen informieren.
            </p>
            <h3>19.2 Verzugsvoraussetzungen</h3>
            <p>
              Der Anbieter gerät nur in Verzug, wenn er einen verbindlich zugesagten Termin
              schuldhaft nicht einhält. Ein Verzug tritt nicht ein, soweit die Verzögerung
              auf Umständen beruht, die der Anbieter nicht zu vertreten hat, insbesondere
              auf fehlender Mitwirkung des Auftraggebers (§ 11), höherer Gewalt (§ 27) oder
              Verzögerungen seitens Dritter (Netzbetreiber, Behörden).
            </p>
            <h3>19.3 Schadensersatz bei Verzug</h3>
            <p>
              Im Falle des vom Anbieter zu vertretenden Verzugs kann der Auftraggeber
              nach fruchtlosem Ablauf einer angemessenen Nachfrist Schadensersatz statt
              der Leistung verlangen. Die Haftungsbeschränkungen gemäß § 25 gelten entsprechend.
            </p>
          </div>

          {/* ===================== § 20 NUTZUNGSRECHTE / IP ===================== */}
          <div className="legal-section">
            <h2>§ 20 Nutzungsrechte und geistiges Eigentum</h2>
            <h3>20.1 Rechte an der Plattform</h3>
            <p>
              Sämtliche Rechte an der Plattform, einschließlich Quellcode, Datenbanken,
              Algorithmen, Designs, Benutzeroberflächen, Dokumentation, Marken, Logos und
              sonstigem geistigem Eigentum, verbleiben beim Anbieter oder dessen Lizenzgebern.
              Der Auftraggeber erwirbt lediglich ein einfaches, nicht übertragbares, nicht
              unterlizenzierbares Nutzungsrecht für die Dauer des Vertrags.
            </p>
            <h3>20.2 Untersagte Handlungen</h3>
            <p>Dem Auftraggeber ist es untersagt:</p>
            <ul>
              <li>Die Plattform ganz oder teilweise zu kopieren, zu dekompilieren, zurückzuentwickeln (Reverse Engineering) oder den Quellcode anderweitig zu ermitteln, soweit nicht gesetzlich zwingend gestattet (§§ 69d, 69e UrhG)</li>
              <li>Die Plattform oder Teile davon Dritten zur Nutzung zu überlassen, zu vermieten oder unterzulizenzieren</li>
              <li>Sicherheitsmechanismen, Zugangsbeschränkungen oder digitale Rechteverwaltung zu umgehen oder zu manipulieren</li>
              <li>Die Plattform für automatisiertes Scraping, Data Mining oder systematisches Auslesen zu nutzen, soweit dies nicht über die API und innerhalb der vereinbarten Limits erfolgt</li>
              <li>Wettbewerbende oder vergleichbare Produkte unter Verwendung der Plattform zu entwickeln</li>
            </ul>
            <h3>20.3 Rechte an Kundendaten</h3>
            <p>
              Der Auftraggeber behält sämtliche Rechte an den von ihm in die Plattform
              eingegebenen Daten und Inhalten. Der Anbieter erhält lediglich das für die
              Leistungserbringung erforderliche Nutzungsrecht. Nach Vertragsende hat der
              Auftraggeber das Recht auf vollständigen Datenexport gemäß § 39.
            </p>
            <h3>20.4 Generierte Dokumente</h3>
            <p>
              An von der Plattform generierten Dokumenten (Schaltpläne, Formulare, Berichte)
              erhält der Auftraggeber ein unbeschränktes Nutzungsrecht. Der Anbieter darf
              anonymisierte Strukturdaten (ohne personenbezogene Daten) zur Verbesserung
              der Vorlagen und des Dienstes verwenden.
            </p>
            <h3>20.5 Open-Source-Komponenten</h3>
            <p>
              Die Plattform kann Open-Source-Komponenten enthalten. Eine Übersicht der
              verwendeten Open-Source-Lizenzen kann auf Anfrage bereitgestellt werden.
              Die jeweiligen Open-Source-Lizenzbedingungen bleiben unberührt.
            </p>
          </div>

          {/* ===================== § 21 SOFTWARE-ESCROW (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 21 Software-Escrow</h2>
            <h3>21.1 Escrow-Vereinbarung</h3>
            <p>
              Auf Wunsch des Auftraggebers kann eine Software-Escrow-Vereinbarung mit einem
              unabhängigen Treuhänder (Escrow-Agent) abgeschlossen werden. Die Kosten des
              Escrow-Agents trägt der Auftraggeber, sofern nicht anders vereinbart.
            </p>
            <h3>21.2 Hinterlegung</h3>
            <p>
              Im Rahmen der Escrow-Vereinbarung hinterlegt der Anbieter den aktuellen Quellcode
              der Plattform beim Treuhänder. Die Aktualisierung erfolgt mindestens einmal
              pro Quartal oder bei wesentlichen Versionssprüngen.
            </p>
            <h3>21.3 Herausgabebedingungen</h3>
            <p>
              Der Treuhänder gibt den Quellcode an den Auftraggeber heraus, wenn der Anbieter
              den Geschäftsbetrieb dauerhaft einstellt, ein Insolvenzverfahren über das Vermögen
              des Anbieters eröffnet wird oder der Anbieter seine wesentlichen vertraglichen
              Pflichten trotz Mahnung und angemessener Nachfrist nicht erfüllt. Die genauen
              Herausgabebedingungen werden in der Escrow-Vereinbarung geregelt.
            </p>
            <h3>21.4 Nutzungsrecht nach Herausgabe</h3>
            <p>
              Im Herausgabefall erhält der Auftraggeber ein einfaches, nicht übertragbares
              Nutzungsrecht am Quellcode, beschränkt auf den Zweck der Aufrechterhaltung
              des eigenen Plattformbetriebs. Eine Weiterveräußerung oder kommerzielle
              Verwertung des Quellcodes ist ausgeschlossen.
            </p>
          </div>

          {/* ===================== § 22 DATENSICHERUNG ===================== */}
          <div className="legal-section">
            <h2>§ 22 Datensicherung und Backups</h2>
            <h3>22.1 Automatische Backups</h3>
            <p>
              Der Anbieter erstellt regelmäßige, automatisierte Backups aller Kundendaten.
              Die Backup-Frequenz beträgt mindestens einmal täglich (Daily Backup). Zusätzlich
              werden inkrementelle Backups alle sechs (6) Stunden erstellt. Alle Backups
              werden AES-256-verschlüsselt gespeichert.
            </p>
            <h3>22.2 Aufbewahrung und Rotation</h3>
            <p>
              Backups werden nach folgendem Rotationsschema aufbewahrt:
            </p>
            <ul>
              <li>Tägliche Backups: 30 Tage</li>
              <li>Wöchentliche Backups: 12 Wochen</li>
              <li>Monatliche Backups: 12 Monate</li>
            </ul>
            <p>
              Ältere Backups werden automatisch und unwiderruflich gelöscht.
            </p>
            <h3>22.3 Backup-Standort</h3>
            <p>
              Backups werden an einem georedundanten Standort innerhalb der EU gespeichert,
              physisch getrennt vom Primärrechenzentrum.
            </p>
            <h3>22.4 Wiederherstellung</h3>
            <p>
              Der Anbieter kann auf Anfrage des Auftraggebers eine Wiederherstellung von Daten
              aus einem Backup durchführen. Die Wiederherstellung ist eine kostenpflichtige
              Dienstleistung, sofern der Datenverlust nicht vom Anbieter zu vertreten ist.
              Der Anbieter gibt keine Garantie für die vollständige Wiederherstellbarkeit
              aller Daten. Die Pflicht des Auftraggebers zur eigenverantwortlichen
              Datensicherung (§ 11.1) bleibt unberührt.
            </p>
          </div>

          {/* ===================== § 23 DISASTER RECOVERY (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 23 Disaster Recovery und Business Continuity</h2>
            <h3>23.1 Disaster-Recovery-Plan</h3>
            <p>
              Der Anbieter unterhält einen dokumentierten Disaster-Recovery-Plan (DRP), der
              Verfahren zur Wiederherstellung der Plattform im Falle eines schwerwiegenden
              Ausfalls des Primärrechenzentrums vorsieht.
            </p>
            <h3>23.2 Recovery Time Objective (RTO)</h3>
            <p>
              Das angestrebte Recovery Time Objective (maximale Dauer bis zur Wiederherstellung
              der Plattform) beträgt vierundzwanzig (24) Stunden. In einem individuellen SLA
              können abweichende RTOs vereinbart werden.
            </p>
            <h3>23.3 Recovery Point Objective (RPO)</h3>
            <p>
              Das angestrebte Recovery Point Objective (maximaler Datenverlust bei Wiederherstellung
              aus einem Backup) beträgt sechs (6) Stunden, entsprechend der Frequenz der
              inkrementellen Backups gemäß § 22.1.
            </p>
            <h3>23.4 Tests</h3>
            <p>
              Der Anbieter führt mindestens einmal jährlich einen Disaster-Recovery-Test durch,
              um die Wirksamkeit des DRP zu überprüfen. Die Ergebnisse werden dokumentiert.
              Auf Anfrage kann dem Auftraggeber eine Zusammenfassung der Testergebnisse zur
              Verfügung gestellt werden.
            </p>
            <h3>23.5 Business-Continuity-Maßnahmen</h3>
            <p>
              Ergänzend zum DRP implementiert der Anbieter Business-Continuity-Maßnahmen,
              einschließlich georedundanter Infrastruktur, automatisierter Failover-Mechanismen
              und regelmäßiger Notfallübungen. Der Anbieter informiert den Auftraggeber
              unverzüglich über schwerwiegende Vorfälle, die die Plattformverfügbarkeit
              beeinträchtigen können.
            </p>
          </div>

          {/* ===================== § 24 MULTI-TENANT (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 24 Multi-Tenant-Architektur und Mandantentrennung</h2>
            <h3>24.1 Multi-Tenant-Betrieb</h3>
            <p>
              Die Plattform wird als Multi-Tenant-Anwendung betrieben, d. h. mehrere Kunden
              teilen sich eine gemeinsame Infrastruktur. Der Anbieter stellt durch geeignete
              technische und organisatorische Maßnahmen sicher, dass eine strikte logische
              Trennung der Kundendaten gewährleistet ist.
            </p>
            <h3>24.2 Datenisolation</h3>
            <p>Die Mandantentrennung wird insbesondere durch folgende Maßnahmen sichergestellt:</p>
            <ul>
              <li>Logische Trennung auf Datenbankebene (tenant-basierte Zugriffskontrolle)</li>
              <li>Rollenbasierte Zugriffssteuerung (RBAC) mit mandantenspezifischen Berechtigungen</li>
              <li>Verschlüsselung mandantenspezifischer Daten mit individuellen Schlüsseln</li>
              <li>Automatisierte Tests zur Überprüfung der Mandantentrennung</li>
              <li>Separate Datei-Speicherbereiche pro Mandant</li>
            </ul>
            <h3>24.3 Keine Cross-Tenant-Zugriffe</h3>
            <p>
              Ein Zugriff auf Daten anderer Mandanten ist technisch ausgeschlossen. Der Anbieter
              gewährleistet, dass weder über die Benutzeroberfläche noch über die API ein
              mandantenübergreifender Datenzugriff möglich ist.
            </p>
            <h3>24.4 Performance-Isolation</h3>
            <p>
              Der Anbieter setzt Maßnahmen zur Performance-Isolation ein, um sicherzustellen,
              dass die Nutzung eines Mandanten die Performance anderer Mandanten nicht
              beeinträchtigt (z. B. durch Rate-Limiting, Ressourcen-Quotas und Lastverteilung).
            </p>
          </div>

          {/* ===================== § 25 HAFTUNG ===================== */}
          <div className="legal-section">
            <h2>§ 25 Haftung</h2>
            <h3>25.1 Unbeschränkte Haftung</h3>
            <p>Der Anbieter haftet unbeschränkt:</p>
            <ul>
              <li>Bei Vorsatz und grober Fahrlässigkeit</li>
              <li>Nach dem Produkthaftungsgesetz</li>
              <li>Bei der Verletzung von Leben, Körper oder Gesundheit</li>
              <li>Bei Übernahme einer Garantie oder eines Beschaffungsrisikos</li>
              <li>Bei arglistigem Verschweigen eines Mangels</li>
            </ul>
            <h3>25.2 Beschränkte Haftung bei einfacher Fahrlässigkeit</h3>
            <p>
              Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher
              Vertragspflichten (Kardinalpflichten), d. h. Pflichten, deren Erfüllung die
              ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren
              Einhaltung der Auftraggeber regelmäßig vertrauen darf. In diesem Fall ist die
              Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <h3>25.3 Haftungshöchstbeträge</h3>
            <p>
              Die Haftung für Vermögensschäden aus einfacher Fahrlässigkeit ist pro
              Schadensfall auf die Höhe der vom Auftraggeber in den letzten zwölf (12) Monaten
              gezahlten Netto-Vergütung begrenzt, maximal jedoch auf 100.000 EUR. Die
              Gesamthaftung pro Kalenderjahr ist auf das Doppelte dieses Betrags begrenzt.
            </p>
            <h3>25.4 Haftungsausschluss</h3>
            <p>Der Anbieter haftet nicht für:</p>
            <ul>
              <li>Schäden durch fehlerhafte oder unvollständige Daten des Auftraggebers</li>
              <li>Entscheidungen, Verzögerungen oder Ablehnungen durch Netzbetreiber</li>
              <li>Schäden aus der Nutzung von Beta-Funktionen (§ 8) oder Test-/Demoumgebungen (§ 9)</li>
              <li>Mittelbare Schäden, entgangenen Gewinn oder Folgeschäden, soweit gesetzlich zulässig</li>
              <li>Datenverluste, soweit der Auftraggeber seine Datensicherungspflicht (§ 11.1) verletzt hat</li>
              <li>Schäden durch höhere Gewalt (§ 27)</li>
            </ul>
            <h3>25.5 Mitverschulden</h3>
            <p>
              Soweit den Auftraggeber ein Mitverschulden trifft, bestimmt sich der Umfang der
              Ersatzpflicht des Anbieters nach § 254 BGB.
            </p>
          </div>

          {/* ===================== § 26 FREISTELLUNGSKLAUSEL (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 26 Freistellungsklausel</h2>
            <h3>26.1 Freistellung durch den Auftraggeber</h3>
            <p>
              Der Auftraggeber stellt den Anbieter von sämtlichen Ansprüchen Dritter frei,
              die aus der Nutzung der Plattform durch den Auftraggeber oder seine Nutzer
              resultieren, insbesondere:
            </p>
            <ul>
              <li>Ansprüche von Endkunden aufgrund fehlerhafter oder verspäteter Netzanmeldungen</li>
              <li>Ansprüche von Netzbetreibern aufgrund unvollständiger oder fehlerhafter Unterlagen</li>
              <li>Ansprüche Dritter wegen Verletzung von Schutzrechten durch vom Auftraggeber bereitgestelltes Material (Logos, Texte, Dokumente)</li>
              <li>Ansprüche aus Datenschutzverletzungen, soweit der Auftraggeber als Verantwortlicher die Verletzung verursacht hat</li>
              <li>Bußgelder oder Sanktionen, die aus einem Verschulden des Auftraggebers resultieren</li>
            </ul>
            <h3>26.2 Umfang der Freistellung</h3>
            <p>
              Die Freistellung umfasst die Erstattung angemessener Kosten der Rechtsverteidigung
              (Rechtsanwalts- und Gerichtskosten). Der Anbieter wird den Auftraggeber unverzüglich
              über geltend gemachte Ansprüche informieren und ihm die Gelegenheit zur Stellungnahme
              und Verteidigung geben.
            </p>
            <h3>26.3 Mitwirkungspflicht</h3>
            <p>
              Der Auftraggeber ist verpflichtet, den Anbieter bei der Abwehr von Drittansprüchen
              nach besten Kräften zu unterstützen und alle erforderlichen Informationen und
              Unterlagen bereitzustellen.
            </p>
          </div>

          {/* ===================== § 27 HÖHERE GEWALT ===================== */}
          <div className="legal-section">
            <h2>§ 27 Höhere Gewalt</h2>
            <h3>27.1 Definition</h3>
            <p>
              Keine Partei haftet für die Nichterfüllung oder verspätete Erfüllung ihrer
              vertraglichen Pflichten, wenn und soweit diese auf Umstände höherer Gewalt
              zurückzuführen sind, die außerhalb des zumutbaren Einflussbereichs der
              betroffenen Partei liegen. Höhere Gewalt umfasst insbesondere:
            </p>
            <ul>
              <li>Naturkatastrophen (Erdbeben, Überschwemmungen, Sturm, Epidemien, Pandemien)</li>
              <li>Krieg, Terrorismus, Bürgerkrieg, Aufstände, Sabotage</li>
              <li>Behördliche Anordnungen, Embargos, Sanktionen, Gesetzesänderungen</li>
              <li>Großflächige Internet- oder Telekommunikationsausfälle</li>
              <li>Stromausfälle, die den Rechenzentrumsbetrieb betreffen und nicht durch USV abgefangen werden können</li>
              <li>Cyberangriffe (DDoS, Ransomware), sofern trotz branchenüblicher Schutzmaßnahmen nicht abwendbar</li>
              <li>Streik, Aussperrung (soweit nicht betriebsintern)</li>
            </ul>
            <h3>27.2 Benachrichtigungspflicht</h3>
            <p>
              Die betroffene Partei wird die andere Partei unverzüglich über den Eintritt und
              die voraussichtliche Dauer des höheren Gewalt-Ereignisses informieren und sich
              nach besten Kräften bemühen, die Auswirkungen zu minimieren.
            </p>
            <h3>27.3 Auswirkung auf den Vertrag</h3>
            <p>
              Dauert ein höheres Gewalt-Ereignis länger als drei (3) Monate an, ist jede
              Partei berechtigt, den Vertrag mit einer Frist von dreißig (30) Tagen zu
              kündigen, ohne dass Schadensersatzansprüche entstehen. Im Falle einer solchen
              Kündigung hat der Auftraggeber Anspruch auf Erstattung bereits geleisteter
              Vorauszahlungen für den nicht genutzten Zeitraum.
            </p>
          </div>

          {/* ===================== § 28 GEWÄHRLEISTUNG ===================== */}
          <div className="legal-section">
            <h2>§ 28 Gewährleistung und Mängelrechte</h2>
            <h3>28.1 Mängelfreiheit</h3>
            <p>
              Der Anbieter gewährleistet, dass die Plattform im Wesentlichen die in der
              jeweils aktuellen Leistungsbeschreibung und Dokumentation beschriebenen
              Funktionen aufweist. Unerhebliche Abweichungen, die die Nutzbarkeit nicht
              wesentlich beeinträchtigen, stellen keinen Mangel dar.
            </p>
            <h3>28.2 Mängelanzeige</h3>
            <p>
              Der Auftraggeber ist verpflichtet, Mängel unverzüglich nach deren Entdeckung
              unter möglichst genauer Beschreibung der Fehlersymptome und der Umstände ihres
              Auftretens schriftlich oder per E-Mail zu melden (Mängelanzeige). Der Auftraggeber
              wird den Anbieter bei der Fehlerbehebung angemessen unterstützen.
            </p>
            <h3>28.3 Nacherfüllung</h3>
            <p>
              Bei Vorliegen eines Mangels hat der Anbieter das Recht zur Nacherfüllung, die
              nach seiner Wahl durch Beseitigung des Mangels (Nachbesserung) oder durch
              Bereitstellung einer fehlerfreien Version (Neulieferung) erfolgt. Die Nacherfüllung
              umfasst auch die Bereitstellung von Workarounds, sofern diese den Mangel in
              zumutbarer Weise umgehen.
            </p>
            <h3>28.4 Gewährleistungsfrist</h3>
            <p>
              Die Gewährleistungsfrist für die Plattform beträgt zwölf (12) Monate ab
              Bereitstellung bzw. ab dem Zeitpunkt, zu dem ein Mangel bei ordnungsgemäßer
              Prüfung hätte entdeckt werden können. Für die Geltendmachung von Mängelrechten
              gelten die gesetzlichen Verjährungsfristen (§§ 634a, 438 BGB analog), soweit
              vorstehend nicht abweichend geregelt.
            </p>
            <h3>28.5 Ausschluss der Gewährleistung</h3>
            <p>Gewährleistungsansprüche bestehen nicht, wenn der Mangel verursacht wurde durch:</p>
            <ul>
              <li>Nicht bestimmungsgemäße Nutzung der Plattform</li>
              <li>Eingriffe oder Modifikationen durch den Auftraggeber oder Dritte</li>
              <li>Nicht kompatible Hard- oder Software-Umgebungen</li>
              <li>Unterlassene Updates oder Sicherheitsmaßnahmen auf Seiten des Auftraggebers</li>
            </ul>
          </div>

          {/* ===================== § 29 VERTRAULICHKEIT ===================== */}
          <div className="legal-section">
            <h2>§ 29 Vertraulichkeit</h2>
            <h3>29.1 Vertrauliche Informationen</h3>
            <p>
              Beide Parteien verpflichten sich, alle Informationen, die ihnen im Rahmen der
              Vertragsanbahnung und -durchführung bekannt werden und die als vertraulich
              gekennzeichnet sind oder deren Vertraulichkeit sich aus den Umständen ergibt,
              streng vertraulich zu behandeln und weder Dritten offenzulegen noch anderweitig
              zu verwerten.
            </p>
            <h3>29.2 Ausnahmen</h3>
            <p>Die Vertraulichkeitspflicht gilt nicht für Informationen, die:</p>
            <ul>
              <li>Zum Zeitpunkt der Mitteilung bereits öffentlich bekannt waren oder ohne Verschulden der empfangenden Partei öffentlich bekannt werden</li>
              <li>Der empfangenden Partei nachweislich bereits vor der Mitteilung bekannt waren</li>
              <li>Von einem Dritten ohne Verstoß gegen Vertraulichkeitspflichten rechtmäßig erlangt wurden</li>
              <li>Von der empfangenden Partei unabhängig entwickelt wurden, ohne auf vertrauliche Informationen zurückzugreifen</li>
              <li>Aufgrund gesetzlicher Vorschriften, behördlicher oder gerichtlicher Anordnung offengelegt werden müssen</li>
            </ul>
            <h3>29.3 Beschränkte Weitergabe</h3>
            <p>
              Die Weitergabe vertraulicher Informationen an Mitarbeiter, Berater und
              Subunternehmer ist nur insoweit zulässig, als diese die Informationen zur
              Vertragserfüllung kennen müssen und ihrerseits zur Vertraulichkeit
              verpflichtet sind (Need-to-Know-Prinzip).
            </p>
            <h3>29.4 Fortbestand</h3>
            <p>
              Die Vertraulichkeitsverpflichtung besteht für die Dauer des Vertragsverhältnisses
              und drei (3) Jahre nach dessen Beendigung fort. Für Betriebs- und Geschäftsgeheimnisse
              im Sinne des GeschGehG gilt die Vertraulichkeitspflicht zeitlich unbegrenzt.
            </p>
          </div>

          {/* ===================== § 30 DATENSCHUTZ ===================== */}
          <div className="legal-section">
            <h2>§ 30 Datenschutz und Auftragsverarbeitung</h2>
            <h3>30.1 Einhaltung datenschutzrechtlicher Vorschriften</h3>
            <p>
              Beide Parteien verpflichten sich, die anwendbaren datenschutzrechtlichen
              Vorschriften einzuhalten, insbesondere die DSGVO, das BDSG, das TDDDG
              und sonstige einschlägige nationale und europäische Datenschutzgesetze.
            </p>
            <h3>30.2 Auftragsverarbeitung</h3>
            <p>
              Soweit der Anbieter im Auftrag des Auftraggebers personenbezogene Daten
              verarbeitet, schließen die Parteien einen gesonderten
              Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO. Der AVV regelt
              insbesondere Gegenstand, Dauer, Art und Zweck der Verarbeitung, die Art
              der personenbezogenen Daten, die Kategorien betroffener Personen sowie
              die Rechte und Pflichten der Parteien.
            </p>
            <h3>30.3 Datenschutzerklärung</h3>
            <p>
              Detaillierte Informationen zur Verarbeitung personenbezogener Daten durch
              den Anbieter finden sich in der <Link to="/datenschutz">Datenschutzerklärung</Link>.
            </p>
            <h3>30.4 Meldung von Datenschutzverletzungen</h3>
            <p>
              Der Anbieter informiert den Auftraggeber unverzüglich, wenn ihm eine Verletzung
              des Schutzes personenbezogener Daten bekannt wird, die die im Auftrag des
              Auftraggebers verarbeiteten Daten betrifft. Die Benachrichtigung enthält
              mindestens die Art der Verletzung, die betroffenen Datenkategorien, die
              wahrscheinlichen Folgen und die ergriffenen Gegenmaßnahmen.
            </p>
          </div>

          {/* ===================== § 31 SUBUNTERNEHMER ===================== */}
          <div className="legal-section">
            <h2>§ 31 Subunternehmer und Drittleistungen</h2>
            <h3>31.1 Einsatz von Subunternehmern</h3>
            <p>
              Der Anbieter ist berechtigt, zur Erbringung seiner Leistungen Subunternehmer
              einzusetzen. Der Anbieter haftet für Subunternehmer wie für eigenes Handeln.
              Eine aktuelle Übersicht der wesentlichen Subunternehmer kann auf Anfrage
              bereitgestellt werden.
            </p>
            <h3>31.2 Wechsel von Subunternehmern</h3>
            <p>
              Der Anbieter informiert den Auftraggeber über den geplanten Wechsel oder die
              Hinzuziehung neuer Subunternehmer, sofern diese wesentliche Leistungen
              erbringen oder personenbezogene Daten verarbeiten. Der Auftraggeber kann dem
              Einsatz eines neuen Subunternehmers innerhalb von dreißig (30) Tagen nach
              Information aus wichtigem Grund widersprechen.
            </p>
            <h3>31.3 Qualitätssicherung</h3>
            <p>
              Der Anbieter stellt sicher, dass Subunternehmer mindestens dem gleichen
              Sicherheits- und Qualitätsniveau unterliegen wie der Anbieter selbst,
              insbesondere im Hinblick auf Datenschutz und IT-Sicherheit.
            </p>
          </div>

          {/* ===================== § 32 VERSICHERUNG ===================== */}
          <div className="legal-section">
            <h2>§ 32 Versicherung</h2>
            <h3>32.1 Betriebshaftpflicht</h3>
            <p>
              Der Anbieter unterhält eine angemessene Betriebshaftpflichtversicherung, die
              Personen-, Sach- und Vermögensschäden abdeckt, die im Zusammenhang mit der
              Erbringung der vertragsgegenständlichen Leistungen entstehen können.
            </p>
            <h3>32.2 IT-Haftpflichtversicherung</h3>
            <p>
              Darüber hinaus unterhält der Anbieter eine IT-Haftpflichtversicherung
              (Cyber-Versicherung), die insbesondere Schäden durch Datenverlust,
              Datenschutzverletzungen und Cyberangriffe abdeckt.
            </p>
            <h3>32.3 Nachweis</h3>
            <p>
              Der Anbieter wird dem Auftraggeber auf Anfrage den Bestand der Versicherungen
              nachweisen, ohne zur Offenlegung der Deckungssummen verpflichtet zu sein.
            </p>
          </div>

          {/* ===================== § 33 COMPLIANCE ===================== */}
          <div className="legal-section">
            <h2>§ 33 Compliance und Anti-Korruption</h2>
            <h3>33.1 Gesetzestreue</h3>
            <p>
              Beide Parteien verpflichten sich, alle anwendbaren Gesetze und Vorschriften
              einzuhalten, einschließlich, aber nicht beschränkt auf Anti-Korruptionsgesetze,
              Geldwäschevorschriften, Export- und Sanktionsvorschriften und Wettbewerbsrecht.
            </p>
            <h3>33.2 Anti-Korruption</h3>
            <p>
              Keine Partei darf im Zusammenhang mit diesem Vertrag direkt oder indirekt
              Vorteile anbieten, versprechen, gewähren, fordern oder annehmen, die geeignet
              sind, die geschäftliche Entscheidung der anderen Partei oder eines Dritten
              sachfremd zu beeinflussen. Dies gilt insbesondere für Zahlungen, Geschenke,
              Einladungen und sonstige Zuwendungen.
            </p>
            <h3>33.3 Sanktions-Compliance</h3>
            <p>
              Der Auftraggeber sichert zu, dass weder er noch seine wirtschaftlich Berechtigten
              auf einer Sanktionsliste (insbesondere EU, UN, OFAC) geführt werden. Der
              Auftraggeber wird die Plattform nicht nutzen, um Transaktionen zugunsten
              sanktionierter Personen oder Länder durchzuführen.
            </p>
            <h3>33.4 Hinweisgeberschutz</h3>
            <p>
              Der Anbieter unterhält ein Hinweisgebersystem (Whistleblower-Kanal) gemäß
              dem Hinweisgeberschutzgesetz (HinSchG). Hinweise auf Compliance-Verstöße
              können unter compliance@baunity.de gemeldet werden.
            </p>
          </div>

          {/* ===================== § 34 BRANCHENSPEZIFISCH EEG/EnWG (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 34 Branchenspezifische Regelungen (EEG, EnWG, NAV)</h2>
            <h3>34.1 Regulatorischer Rahmen</h3>
            <p>
              Die über die Plattform abgewickelten Netzanmeldungen unterliegen den jeweils
              geltenden energiewirtschaftsrechtlichen Vorschriften, insbesondere dem
              Erneuerbare-Energien-Gesetz (EEG), dem Energiewirtschaftsgesetz (EnWG), der
              Niederspannungsanschlussverordnung (NAV) und den Technischen Anschlussbedingungen
              (TAB) der jeweiligen Netzbetreiber.
            </p>
            <h3>34.2 Keine Rechtsberatung</h3>
            <p>
              Die Plattform stellt Funktionen und Vorlagen zur Verfügung, die auf den genannten
              Rechtsvorschriften basieren. Dies stellt keine Rechtsberatung dar. Der Auftraggeber
              ist allein verantwortlich für die Einhaltung der geltenden Vorschriften und die
              Richtigkeit der technischen Angaben. Der Anbieter übernimmt keine Haftung für
              die regulatorische Konformität der vom Auftraggeber eingereichten Unterlagen.
            </p>
            <h3>34.3 Aktualisierung bei Rechtsänderungen</h3>
            <p>
              Der Anbieter ist bestrebt, die Plattform (Formulare, Vorlagen, Schnittstellen)
              zeitnah an Änderungen der relevanten Rechtsvorschriften, Normen (VDE-AR-N,
              DIN-VDE, IEC) und Netzbetreiber-Anforderungen anzupassen. Ein Rechtsanspruch
              auf sofortige Anpassung besteht nicht. Der Anbieter informiert den Auftraggeber
              über wesentliche regulatorische Änderungen, die die Plattformnutzung betreffen.
            </p>
            <h3>34.4 Marktstammdatenregister</h3>
            <p>
              Soweit die Plattform Funktionen zur Registrierung im Marktstammdatenregister (MaStR)
              der Bundesnetzagentur anbietet, handelt der Anbieter ausschließlich auf Weisung und
              im Namen des Auftraggebers. Die Verantwortung für die Richtigkeit und Vollständigkeit
              der Registrierungsdaten verbleibt beim Auftraggeber.
            </p>
          </div>

          {/* ===================== § 35 AUDIT-RECHTE (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 35 Audit-Rechte</h2>
            <h3>35.1 Prüfungsrecht des Auftraggebers</h3>
            <p>
              Der Auftraggeber hat das Recht, die Einhaltung der vertraglichen und
              datenschutzrechtlichen Pflichten durch den Anbieter zu überprüfen. Audits
              können einmal jährlich durchgeführt werden, sofern kein konkreter Anlass
              für eine häufigere Überprüfung besteht.
            </p>
            <h3>35.2 Durchführung</h3>
            <p>
              Audits sind mit einer Vorankündigungsfrist von mindestens dreißig (30) Tagen
              schriftlich anzukündigen. Der Anbieter kann verlangen, dass Audits durch einen
              unabhängigen, zur Verschwiegenheit verpflichteten Prüfer (z. B. Wirtschaftsprüfer,
              IT-Sicherheitsauditor) durchgeführt werden.
            </p>
            <h3>35.3 Kosten</h3>
            <p>
              Die Kosten des Audits (einschließlich der Kosten des externen Prüfers) trägt
              der Auftraggeber, es sei denn, das Audit ergibt wesentliche Verstöße des
              Anbieters. In letzterem Fall trägt der Anbieter die angemessenen Kosten des Audits.
            </p>
            <h3>35.4 Mitwirkungspflicht des Anbieters</h3>
            <p>
              Der Anbieter wird den Prüfer angemessen unterstützen und die erforderlichen
              Informationen und Unterlagen bereitstellen, soweit dies nicht die Vertraulichkeit
              gegenüber anderen Kunden, Betriebs- und Geschäftsgeheimnisse oder die
              IT-Sicherheit beeinträchtigt.
            </p>
            <h3>35.5 Zertifizierungen als Audit-Ersatz</h3>
            <p>
              Der Anbieter kann anstelle eines Vor-Ort-Audits aktuelle Zertifizierungen
              und Auditberichte (z. B. ISO 27001, SOC 2 Type II) vorlegen, die das Audit
              ganz oder teilweise ersetzen, sofern der Auftraggeber dem zustimmt.
            </p>
          </div>

          {/* ===================== § 36 ELEKTRONISCHE SIGNATUR (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 36 Elektronische Signatur und digitale Dokumente</h2>
            <h3>36.1 Nutzung elektronischer Signaturen</h3>
            <p>
              Die Plattform kann Funktionen zur Erstellung und Verwendung elektronischer
              Signaturen bereitstellen. Der Anbieter unterstützt einfache elektronische
              Signaturen im Sinne der eIDAS-Verordnung (EU) Nr. 910/2014. Fortgeschrittene
              und qualifizierte elektronische Signaturen können über Drittanbieter
              integriert werden.
            </p>
            <h3>36.2 Rechtswirksamkeit</h3>
            <p>
              Der Auftraggeber ist selbst dafür verantwortlich zu prüfen, ob für den
              jeweiligen Verwendungszweck eine einfache elektronische Signatur ausreicht
              oder ob eine fortgeschrittene oder qualifizierte elektronische Signatur
              erforderlich ist. Der Anbieter übernimmt keine Haftung für die rechtliche
              Anerkennung der über die Plattform erstellten Signaturen.
            </p>
            <h3>36.3 Archivierung signierter Dokumente</h3>
            <p>
              Elektronisch signierte Dokumente werden auf der Plattform für die Dauer
              des Vertragsverhältnisses archiviert. Der Auftraggeber ist verpflichtet,
              eigenständig Sicherungskopien signierter Dokumente vorzuhalten.
            </p>
          </div>

          {/* ===================== § 37 BARRIEREFREIHEIT (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 37 Barrierefreiheit</h2>
            <h3>37.1 Ziel</h3>
            <p>
              Der Anbieter ist bestrebt, die Plattform barrierefrei zu gestalten und orientiert
              sich dabei an den Web Content Accessibility Guidelines (WCAG 2.1) auf Konformitätsstufe
              AA. Ein Rechtsanspruch auf vollständige Barrierefreiheit besteht derzeit nicht,
              der Anbieter arbeitet jedoch kontinuierlich an der Verbesserung.
            </p>
            <h3>37.2 Barrierefreiheitsstärkungsgesetz (BFSG)</h3>
            <p>
              Soweit das Barrierefreiheitsstärkungsgesetz (BFSG) ab dem 28. Juni 2025 für
              die Plattform anwendbar ist, wird der Anbieter die gesetzlichen Anforderungen
              umsetzen. Der Anbieter informiert den Auftraggeber über den Stand der Umsetzung.
            </p>
            <h3>37.3 Feedback</h3>
            <p>
              Nutzer können Barrieren und Verbesserungsvorschläge zur Barrierefreiheit
              unter accessibility@baunity.de oder über das Kontaktformular melden.
              Der Anbieter wird Meldungen innerhalb angemessener Frist prüfen und
              nach Möglichkeit umsetzen.
            </p>
          </div>

          {/* ===================== § 38 LAUFZEIT / KÜNDIGUNG ===================== */}
          <div className="legal-section">
            <h2>§ 38 Vertragslaufzeit und Kündigung</h2>
            <h3>38.1 Vertragsbeginn</h3>
            <p>
              Das Vertragsverhältnis beginnt mit der Registrierung auf der Plattform und
              der Annahme dieser AGB oder mit dem in einem gesonderten Vertrag vereinbarten
              Datum.
            </p>
            <h3>38.2 Mindestlaufzeit</h3>
            <p>
              Die Mindestlaufzeit beträgt, sofern nicht anders vereinbart, einen (1) Monat
              bei monatlicher Abrechnung bzw. zwölf (12) Monate bei jährlicher Abrechnung.
              Nach Ablauf der Mindestlaufzeit verlängert sich der Vertrag automatisch um
              den gleichen Zeitraum, wenn er nicht fristgerecht gekündigt wird.
            </p>
            <h3>38.3 Ordentliche Kündigung</h3>
            <p>
              Der Vertrag kann von jeder Partei mit einer Frist von dreißig (30) Tagen zum
              Ende des jeweiligen Vertragszeitraums (Monat oder Jahr) schriftlich oder in
              Textform (E-Mail) gekündigt werden. Bei jährlicher Abrechnung beträgt die
              Kündigungsfrist drei (3) Monate zum Ende des Vertragsjahres.
            </p>
            <h3>38.4 Außerordentliche Kündigung</h3>
            <p>
              Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
              Ein wichtiger Grund liegt insbesondere vor, wenn:
            </p>
            <ul>
              <li>Die andere Partei wesentliche Vertragspflichten trotz Mahnung und angemessener Nachfrist (mindestens 14 Tage) nicht erfüllt</li>
              <li>Über das Vermögen der anderen Partei ein Insolvenzverfahren eröffnet, beantragt oder mangels Masse abgelehnt wird</li>
              <li>Die andere Partei ihre Zahlungen einstellt</li>
              <li>Der Auftraggeber die Plattform missbräuchlich nutzt oder gegen wesentliche Bestimmungen dieser AGB verstößt</li>
              <li>Die Preiserhöhung die Schwelle gemäß § 16.2 überschreitet (Sonderkündigungsrecht des Auftraggebers)</li>
              <li>Ein höheres Gewalt-Ereignis gemäß § 27.3 andauert</li>
            </ul>
            <h3>38.5 Folgen der Beendigung</h3>
            <p>
              Nach Beendigung des Vertrags wird der Zugang des Auftraggebers zur Plattform
              gesperrt. Der Auftraggeber hat innerhalb einer Übergangsfrist von dreißig (30)
              Tagen nach Vertragsende die Möglichkeit, seine Daten zu exportieren (§ 39).
              Nach Ablauf der Übergangsfrist werden die Daten des Auftraggebers unwiderruflich
              gelöscht, vorbehaltlich gesetzlicher Aufbewahrungspflichten.
            </p>
            <h3>38.6 Fortgeltende Bestimmungen</h3>
            <p>
              Die Bestimmungen zur Vertraulichkeit (§ 29), zur Haftung (§ 25), zum Datenschutz
              (§ 30), zur Freistellung (§ 26) und zu den Schlussbestimmungen (§ 46) gelten
              über das Vertragsende hinaus fort.
            </p>
          </div>

          {/* ===================== § 39 DATENIMPORT/MIGRATION (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 39 Datenimport, -export und -migration</h2>
            <h3>39.1 Datenimport</h3>
            <p>
              Der Anbieter unterstützt den Import von Daten aus gängigen Formaten (CSV, JSON,
              XML, Excel). Individuelle Datenmigrationen von anderen Systemen können gegen
              gesonderte Vergütung vereinbart werden.
            </p>
            <h3>39.2 Datenexport</h3>
            <p>
              Der Auftraggeber kann seine Daten jederzeit während der Vertragslaufzeit und
              innerhalb der Übergangsfrist nach Vertragsende (§ 38.5) in einem strukturierten,
              gängigen und maschinenlesbaren Format (CSV, JSON) exportieren. Der Datenexport
              umfasst:
            </p>
            <ul>
              <li>Stammdaten des Auftraggebers und seiner Nutzer</li>
              <li>Alle Anlagen- und Projektdaten</li>
              <li>Endkundendaten</li>
              <li>Hochgeladene und generierte Dokumente</li>
              <li>Kommunikationsverläufe und Nachrichten</li>
              <li>Rechnungs- und Abrechnungsdaten</li>
            </ul>
            <h3>39.3 Keine Vendor-Lock-In</h3>
            <p>
              Der Anbieter verpflichtet sich, den Auftraggeber nicht an die Plattform zu binden
              (kein Vendor Lock-In). Die exportierten Daten sind in offenen, dokumentierten
              Formaten strukturiert und können ohne proprietäre Tools weiterverarbeitet werden.
            </p>
            <h3>39.4 Migrationsunterstützung</h3>
            <p>
              Auf Wunsch unterstützt der Anbieter den Auftraggeber bei der Migration zu einem
              anderen System gegen gesonderte Vergütung. Die Migrationsunterstützung umfasst
              Datenextraktion, Formatkonvertierung und technische Beratung.
            </p>
          </div>

          {/* ===================== § 40 REFERENZ ===================== */}
          <div className="legal-section">
            <h2>§ 40 Referenz und Testimonials</h2>
            <h3>40.1 Referenznennung</h3>
            <p>
              Der Anbieter ist berechtigt, den Auftraggeber als Referenzkunden zu benennen
              und den Firmennamen und das Logo auf seiner Website und in Marketingmaterialien
              zu verwenden, sofern der Auftraggeber nicht schriftlich widerspricht.
            </p>
            <h3>40.2 Widerspruchsrecht</h3>
            <p>
              Der Auftraggeber kann der Referenznennung jederzeit schriftlich oder per E-Mail
              widersprechen. Der Anbieter wird die Referenz innerhalb von vierzehn (14) Tagen
              nach Eingang des Widerspruchs entfernen.
            </p>
            <h3>40.3 Testimonials</h3>
            <p>
              Die Verwendung von Zitaten, Erfahrungsberichten oder Case Studies des Auftraggebers
              bedarf der vorherigen schriftlichen Zustimmung. Der Auftraggeber kann eine erteilte
              Zustimmung jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>
          </div>

          {/* ===================== § 41 ABTRETUNG ===================== */}
          <div className="legal-section">
            <h2>§ 41 Abtretung und Vertragsübernahme</h2>
            <h3>41.1 Abtretungsverbot</h3>
            <p>
              Rechte und Pflichten aus diesem Vertrag dürfen ohne vorherige schriftliche
              Zustimmung der jeweils anderen Partei nicht an Dritte abgetreten oder
              übertragen werden. Dies gilt nicht für die Abtretung von Zahlungsansprüchen.
            </p>
            <h3>41.2 Konzernprivileg</h3>
            <p>
              Abweichend von § 41.1 ist jede Partei berechtigt, den Vertrag auf ein
              verbundenes Unternehmen im Sinne der §§ 15 ff. AktG zu übertragen, sofern
              die Übertragung die Rechte der anderen Partei nicht wesentlich beeinträchtigt
              und die andere Partei mindestens dreißig (30) Tage im Voraus informiert wird.
            </p>
          </div>

          {/* ===================== § 42 AGB-ÄNDERUNG ===================== */}
          <div className="legal-section">
            <h2>§ 42 Änderung der AGB</h2>
            <h3>42.1 Änderungsrecht</h3>
            <p>
              Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern
              oder zu ergänzen, soweit dies aufgrund von Gesetzesänderungen, Änderungen der
              Rechtsprechung, technischen Weiterentwicklungen oder veränderten Marktbedingungen
              erforderlich oder sachlich gerechtfertigt ist und den Auftraggeber nicht
              unangemessen benachteiligt.
            </p>
            <h3>42.2 Benachrichtigung und Zustimmungsfiktion</h3>
            <p>
              Der Anbieter wird den Auftraggeber mindestens sechs (6) Wochen vor Inkrafttreten
              der Änderungen per E-Mail über die geplanten Änderungen informieren und auf die
              neuen Regelungen hinweisen. Die Änderungen gelten als genehmigt, wenn der
              Auftraggeber nicht innerhalb von sechs (6) Wochen nach Zugang der Mitteilung
              schriftlich oder in Textform widerspricht. Auf diese Rechtsfolge wird der Anbieter
              in der Änderungsmitteilung gesondert hinweisen.
            </p>
            <h3>42.3 Widerspruch und Sonderkündigungsrecht</h3>
            <p>
              Widerspricht der Auftraggeber den Änderungen fristgerecht, gelten die bisherigen
              AGB fort. In diesem Fall ist der Anbieter berechtigt, den Vertrag mit einer Frist
              von drei (3) Monaten zum Monatsende zu kündigen, sofern die Fortführung des
              Vertrags unter den alten Bedingungen unzumutbar ist.
            </p>
          </div>

          {/* ===================== § 43 ÜBERGANGSBESTIMMUNGEN (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 43 Übergangsbestimmungen</h2>
            <h3>43.1 Geltung für Bestandskunden</h3>
            <p>
              Für bestehende Vertragsverhältnisse, die vor Inkrafttreten dieser AGB-Fassung
              geschlossen wurden, gelten die neuen Bestimmungen nach Ablauf der
              Änderungsmitteilungsfrist gemäß § 42.2, sofern der Auftraggeber nicht
              fristgerecht widersprochen hat.
            </p>
            <h3>43.2 Übergangsfristen</h3>
            <p>
              Soweit einzelne neue Bestimmungen dem Auftraggeber zusätzliche Pflichten
              auferlegen (z. B. Sicherheitsanforderungen, Dokumentationspflichten),
              gewährt der Anbieter eine angemessene Übergangsfrist von mindestens
              neunzig (90) Tagen zur Umsetzung.
            </p>
            <h3>43.3 Altverträge</h3>
            <p>
              Individuelle Vereinbarungen, die vor Inkrafttreten dieser AGB geschlossen
              wurden, behalten ihre Gültigkeit und gehen den Bestimmungen dieser AGB vor,
              soweit sie abweichende Regelungen enthalten (§ 1.5).
            </p>
          </div>

          {/* ===================== § 44 FORMVORSCHRIFTEN (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 44 Formvorschriften und Kommunikation</h2>
            <h3>44.1 Schriftform und Textform</h3>
            <p>
              Soweit in diesen AGB „schriftlich" vorgesehen ist, genügt die Textform
              gemäß § 126b BGB (E-Mail, PDF-Dokument), sofern nicht ausdrücklich die
              Schriftform gemäß § 126 BGB (eigenhändige Unterschrift) verlangt wird.
              Die Kündigung des Vertrags bedarf mindestens der Textform.
            </p>
            <h3>44.2 Zugangsfiktion</h3>
            <p>
              E-Mails gelten als zugegangen, wenn sie an die vom Auftraggeber in der
              Plattform hinterlegte E-Mail-Adresse gesendet wurden und kein Fehlerhinweis
              (Bounce) eingegangen ist. Der Auftraggeber ist verpflichtet, seine
              E-Mail-Adresse aktuell zu halten.
            </p>
            <h3>44.3 Benachrichtigungen über die Plattform</h3>
            <p>
              Benachrichtigungen, die der Anbieter über die Plattform (In-App-Benachrichtigungen,
              Dashboard-Hinweise) bereitstellt, gelten als zugegangen, sobald der Auftraggeber
              sich nach der Bereitstellung erstmals in die Plattform einloggt oder spätestens
              nach Ablauf von sieben (7) Tagen nach Bereitstellung.
            </p>
          </div>

          {/* ===================== § 45 MEDIATION (NEU) ===================== */}
          <div className="legal-section">
            <h2>§ 45 Mediation und außergerichtliche Streitbeilegung</h2>
            <h3>45.1 Gütliche Einigung</h3>
            <p>
              Die Parteien werden sich bemühen, Streitigkeiten aus oder im Zusammenhang mit
              diesem Vertrag zunächst einvernehmlich beizulegen. Zu diesem Zweck werden
              die zuständigen Ansprechpartner beider Parteien innerhalb von dreißig (30) Tagen
              nach schriftlicher Mitteilung der Streitigkeit Verhandlungen aufnehmen.
            </p>
            <h3>45.2 Mediation</h3>
            <p>
              Scheitern die Verhandlungen gemäß § 45.1 innerhalb von sechzig (60) Tagen,
              können die Parteien vereinbaren, eine Mediation gemäß der Mediationsordnung
              der Deutschen Institution für Schiedsgerichtsbarkeit (DIS) oder einer anderen
              anerkannten Mediationsinstitution durchzuführen. Die Kosten der Mediation
              tragen die Parteien je zur Hälfte, sofern nicht anders vereinbart.
            </p>
            <h3>45.3 Keine Einschränkung des Rechtswegs</h3>
            <p>
              Die vorstehenden Regelungen lassen das Recht jeder Partei unberührt, jederzeit
              den ordentlichen Rechtsweg zu beschreiten, insbesondere zur Erlangung einstweiligen
              Rechtsschutzes.
            </p>
          </div>

          {/* ===================== § 46 SCHLUSSBESTIMMUNGEN ===================== */}
          <div className="legal-section">
            <h2>§ 46 Schlussbestimmungen</h2>
            <h3>46.1 Anwendbares Recht</h3>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
              UN-Kaufrechts (CISG) und der Kollisionsnormen des Internationalen Privatrechts.
            </p>
            <h3>46.2 Gerichtsstand</h3>
            <p>
              Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang
              mit diesem Vertrag ist, soweit gesetzlich zulässig, Lahr (Schwarzwald), Deutschland.
              Bei Vertragspartnern, die keinen allgemeinen Gerichtsstand in Deutschland haben,
              gelten die gesetzlichen Regelungen.
            </p>
            <h3>46.3 Salvatorische Klausel</h3>
            <p>
              Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam oder
              undurchführbar sein oder werden, so bleibt die Wirksamkeit der übrigen
              Bestimmungen hiervon unberührt. Anstelle der unwirksamen oder undurchführbaren
              Bestimmung gilt diejenige wirksame und durchführbare Regelung als vereinbart,
              die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.
              Gleiches gilt für etwaige Lücken des Vertrags.
            </p>
            <h3>46.4 Vollständigkeit</h3>
            <p>
              Diese AGB einschließlich etwaiger individueller Vereinbarungen, Auftragsbestätigungen
              und eines etwaigen SLA stellen die vollständige Vereinbarung der Parteien in Bezug
              auf den Vertragsgegenstand dar und ersetzen alle vorherigen mündlichen oder
              schriftlichen Vereinbarungen, Zusicherungen und Absprachen.
            </p>
            <h3>46.5 Keine stillschweigende Verzichtserklärung</h3>
            <p>
              Das Unterlassen der Geltendmachung eines Rechts aus diesen AGB durch eine Partei
              stellt keinen Verzicht auf dieses Recht dar. Ein Verzicht bedarf der Schriftform.
            </p>
            <h3>46.6 Vertragssprache</h3>
            <p>
              Vertragssprache ist Deutsch. Bei Übersetzungen in andere Sprachen ist im Zweifel
              die deutsche Fassung maßgeblich.
            </p>
          </div>

          <div className="legal-section">
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Stand dieser AGB: Februar 2026 — Baunity, Südstraße 31, 47475 Kamp-Lintfort
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
