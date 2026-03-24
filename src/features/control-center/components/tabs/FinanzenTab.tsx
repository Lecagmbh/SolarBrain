/**
 * FINANZEN TAB (Control Center)
 * 3 Sub-Tabs: Rechnungen, Abrechnung, Wise
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { FileStack, ClipboardCheck, CreditCard, Loader2 } from "lucide-react";
import { WiseTab } from "../../../accounting/components/tabs/WiseTab";
import { fetchBillingOverview } from "../../../../modules/rechnungen/api";
import "../../../../pages/finanzen.css";

const RechnungenPage = lazy(() => import("../../../../pages/RechnungenPage"));
const AbrechnungOverview = lazy(
  () => import("../../../../components/billing/AbrechnungOverview")
);

function LazyFallback() {
  return (
    <div className="fin-loading">
      <Loader2 size={28} className="fin-spin" />
    </div>
  );
}

function RechnungenTab() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <RechnungenPage />
    </Suspense>
  );
}

function AbrechnungTab() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <AbrechnungOverview />
    </Suspense>
  );
}

type SubTabId = "rechnungen" | "abrechnung" | "wise";

interface SubTab {
  id: SubTabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  component: React.ComponentType;
}

const SUB_TABS: SubTab[] = [
  { id: "rechnungen", label: "Rechnungen", icon: FileStack, component: RechnungenTab },
  { id: "abrechnung", label: "Abrechnung", icon: ClipboardCheck, component: AbrechnungTab },
  { id: "wise", label: "Wise Bank", icon: CreditCard, component: WiseTab },
];

export function FinanzenTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("rechnungen");
  const [openCount, setOpenCount] = useState<number>(0);

  useEffect(() => {
    fetchBillingOverview()
      .then((ov) => {
        const offen = ov?.rechnungenByStatus?.OFFEN?.count ?? 0;
        const ueber = ov?.rechnungenByStatus?.UEBERFAELLIG?.count ?? 0;
        setOpenCount(offen + ueber);
      })
      .catch(() => {});
  }, []);

  const ActiveComponent =
    SUB_TABS.find((t) => t.id === activeSubTab)?.component || RechnungenTab;

  return (
    <div className="finanzen" style={{ minHeight: "100%" }}>
      {/* Pill Tab Navigation */}
      <div style={{ padding: "20px 2.5rem 0" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div className="fin-tabs">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`fin-tabs__btn${isActive ? " fin-tabs__btn--active" : ""}`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.id === "rechnungen" && openCount > 0 && (
                    <span className="fin-tabs__badge">{openCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 2.5rem" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}

export default FinanzenTab;
