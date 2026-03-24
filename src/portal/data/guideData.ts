/**
 * Guide Data — Schritt-für-Schritt-Anleitungen pro Status
 * Einfache Sprache für Endkunden.
 */

export interface GuideStep {
  title: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StatusGuide {
  status: string;
  title: string;
  intro: string;
  steps: GuideStep[];
  doList: string[];
  dontList: string[];
  faq: FaqItem[];
}

export const STATUS_GUIDES: Record<string, StatusGuide> = {
  EINGANG: {
    status: "EINGANG",
    title: "Ihre Unterlagen werden geprüft",
    intro: "Wir haben Ihre Anmeldung erhalten und prüfen die Unterlagen auf Vollständigkeit.",
    steps: [
      {
        title: "Dokumente hochladen",
        description: "Falls noch Unterlagen fehlen, laden Sie diese unter \"Dokumente\" hoch.",
      },
      {
        title: "Kontaktdaten prüfen",
        description: "Stellen Sie sicher, dass Ihre E-Mail-Adresse und Telefonnummer aktuell sind.",
      },
      {
        title: "Abwarten",
        description: "Sobald alles vollständig ist, reichen wir die Unterlagen beim Netzbetreiber ein.",
      },
    ],
    doList: [
      "Fehlende Dokumente zeitnah hochladen",
      "Kontaktdaten unter \"Einstellungen\" prüfen",
      "Nachrichten regelmäßig checken",
    ],
    dontList: [
      "Den Netzbetreiber selbst kontaktieren",
      "Dokumente doppelt einreichen",
    ],
    faq: [
      {
        question: "Wie lange dauert die Prüfung?",
        answer: "In der Regel 1-3 Werktage. Wenn Unterlagen fehlen, melden wir uns bei Ihnen.",
      },
      {
        question: "Welche Dokumente brauche ich?",
        answer: "Lageplan, Schaltplan, Datenblätter der Module und Wechselrichter. Unter \"Dokumente\" sehen Sie, was noch fehlt.",
      },
    ],
  },

  IN_BEARBEITUNG: {
    status: "IN_BEARBEITUNG",
    title: "Wir bereiten Ihre Unterlagen vor",
    intro: "Ihre Unterlagen werden gerade für die Einreichung beim Netzbetreiber vorbereitet.",
    steps: [
      {
        title: "Wir arbeiten daran",
        description: "Unser Team bereitet die Unterlagen für den Netzbetreiber vor.",
      },
      {
        title: "Automatische Einreichung",
        description: "Sobald alles fertig ist, reichen wir direkt beim Netzbetreiber ein.",
      },
    ],
    doList: [
      "Auf Nachrichten achten, falls doch noch etwas fehlt",
      "Entspannt abwarten — wir kümmern uns",
    ],
    dontList: [
      "Unterlagen nochmal einreichen",
      "Den Netzbetreiber kontaktieren",
    ],
    faq: [
      {
        question: "Muss ich noch etwas tun?",
        answer: "Nein, im Moment nicht. Wir melden uns, falls doch noch etwas benötigt wird.",
      },
    ],
  },

  BEIM_NB: {
    status: "BEIM_NB",
    title: "Alles eingereicht — jetzt heißt es warten",
    intro: "Ihre Unterlagen wurden beim Netzbetreiber eingereicht. Die Bearbeitung dauert in der Regel 2-8 Wochen.",
    steps: [
      {
        title: "Unterlagen eingereicht",
        description: "Der Netzbetreiber hat Ihre Unterlagen und bearbeitet den Antrag.",
      },
      {
        title: "Warten auf Antwort",
        description: "Die Bearbeitungszeit variiert je nach Netzbetreiber (2-8 Wochen).",
      },
      {
        title: "Benachrichtigung",
        description: "Sobald der Netzbetreiber antwortet, informieren wir Sie sofort.",
      },
    ],
    doList: [
      "Geduldig warten — der Netzbetreiber braucht seine Zeit",
      "Benachrichtigungen aktiviert lassen",
    ],
    dontList: [
      "Den Netzbetreiber selbst anrufen — das kann den Prozess verzögern",
      "Dokumente nochmal an den Netzbetreiber senden",
    ],
    faq: [
      {
        question: "Warum dauert das so lange?",
        answer: "Netzbetreiber bearbeiten Anträge in der Reihenfolge des Eingangs. Bei hohem Aufkommen kann es etwas länger dauern.",
      },
      {
        question: "Kann ich den Netzbetreiber anrufen?",
        answer: "Bitte nicht — das kann den Prozess tatsächlich verzögern. Wir verfolgen den Stand und informieren Sie bei Neuigkeiten.",
      },
      {
        question: "Was bedeutet 'Kundenfreigabe erforderlich'?",
        answer: "Manche Netzbetreiber verlangen, dass Sie sich in deren Portal registrieren und den Vorgang aktiv freigeben. Folgen Sie dazu den Anweisungen im roten Banner auf Ihrem Dashboard.",
      },
    ],
  },

  RUECKFRAGE: {
    status: "RUECKFRAGE",
    title: "Der Netzbetreiber braucht noch etwas",
    intro: "Es liegt eine Rückfrage des Netzbetreibers vor. Bitte reagieren Sie zeitnah.",
    steps: [
      {
        title: "Nachricht lesen",
        description: "Gehen Sie zu \"Nachrichten\" und lesen Sie die Rückfrage sorgfältig durch.",
      },
      {
        title: "Angeforderte Unterlagen bereitstellen",
        description: "Falls Dokumente benötigt werden, laden Sie diese unter \"Dokumente\" hoch.",
      },
      {
        title: "Antwort senden",
        description: "Schreiben Sie eine kurze Antwort über \"Nachrichten\", damit wir weiterarbeiten können.",
      },
      {
        title: "Wir leiten weiter",
        description: "Sobald Sie geantwortet haben, leiten wir alles an den Netzbetreiber weiter.",
      },
    ],
    doList: [
      "Nachricht unter \"Nachrichten\" lesen",
      "Geforderte Dokumente unter \"Dokumente\" hochladen",
      "Kurze Antwort schreiben",
      "Innerhalb von 5 Werktagen reagieren",
    ],
    dontList: [
      "Die Rückfrage ignorieren — das verzögert die Genehmigung",
      "Direkt beim Netzbetreiber antworten",
    ],
    faq: [
      {
        question: "Was passiert, wenn ich nicht reagiere?",
        answer: "Der Antrag kann vom Netzbetreiber abgelehnt werden. Bitte reagieren Sie möglichst innerhalb von 5 Werktagen.",
      },
      {
        question: "Ich verstehe die Rückfrage nicht — was tun?",
        answer: "Schreiben Sie uns eine Nachricht und wir erklären Ihnen, was benötigt wird.",
      },
    ],
  },

  GENEHMIGT: {
    status: "GENEHMIGT",
    title: "Ihre Anlage ist genehmigt!",
    intro: "Der Netzbetreiber hat Ihren Antrag genehmigt. Die Installation kann weitergehen.",
    steps: [
      {
        title: "Genehmigung erteilt",
        description: "Der Netzbetreiber hat die Einspeisezusage erteilt.",
      },
      {
        title: "Installateur kümmert sich",
        description: "Ihr Installateur wird die nächsten Schritte koordinieren.",
      },
      {
        title: "Zählerplatz vorbereiten",
        description: "Stellen Sie sicher, dass der Zählerplatz zugänglich ist.",
      },
    ],
    doList: [
      "Zugang zum Zählerplatz sicherstellen",
      "Auf Kontaktaufnahme des Installateurs warten",
    ],
    dontList: [
      "Den Zählerplatz selbst umbauen",
    ],
    faq: [
      {
        question: "Wann wird der Zähler getauscht?",
        answer: "Der Netzbetreiber oder ein beauftragter Dienstleister wird sich für einen Termin melden.",
      },
    ],
  },

  IBN: {
    status: "IBN",
    title: "Inbetriebnahme läuft",
    intro: "Der Zähler wird gesetzt und die Anlage in Betrieb genommen.",
    steps: [
      {
        title: "Zähler wird gesetzt",
        description: "Der Netzbetreiber oder ein Techniker kommt zum Zählertausch.",
      },
      {
        title: "Anlage wird angemeldet",
        description: "Die finale Anmeldung im Marktstammdatenregister erfolgt.",
      },
      {
        title: "Fertigmeldung",
        description: "Sobald alles abgeschlossen ist, erhalten Sie die Fertigmeldung.",
      },
    ],
    doList: [
      "Zugang zum Zählerplatz am Termin sicherstellen",
      "Erreichbar sein für eventuelle Rückfragen",
    ],
    dontList: [
      "Am Zählerkasten selbst arbeiten",
    ],
    faq: [
      {
        question: "Wie lange dauert die Inbetriebnahme?",
        answer: "Der Zählertausch selbst dauert ca. 1-2 Stunden. Die komplette Inbetriebnahme kann wenige Tage in Anspruch nehmen.",
      },
    ],
  },

  FERTIG: {
    status: "FERTIG",
    title: "Alles erledigt!",
    intro: "Die Netzanmeldung ist abgeschlossen. Ihre Anlage ist vollständig angemeldet.",
    steps: [
      {
        title: "Abgeschlossen",
        description: "Die Netzanmeldung ist vollständig abgeschlossen.",
      },
      {
        title: "Dokumente archiviert",
        description: "Alle Unterlagen finden Sie weiterhin unter \"Dokumente\".",
      },
    ],
    doList: [
      "Dokumente für Ihre Unterlagen herunterladen",
      "Bei Änderungen an der Anlage Ihren Installateur kontaktieren",
    ],
    dontList: [],
    faq: [
      {
        question: "Was ist, wenn sich etwas an meiner Anlage ändert?",
        answer: "Bei Änderungen (z.B. Erweiterung, Speicher nachrüsten) muss eine neue Anmeldung erfolgen. Kontaktieren Sie Ihren Installateur.",
      },
    ],
  },

  STORNIERT: {
    status: "STORNIERT",
    title: "Vorgang abgebrochen",
    intro: "Dieser Vorgang wurde storniert. Alle bisherigen Unterlagen bleiben als Archiv erhalten.",
    steps: [
      {
        title: "Stornierung",
        description: "Der Netzanmeldungs-Vorgang wurde abgebrochen.",
      },
    ],
    doList: [
      "Bei Fragen Ihren Installateur kontaktieren",
    ],
    dontList: [],
    faq: [
      {
        question: "Kann ich den Vorgang wieder aktivieren?",
        answer: "Kontaktieren Sie Ihren Installateur. Je nach Grund der Stornierung kann eine neue Anmeldung gestartet werden.",
      },
    ],
  },
};

/**
 * Dokument-Upload-Hilfe für die DocumentsPage
 */
export const DOCUMENT_UPLOAD_HELP = {
  title: "Wie lade ich Dokumente hoch?",
  steps: [
    "Klicken Sie auf das Upload-Symbol bei der passenden Kategorie.",
    "Wählen Sie die Datei von Ihrem Gerät aus (PDF, JPG, PNG).",
    "Das Dokument wird automatisch hochgeladen und geprüft.",
  ],
  categories: [
    { key: "lageplan", label: "Lageplan", explanation: "Zeichnung, die zeigt wo die Module auf Ihrem Dach liegen." },
    { key: "schaltplan", label: "Schaltplan", explanation: "Technische Zeichnung der elektrischen Verkabelung (erstellt Ihr Installateur)." },
    { key: "datenblatt", label: "Datenblatt", explanation: "Technische Daten der Module und Wechselrichter (vom Hersteller)." },
    { key: "antrag", label: "Antrag", explanation: "Ausgefülltes Antragsformular des Netzbetreibers." },
  ],
};

/**
 * Rückfrage-Hilfe für die MessagesPage
 */
export const RUECKFRAGE_HELP = {
  title: "So beantworten Sie die Rückfrage",
  steps: [
    "Lesen Sie die Rückfrage oben sorgfältig durch.",
    "Falls Dokumente angefordert werden: Laden Sie diese unter \"Dokumente\" hoch.",
    "Schreiben Sie eine kurze Antwort im Textfeld unten.",
    "Klicken Sie auf \"Senden\" — wir leiten alles an den Netzbetreiber weiter.",
  ],
};
