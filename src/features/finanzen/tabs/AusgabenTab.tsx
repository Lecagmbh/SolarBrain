/**
 * AUSGABEN TAB
 * Wrapper für ExpensesTab + VendorsTab als Sub-Tabs
 */

import { useState } from "react";
import { Receipt, Building2 } from "lucide-react";
import { ExpensesTab } from "../../accounting/components/tabs/ExpensesTab";
import { VendorsTab } from "../../accounting/components/tabs/VendorsTab";

type SubTabId = "eingangsrechnungen" | "lieferanten";

const SUB_TABS: { id: SubTabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "eingangsrechnungen", label: "Eingangsrechnungen", icon: Receipt },
  { id: "lieferanten", label: "Lieferanten", icon: Building2 },
];

export default function AusgabenTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("eingangsrechnungen");

  return (
    <div>
      {/* Sub-Tab Pills */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "1rem 2.5rem",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                border: "1px solid",
                borderColor: isActive ? "#10b981" : "var(--dash-border, rgba(255, 255, 255, 0.08))",
                background: isActive ? "rgba(16, 185, 129, 0.1)" : "transparent",
                color: isActive ? "#10b981" : "var(--dash-text-subtle, #71717a)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === "eingangsrechnungen" && <ExpensesTab />}
      {activeSubTab === "lieferanten" && <VendorsTab />}
    </div>
  );
}
