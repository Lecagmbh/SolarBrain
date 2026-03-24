// src/modules/rechnungs-ordner/CustomerFolderTree.tsx
import { useMemo, useState } from "react";
import type { AbrechnungKunde, AbrechnungInstallation } from "../rechnungen/types";

interface CustomerFolderTreeProps {
  customers: AbrechnungKunde[];
  selectedInstallationId: number | null;
  onSelectInstallation: (installation: AbrechnungInstallation, kunde: AbrechnungKunde) => void;
  loading?: boolean;
}

export default function CustomerFolderTree({
  customers,
  selectedInstallationId,
  onSelectInstallation,
  loading,
}: CustomerFolderTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedKunden, setExpandedKunden] = useState<Set<number>>(new Set());

  const toggleKunde = (kundeId: number) => {
    setExpandedKunden((prev) => {
      const next = new Set(prev);
      if (next.has(kundeId)) next.delete(kundeId);
      else next.add(kundeId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers
      .map((k) => {
        const kundeMatch =
          k.kundeName.toLowerCase().includes(q) ||
          (k.firmenName || "").toLowerCase().includes(q);
        const matchedInstallations = k.installations.filter(
          (i) =>
            i.publicId.toLowerCase().includes(q) ||
            i.customerName.toLowerCase().includes(q) ||
            i.standort.toLowerCase().includes(q)
        );
        if (kundeMatch) return k;
        if (matchedInstallations.length > 0)
          return { ...k, installations: matchedInstallations };
        return null;
      })
      .filter(Boolean) as AbrechnungKunde[];
  }, [customers, search]);

  return (
    <div className="ro-tree">
      {/* Search */}
      <div className="ro-search-wrap">
        <div className="ro-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kunde oder Installation suchen..."
            className="ro-search-input"
          />
          {search && (
            <button onClick={() => setSearch("")} className="ro-search-clear">×</button>
          )}
        </div>
      </div>

      {/* Customer List */}
      <div className="ro-tree-list">
        {loading ? (
          <div className="ro-tree-loading">
            <div className="ro-spinner" />
            Lade Kunden...
          </div>
        ) : filtered.length === 0 ? (
          <div className="ro-tree-empty">
            {search ? "Keine Treffer" : "Keine Kunden"}
          </div>
        ) : (
          filtered.map((kunde) => {
            const expanded = expandedKunden.has(kunde.kundeId) || !!search.trim();
            const allBilled = kunde.summary.billedCount === kunde.summary.totalInstallations;
            const billedRatio = `${kunde.summary.billedCount}/${kunde.summary.totalInstallations}`;

            return (
              <div key={kunde.kundeId} className="ro-kunde">
                {/* Kunde Header */}
                <button
                  className={`ro-kunde-btn ${expanded ? "ro-kunde-btn--expanded" : ""}`}
                  onClick={() => toggleKunde(kunde.kundeId)}
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`ro-kunde-arrow ${expanded ? "ro-kunde-arrow--open" : ""}`}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill={expanded ? "rgba(212, 168, 67, 0.2)" : "none"}
                    stroke="currentColor" strokeWidth="1.75"
                    className={`ro-kunde-folder ${expanded ? "ro-kunde-folder--open" : ""}`}
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <div className="ro-kunde-info">
                    <div className="ro-kunde-name">{kunde.firmenName || kunde.kundeName}</div>
                    <div className="ro-kunde-count">{kunde.summary.totalInstallations} Anlagen</div>
                  </div>
                  <span className={`ro-kunde-badge ${allBilled ? "ro-kunde-badge--done" : "ro-kunde-badge--open"}`}>
                    {billedRatio}
                  </span>
                </button>

                {/* Installations */}
                {expanded && (
                  <div className="ro-inst-list">
                    {kunde.installations.map((inst) => {
                      const isSelected = selectedInstallationId === inst.id;
                      return (
                        <button
                          key={inst.id}
                          className={`ro-inst-btn ${isSelected ? "ro-inst-btn--selected" : ""}`}
                          onClick={() => onSelectInstallation(inst, kunde)}
                        >
                          {inst.rechnungGestellt ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ro-inst-check ro-inst-check--done">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <div className="ro-inst-check ro-inst-check--open" />
                          )}
                          <div className="ro-inst-info">
                            <div className="ro-inst-id">{inst.publicId}</div>
                            <div className="ro-inst-name">{inst.customerName}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && customers.length > 0 && (
        <div className="ro-tree-footer">
          <span>{customers.length} Kunden</span>
          <span>{customers.reduce((s, k) => s + k.summary.totalInstallations, 0)} Anlagen</span>
        </div>
      )}
    </div>
  );
}
