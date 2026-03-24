/**
 * Page Header: Titel, Stats, Action-Buttons
 */

import { Plus, GitBranch, Download } from 'lucide-react';

interface Props {
  total: number;
  onCreateUser: () => void;
  onExport?: () => void;
  onShowTree?: () => void;
  isAdmin: boolean;
}

export function UsersHeader({ total, onCreateUser, onExport, onShowTree, isAdmin }: Props) {
  return (
    <header className="up-header">
      <div className="up-header__left">
        <h1 className="up-header__title">
          Kunden & Benutzer
          <span className="up-header__count">{total}</span>
        </h1>
      </div>
      <div className="up-header__actions">
        {isAdmin && onShowTree && (
          <button className="up-btn up-btn--ghost" onClick={onShowTree}>
            <GitBranch size={16} />
            <span>Stammbaum</span>
          </button>
        )}
        {isAdmin && onExport && (
          <button className="up-btn up-btn--ghost" onClick={onExport}>
            <Download size={16} />
            <span>Export</span>
          </button>
        )}
        <button className="up-btn up-btn--primary" onClick={onCreateUser}>
          <Plus size={16} />
          <span>Neuer Benutzer</span>
        </button>
      </div>
    </header>
  );
}
