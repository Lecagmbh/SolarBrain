/**
 * UserTree – Übersichtlicher Baum mit Sektionen
 * Kunden zugeklappt, Demo/Test versteckt, Endkunden nur als Zähler
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Search, Building2, Briefcase, Users, Filter } from 'lucide-react';
import type { UserData, UserRole } from '../types';
import { ROLE_CONFIG } from '../constants';

interface Props {
  users: UserData[];
  selectedId: number | null;
  onSelect: (user: UserData) => void;
  onCreateUser: () => void;
  search: string;
  onSearch: (q: string) => void;
}

type ViewFilter = 'kunden' | 'hvs' | 'endkunden' | 'alle';

const HIDDEN_ROLES: UserRole[] = ['DEMO', 'ADMIN', 'MITARBEITER'];

function isDemo(u: UserData): boolean {
  return u.role === 'DEMO' || u.email.includes('demo') || u.email.includes('@demo.') || (u.name || '').toLowerCase().includes('demo');
}

export function UserTree({ users, selectedId, onSelect, onCreateUser, search, onSearch }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('kunden');

  const toggle = (id: number) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const q = search.toLowerCase();

  // Kunden mit Team-Count
  const kundenGroups = useMemo(() => {
    const kunden = users.filter((u) => (u.role === 'KUNDE' || (u.role as string) === 'PARTNER') && !isDemo(u));
    return kunden.map((kunde) => {
      const team = users.filter(
        (u) => u.id !== kunde.id && (u.parentUserId === kunde.id ||
          (u.kundeId === kunde.kundeId && u.kundeId !== null && ['KUNDE_MITARBEITER', 'SUBUNTERNEHMER'].includes(u.role)))
      );
      const instCount = (kunde.kunde as any)?._count?.installations || kunde._count?.installations || 0;
      return { kunde, team, instCount };
    }).filter((g) => {
      if (!q) return true;
      return (g.kunde.name || '').toLowerCase().includes(q) ||
        (g.kunde.kunde?.firmenName || '').toLowerCase().includes(q) ||
        g.kunde.email.toLowerCase().includes(q) ||
        g.team.some((t) => (t.name || '').toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (t.kunde?.firmenName || '').toLowerCase().includes(q));
    }).sort((a, b) => b.instCount - a.instCount); // Aktivste oben
  }, [users, q]);

  // HVs
  const hvGroups = useMemo(() => {
    return users.filter((u) => ['HV_LEITER', 'HV_TEAMLEITER', 'HANDELSVERTRETER'].includes(u.role)).map((hv) => {
      const kunden = hv.handelsvertreter?.kunden || [];
      const subHvs = users.filter((u) => u.parentUserId === hv.id);
      return { hv, kunden, subHvs };
    }).filter((g) => {
      if (!q) return true;
      return (g.hv.name || '').toLowerCase().includes(q) || g.hv.email.toLowerCase().includes(q);
    });
  }, [users, q]);

  // Endkunden
  const endkundenCount = useMemo(() => users.filter((u) => u.role === 'ENDKUNDE_PORTAL').length, [users]);
  const endkunden = useMemo(() => {
    if (viewFilter !== 'endkunden') return [];
    return users.filter((u) => u.role === 'ENDKUNDE_PORTAL').filter((u) => {
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, q, viewFilter]);

  // Stats
  const stats = useMemo(() => ({
    kunden: kundenGroups.length,
    hvs: hvGroups.length,
    endkunden: endkundenCount,
  }), [kundenGroups, hvGroups, endkundenCount]);

  return (
    <div className="ut-tree">
      {/* Search + Add */}
      <div className="ut-search">
        <Search size={14} className="ut-search__icon" />
        <input className="ut-search__input" placeholder="Suchen..." value={search} onChange={(e) => onSearch(e.target.value)} />
        <button className="ut-add-btn" onClick={onCreateUser} title="Neuer Benutzer"><Plus size={14} /></button>
      </div>

      {/* View Filter Tabs */}
      <div className="ut-filters">
        <button className={`ut-filter ${viewFilter === 'kunden' ? 'ut-filter--active' : ''}`} onClick={() => setViewFilter('kunden')}>
          <Building2 size={12} /> Kunden <span className="ut-filter__count">{stats.kunden}</span>
        </button>
        <button className={`ut-filter ${viewFilter === 'hvs' ? 'ut-filter--active' : ''}`} onClick={() => setViewFilter('hvs')}>
          <Briefcase size={12} /> HVs <span className="ut-filter__count">{stats.hvs}</span>
        </button>
        <button className={`ut-filter ${viewFilter === 'endkunden' ? 'ut-filter--active' : ''}`} onClick={() => setViewFilter('endkunden')}>
          <Users size={12} /> Endkunden <span className="ut-filter__count">{stats.endkunden}</span>
        </button>
      </div>

      {/* Content */}
      <div className="ut-nodes">
        {/* KUNDEN VIEW */}
        {viewFilter === 'kunden' && kundenGroups.map(({ kunde, team, instCount }) => {
          const isOpen = expanded.has(kunde.id);
          const name = kunde.kunde?.firmenName || kunde.name || kunde.email;
          const hasTeam = team.length > 0;
          const hvId = kunde.kunde?.handelsvertreterId;
          const hv = hvId ? users.find((u) => u.handelsvertreter?.id === hvId) : null;

          return (
            <div key={kunde.id}>
              <div
                className={`ut-node ${selectedId === kunde.id ? 'ut-node--selected' : ''}`}
                onClick={() => onSelect(kunde)}
              >
                {hasTeam ? (
                  <button className="ut-toggle" onClick={(e) => { e.stopPropagation(); toggle(kunde.id); }}>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : <span className="ut-toggle-spacer" />}

                <div className="ut-node-main">
                  <span className="ut-node-name">{name}</span>
                  <div className="ut-node-meta">
                    <span className="ut-meta-chip">{instCount} Anl.</span>
                    {hasTeam && <span className="ut-meta-chip">{team.length} Team</span>}
                    {hv && <span className="ut-meta-chip ut-meta-chip--hv">💼 {hv.name?.split(' ')[0]}</span>}
                  </div>
                </div>
              </div>

              {isOpen && hasTeam && (
                <div className="ut-children">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className={`ut-node ut-node--child ${selectedId === member.id ? 'ut-node--selected' : ''}`}
                      onClick={() => onSelect(member)}
                    >
                      <span className="ut-child-icon">
                        {member.role === 'SUBUNTERNEHMER' ? '🏗' : '👤'}
                      </span>
                      <span className="ut-node-name">{member.name || member.email}</span>
                      <span className="ut-role-mini" style={{ color: ROLE_CONFIG[member.role]?.color }}>
                        {ROLE_CONFIG[member.role]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* HVS VIEW */}
        {viewFilter === 'hvs' && hvGroups.map(({ hv, kunden }) => {
          const isOpen = expanded.has(hv.id);
          const prov = hv.handelsvertreter?.provisionssatz || 0;

          return (
            <div key={hv.id}>
              <div
                className={`ut-node ${selectedId === hv.id ? 'ut-node--selected' : ''}`}
                onClick={() => onSelect(hv)}
              >
                {kunden.length > 0 ? (
                  <button className="ut-toggle" onClick={(e) => { e.stopPropagation(); toggle(hv.id); }}>
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : <span className="ut-toggle-spacer" />}

                <div className="ut-node-main">
                  <span className="ut-node-name">💼 {hv.name || hv.email}</span>
                  <div className="ut-node-meta">
                    <span className="ut-meta-chip ut-meta-chip--hv">{prov}%</span>
                    <span className="ut-meta-chip">{kunden.length} Kunden</span>
                    {hv.handelsvertreter?.isOberHv && <span className="ut-meta-chip ut-meta-chip--ober">Ober-HV</span>}
                  </div>
                </div>
              </div>

              {isOpen && kunden.length > 0 && (
                <div className="ut-children">
                  {kunden.map((k) => {
                    const kundeUser = users.find((u) => u.role === 'KUNDE' && u.kunde?.id === k.id);
                    return (
                      <div
                        key={k.id}
                        className={`ut-node ut-node--child ${kundeUser && selectedId === kundeUser.id ? 'ut-node--selected' : ''}`}
                        onClick={() => kundeUser && onSelect(kundeUser)}
                      >
                        <span className="ut-child-icon">🏢</span>
                        <span className="ut-node-name">{k.firmenName || k.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ENDKUNDEN VIEW */}
        {viewFilter === 'endkunden' && endkunden.map((ek) => (
          <div
            key={ek.id}
            className={`ut-node ${selectedId === ek.id ? 'ut-node--selected' : ''}`}
            onClick={() => onSelect(ek)}
          >
            <span className="ut-toggle-spacer" />
            <div className="ut-node-main">
              <span className="ut-node-name">{ek.name || ek.email}</span>
            </div>
          </div>
        ))}

        {/* Empty */}
        {viewFilter === 'kunden' && kundenGroups.length === 0 && <div className="ut-empty-msg">Keine Kunden gefunden</div>}
        {viewFilter === 'hvs' && hvGroups.length === 0 && <div className="ut-empty-msg">Keine HVs gefunden</div>}
        {viewFilter === 'endkunden' && endkunden.length === 0 && <div className="ut-empty-msg">Keine Endkunden gefunden</div>}
      </div>
    </div>
  );
}
