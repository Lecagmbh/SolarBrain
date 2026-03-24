// src/features/nb-portal/NbPortalAuswahl.tsx
/**
 * NB-Portal Anmeldungstyp Auswahl
 * ================================
 * Stromnetz Berlin Welcome-Seite im Baunity Dark Theme
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Home,
  Settings,
  Construction,
  Zap,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sun,
  Trash2,
  Gauge,
  ToggleRight,
  Car,
  Flame,
  Building2,
  Clock,
  FileText,
  HelpCircle,
  Activity,
  FileEdit,
  Shield
} from 'lucide-react';
import { getAvailablePortals, type NbPortal } from './nbPortalApi';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL CONFIG
// ═══════════════════════════════════════════════════════════════════════════
// Formulare werden INTERN in Baunity gerendert (kein externer Redirect!)
// Die Formular-Definitionen kommen von der Stromnetz Berlin REST API

// ═══════════════════════════════════════════════════════════════════════════
// KATEGORIEN UND PRODUKTE
// ═══════════════════════════════════════════════════════════════════════════

interface Produkt {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface Kategorie {
  id: string;
  title: string;
  subtitle: string;
  produkte: Produkt[];
}

const KATEGORIEN: Kategorie[] = [
  {
    id: 'anschluss',
    title: 'Anschluss',
    subtitle: 'Bitte wählen Sie eines der Produkte für Anschlüsse auf Privatgrundstücken aus.',
    produkte: [
      {
        id: 'neuanschluss',
        title: 'Neuanschluss',
        description: 'Herstellung eines neuen Netzanschlusses (Grundstück hat noch keinen Netzanschluss)',
        icon: Home,
      },
      {
        id: 'aenderung-anschluss',
        title: 'Änderung bestehender Anschluss',
        description: 'Änderung eines bestehenden Netzanschlusses, Standortänderung oder Leistungsänderung',
        icon: Settings,
      },
      {
        id: 'baustrom',
        title: 'Baustrom',
        description: 'Herstellung eines kurzzeitigen Baustromanschlusses für die Bauphase',
        icon: Construction,
      },
      {
        id: 'wallboxen',
        title: 'Wallboxen',
        description: 'Leistungsanfrage von Ladeeinrichtungen (Wallboxen) für Elektrofahrzeuge',
        icon: Car,
      },
      {
        id: 'waermepumpen',
        title: 'Wärmepumpen',
        description: 'Leistungsanfrage von Wärmepumpen an Ihrem Netzanschluss',
        icon: Flame,
      },
      {
        id: 'demontage',
        title: 'Demontage',
        description: 'Vollständige Demontage Ihres Netzanschlusses',
        icon: Trash2,
      },
      {
        id: 'messung-vorzaehler',
        title: 'Messung im Vorzählerbereich',
        description: 'Einbau einer Messung im Vorzählerbereich mit Zusatzverrechnung',
        icon: Gauge,
      },
      {
        id: 'steuerbare-verbraucher',
        title: 'Steuerbare Verbrauchseinrichtungen §14a EnWG',
        description: 'Inbetriebnahme steuerbarer Verbrauchseinrichtungen nach § 14a EnWG',
        icon: ToggleRight,
      }
    ]
  },
  {
    id: 'einspeiser',
    title: 'Einspeiser',
    subtitle: 'Beantragung für einen Anschluss am Niederspannungsnetz für PV-Anlagen und andere Erzeuger.',
    produkte: [
      {
        id: 'pv-bis-30kva',
        title: 'Neueinrichtung PV-Anlage bis 30 kVA',
        description: 'Anmeldung einer PV-Anlage bis 30 kVA am Niederspannungsnetz',
        icon: Sun,
      },
      {
        id: 'pv-30-100kwp',
        title: 'Neueinrichtung PV-Anlage 30 kVA bis 100 kWp',
        description: 'Anmeldung einer PV-Anlage größer 30 kVA bis 100 kWp',
        icon: Sun,
      },
      {
        id: 'aenderung-eeg',
        title: 'Änderung EEG- / KWKG-Anlage',
        description: 'Änderung einer bestehenden EEG-/KWKG-Anlage, Batteriespeicher hinzufügen',
        icon: Settings,
      },
      {
        id: 'demontage-eeg',
        title: 'Demontage EEG- / KWKG-Anlage',
        description: 'Demontage einer bestehenden EEG- oder KWKG-Anlage',
        icon: Trash2,
      },
      {
        id: 'andere-erzeugung',
        title: 'Neueinrichtung anderer Erzeugungsanlagen',
        description: 'Anmeldung anderer Erzeugungsanlagen inkl. PV > 100 kWp',
        icon: Activity,
      }
    ]
  },
  {
    id: 'strassenland',
    title: 'Öffentliches Straßenland',
    subtitle: 'Beantragung für einen Anschluss im öffentlichen Straßenland.',
    produkte: [
      {
        id: 'ladeinfrastruktur',
        title: 'Ladeinfrastruktur Öffentlicher Raum',
        description: 'Anmeldung von Ladeeinrichtungen im öffentlichen Raum',
        icon: Car,
      },
      {
        id: 'zeitlich-begrenzt',
        title: 'Zeitlich begrenzter Anschluss',
        description: 'Kurzzeitiger Anschluss für Straßenfeste, Filmaufnahmen, Veranstaltungen',
        icon: Clock,
      },
      {
        id: 'neuanschluss-strassenland',
        title: 'Neuanschluss im öffentlichen Straßenland',
        description: 'Herstellung eines neuen Netzanschlusses im öffentlichen Straßenland',
        icon: Building2,
      },
      {
        id: 'aenderung-strassenland',
        title: 'Änderung im öffentlichen Straßenland',
        description: 'Änderung eines bestehenden Netzanschlusses im öffentlichen Straßenland',
        icon: Settings,
      },
      {
        id: 'demontage-strassenland',
        title: 'Demontage im öffentlichen Straßenland',
        description: 'Vollständige Demontage Ihres Netzanschlusses im öffentlichen Straßenland',
        icon: Trash2,
      }
    ]
  },
  {
    id: 'mittelspannung',
    title: 'Mittelspannung',
    subtitle: 'Beantragung für einen Anschluss am Mittelspannungsnetz.',
    produkte: [
      {
        id: 'mittelspannung',
        title: 'Mittelspannung',
        description: 'Neubau Standard-Mittelspannungsanschluss (Bezug bis 800 kVA, 1 Trafo)',
        icon: Zap,
      }
    ]
  },
  {
    id: 'messstellenbetrieb',
    title: 'Messstellenbetrieb',
    subtitle: 'Beantragung für intelligente Messsysteme.',
    produkte: [
      {
        id: 'imsys',
        title: 'Kundenwunsch iMSys',
        description: 'Anmeldung zum Einbau eines intelligenten Messsystems',
        icon: Gauge,
      }
    ]
  },
  {
    id: 'service',
    title: 'Service',
    subtitle: 'Weitere Serviceangebote und Informationen.',
    produkte: [
      {
        id: 'service',
        title: 'Unser Service',
        description: 'Informieren Sie sich hier über unseren kompletten Service',
        icon: HelpCircle,
      },
      {
        id: 'preisblatt',
        title: 'Preisblatt Anschluss Niederspannung',
        description: 'Preise für Errichtung, Änderung oder Demontage (bis 400 Volt)',
        icon: FileText,
      }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// STYLES - Inline CSS to guarantee dark theme
// ═══════════════════════════════════════════════════════════════════════════

const styles = {
  // Page
  page: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: '#ffffff',
  } as React.CSSProperties,

  // Header
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #374151',
  } as React.CSSProperties,

  headerInner: {
    maxWidth: '72rem',
    margin: '0 auto',
    padding: '1rem 1.5rem',
  } as React.CSSProperties,

  headerFlex: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,

  backButton: {
    padding: '0.5rem',
    color: '#9ca3af',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  // Info Badge
  infoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '9999px',
  } as React.CSSProperties,

  // Main content
  main: {
    maxWidth: '72rem',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,

  // Page title section
  titleSection: {
    marginBottom: '2rem',
  } as React.CSSProperties,

  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  } as React.CSSProperties,

  pageSubtitle: {
    color: '#9ca3af',
    marginTop: '0.25rem',
  } as React.CSSProperties,

  // Info banner
  infoBanner: {
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: 'rgba(88, 28, 135, 0.15)',
    border: '1px solid rgba(168, 85, 247, 0.25)',
    borderRadius: '0.75rem',
  } as React.CSSProperties,

  infoBannerFlex: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  } as React.CSSProperties,

  infoBannerTitle: {
    color: '#c4b5fd',
    fontWeight: 500,
    margin: 0,
  } as React.CSSProperties,

  infoBannerText: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  } as React.CSSProperties,

  // Section
  section: {
    marginBottom: '2.5rem',
  } as React.CSSProperties,

  sectionHeader: {
    marginBottom: '1rem',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  } as React.CSSProperties,

  sectionSubtitle: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
  } as React.CSSProperties,

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: '1rem',
  } as React.CSSProperties,

  // Tile
  tile: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    width: '100%',
    padding: '1.25rem',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    border: '1px solid #374151',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  } as React.CSSProperties,

  tileHover: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  } as React.CSSProperties,

  tileIconContainer: {
    flexShrink: 0,
    padding: '0.75rem',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s ease',
  } as React.CSSProperties,

  tileIconContainerHover: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  } as React.CSSProperties,

  tileContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  tileTitle: {
    color: '#ffffff',
    fontWeight: 600,
    margin: 0,
    transition: 'color 0.2s ease',
  } as React.CSSProperties,

  tileTitleHover: {
    color: '#c4b5fd',
  } as React.CSSProperties,

  tileDescription: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '0.25rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  tileArrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
    marginTop: '0.25rem',
  } as React.CSSProperties,

  // Footer
  footer: {
    borderTop: '1px solid #374151',
    marginTop: '2rem',
  } as React.CSSProperties,

  footerInner: {
    maxWidth: '72rem',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#6b7280',
  } as React.CSSProperties,

  // Loading/Error states
  centerScreen: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  centerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  // Status badge
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  } as React.CSSProperties,
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT TILE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ProduktTileProps {
  produkt: Produkt;
  onClick: () => void;
}

function ProduktTile({ produkt, onClick }: ProduktTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = produkt.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.tile,
        ...(isHovered ? styles.tileHover : {}),
      }}
    >
      {/* Icon Container */}
      <div style={{
        ...styles.tileIconContainer,
        ...(isHovered ? styles.tileIconContainerHover : {}),
      }}>
        <Icon style={{
          width: '1.25rem',
          height: '1.25rem',
          color: isHovered ? '#a855f7' : '#9ca3af',
          transition: 'color 0.2s ease',
        }} />
      </div>

      {/* Content */}
      <div style={styles.tileContent}>
        <h3 style={{
          ...styles.tileTitle,
          ...(isHovered ? styles.tileTitleHover : {}),
        }}>
          {produkt.title}
        </h3>
        <p style={styles.tileDescription}>
          {produkt.description}
        </p>
      </div>

      {/* Arrow Icon */}
      <div style={styles.tileArrow}>
        <ChevronRight style={{
          width: '1.25rem',
          height: '1.25rem',
          color: isHovered ? '#a855f7' : '#4b5563',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
          transition: 'all 0.2s ease',
        }} />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface KategorieSectionProps {
  kategorie: Kategorie;
  onProduktSelect: (produkt: Produkt) => void;
}

function KategorieSection({ kategorie, onProduktSelect }: KategorieSectionProps) {
  return (
    <section style={styles.section}>
      {/* Section Header */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>{kategorie.title}</h2>
        <p style={styles.sectionSubtitle}>{kategorie.subtitle}</p>
      </div>

      {/* Products Grid */}
      <div style={{
        ...styles.grid,
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
      }}>
        {kategorie.produkte.map(produkt => (
          <ProduktTile
            key={produkt.id}
            produkt={produkt}
            onClick={() => onProduktSelect(produkt)}
          />
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const NbPortalAuswahl: React.FC = () => {
  const { portalId } = useParams<{ portalId: string }>();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<NbPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portalId) {
      setError('Kein Portal ausgewählt');
      setLoading(false);
      return;
    }

    getAvailablePortals()
      .then(portals => {
        const found = portals.find(p => p.id === portalId);
        if (found) {
          if (found.available) {
            setPortal(found);
          } else {
            setError(`${found.name} ist derzeit nicht verfügbar`);
          }
        } else {
          setError('Portal nicht gefunden');
        }
      })
      .catch(err => {
        setError('Fehler beim Laden des Portals');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [portalId]);

  const handleProduktSelect = (produkt: Produkt) => {
    // Immer zur internen Formular-Seite navigieren - KEIN externer Redirect!
    // Das Formular wird von der Stromnetz Berlin API geladen und in Baunity gerendert
    // Navigate to form for selected product
    navigate(`/nb-portal/${portalId}/form/${produkt.id}`, {
      state: { produktTitle: produkt.title }
    });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Loading State
  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.centerContent}>
          <Loader2 style={{ width: '2.5rem', height: '2.5rem', color: '#a855f7', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Portal wird geladen...</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.centerContent}>
          <AlertCircle style={{ width: '3rem', height: '3rem', color: '#ef4444' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>Fehler</h2>
          <p style={{ color: '#9ca3af' }}>{safeString(error)}</p>
          <button
            onClick={handleBack}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerFlex}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleBack}
                style={styles.backButton}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.5)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>NB-Portal</p>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{portal?.name || 'Netzbetreiber'}</h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Connection Status */}
              <div style={styles.statusBadge}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#4ade80' }} />
                <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>Verbunden</span>
              </div>

              {/* Info Badge */}
              <div style={styles.infoBadge}>
                <Shield style={{ width: '0.75rem', height: '0.75rem', color: '#a855f7' }} />
                <span style={{ color: '#a855f7', fontSize: '0.875rem' }}>Integriertes Formular</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Page Title */}
        <div style={styles.titleSection}>
          <h1 style={styles.pageTitle}>Netzanmeldung</h1>
          <p style={styles.pageSubtitle}>
            Wählen Sie den passenden Anmeldungstyp und füllen Sie das Formular direkt in Baunity aus
          </p>
        </div>

        {/* Info Banner */}
        <div style={styles.infoBanner}>
          <div style={styles.infoBannerFlex}>
            <FileEdit style={{ width: '1.25rem', height: '1.25rem', color: '#a855f7', flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <p style={styles.infoBannerTitle}>Integriertes Formular</p>
              <p style={styles.infoBannerText}>
                Die Formulare werden direkt in Baunity angezeigt. Ihre Daten werden sicher an {portal?.name || 'den Netzbetreiber'} übermittelt.
                Sie verlassen Baunity nicht.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        {KATEGORIEN.map(kategorie => (
          <KategorieSection
            key={kategorie.id}
            kategorie={kategorie}
            onProduktSelect={handleProduktSelect}
          />
        ))}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span>Daten werden sicher an {portal?.name || 'den Netzbetreiber'} übermittelt</span>
          <span>Powered by Baunity</span>
        </div>
      </footer>
    </div>
  );
};

export default NbPortalAuswahl;
