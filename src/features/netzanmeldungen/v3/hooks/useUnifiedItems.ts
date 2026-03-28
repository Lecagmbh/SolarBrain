/**
 * useUnifiedItems — Merges wizard + CRM items into unified list
 * Handles filtering, sorting, pagination, activity derivation
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStats, useList, fetchApi } from "../../hooks/useEnterpriseApi";
import type { ListItem } from "../../hooks/useEnterpriseApi";
import { useCrmProjekte } from "../../components/SourceTabs";
import type { UnifiedItem, ViewKey, PipelineCounts, SourceFilter } from "../types";
import { VIEWS, STATUS_ORDER, SC, getNextAction, getLastActivityFallback } from "../constants";

function normalizeStatus(s: string): string {
  return (s || "").toLowerCase().replace(/-/g, "_");
}

function wizardToUnified(item: ListItem): UnifiedItem {
  const status = normalizeStatus(item.status);
  const unified: UnifiedItem = {
    id: item.id,
    publicId: item.publicId,
    name: (item as any).projektName || item.customerName || "—",
    kunde: (item as any).kundeName || item.createdByCompany || "—",
    plz: item.plz || "",
    ort: item.ort || "",
    nb: item.gridOperator || "",
    kwp: item.totalKwp || 0,
    status,
    source: "wizard",
    daysAtNb: item.daysAtNb ?? null,
    daysOld: item.daysOld || 0,
    createdAt: item.createdAt,
    lastActivity: { text: "", time: "", type: "status" },
    azNb: (item as any).nbCaseNumber || undefined,
    kundeId: item.kundeId,
    createdById: item.createdById,
    isBilled: item.isBilled,
    priority: item.priority,
    documentsCount: (item as any).documentsCount || 0,
    emailsCount: (item as any).emailsCount || 0,
    commentsCount: (item as any).commentsCount || 0,
    waitingForReply: (item as any).waitingForReply || false,
    pendingDrafts: (item as any).pendingDrafts || 0,
    _isCrm: false,
    _installationId: item.id,
  };
  unified.nextAction = getNextAction(unified);
  unified.lastActivity = getLastActivityFallback(unified);
  return unified;
}

function crmToUnified(item: Record<string, any>): UnifiedItem {
  const status = normalizeStatus(item.status);
  const createdAt = item.createdAt as string;
  const daysOld = createdAt ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000) : 0;
  const unified: UnifiedItem = {
    id: item.id as number,
    publicId: `CRM-${item.id}`,
    name: (item.customerName as string) || "—",
    kunde: (item.createdByName as string) || "CRM",
    plz: (item.plz as string) || "",
    ort: (item.ort as string) || "",
    nb: (item.netzbetreiberName as string) || (item.gridOperator as string) || "",
    kwp: (item.technical_data as any)?.totalPvKwPeak || 0,
    status,
    source: "crm",
    daysAtNb: null,
    daysOld,
    createdAt,
    lastActivity: { text: "", time: "", type: "status" },
    kundeId: null,
    createdById: null,
    isBilled: false,
    priority: null,
    _isCrm: true,
    _crmId: item._crmId as number,
    email: (item._crmEmail as string) || "",
    titel: (item._crmTitel as string) || "",
  };
  unified.nextAction = getNextAction(unified);
  unified.lastActivity = getLastActivityFallback(unified);
  return unified;
}

// ═══ Wizard-Leads → UnifiedItem ═══
interface WizardLead {
  id: string;
  timestamp: string;
  status: string;
  hausart: string;
  dachform: string;
  eigentuemer: string;
  stromverbrauch: number;
  unsicher: boolean;
  name: string;
  email: string;
  phone: string;
  plz: string;
  notes?: string;
}

const HAUSART_LABELS: Record<string, string> = {
  efh: "Ein-/Zweifamilienhaus",
  mfh: "Mehrfamilienhaus",
  gewerbe: "Firmengebäude",
  sonstiges: "Sonstiges",
};

function leadToUnified(lead: WizardLead): UnifiedItem {
  const status = `lead_${lead.status || "neu"}`;
  const daysOld = Math.floor((Date.now() - new Date(lead.timestamp).getTime()) / 86400000);
  const unified: UnifiedItem = {
    id: -9000 - parseInt(lead.id.slice(0, 6), 36), // Negative ID to avoid conflicts
    publicId: `LEAD-${lead.id.slice(0, 8).toUpperCase()}`,
    name: lead.name || "—",
    kunde: HAUSART_LABELS[lead.hausart] || lead.hausart || "—",
    plz: lead.plz || "",
    ort: "",
    nb: "",
    kwp: 0,
    status,
    source: "lead",
    daysAtNb: null,
    daysOld,
    createdAt: lead.timestamp,
    lastActivity: {
      text: `Wizard-Lead eingegangen`,
      time: lead.timestamp,
      type: "lead",
    },
    kundeId: null,
    createdById: null,
    isBilled: false,
    priority: null,
    email: lead.email,
    _isCrm: false,
    _isLead: true,
    _leadId: lead.id,
  } as any;
  unified.nextAction = getNextAction(unified);
  return unified;
}

function useWizardLeads(enabled: boolean) {
  return useQuery<{ data: WizardLead[]; stats: any }>({
    queryKey: ["wizard-leads"],
    queryFn: () => fetchApi<{ data: WizardLead[]; stats: any }>("/api/wizard/leads"),
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled,
  });
}

interface UseUnifiedParams {
  view: ViewKey;
  activeFilter: string | null;
  search: string;
  selectedKunde: number | null;
  sourceFilter: SourceFilter;
  isStaff: boolean;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export function useUnifiedItems(params: UseUnifiedParams) {
  const { view, activeFilter, search, selectedKunde, sourceFilter, isStaff, sortBy, sortDir } = params;

  const { data: stats } = useStats();

  // Welcher Status soll an die API?
  const isCrmOnlyFilter = activeFilter?.startsWith("crm_") || false;
  const apiStatus = isCrmOnlyFilter ? undefined : (activeFilter || undefined);
  const apiEnabled = !isCrmOnlyFilter;

  const { data: listData, isLoading: listLoading } = useList({
    status: apiStatus,
    search: search || undefined,
    createdById: selectedKunde || undefined,
    limit: 500,
    enabled: apiEnabled,
  });

  const { crmItems: rawCrmItems, crmLoading } = useCrmProjekte();
  const crmItems = isStaff ? rawCrmItems : [];

  // Wizard-Leads (nur Staff)
  const { data: leadsResponse, isLoading: leadsLoading } = useWizardLeads(isStaff);
  const rawLeads = leadsResponse?.data || [];

  // CRM einmal konvertieren, memo'd
  const allCrmConverted = useMemo(() => crmItems.map(crmToUnified), [crmItems]);
  const allLeadsConverted = useMemo(() => rawLeads.map(leadToUnified), [rawLeads]);

  const result = useMemo(() => {
    // Wizard → UnifiedItem
    const wizardItems: UnifiedItem[] = isCrmOnlyFilter ? [] : (listData?.data || []).map(wizardToUnified);

    // CRM client-side filtering (auf bereits konvertierte Items)
    let crmFiltered = [...allCrmConverted];
    if (activeFilter) {
      crmFiltered = crmFiltered.filter(i => i.status === activeFilter);
    }
    if (selectedKunde) {
      crmFiltered = []; // CRM hat kein createdById
    }
    if (search) {
      const q = search.toLowerCase();
      crmFiltered = crmFiltered.filter(i =>
        i.name.toLowerCase().includes(q) || i.kunde.toLowerCase().includes(q) ||
        i.ort.toLowerCase().includes(q) || i.publicId.toLowerCase().includes(q) ||
        i.nb.toLowerCase().includes(q) || (i.titel || "").toLowerCase().includes(q)
      );
    }

    // Leads client-side filtering
    let leadsFiltered = [...allLeadsConverted];
    if (activeFilter) {
      leadsFiltered = leadsFiltered.filter(i => i.status === activeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      leadsFiltered = leadsFiltered.filter(i =>
        i.name.toLowerCase().includes(q) || i.plz.includes(q) ||
        i.publicId.toLowerCase().includes(q) || (i.email || "").toLowerCase().includes(q)
      );
    }

    // Source filter
    let allItems: UnifiedItem[] = sourceFilter === "crm" ? crmFiltered
      : sourceFilter === "wizard" ? wizardItems
      : sourceFilter === "leads" ? leadsFiltered
      : [...leadsFiltered, ...crmFiltered, ...wizardItems];

    // View filter (wenn kein aktiver Pipeline-Filter)
    if (!activeFilter) {
      const viewDef = VIEWS.find(v => v.key === view);
      if (viewDef) {
        allItems = allItems.filter(viewDef.filter);
      }
    }

    // CRM Counts (aus ALLEN konvertierten CRM-Items, nicht gefiltert)
    const crmCounts: Record<string, number> = {};
    for (const item of allCrmConverted) {
      crmCounts[item.status] = (crmCounts[item.status] || 0) + 1;
    }

    // Pipeline counts
    const pipelineCounts: PipelineCounts = {
      crm_anfrage: crmCounts["crm_anfrage"] || 0,
      crm_hv: crmCounts["crm_hv"] || crmCounts["crm_hv_vermittelt"] || 0,
      crm_auftrag: crmCounts["crm_auftrag"] || 0,
      crm_nb_kommunikation: (crmCounts["crm_nb_kommunikation"] || 0) + (crmCounts["crm_nb_anfrage"] || 0),
      crm_nb_genehmigt: crmCounts["crm_nb_genehmigt"] || 0,
      crm_eingestellt: crmCounts["crm_eingestellt"] || 0,
      eingang: stats?.eingang || 0,
      beim_nb: stats?.beimNb || 0,
      rueckfrage: stats?.rueckfrage || 0,
      genehmigt: stats?.genehmigt || 0,
      ibn: stats?.ibn || 0,
      fertig: stats?.fertig || 0,
      storniert: stats?.storniert || 0,
      avgDaysBeimNb: stats?.avgDaysBeimNb || 0,
      leads_neu: allLeadsConverted.filter(l => l.status === "lead_neu").length,
      leads_kontaktiert: allLeadsConverted.filter(l => l.status === "lead_kontaktiert").length,
      leads_qualifiziert: allLeadsConverted.filter(l => l.status === "lead_qualifiziert").length,
      leads_disqualifiziert: allLeadsConverted.filter(l => l.status === "lead_disqualifiziert" || l.status === "lead_abgelehnt").length,
      leads_total: allLeadsConverted.length,
    };

    // Kunden-Liste
    const kundenMap = new Map<number, { id: number; name: string; count: number }>();
    for (const su of (listData?.subUsers || [])) {
      kundenMap.set(su.id, { id: su.id, name: su.company || su.name, count: su.count });
    }
    const kundenList = Array.from(kundenMap.values()).sort((a, b) => b.count - a.count);

    // Sort
    allItems.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "kwp": cmp = (a.kwp || 0) - (b.kwp || 0); break;
        case "daysAtNb": cmp = (a.daysAtNb ?? -1) - (b.daysAtNb ?? -1); break;
        case "status": cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99); break;
        case "ort": cmp = a.ort.localeCompare(b.ort); break;
        default: cmp = 0;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return { items: allItems, pipelineCounts, kundenList, crmCounts };
  }, [listData, allCrmConverted, activeFilter, view, search, selectedKunde, sourceFilter, stats, isCrmOnlyFilter, sortBy, sortDir]);

  return {
    ...result,
    stats,
    isLoading: listLoading || crmLoading || leadsLoading,
    totalCount: (stats?.total || 0) + crmItems.length + rawLeads.length,
  };
}
