// src/features/nb-portal/forms/FormPlaceholder.tsx
/**
 * Placeholder für NB-Portal Formulare
 * ====================================
 * Zeigt einen Platzhalter für Formulare die noch nicht implementiert sind
 */

import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Construction,
  Home,
  Settings,
  Car,
  Flame,
  Trash2,
  Gauge,
  ToggleRight,
  Sun,
  Building2,
  Clock,
  Zap,
  HelpCircle,
  FileText,
  Activity
} from 'lucide-react';

// Mapping von Produkt-IDs zu Icons und Titeln
const PRODUKT_INFO: Record<string, { icon: React.ComponentType<{ className?: string }>; title: string }> = {
  'neuanschluss': { icon: Home, title: 'Neuanschluss' },
  'aenderung-anschluss': { icon: Settings, title: 'Änderung bestehender Anschluss' },
  'baustrom': { icon: Construction, title: 'Baustrom' },
  'wallboxen': { icon: Car, title: 'Wallboxen' },
  'waermepumpen': { icon: Flame, title: 'Wärmepumpen' },
  'demontage': { icon: Trash2, title: 'Demontage' },
  'messung-vorzaehler': { icon: Gauge, title: 'Messung im Vorzählerbereich' },
  'steuerbare-verbraucher': { icon: ToggleRight, title: 'Steuerbare Verbrauchseinrichtungen §14a EnWG' },
  'pv-bis-30kva': { icon: Sun, title: 'Neueinrichtung PV-Anlage bis 30 kVA' },
  'pv-30-100kwp': { icon: Sun, title: 'Neueinrichtung PV-Anlage 30 kVA bis 100 kWp' },
  'aenderung-eeg': { icon: Settings, title: 'Änderung EEG- / KWKG-Anlage' },
  'demontage-eeg': { icon: Trash2, title: 'Demontage EEG- / KWKG-Anlage' },
  'andere-erzeugung': { icon: Activity, title: 'Neueinrichtung anderer Erzeugungsanlagen' },
  'ladeinfrastruktur': { icon: Car, title: 'Ladeinfrastruktur Öffentlicher Raum' },
  'zeitlich-begrenzt': { icon: Clock, title: 'Zeitlich begrenzter Anschluss' },
  'neuanschluss-strassenland': { icon: Building2, title: 'Neuanschluss im öffentlichen Straßenland' },
  'aenderung-strassenland': { icon: Settings, title: 'Änderung im öffentlichen Straßenland' },
  'demontage-strassenland': { icon: Trash2, title: 'Demontage im öffentlichen Straßenland' },
  'mittelspannung': { icon: Zap, title: 'Mittelspannung' },
  'imsys': { icon: Gauge, title: 'Kundenwunsch iMSys' },
  'service': { icon: HelpCircle, title: 'Unser Service' },
  'preisblatt': { icon: FileText, title: 'Preisblatt Anschluss Niederspannung' },
};

interface LocationState {
  produktPath?: string;
  produktTitle?: string;
}

export function FormPlaceholder() {
  const { portalId, typeId } = useParams<{ portalId: string; typeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  // Get product info from mapping or location state
  const produktInfo = typeId ? PRODUKT_INFO[typeId] : null;
  const title = locationState?.produktTitle || produktInfo?.title || typeId || 'Formular';
  const Icon = produktInfo?.icon || Construction;

  const handleBack = () => {
    navigate(`/nb-portal/${portalId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">NB-Portal</p>
              <h1 className="text-xl font-bold text-white">{title}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-purple-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            Dieses Formular wird demnächst verfügbar sein.
          </p>

          {/* Info Box */}
          <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-300">
              <span className="text-purple-400 font-medium">Hinweis:</span> Die direkte Anbindung an das Netzbetreiber-Portal wird gerade eingerichtet.
              In der Zwischenzeit können Sie die Anmeldung über unseren Standard-Wizard durchführen.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/anlagen-wizard')}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Zum Anlagen-Wizard
            </button>
            <button
              onClick={handleBack}
              className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Zurück zur Auswahl
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <span>Powered by Baunity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default FormPlaceholder;
