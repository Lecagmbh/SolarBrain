// ═══════════════════════════════════════════════════════════════════════════
// NETZBETREIBER DATENBANK - Aus MaStR Import
// 941 Netzbetreiber aus öffentlichem Marktakteur-Register
// ═══════════════════════════════════════════════════════════════════════════

import type { GridOperator, PlzMapping } from '../types';

// Diese Daten werden aus der CSV generiert und hier als TypeScript Array gespeichert
// In Produktion würde das aus einer Datenbank kommen

export const GRID_OPERATORS: GridOperator[] = [
  // Top 20 größte Netzbetreiber (häufigste)
  {
    id: "SNB940352624434",
    name: "Bayernwerk Netz GmbH",
    shortName: "Bayernwerk",
    bundesland: "Bayern",
    plz: "93049",
    ort: "Regensburg",
    strasse: "Lilienthalstraße",
    hausnummer: "7",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher"],
    status: "Aktiv",
    portalUrl: "https://www.bayernwerk-netz.de/de/energie-anschliessen/einspeiser.html",
  },
  {
    id: "SNB941690671609",
    name: "E.DIS Netz GmbH",
    shortName: "E.DIS",
    bundesland: "Brandenburg",
    plz: "15517",
    ort: "Fürstenwalde",
    strasse: "Langewahler Straße",
    hausnummer: "60",
    acerCode: "A0005838T.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB990362338043",
    name: "Avacon Netz GmbH",
    shortName: "Avacon",
    bundesland: "Niedersachsen",
    plz: "38350",
    ort: "Helmstedt",
    strasse: "Schillerstraße",
    hausnummer: "3",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB965774651691",
    name: "badenovaNETZE GmbH",
    shortName: "badenova",
    bundesland: "Baden-Württemberg",
    plz: "79108",
    ort: "Freiburg",
    strasse: "Tullastraße",
    hausnummer: "61",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB980808485264",
    name: "SachsenNetze GmbH",
    shortName: "SachsenNetze",
    bundesland: "Sachsen",
    plz: "01069",
    ort: "Dresden",
    strasse: "Friedrich-List-Platz",
    hausnummer: "2",
    acerCode: "A0004570C.DE",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB945502201350",
    name: "naturenergie netze GmbH",
    shortName: "naturenergie",
    bundesland: "Baden-Württemberg",
    plz: "79618",
    ort: "Rheinfelden",
    strasse: "Schildgasse",
    hausnummer: "20",
    acerCode: "A00013981.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB981060961299",
    name: "Dortmunder Netz GmbH",
    shortName: "Dortmunder Netz",
    bundesland: "Nordrhein-Westfalen",
    plz: "44135",
    ort: "Dortmund",
    strasse: "Günter-Samtlebe-Platz",
    hausnummer: "1",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB926699071292",
    name: "Albwerk GmbH & Co. KG",
    shortName: "Albwerk",
    bundesland: "Baden-Württemberg",
    plz: "73312",
    ort: "Geislingen",
    strasse: "Eybstraße",
    hausnummer: "98-102",
    acerCode: "A0002143J.DE",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB926394308747",
    name: "AllgäuNetz GmbH & Co. KG",
    shortName: "AllgäuNetz",
    bundesland: "Bayern",
    plz: "87435",
    ort: "Kempten",
    strasse: "Illerstraße",
    hausnummer: "18",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB976890256486",
    name: "Amprion GmbH",
    shortName: "Amprion",
    bundesland: "Nordrhein-Westfalen",
    plz: "44263",
    ort: "Dortmund",
    strasse: "Robert-Schuman-Straße",
    hausnummer: "7",
    acerCode: "A0001435B.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkoordinator", "Bilanzkreisverantwortlicher", "Messstellenbetreiber", "Übertragungsnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB982046657236",
    name: "50Hertz Transmission GmbH",
    shortName: "50Hertz",
    bundesland: "Berlin",
    plz: "10557",
    ort: "Berlin",
    strasse: "Heidestraße",
    hausnummer: "2",
    acerCode: "A00014369.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkoordinator", "Bilanzkreisverantwortlicher", "Messstellenbetreiber", "Übertragungsnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB927498960503",
    name: "Bonn-Netz GmbH",
    shortName: "Bonn-Netz",
    bundesland: "Nordrhein-Westfalen",
    plz: "53115",
    ort: "Bonn",
    strasse: "Karlstr.",
    hausnummer: "",
    acerCode: "A0005775X.DE",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB926644622999",
    name: "Braunschweiger Netz GmbH",
    shortName: "BS Netz",
    bundesland: "Niedersachsen",
    plz: "38106",
    ort: "Braunschweig",
    strasse: "Taubenstraße",
    hausnummer: "7",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB955238223991",
    name: "Celle-Uelzen Netz GmbH",
    shortName: "Celle-Uelzen",
    bundesland: "Niedersachsen",
    plz: "29223",
    ort: "Celle",
    strasse: "Sprengerstraße",
    hausnummer: "2",
    acerCode: "A0010541F.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB973074326355",
    name: "ELE Verteilnetz GmbH",
    shortName: "ELE",
    bundesland: "Nordrhein-Westfalen",
    plz: "45879",
    ort: "Gelsenkirchen",
    strasse: "Ebertstraße",
    hausnummer: "30",
    acerCode: "A00033658.DE",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB979557818782",
    name: "EGT Energie GmbH",
    shortName: "EGT",
    bundesland: "Baden-Württemberg",
    plz: "78098",
    ort: "Triberg",
    strasse: "Schonacher Straße",
    hausnummer: "2",
    acerCode: "A00025738.DE",
    marktrollen: ["Anschlussnetzbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB928479274794",
    name: "EHINGER ENERGIE GmbH & Co. KG",
    shortName: "EHINGER ENERGIE",
    bundesland: "Baden-Württemberg",
    plz: "89584",
    ort: "Ehingen",
    strasse: "Groggentalgasse",
    hausnummer: "5",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB967794191157",
    name: "AVU Netz GmbH",
    shortName: "AVU",
    bundesland: "Nordrhein-Westfalen",
    plz: "58285",
    ort: "Gevelsberg",
    strasse: "An der Drehbank",
    hausnummer: "18",
    marktrollen: ["Anschlussnetzbetreiber", "Bilanzkreisverantwortlicher", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB990174285078",
    name: "BIGGE ENERGIE GmbH & Co. KG",
    shortName: "BIGGE ENERGIE",
    bundesland: "Nordrhein-Westfalen",
    plz: "57439",
    ort: "Attendorn",
    strasse: "In der Stesse",
    hausnummer: "14",
    acerCode: "A00013486.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Messstellenbetreiber"],
    status: "Aktiv",
  },
  {
    id: "SNB931070025696",
    name: "Alliander Netz Heinsberg GmbH",
    shortName: "Alliander",
    bundesland: "Nordrhein-Westfalen",
    plz: "52525",
    ort: "Heinsberg",
    strasse: "Boos-Fremery-Straße",
    hausnummer: "70",
    acerCode: "A0004621D.DE",
    marktrollen: ["Anschlussnetzbetreiber", "Messstellenbetreiber"],
    status: "Aktiv",
  },
];

// Funktion um alle NB aus CSV zu laden (wird in Produktion verwendet)
export async function loadAllGridOperatorsFromCsv(csvContent: string): Promise<GridOperator[]> {
  const lines = csvContent.split('\n');
  const operators: GridOperator[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV (Semikolon-getrennt, Werte in Anführungszeichen)
    const values = line.split(';').map(v => v.replace(/^"|"$/g, '').trim());
    
    const [
      mastrNr, name, _marktfunktion, marktrollen, bundesland, plz, ort,
      strasse, hausnummer, _land, registrierungsdatum, _aktualisierung,
      acerCode, _geschlossenesNetz, status, _taetigkeitsbeginn, _taetigkeitsende
    ] = values;
    
    // Nur aktive Stromnetzbetreiber
    if (status !== 'Aktiv') continue;
    if (!marktrollen.includes('Anschlussnetzbetreiber')) continue;
    
    operators.push({
      id: mastrNr,
      name: name,
      shortName: extractShortName(name),
      bundesland,
      plz,
      ort,
      strasse,
      hausnummer,
      acerCode: acerCode || undefined,
      marktrollen: marktrollen.split(',').map(r => r.trim()),
      status: 'Aktiv',
      registrierungsdatum,
    });
  }
  
  return operators;
}

function extractShortName(fullName: string): string {
  // Entferne typische Suffixe
  let short = fullName
    .replace(/ GmbH & Co\. KG$/i, '')
    .replace(/ GmbH & Co\.KG$/i, '')
    .replace(/ GmbH$/i, '')
    .replace(/ AG$/i, '')
    .replace(/ eG$/i, '')
    .replace(/ Netz$/i, '')
    .replace(/ Netze$/i, '')
    .replace(/ Verteilnetz$/i, '');
  
  // Wenn zu lang, kürzen
  if (short.length > 25) {
    short = short.substring(0, 25);
  }
  
  return short;
}

// Suche in NB
export function searchGridOperators(
  query: string, 
  operators: GridOperator[],
  limit: number = 20
): GridOperator[] {
  const q = query.toLowerCase();
  
  return operators
    .filter(op => 
      op.name.toLowerCase().includes(q) ||
      op.shortName?.toLowerCase().includes(q) ||
      op.ort?.toLowerCase().includes(q) ||
      op.plz?.startsWith(q)
    )
    .slice(0, limit);
}

// Finde NB nach Bundesland
export function getGridOperatorsByBundesland(
  bundesland: string,
  operators: GridOperator[]
): GridOperator[] {
  return operators.filter(op => op.bundesland === bundesland);
}

// PLZ-Mapping Funktionen
export function createPlzMappingFromSelection(
  plz: string,
  operator: GridOperator,
  source: 'customer' | 'admin_verified' = 'customer'
): PlzMapping {
  return {
    id: `${plz}-${operator.id}`,
    plz,
    gridOperatorId: operator.id,
    gridOperatorName: operator.name,
    source,
    confirmations: source === 'admin_verified' ? 100 : 1,
    rejections: 0,
    confidence: source === 'admin_verified' ? 100 : 10,
    coverage: 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 1,
  };
}

export function updatePlzMappingConfirmation(
  mapping: PlzMapping,
  confirmed: boolean
): PlzMapping {
  return {
    ...mapping,
    confirmations: confirmed ? (mapping.confirmations ?? 0) + 1 : (mapping.confirmations ?? 0),
    rejections: confirmed ? mapping.rejections : (mapping.rejections ?? 0) + 1,
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    usageCount: (mapping.usageCount ?? 0) + 1,
  };
}
