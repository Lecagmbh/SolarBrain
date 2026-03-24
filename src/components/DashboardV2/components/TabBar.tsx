import React from "react";
import { C, FONT } from "../constants";
import type { TabId } from "../constants";

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 16px",
        background: C.s1,
        borderBottom: `1px solid ${C.bd}`,
        fontFamily: FONT,
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 8,
              background: isActive ? C.s3 : "transparent",
              color: isActive ? C.t : C.t3,
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              cursor: "pointer",
              fontFamily: FONT,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: isActive ? C.acG : C.s4,
                  color: isActive ? C.ac : C.t3,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "0 5px",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
