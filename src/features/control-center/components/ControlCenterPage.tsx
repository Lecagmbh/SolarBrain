/**
 * CONTROL CENTER PAGE
 * Main container with tab navigation for all admin functions
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  FileText,
  Mail,
  Network,
  Server,
  ClipboardList,
  SlidersHorizontal,
} from "lucide-react";
import { SmartDashboard } from "./SmartDashboard";
import { UsersTab } from "./tabs/UsersTab";
import { SystemTab } from "./tabs/SystemTab";
import { LogsTab } from "./tabs/LogsTab";
import { OperationsTab } from "./tabs/OperationsTab";
import { CommunicationTab } from "./tabs/communication";
import { NetworkTab } from "./tabs/NetworkTab";
import { SettingsTab } from "./tabs/SettingsTab";
import "../../../modules/dashboard/dashboard.css";
import "./control-center.css";

type TabId = "dashboard" | "operations" | "communication" | "network" | "users" | "system" | "logs" | "settings";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  component: React.ComponentType;
}

const TABS: Tab[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: SmartDashboard },
  { id: "operations", label: "Anlagen", icon: ClipboardList, component: OperationsTab },
  { id: "communication", label: "Kommunikation", icon: Mail, component: CommunicationTab },
  { id: "network", label: "Netzbetreiber", icon: Network, component: NetworkTab },
  { id: "users", label: "Benutzer", icon: Users, component: UsersTab },
  { id: "system", label: "System", icon: Server, component: SystemTab },
  { id: "logs", label: "Logs", icon: FileText, component: LogsTab },
  { id: "settings", label: "Einstellungen", icon: SettingsIcon, component: SettingsTab },
];

export function ControlCenterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && TABS.find(t => t.id === tabParam) ? tabParam : "dashboard");

  useEffect(() => {
    if (tabParam && TABS.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || SmartDashboard;

  return (
    <div className="cc-page">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          <div className="cc-header-icon">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <h1 className="cc-title">Control Center</h1>
            <p className="cc-subtitle">Anlagen · Kommunikation · Netzbetreiber · System</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="cc-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`cc-tab${isActive ? " cc-tab--active" : ""}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="cc-content">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default ControlCenterPage;
