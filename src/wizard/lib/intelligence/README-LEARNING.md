# LECA Wizard Intelligence Learning System

## Übersicht

Das Learning System macht den Wizard mit jeder Installation intelligenter. Es lernt aus:

- **Nutzerverhalten**: Welche Produkte werden ausgewählt, wie lange dauern Schritte
- **Erfolgreiche Muster**: Welche Produkt-Kombinationen funktionieren gut
- **Regionale Präferenzen**: Was ist in bestimmten PLZ-Bereichen beliebt
- **Persönliche Präferenzen**: Was verwendet der Nutzer typischerweise

## Features

### 🧠 Smart Suggestions
Der Wizard zeigt intelligente Vorschläge an:
- **Produkt-Empfehlungen**: Basierend auf regionalen Trends und persönlichen Präferenzen
- **Kompatible Produkte**: Zeigt passende Speicher zu gewähltem Wechselrichter
- **Warnungen**: Bei unüblichen Konfigurationen
- **Tipps**: Regionale Orientierungswerte (z.B. "In Ihrer Region werden durchschnittlich 11 kWp installiert")

### 📊 Regional Insights
- Durchschnittliche Anlagengröße pro PLZ-Bereich
- Speicher-Quote, Wallbox-Quote, Wärmepumpen-Quote
- Beliebteste Hersteller und Produkte
- Typische Bearbeitungszeiten beim Netzbetreiber

### 🔄 Autofill
- Letzte Adresse wiederverwenden
- Kundendaten automatisch ausfüllen

### 🔗 Pattern-Erkennung
- Erkennt bewährte Produkt-Kombinationen (z.B. "Fronius + BYD")
- Zeigt Erfolgsquoten für Kombinationen
- Warnt bei unbekannten Kombinationen

## Integration

### 1. Frontend - useLearning Hook

```tsx
import { useLearning } from '@/wizard/hooks/useLearning';

function MyWizardComponent() {
  const {
    suggestions,           // Smart Suggestions für aktuellen Step
    regionalInsight,       // Regionale Statistiken
    patternMatch,          // Erkannte Muster
    autofillSuggestions,   // Autofill-Optionen
    acceptSuggestion,      // Suggestion akzeptieren
    rejectSuggestion,      // Suggestion ablehnen
    applyAutofill,         // Autofill anwenden
    startSession,          // Learning Session starten
    endSession,            // Learning Session beenden
  } = useLearning();

  // Suggestions anzeigen
  return (
    <div>
      {suggestions.map(s => (
        <SuggestionCard 
          key={s.id}
          suggestion={s}
          onAccept={() => acceptSuggestion(s)}
          onReject={() => rejectSuggestion(s)}
        />
      ))}
    </div>
  );
}
```

### 2. SmartSuggestions Komponente

```tsx
import { SmartSuggestions, RegionalInsights, PatternMatchBadge } from '@/wizard/components/wizard/SmartSuggestions';

function Step5Technik() {
  return (
    <div>
      {/* Zeigt Vorschläge automatisch */}
      <SmartSuggestions />
      
      {/* Regionale Statistiken */}
      <RegionalInsights plz={data.step2.plz} />
      
      {/* Pattern-Match Badge */}
      <PatternMatchBadge />
    </div>
  );
}
```

### 3. WizardStore Integration

Der WizardStore hat zwei neue Methoden:

```tsx
const { startLearningSession, endLearningSession } = useWizardStore();

// Am Anfang des Wizards:
useEffect(() => {
  startLearningSession();
}, []);

// Nach erfolgreichem Absenden:
async function onSubmit() {
  await submitWizard();
  await endLearningSession(true);
}

// Bei Abbruch:
async function onCancel() {
  await endLearningSession(false);
}
```

## Backend API

### POST /api/wizard/learning
Speichert eine Learning Session nach Wizard-Abschluss.

### POST /api/wizard/learning/suggestions
Generiert Smart Suggestions basierend auf Kontext.

### GET /api/wizard/learning/regional/:plzPrefix
Holt regionale Insights für PLZ-Bereich.

### GET /api/wizard/learning/user-insights
Holt persönliche Insights für eingeloggten User.

### POST /api/wizard/learning/compatible-products
Findet kompatible Produkte zu gewählter Basis.

### POST /api/wizard/learning/feedback
Speichert Feedback zu Vorschlägen.

### GET /api/wizard/learning/stats
Admin-Statistiken zum Lernsystem.

## Datenbank-Setup

1. Schema-Erweiterung in `prisma/schema-learning.prisma`
2. SQL-Migration in `prisma/migrations/add_wizard_learning.sql`

Migration ausführen:
```bash
mysql -u root -p leca < prisma/migrations/add_wizard_learning.sql
```

## Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `wizard_learning_sessions` | Speichert jeden Wizard-Durchlauf |
| `product_patterns` | Erkannte Produkt-Kombinationen |
| `user_preferences` | Benutzer-Präferenzen |
| `regional_patterns` | Regionale Statistiken |
| `smart_suggestions` | Gecachte Vorschläge |
| `suggestion_feedback` | Feedback zu Vorschlägen |

## Confidence-Berechnung

Die Konfidenz eines Vorschlags basiert auf:
- **Anzahl der Datenpunkte**: Mehr Daten = höhere Konfidenz
- **Erfolgsquote**: Höhere Erfolgsrate = höhere Konfidenz
- **Aktualität**: Neuere Daten werden stärker gewichtet
- **Quelle**: Personal > Pattern > Regional

## Datenschutz

- Keine personenbezogenen Daten in Learning-Tabellen
- Session-IDs sind nicht mit Nutzern verknüpft (optional)
- Daten werden aggregiert gespeichert
- Regionale Daten nur auf PLZ-Prefix-Ebene (z.B. "77")

## Erweiterungsmöglichkeiten

1. **ML-Modelle**: Echtes Machine Learning für Vorhersagen
2. **A/B-Testing**: Verschiedene Suggestion-Strategien testen
3. **Personalisierung**: Tiefere User-Profile
4. **Echtzeit-Updates**: WebSocket für Live-Suggestions
5. **Erklärbarkeit**: "Warum wird das empfohlen?"
