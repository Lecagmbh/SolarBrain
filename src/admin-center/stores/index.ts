// ═══════════════════════════════════════════════════════════════════════════
// ADMIN CENTER - ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GridOperator,
  PlzMapping,
  DocumentRequirement,
  FieldRequirement,
  GridOperatorRule,
  StoredPassword,
} from "../../shared/types";
import { generateId } from "../../shared/utils";
import { ADMIN_CENTER_STORE_KEY } from "../../config/storage";

// ─────────────────────────────────────────────────────────────────────────────
// STATE INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

interface AdminCenterState {
  // Data
  gridOperators: GridOperator[];
  plzMappings: PlzMapping[];
  documentRequirements: DocumentRequirement[];
  fieldRequirements: FieldRequirement[];
  rules: GridOperatorRule[];
  passwords: StoredPassword[];
  
  // UI State
  activeTab: "overview" | "gridOperators" | "plzMappings" | "documents" | "fields" | "rules" | "passwords" | "settings";
  selectedGridOperatorId: string | null;
  searchQuery: string;
  isLoading: boolean;
  
  // ─────────────────────────────────────────────────────────────────────────
  // GRID OPERATORS
  // ─────────────────────────────────────────────────────────────────────────
  
  addGridOperator: (data: Omit<GridOperator, "id" | "createdAt" | "updatedAt">) => GridOperator;
  updateGridOperator: (id: string, data: Partial<GridOperator>) => void;
  deleteGridOperator: (id: string) => void;
  getGridOperator: (id: string) => GridOperator | undefined;
  
  // ─────────────────────────────────────────────────────────────────────────
  // PLZ MAPPINGS (Lernendes System)
  // ─────────────────────────────────────────────────────────────────────────
  
  addPlzMapping: (plz: string, gridOperatorId: string, source: "manual" | "imported" | "learned") => PlzMapping;
  updatePlzMapping: (id: string, data: Partial<PlzMapping>) => void;
  deletePlzMapping: (id: string) => void;
  
  // Die wichtigste Funktion: PLZ → Netzbetreiber suchen
  findGridOperatorByPlz: (plz: string) => PlzMapping | undefined;
  
  // Lernfunktion: Wenn User einen NB einträgt, merken wir uns das
  learnPlzMapping: (plz: string, city: string, gridOperatorId: string, gridOperatorName: string) => void;
  
  // Nutzung tracken (erhöht confidence)
  trackPlzUsage: (plz: string) => void;
  
  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENT REQUIREMENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  addDocumentRequirement: (data: Omit<DocumentRequirement, "id" | "createdAt" | "updatedAt">) => DocumentRequirement;
  updateDocumentRequirement: (id: string, data: Partial<DocumentRequirement>) => void;
  deleteDocumentRequirement: (id: string) => void;
  getDocumentRequirements: (gridOperatorId?: string) => DocumentRequirement[];
  
  // ─────────────────────────────────────────────────────────────────────────
  // FIELD REQUIREMENTS
  // ─────────────────────────────────────────────────────────────────────────
  
  addFieldRequirement: (data: Omit<FieldRequirement, "id" | "createdAt" | "updatedAt">) => FieldRequirement;
  updateFieldRequirement: (id: string, data: Partial<FieldRequirement>) => void;
  deleteFieldRequirement: (id: string) => void;
  getFieldRequirements: (gridOperatorId: string) => FieldRequirement[];
  
  // ─────────────────────────────────────────────────────────────────────────
  // RULES
  // ─────────────────────────────────────────────────────────────────────────
  
  addRule: (data: Omit<GridOperatorRule, "id" | "createdAt" | "updatedAt">) => GridOperatorRule;
  updateRule: (id: string, data: Partial<GridOperatorRule>) => void;
  deleteRule: (id: string) => void;
  getRules: (gridOperatorId: string) => GridOperatorRule[];
  
  // ─────────────────────────────────────────────────────────────────────────
  // PASSWORDS
  // ─────────────────────────────────────────────────────────────────────────
  
  addPassword: (data: Omit<StoredPassword, "id" | "createdAt" | "updatedAt">) => StoredPassword;
  updatePassword: (id: string, data: Partial<StoredPassword>) => void;
  deletePassword: (id: string) => void;
  getPasswords: (category?: StoredPassword["category"]) => StoredPassword[];
  
  // ─────────────────────────────────────────────────────────────────────────
  // UI ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  setActiveTab: (tab: AdminCenterState["activeTab"]) => void;
  setSelectedGridOperator: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  
  // ─────────────────────────────────────────────────────────────────────────
  // IMPORT / EXPORT
  // ─────────────────────────────────────────────────────────────────────────
  
  exportData: () => string;
  importData: (json: string) => boolean;
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────
  
  getStats: () => {
    gridOperatorCount: number;
    plzMappingCount: number;
    documentRequirementCount: number;
    fieldRequirementCount: number;
    ruleCount: number;
    passwordCount: number;
    learnedMappingsCount: number;
    topGridOperators: { id: string; name: string; usageCount: number }[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export const useAdminCenterStore = create<AdminCenterState>()(
  persist(
    (set, get) => ({
      // Initial State
      gridOperators: [],
      plzMappings: [],
      documentRequirements: [],
      fieldRequirements: [],
      rules: [],
      passwords: [],
      
      activeTab: "overview",
      selectedGridOperatorId: null,
      searchQuery: "",
      isLoading: false,
      
      // ─────────────────────────────────────────────────────────────────────
      // GRID OPERATORS
      // ─────────────────────────────────────────────────────────────────────
      
      addGridOperator: (data) => {
        const now = new Date().toISOString();
        const newOperator: GridOperator = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          gridOperators: [...state.gridOperators, newOperator],
        }));
        return newOperator;
      },
      
      updateGridOperator: (id, data) => {
        set((state) => ({
          gridOperators: state.gridOperators.map((op) =>
            op.id === id ? { ...op, ...data, updatedAt: new Date().toISOString() } : op
          ),
        }));
      },
      
      deleteGridOperator: (id) => {
        set((state) => ({
          gridOperators: state.gridOperators.filter((op) => op.id !== id),
          // Cascade: Lösche auch zugehörige Mappings, Requirements, etc.
          plzMappings: state.plzMappings.filter((m) => m.gridOperatorId !== id),
          documentRequirements: state.documentRequirements.filter((d) => d.gridOperatorId !== id),
          fieldRequirements: state.fieldRequirements.filter((f) => f.gridOperatorId !== id),
          rules: state.rules.filter((r) => r.gridOperatorId !== id),
        }));
      },
      
      getGridOperator: (id) => {
        return get().gridOperators.find((op) => op.id === id);
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // PLZ MAPPINGS
      // ─────────────────────────────────────────────────────────────────────
      
      addPlzMapping: (plz, gridOperatorId, source) => {
        const operator = get().getGridOperator(gridOperatorId);
        const now = new Date().toISOString();
        const newMapping: PlzMapping = {
          id: generateId(),
          plz,
          gridOperatorId,
          gridOperatorName: operator?.name || "Unbekannt",
          source,
          confidence: source === "manual" ? 100 : source === "imported" ? 90 : 70,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          plzMappings: [...state.plzMappings, newMapping],
        }));
        return newMapping;
      },
      
      updatePlzMapping: (id, data) => {
        set((state) => ({
          plzMappings: state.plzMappings.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },
      
      deletePlzMapping: (id) => {
        set((state) => ({
          plzMappings: state.plzMappings.filter((m) => m.id !== id),
        }));
      },
      
      findGridOperatorByPlz: (plz) => {
        const mappings = get().plzMappings.filter((m) => m.plz === plz);
        if (mappings.length === 0) return undefined;
        
        // Sortiere nach Confidence und Usage Count
        return mappings.sort((a, b) => {
          if (b.confidence !== a.confidence) return (b.confidence ?? 0) - (a.confidence ?? 0);
          return (b.usageCount ?? 0) - (a.usageCount ?? 0);
        })[0];
      },
      
      learnPlzMapping: (plz, city, gridOperatorId, gridOperatorName) => {
        const existing = get().plzMappings.find(
          (m) => m.plz === plz && m.gridOperatorId === gridOperatorId
        );
        
        if (existing) {
          // Existiert bereits -> Confidence erhöhen
          get().updatePlzMapping(existing.id, {
            confidence: Math.min(100, (existing.confidence ?? 0) + 5),
            usageCount: (existing.usageCount ?? 0) + 1,
            city: city || existing.city,
          });
        } else {
          // Neu anlegen als "learned"
          const now = new Date().toISOString();
          const newMapping: PlzMapping = {
            id: generateId(),
            plz,
            city,
            gridOperatorId,
            gridOperatorName,
            source: "learned",
            confidence: 70,
            usageCount: 1,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            plzMappings: [...state.plzMappings, newMapping],
          }));
        }
      },
      
      trackPlzUsage: (plz) => {
        const mapping = get().findGridOperatorByPlz(plz);
        if (mapping) {
          get().updatePlzMapping(mapping.id, {
            usageCount: (mapping.usageCount ?? 0) + 1,
            confidence: Math.min(100, (mapping.confidence ?? 0) + 1),
          });
        }
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // DOCUMENT REQUIREMENTS
      // ─────────────────────────────────────────────────────────────────────
      
      addDocumentRequirement: (data) => {
        const now = new Date().toISOString();
        const newReq: DocumentRequirement = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          documentRequirements: [...state.documentRequirements, newReq],
        }));
        return newReq;
      },
      
      updateDocumentRequirement: (id, data) => {
        set((state) => ({
          documentRequirements: state.documentRequirements.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },
      
      deleteDocumentRequirement: (id) => {
        set((state) => ({
          documentRequirements: state.documentRequirements.filter((d) => d.id !== id),
        }));
      },
      
      getDocumentRequirements: (gridOperatorId) => {
        return get().documentRequirements.filter(
          (d) => !gridOperatorId || d.gridOperatorId === gridOperatorId || !d.gridOperatorId
        );
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // FIELD REQUIREMENTS
      // ─────────────────────────────────────────────────────────────────────
      
      addFieldRequirement: (data) => {
        const now = new Date().toISOString();
        const newField: FieldRequirement = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          fieldRequirements: [...state.fieldRequirements, newField],
        }));
        return newField;
      },
      
      updateFieldRequirement: (id, data) => {
        set((state) => ({
          fieldRequirements: state.fieldRequirements.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },
      
      deleteFieldRequirement: (id) => {
        set((state) => ({
          fieldRequirements: state.fieldRequirements.filter((f) => f.id !== id),
        }));
      },
      
      getFieldRequirements: (gridOperatorId) => {
        return get().fieldRequirements.filter((f) => f.gridOperatorId === gridOperatorId);
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // RULES
      // ─────────────────────────────────────────────────────────────────────
      
      addRule: (data) => {
        const now = new Date().toISOString();
        const newRule: GridOperatorRule = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          rules: [...state.rules, newRule],
        }));
        return newRule;
      },
      
      updateRule: (id, data) => {
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },
      
      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        }));
      },
      
      getRules: (gridOperatorId) => {
        return get().rules.filter((r) => r.gridOperatorId === gridOperatorId);
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // PASSWORDS
      // ─────────────────────────────────────────────────────────────────────
      
      addPassword: (data) => {
        const now = new Date().toISOString();
        const newPw: StoredPassword = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          passwords: [...state.passwords, newPw],
        }));
        return newPw;
      },
      
      updatePassword: (id, data) => {
        set((state) => ({
          passwords: state.passwords.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
      
      deletePassword: (id) => {
        set((state) => ({
          passwords: state.passwords.filter((p) => p.id !== id),
        }));
      },
      
      getPasswords: (category) => {
        return get().passwords.filter((p) => !category || p.category === category);
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // UI ACTIONS
      // ─────────────────────────────────────────────────────────────────────
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedGridOperator: (id) => set({ selectedGridOperatorId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      // ─────────────────────────────────────────────────────────────────────
      // IMPORT / EXPORT
      // ─────────────────────────────────────────────────────────────────────
      
      exportData: () => {
        const state = get();
        return JSON.stringify({
          gridOperators: state.gridOperators,
          plzMappings: state.plzMappings,
          documentRequirements: state.documentRequirements,
          fieldRequirements: state.fieldRequirements,
          rules: state.rules,
          passwords: state.passwords,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },
      
      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            gridOperators: data.gridOperators || [],
            plzMappings: data.plzMappings || [],
            documentRequirements: data.documentRequirements || [],
            fieldRequirements: data.fieldRequirements || [],
            rules: data.rules || [],
            passwords: data.passwords || [],
          });
          return true;
        } catch (e) {
          console.error("Import failed:", e);
          return false;
        }
      },
      
      // ─────────────────────────────────────────────────────────────────────
      // STATISTICS
      // ─────────────────────────────────────────────────────────────────────
      
      getStats: () => {
        const state = get();
        
        // Top Netzbetreiber nach Nutzung
        const usageByOperator = new Map<string, number>();
        state.plzMappings.forEach((m) => {
          const current = usageByOperator.get(m.gridOperatorId) || 0;
          usageByOperator.set(m.gridOperatorId, current + (m.usageCount ?? 0));
        });
        
        const topGridOperators = Array.from(usageByOperator.entries())
          .map(([id, usageCount]) => ({
            id,
            name: state.gridOperators.find((op) => op.id === id)?.name || "Unbekannt",
            usageCount,
          }))
          .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
          .slice(0, 10);
        
        return {
          gridOperatorCount: state.gridOperators.length,
          plzMappingCount: state.plzMappings.length,
          documentRequirementCount: state.documentRequirements.length,
          fieldRequirementCount: state.fieldRequirements.length,
          ruleCount: state.rules.length,
          passwordCount: state.passwords.length,
          learnedMappingsCount: state.plzMappings.filter((m) => m.source === "learned").length,
          topGridOperators,
        };
      },
    }),
    {
      name: ADMIN_CENTER_STORE_KEY,
      version: 1,
    }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA - Standard-Dokumente die für alle gelten
// ─────────────────────────────────────────────────────────────────────────────

export function seedDefaultDocumentRequirements(store: typeof useAdminCenterStore) {
  const state = store.getState();
  
  // Nur wenn noch keine Dokument-Anforderungen existieren
  if (state.documentRequirements.length > 0) return;
  
  const defaults: Omit<DocumentRequirement, "id" | "createdAt" | "updatedAt">[] = [
    // PV - Immer
    {
      gridOperatorId: "", // Leer = gilt für alle
      documentType: "lageplan",
      name: "Lageplan",
      description: "Lageplan mit Kennzeichnung der Anlage",
      conditions: [{ field: "category", operator: "==", value: "generation" }],
      required: true,
      helpText: "Zeigen Sie den Standort der Anlage auf dem Grundstück",
      sortOrder: 1,
    },
    {
      gridOperatorId: "",
      documentType: "wechselrichterDatenblatt",
      name: "Wechselrichter-Datenblatt",
      description: "Technisches Datenblatt des Wechselrichters",
      conditions: [{ field: "type", operator: "in", value: ["pv", "pv_storage"] }],
      required: true,
      sortOrder: 2,
    },
    {
      gridOperatorId: "",
      documentType: "modulDatenblatt",
      name: "Modul-Datenblatt",
      description: "Technisches Datenblatt der PV-Module",
      conditions: [{ field: "type", operator: "in", value: ["pv", "pv_storage", "balcony"] }],
      required: true,
      sortOrder: 3,
    },
    // PV > 10 kWp
    {
      gridOperatorId: "",
      documentType: "anlagenschema",
      name: "Übersichtsschaltplan",
      description: "Elektrischer Übersichtsschaltplan der Anlage",
      conditions: [
        { field: "type", operator: "in", value: ["pv", "pv_storage"] },
        { field: "pv.kwp", operator: ">", value: 10 },
      ],
      required: true,
      sortOrder: 4,
    },
    {
      gridOperatorId: "",
      documentType: "naSchutzZertifikat",
      name: "NA-Schutz Zertifikat",
      description: "Zertifikat für den Netz- und Anlagenschutz",
      conditions: [
        { field: "type", operator: "in", value: ["pv", "pv_storage"] },
        { field: "pv.kwp", operator: ">", value: 10 },
      ],
      required: true,
      helpText: "Erforderlich für Anlagen > 10 kWp",
      sortOrder: 5,
    },
    // Speicher
    {
      gridOperatorId: "",
      documentType: "speicherDatenblatt",
      name: "Speicher-Datenblatt",
      description: "Technisches Datenblatt des Batteriespeichers",
      conditions: [{ field: "type", operator: "in", value: ["storage", "pv_storage"] }],
      required: true,
      sortOrder: 6,
    },
    // Wallbox
    {
      gridOperatorId: "",
      documentType: "wallboxDatenblatt",
      name: "Wallbox-Datenblatt",
      description: "Technisches Datenblatt der Ladestation",
      conditions: [{ field: "type", operator: "==", value: "wallbox" }],
      required: true,
      sortOrder: 7,
    },
    // Wärmepumpe
    {
      gridOperatorId: "",
      documentType: "waermepumpeDatenblatt",
      name: "Wärmepumpe-Datenblatt",
      description: "Technisches Datenblatt der Wärmepumpe",
      conditions: [{ field: "type", operator: "==", value: "heat_pump" }],
      required: true,
      sortOrder: 8,
    },
    // Vollmacht wenn Installateur
    {
      gridOperatorId: "",
      documentType: "vollmacht",
      name: "Vollmacht",
      description: "Vollmacht für die Anmeldung durch den Installateur",
      conditions: [{ field: "hasInstaller", operator: "==", value: true }],
      required: true,
      sortOrder: 20,
    },
  ];
  
  defaults.forEach((doc) => {
    state.addDocumentRequirement(doc);
  });
}
