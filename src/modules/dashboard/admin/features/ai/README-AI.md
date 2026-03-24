# 🧠 LECA AI Assistant - Setup Guide

## Übersicht

Der LECA AI Assistant nutzt die **Claude API** von Anthropic für intelligente Features:

- 💬 **Kontext-Aware Chat** - Versteht das gesamte System
- 📊 **Prognosen** - ML-basierte Bearbeitungszeit-Vorhersagen
- 📧 **E-Mail Drafting** - Automatische E-Mail-Entwürfe
- 📄 **Dokumenten-Analyse** - OCR & Vollständigkeitsprüfung
- 📋 **Tägliches Briefing** - Proaktive Zusammenfassung
- 🎤 **Voice Input** - Spracheingabe (Web Speech API)

---

## 🔐 Rollen-basierte Features

| Feature | ADMIN | MITARBEITER | KUNDE | SUBUNTERNEHMER |
|---------|-------|-------------|-------|----------------|
| Chat | ✅ | ✅ | ✅ | ✅ |
| Alle Anmeldungen sehen | ✅ | ✅ | ❌ | ❌ |
| Prognosen | ✅ | ✅ | ✅ | ✅ |
| E-Mail Drafts | ✅ | ✅ | ❌ | ❌ |
| Status ändern | ✅ | ✅ | ❌ | ❌ |
| Einreichungen | ✅ | ✅ | ❌ | ❌ |
| Workflow Automation | ✅ | ✅ | ❌ | ❌ |

---

## 🚀 Backend Setup

### 1. Dependencies installieren

```bash
cd /var/www/leca-admin-backend
npm install @anthropic-ai/sdk pdf-parse sharp multer
```

### 2. Environment Variable setzen

```bash
# .env
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

### 3. Route registrieren

```typescript
// src/index.ts oder src/app.ts
import aiRoutes from "./routes/ai.routes";

app.use("/api/ai", aiRoutes);
```

### 4. API Key von Anthropic

1. Gehe zu https://console.anthropic.com/
2. Erstelle einen API Key
3. Füge ihn zur .env hinzu

---

## 📡 API Endpoints

### POST `/api/ai/chat`
Haupt-Chat-Endpoint für Konversation mit Claude.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Zeige überfällige Anmeldungen" }
  ],
  "context": {
    "currentPage": "/dashboard"
  }
}
```

**Response:**
```json
{
  "message": "Ich habe 3 überfällige Anmeldungen gefunden:",
  "results": [
    {
      "id": 123,
      "publicId": "NA-2847",
      "customerName": "Müller Solar GmbH",
      "status": "warten_auf_nb",
      "statusLabel": "Beim Netzbetreiber",
      "gridOperator": "EnBW",
      "daysInStatus": 7,
      "relevance": 95
    }
  ],
  "actions": [
    {
      "id": "send-reminder",
      "type": "email",
      "label": "Erinnerung senden",
      "allowedRoles": ["ADMIN", "MITARBEITER"]
    }
  ]
}
```

### POST `/api/ai/analyze-document`
Dokumenten-Analyse mit OCR.

**Request:** `multipart/form-data`
- `file`: PDF oder Bild

**Response:**
```json
{
  "fileName": "lageplan.pdf",
  "documentType": "Lageplan",
  "confidence": 92,
  "extractedData": {
    "adresse": "Musterstraße 1, 76137 Karlsruhe"
  },
  "issues": [
    { "type": "warning", "message": "Maßstab nicht erkennbar" }
  ],
  "suggestions": [
    "Maßstab 1:500 hinzufügen"
  ]
}
```

### GET `/api/ai/predict/:installationId`
Prognose für eine Netzanmeldung.

**Response:**
```json
{
  "installationId": 123,
  "publicId": "NA-2847",
  "predictedDays": 4,
  "confidence": 78,
  "riskScore": 35,
  "riskLevel": "low",
  "factors": [
    {
      "name": "Schneller Netzbetreiber",
      "impact": "positive",
      "description": "EnBW bearbeitet im Schnitt in 3.5 Tagen"
    }
  ],
  "recommendations": [
    "Alle Dokumente vollständig - gute Chancen"
  ]
}
```

### GET `/api/ai/briefing`
Tägliches Briefing.

**Response:**
```json
{
  "date": "Dienstag, 24.12.2024",
  "urgent": [
    {
      "id": 123,
      "publicId": "NA-2847",
      "customerName": "Müller Solar",
      "issue": "Wartet seit 7 Tagen",
      "priority": "high",
      "suggestedAction": "Nachfassen beim Netzbetreiber"
    }
  ],
  "stats": {
    "newToday": 3,
    "completedToday": 5,
    "openTotal": 47,
    "avgDays": 4.2
  },
  "insights": [
    "3 neue Anmeldungen heute eingegangen",
    "2 dringende Items erfordern Aufmerksamkeit"
  ]
}
```

### POST `/api/ai/draft-email`
E-Mail-Entwurf generieren.

**Request:**
```json
{
  "installationId": 123,
  "type": "nachfrage",
  "customMessage": "Bitte höflich nach dem Status fragen"
}
```

**Response:**
```json
{
  "to": "netzanschluss@enbw.com",
  "subject": "Nachfrage zu NA-2847 - Müller Solar GmbH",
  "body": "Sehr geehrte Damen und Herren,\n\nwir erlauben uns...",
  "relatedInstallation": "NA-2847"
}
```

---

## 🎨 Frontend Integration

### 1. Import

```tsx
import { AIAssistantV2, useAIAssistant } from "./features/ai/AIAssistantV2";
```

### 2. In Layout einbinden

```tsx
const Layout = () => {
  const ai = useAIAssistant();
  const user = { id: 1, name: "Max", email: "max@leca.de", role: "ADMIN" };

  return (
    <>
      <Header>
        <button onClick={ai.open}>
          <Sparkles /> AI
        </button>
      </Header>
      
      <AIAssistantV2
        isOpen={ai.isOpen}
        onClose={ai.close}
        user={user}
      />
    </>
  );
};
```

### 3. CSS importieren

```tsx
import "./features/ai/ai-assistant-v2.css";
```

---

## 💡 Beispiel-Queries

### Für ADMIN/MITARBEITER:

```
"Zeig mir alle überfälligen Anmeldungen"
"Welche Anmeldungen sind bereit zur Einreichung?"
"Schreib eine Nachfrage-E-Mail an EnBW für NA-2847"
"Wie ist die Performance diese Woche?"
"Prognose für NA-2850"
"Welche Dokumente fehlen bei NA-2848?"
"Erstelle eine Regel: E-Mail bei Genehmigung"
```

### Für KUNDE:

```
"Status meiner Anmeldungen"
"Was muss ich als nächstes tun?"
"Welche Dokumente fehlen noch?"
"Wann wird meine Anmeldung genehmigt?"
```

---

## 🔧 Anpassungen

### System Prompt erweitern

In `backend/ai.routes.ts`:

```typescript
const SYSTEM_PROMPT = `
Du bist LECA AI...

// Eigene Regeln hinzufügen:
ZUSÄTZLICHE REGELN:
- Bei Fragen zu Tarifen verweise auf die Preisliste
- Erwähne immer die NA-Nummer bei Aktionen
`;
```

### Neue Actions hinzufügen

```typescript
// In der Claude Response können Actions definiert werden:
"actions": [
  {
    "id": "custom-action",
    "type": "call_api",
    "label": "Meine Aktion",
    "data": { "endpoint": "/api/custom" },
    "allowedRoles": ["ADMIN"]
  }
]
```

---

## 💰 Kosten

Claude API Preise (Stand Dezember 2024):

| Modell | Input | Output |
|--------|-------|--------|
| Claude Sonnet 4 | $3 / 1M tokens | $15 / 1M tokens |

**Geschätzte Kosten:**
- ~500-1000 Tokens pro Chat-Nachricht
- ~1000-2000 Tokens pro Dokumentenanalyse
- Bei 100 Anfragen/Tag: ca. $1-2/Tag

---

## 🛡️ Datenschutz

- Alle Daten werden über HTTPS übertragen
- Claude speichert keine Daten (Zero Data Retention verfügbar)
- Sensible Daten werden vor dem Senden maskiert
- API Key niemals im Frontend!

---

## 🐛 Troubleshooting

### "API Key ungültig"
- Prüfe ob CLAUDE_API_KEY in .env korrekt ist
- Key muss mit `sk-ant-api03-` beginnen

### "Keine Antwort"
- Prüfe Netzwerk-Verbindung
- Claude API Status: https://status.anthropic.com

### "Dokumentenanalyse schlägt fehl"
- Maximale Dateigröße: 10MB
- Unterstützte Formate: PDF, JPG, PNG
- Bei PDFs: pdf-parse installiert?

---

## 📚 Weiterführende Links

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [API Pricing](https://www.anthropic.com/pricing)
