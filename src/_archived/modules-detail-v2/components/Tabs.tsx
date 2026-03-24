// ============================================================================
// Baunity Installation Detail V2 - Tabs Component
// ============================================================================

import { useDetail } from "../context/DetailContext";
import { useAuth } from "../../../auth/AuthContext";
import { TABS, type TabKey } from "../types";
import { isAdmin } from "../utils";

export default function Tabs() {
  const { activeTab, setActiveTab, detail } = useDetail();
  const { user } = useAuth();
  const role = user?.role ?? "mitarbeiter";

  // Calculate badges
  const getBadge = (tabKey: TabKey): number | string | undefined => {
    if (!detail) return undefined;

    switch (tabKey) {
      case "documents": {
        const docCount = Object.values(detail.uploads || {}).flat().length;
        return docCount > 0 ? docCount : undefined;
      }
      case "emails": {
        const emailCount = detail.emails?.length ?? 0;
        return emailCount > 0 ? emailCount : undefined;
      }
      default:
        return undefined;
    }
  };

  return (
    <div className="ld-tabs">
      {TABS.map((tab) => {
        // Hide admin tab from non-admins
        if (tab.adminOnly && !isAdmin(role as any)) {
          return null;
        }

        const isActive = activeTab === tab.key;
        const badge = getBadge(tab.key);

        return (
          <button
            key={tab.key}
            className={`ld-tab ${isActive ? "ld-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            title={tab.shortcut ? `Taste ${tab.shortcut}` : undefined}
          >
            <span className="ld-tab__icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {badge !== undefined && (
              <span className="ld-tab__badge">{badge}</span>
            )}
            {tab.shortcut && (
              <span className="ld-tab__shortcut">{tab.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
