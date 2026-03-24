// ═══════════════════════════════════════════════════════════════════════════
// TOP 50 DEUTSCHE NETZBETREIBER - SEED DATA
// Diese Daten können importiert werden um das System zu initialisieren
// ═══════════════════════════════════════════════════════════════════════════

import type { GridOperator, PlzMapping } from "../types";

export const TOP_GRID_OPERATORS: Omit<GridOperator, "id" | "createdAt" | "updatedAt">[] = [
  { name: "E.ON Energie Deutschland", shortName: "E.ON", bdewCode: "9900", website: "https://www.eon.de", portalUrl: "https://www.eon.de/de/pk/service/netzanschluss.html", active: true, verified: true },
  { name: "Bayernwerk Netz GmbH", shortName: "Bayernwerk", bdewCode: "9903", website: "https://www.bayernwerk-netz.de", portalUrl: "https://www.bayernwerk-netz.de/de/energie-anschliessen.html", active: true, verified: true },
  { name: "EnBW Energie Baden-Württemberg", shortName: "EnBW", bdewCode: "9901", website: "https://www.enbw.com", portalUrl: "https://www.netze-bw.de/einspeiser", active: true, verified: true },
  { name: "Netze BW GmbH", shortName: "Netze BW", bdewCode: "9902", website: "https://www.netze-bw.de", portalUrl: "https://www.netze-bw.de/einspeiser", active: true, verified: true },
  { name: "Westnetz GmbH", shortName: "Westnetz", bdewCode: "9904", website: "https://www.westnetz.de", portalUrl: "https://www.westnetz.de/de/einspeiser.html", active: true, verified: true },
  { name: "Stromnetz Berlin GmbH", shortName: "Stromnetz Berlin", bdewCode: "9905", website: "https://www.stromnetz-berlin.de", portalUrl: "https://www.stromnetz-berlin.de/de/einspeiser.html", active: true, verified: true },
  { name: "Stromnetz Hamburg GmbH", shortName: "Stromnetz Hamburg", bdewCode: "9906", website: "https://www.stromnetz-hamburg.de", portalUrl: "https://www.stromnetz-hamburg.de/einspeiser", active: true, verified: true },
  { name: "SWM Infrastruktur GmbH & Co. KG", shortName: "SWM München", bdewCode: "9907", website: "https://www.swm.de", portalUrl: "https://www.swm-infrastruktur.de/einspeiser", active: true, verified: true },
  { name: "Rheinische NETZGesellschaft mbH", shortName: "RNG", bdewCode: "9908", website: "https://www.rng.de", portalUrl: "https://www.rng.de/einspeiser", active: true, verified: true },
  { name: "EWE NETZ GmbH", shortName: "EWE NETZ", bdewCode: "9909", website: "https://www.ewe-netz.de", portalUrl: "https://www.ewe-netz.de/einspeiser", active: true, verified: true },
  { name: "Avacon Netz GmbH", shortName: "Avacon", bdewCode: "9910", website: "https://www.avacon-netz.de", portalUrl: "https://www.avacon-netz.de/de/einspeiser.html", active: true, verified: true },
  { name: "LEW Verteilnetz GmbH", shortName: "LEW", bdewCode: "9911", website: "https://www.lew-verteilnetz.de", portalUrl: "https://www.lew-verteilnetz.de/einspeiser", active: true, verified: true },
  { name: "Mitteldeutsche Netzgesellschaft Strom mbH", shortName: "MITNETZ", bdewCode: "9912", website: "https://www.mitnetz-strom.de", portalUrl: "https://www.mitnetz-strom.de/einspeiser", active: true, verified: true },
  { name: "WEMAG Netz GmbH", shortName: "WEMAG", bdewCode: "9913", website: "https://www.wemag-netz.de", portalUrl: "https://www.wemag-netz.de/einspeiser", active: true, verified: true },
  { name: "enercity Netz GmbH", shortName: "enercity", bdewCode: "9914", website: "https://www.enercity-netz.de", portalUrl: "https://www.enercity-netz.de/einspeiser", active: true, verified: true },
  { name: "N-ERGIE Netz GmbH", shortName: "N-ERGIE", bdewCode: "9915", website: "https://www.n-ergie-netz.de", portalUrl: "https://www.n-ergie-netz.de/einspeiser", active: true, verified: true },
  { name: "Mainova AG", shortName: "Mainova", bdewCode: "9916", website: "https://www.mainova.de", portalUrl: "https://www.mainova-servicedienste.de/netz", active: true, verified: true },
  { name: "Syna GmbH", shortName: "Syna", bdewCode: "9917", website: "https://www.syna.de", portalUrl: "https://www.syna.de/einspeiser", active: true, verified: true },
  { name: "Pfalzwerke Netz AG", shortName: "Pfalzwerke", bdewCode: "9918", website: "https://www.pfalzwerke-netz.de", portalUrl: "https://www.pfalzwerke-netz.de/einspeiser", active: true, verified: true },
  { name: "Schleswig-Holstein Netz AG", shortName: "SH Netz", bdewCode: "9919", website: "https://www.sh-netz.com", portalUrl: "https://www.sh-netz.com/de/einspeiser.html", active: true, verified: true },
  { name: "HanseWerk Schleswig-Holstein Netz AG", shortName: "HanseWerk", bdewCode: "9920", website: "https://www.hansewerk.com", portalUrl: "https://www.hansewerk.com/einspeiser", active: true, verified: true },
  { name: "ENSO NETZ GmbH", shortName: "ENSO", bdewCode: "9921", website: "https://www.enso-netz.de", portalUrl: "https://www.enso-netz.de/einspeiser", active: true, verified: true },
  { name: "SachsenNetze GmbH", shortName: "SachsenNetze", bdewCode: "9922", website: "https://www.sachsennetze.de", portalUrl: "https://www.sachsennetze.de/einspeiser", active: true, verified: true },
  { name: "E.DIS Netz GmbH", shortName: "E.DIS", bdewCode: "9923", website: "https://www.e-dis-netz.de", portalUrl: "https://www.e-dis-netz.de/de/einspeiser.html", active: true, verified: true },
  { name: "Stadtwerke Düsseldorf Netz GmbH", shortName: "SWD Netz", bdewCode: "9924", website: "https://www.swd-netz.de", portalUrl: "https://www.swd-netz.de/einspeiser", active: true, verified: true },
  { name: "Netz Köln GmbH", shortName: "Netz Köln", bdewCode: "9925", website: "https://www.rheinenergie.com", portalUrl: "https://www.rheinenergie.com/netz", active: true, verified: true },
  { name: "Stadtwerke Essen AG", shortName: "SWE", bdewCode: "9926", website: "https://www.stadtwerke-essen.de", portalUrl: "https://www.stadtwerke-essen.de/netz", active: true, verified: true },
  { name: "Dortmunder Netz GmbH", shortName: "DONETZ", bdewCode: "9927", website: "https://www.do-netz.de", portalUrl: "https://www.do-netz.de/einspeiser", active: true, verified: true },
  { name: "Stadtwerke Bochum Netz GmbH", shortName: "SW Bochum", bdewCode: "9928", website: "https://www.stadtwerke-bochum.de", portalUrl: "https://www.stadtwerke-bochum.de/netz", active: true, verified: true },
  { name: "Netz Leipzig GmbH", shortName: "Netz Leipzig", bdewCode: "9929", website: "https://www.netz-leipzig.de", portalUrl: "https://www.netz-leipzig.de/einspeiser", active: true, verified: true },
  { name: "SWB Energie und Wasser Bonn/Rhein-Sieg", shortName: "SWB Bonn", bdewCode: "9930", website: "https://www.swb-energie.de", portalUrl: "https://www.swb-energie.de/netz", active: true, verified: true },
  { name: "Stadtwerke Augsburg Netze GmbH", shortName: "swa Netze", bdewCode: "9931", website: "https://www.sw-augsburg.de", portalUrl: "https://www.sw-augsburg.de/netz", active: true, verified: true },
  { name: "MVV Netze GmbH", shortName: "MVV Netze", bdewCode: "9932", website: "https://www.mvv-netze.de", portalUrl: "https://www.mvv-netze.de/einspeiser", active: true, verified: true },
  { name: "GGEW Netz GmbH", shortName: "GGEW", bdewCode: "9933", website: "https://www.ggew.de", portalUrl: "https://www.ggew.de/netz", active: true, verified: true },
  { name: "Stadtwerke Karlsruhe Netzservice GmbH", shortName: "SW Karlsruhe", bdewCode: "9934", website: "https://www.stadtwerke-karlsruhe.de", portalUrl: "https://www.stadtwerke-karlsruhe.de/netz", active: true, verified: true },
  { name: "Thüringer Energienetze GmbH & Co. KG", shortName: "TEN", bdewCode: "9935", website: "https://www.thueringer-energienetze.com", portalUrl: "https://www.thueringer-energienetze.com/einspeiser", active: true, verified: true },
  { name: "Stadtwerke Wuppertal Netze GmbH", shortName: "WSW Netz", bdewCode: "9936", website: "https://www.wsw-online.de", portalUrl: "https://www.wsw-online.de/netz", active: true, verified: true },
  { name: "Stadtwerke Bielefeld Netz GmbH", shortName: "SW Bielefeld", bdewCode: "9937", website: "https://www.stadtwerke-bielefeld.de", portalUrl: "https://www.stadtwerke-bielefeld.de/netz", active: true, verified: true },
  { name: "swb Netze GmbH & Co. KG Bremen", shortName: "swb Bremen", bdewCode: "9938", website: "https://www.swb-netze.de", portalUrl: "https://www.swb-netze.de/einspeiser", active: true, verified: true },
  { name: "Netz Lübeck GmbH", shortName: "Netz Lübeck", bdewCode: "9939", website: "https://www.netz-luebeck.de", portalUrl: "https://www.netz-luebeck.de/einspeiser", active: true, verified: true },
  { name: "Stadtwerke Kiel AG Netze", shortName: "SW Kiel", bdewCode: "9940", website: "https://www.stadtwerke-kiel.de", portalUrl: "https://www.stadtwerke-kiel.de/netz", active: true, verified: true },
  { name: "Energienetze Mittelrhein GmbH & Co. KG", shortName: "evm Netz", bdewCode: "9941", website: "https://www.evm.de", portalUrl: "https://www.evm.de/netz", active: true, verified: true },
  { name: "Stadtwerke Rostock Netzgesellschaft mbH", shortName: "SW Rostock", bdewCode: "9942", website: "https://www.swrag.de", portalUrl: "https://www.swrag.de/netz", active: true, verified: true },
  { name: "Energie- und Wasserwerke Bünde GmbH", shortName: "EWB Bünde", bdewCode: "9943", website: "https://www.ewb.de", portalUrl: "https://www.ewb.de/netz", active: true, verified: true },
  { name: "Stadtwerke Heidelberg Netze GmbH", shortName: "SW Heidelberg", bdewCode: "9944", website: "https://www.swhd.de", portalUrl: "https://www.swhd.de/netz", active: true, verified: true },
  { name: "Netze Magdeburg GmbH", shortName: "Netze Magdeburg", bdewCode: "9945", website: "https://www.netze-magdeburg.de", portalUrl: "https://www.netze-magdeburg.de/einspeiser", active: true, verified: true },
  { name: "Stadtwerke Erfurt GmbH", shortName: "SWE Erfurt", bdewCode: "9946", website: "https://www.stadtwerke-erfurt.de", portalUrl: "https://www.stadtwerke-erfurt.de/netz", active: true, verified: true },
  { name: "OsthessenNetz GmbH", shortName: "OsthessenNetz", bdewCode: "9947", website: "https://www.osthessennetz.de", portalUrl: "https://www.osthessennetz.de/einspeiser", active: true, verified: true },
  { name: "Stadtwerke Flensburg GmbH", shortName: "SW Flensburg", bdewCode: "9948", website: "https://www.stadtwerke-flensburg.de", portalUrl: "https://www.stadtwerke-flensburg.de/netz", active: true, verified: true },
  { name: "Städtische Werke Netz + Service GmbH Kassel", shortName: "SW Kassel", bdewCode: "9949", website: "https://www.sw-kassel.de", portalUrl: "https://www.sw-kassel.de/netz", active: true, verified: true },
];

// Einige bekannte PLZ-Zuordnungen für München, Berlin, Hamburg als Beispiel
export const SAMPLE_PLZ_MAPPINGS: Omit<PlzMapping, "id" | "createdAt" | "updatedAt">[] = [
  // München -> SWM
  { plz: "80331", city: "München", gridOperatorId: "", gridOperatorName: "SWM Infrastruktur GmbH & Co. KG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "80333", city: "München", gridOperatorId: "", gridOperatorName: "SWM Infrastruktur GmbH & Co. KG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "80335", city: "München", gridOperatorId: "", gridOperatorName: "SWM Infrastruktur GmbH & Co. KG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "80336", city: "München", gridOperatorId: "", gridOperatorName: "SWM Infrastruktur GmbH & Co. KG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "80337", city: "München", gridOperatorId: "", gridOperatorName: "SWM Infrastruktur GmbH & Co. KG", source: "imported", confidence: 95, usageCount: 0 },
  
  // Berlin -> Stromnetz Berlin
  { plz: "10115", city: "Berlin", gridOperatorId: "", gridOperatorName: "Stromnetz Berlin GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "10117", city: "Berlin", gridOperatorId: "", gridOperatorName: "Stromnetz Berlin GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "10119", city: "Berlin", gridOperatorId: "", gridOperatorName: "Stromnetz Berlin GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "10178", city: "Berlin", gridOperatorId: "", gridOperatorName: "Stromnetz Berlin GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "10179", city: "Berlin", gridOperatorId: "", gridOperatorName: "Stromnetz Berlin GmbH", source: "imported", confidence: 95, usageCount: 0 },
  
  // Hamburg -> Stromnetz Hamburg
  { plz: "20095", city: "Hamburg", gridOperatorId: "", gridOperatorName: "Stromnetz Hamburg GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "20097", city: "Hamburg", gridOperatorId: "", gridOperatorName: "Stromnetz Hamburg GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "20099", city: "Hamburg", gridOperatorId: "", gridOperatorName: "Stromnetz Hamburg GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "20144", city: "Hamburg", gridOperatorId: "", gridOperatorName: "Stromnetz Hamburg GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "20146", city: "Hamburg", gridOperatorId: "", gridOperatorName: "Stromnetz Hamburg GmbH", source: "imported", confidence: 95, usageCount: 0 },
  
  // Frankfurt -> Mainova / Syna
  { plz: "60311", city: "Frankfurt am Main", gridOperatorId: "", gridOperatorName: "Mainova AG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "60313", city: "Frankfurt am Main", gridOperatorId: "", gridOperatorName: "Mainova AG", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "60314", city: "Frankfurt am Main", gridOperatorId: "", gridOperatorName: "Mainova AG", source: "imported", confidence: 95, usageCount: 0 },
  
  // Köln -> Netz Köln
  { plz: "50667", city: "Köln", gridOperatorId: "", gridOperatorName: "Netz Köln GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "50668", city: "Köln", gridOperatorId: "", gridOperatorName: "Netz Köln GmbH", source: "imported", confidence: 95, usageCount: 0 },
  { plz: "50670", city: "Köln", gridOperatorId: "", gridOperatorName: "Netz Köln GmbH", source: "imported", confidence: 95, usageCount: 0 },
];

// Funktion um die Seed-Daten in den Store zu laden
export function seedGridOperators(addGridOperator: Function, addPlzMapping: Function) {
  // Grid Operators hinzufügen
  const operatorIdMap = new Map<string, string>();
  
  TOP_GRID_OPERATORS.forEach(op => {
    const created = addGridOperator(op);
    operatorIdMap.set(op.name, created.id);
  });
  
  // PLZ Mappings mit korrekten IDs hinzufügen
  SAMPLE_PLZ_MAPPINGS.forEach(mapping => {
    const operatorId = operatorIdMap.get(mapping.gridOperatorName ?? "");
    if (operatorId) {
      addPlzMapping(mapping.plz, operatorId, mapping.source);
    }
  });
  
  console.log(`Seeded ${TOP_GRID_OPERATORS.length} grid operators and ${SAMPLE_PLZ_MAPPINGS.length} PLZ mappings`);
}
