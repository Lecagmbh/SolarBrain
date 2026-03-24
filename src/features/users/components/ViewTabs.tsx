/**
 * View-Tabs: Alle Benutzer | Kunden-Hierarchie | Handelsvertreter | Endkunden
 */

import { Users, GitBranch, Briefcase, UserCheck } from 'lucide-react';
import type { ViewMode } from '../types';

interface Props {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const TABS: { id: ViewMode; label: string; icon: typeof Users }[] = [
  { id: 'alle', label: 'Alle Benutzer', icon: Users },
  { id: 'hierarchie', label: 'Kunden-Hierarchie', icon: GitBranch },
  { id: 'hv', label: 'Handelsvertreter', icon: Briefcase },
  { id: 'endkunden', label: 'Endkunden', icon: UserCheck },
];

export function ViewTabs({ active, onChange }: Props) {
  return (
    <div className="up-view-tabs">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`up-view-tab ${active === tab.id ? 'up-view-tab--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
