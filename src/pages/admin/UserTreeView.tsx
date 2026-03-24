/**
 * UserTreeView - Stammbaum mit Auswahl-basiertem Verknüpfen
 * Kein Drag & Drop - stattdessen Select-Dropdown zum Parent zuweisen
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChevronRight, ChevronDown, Users, User, Search, X,
  Unlink, Building2, Shield, Briefcase, Link2, Check,
  Handshake, ChevronsUpDown, ChevronUp,
} from "lucide-react";
import { api } from "../../modules/api/client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TreeUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  kundeId: number | null;
  parentUserId: number | null;
  kunde: { id: number; name: string; firmenName: string | null } | null;
  handelsvertreter: { id: number; firmenName: string | null; aktiv: boolean } | null;
}

interface TreeNode extends TreeUser {
  children: TreeNode[];
}

// ─── Style Config ───────────────────────────────────────────────────────────

const RS: Record<string, { label: string; shortLabel: string; color: string; bg: string; icon: typeof User }> = {
  ADMIN:            { label: "Administrator",     shortLabel: "Admin", color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: Shield },
  MITARBEITER:      { label: "Mitarbeiter",       shortLabel: "MA",    color: "#a78bfa", bg: "rgba(168,85,247,0.1)",  icon: Briefcase },
  KUNDE:            { label: "Kunde",             shortLabel: "Kunde", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: Building2 },
  SUBUNTERNEHMER:   { label: "Subunternehmer",    shortLabel: "Sub",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: User },
  HANDELSVERTRETER: { label: "Handelsvertreter",  shortLabel: "HV",    color: "#22d3ee", bg: "rgba(6,182,212,0.1)",   icon: Handshake },
  ENDKUNDE_PORTAL:  { label: "Endkunde Portal",   shortLabel: "Portal",color: "#4ade80", bg: "rgba(34,197,94,0.1)",   icon: User },
  DEMO:             { label: "Demo",              shortLabel: "Demo",  color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)", icon: User },
};

// ─── Link-Picker (Dropdown to select parent) ────────────────────────────────

function LinkPicker({ allUsers, currentUser, onLink, onClose }: {
  allUsers: TreeUser[];
  currentUser: TreeUser;
  onLink: (parentId: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allUsers
      .filter(u => u.id !== currentUser.id && u.parentUserId !== currentUser.id)
      .filter(u => !q ||
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.kunde?.firmenName || "").toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [allUsers, currentUser.id, search]);

  return (
    <div className="ut-picker-backdrop" onClick={onClose}>
      <div className="ut-picker" onClick={e => e.stopPropagation()}>
        <div className="ut-picker-header">
          <Link2 size={14} />
          <span>Übergeordneten Benutzer wählen für <strong>{currentUser.name || currentUser.email}</strong></span>
          <button className="ut-picker-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="ut-picker-search">
          <Search size={13} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Name, Email oder Firma suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ut-picker-list">
          {filtered.length === 0 && (
            <div className="ut-picker-empty">Keine passenden Benutzer gefunden</div>
          )}
          {filtered.map(u => {
            const rs = RS[u.role] || RS.DEMO;
            return (
              <button
                key={u.id}
                className="ut-picker-item"
                onClick={() => onLink(u.id)}
              >
                <div className="ut-avatar-sm" style={{ background: rs.bg, color: rs.color }}>
                  <rs.icon size={12} />
                </div>
                <div className="ut-picker-info">
                  <span className="ut-picker-name">{u.name || u.email}</span>
                  <span className="ut-picker-meta">
                    {u.kunde?.firmenName || u.email}
                    {u.handelsvertreter && <span style={{ color: "#22d3ee" }}> · HV: {u.handelsvertreter.firmenName}</span>}
                  </span>
                </div>
                <span className="ut-role-sm" style={{ background: rs.bg, color: rs.color }}>{rs.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tree Node Component ────────────────────────────────────────────────────

function TreeNodeRow({ node, level, expanded, onToggle, onLink, onUnlink, saving, searchTerm }: {
  node: TreeNode;
  level: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onLink: (userId: number) => void;
  onUnlink: (userId: number) => void;
  saving: boolean;
  searchTerm: string;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const rs = RS[node.role] || RS.DEMO;
  const Icon = rs.icon;

  const isAlsoKunde = node.kundeId !== null && node.role !== "KUNDE";
  const isAlsoHV = node.handelsvertreter !== null && node.role !== "HANDELSVERTRETER";

  const matchesSearch = searchTerm
    ? (node.name || "").toLowerCase().includes(searchTerm) ||
      node.email.toLowerCase().includes(searchTerm) ||
      (node.kunde?.firmenName || "").toLowerCase().includes(searchTerm) ||
      (node.handelsvertreter?.firmenName || "").toLowerCase().includes(searchTerm)
    : false;

  return (
    <div style={{ marginLeft: level > 0 ? 24 : 0 }}>
      {/* Connector line for children */}
      {level > 0 && (
        <div className="ut-connector">
          <div className="ut-hline" />
        </div>
      )}
      <div
        className={[
          "ut-row",
          !node.active && "ut-row--inactive",
          searchTerm && matchesSearch && "ut-row--highlight",
          searchTerm && !matchesSearch && "ut-row--dim",
        ].filter(Boolean).join(" ")}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button className="ut-toggle" onClick={() => onToggle(node.id)}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="ut-toggle-spacer" />
        )}

        {/* Avatar */}
        <div className="ut-avatar" style={{ background: rs.bg, color: rs.color }}>
          <Icon size={14} />
        </div>

        {/* Info */}
        <div className="ut-row-info">
          <div className="ut-row-name">{node.name || node.email}</div>
          <div className="ut-row-meta">
            {node.kunde?.firmenName || node.email}
          </div>
        </div>

        {/* Role badge */}
        <span className="ut-badge" style={{ background: rs.bg, color: rs.color }}>{rs.shortLabel}</span>

        {/* Extra role tags */}
        {isAlsoKunde && (
          <span className="ut-extra-tag ut-extra-tag--blue" title={`Auch Kunde: ${node.kunde?.firmenName || node.kunde?.name}`}>
            <Building2 size={9} /> Kunde
          </span>
        )}
        {isAlsoHV && (
          <span className="ut-extra-tag ut-extra-tag--cyan" title={`Auch HV: ${node.handelsvertreter?.firmenName}`}>
            <Handshake size={9} /> HV
          </span>
        )}
        {node.role === "HANDELSVERTRETER" && node.handelsvertreter?.firmenName && (
          <span className="ut-extra-tag ut-extra-tag--cyan">
            {node.handelsvertreter.firmenName}
          </span>
        )}

        {/* Child count */}
        {hasChildren && (
          <span className="ut-child-badge">{node.children.length}</span>
        )}

        {/* Actions */}
        <div className="ut-row-actions">
          <button
            className="ut-action-btn ut-action-btn--link"
            onClick={() => onLink(node.id)}
            disabled={saving}
            title="Übergeordneten Benutzer zuweisen"
          >
            <Link2 size={13} />
          </button>
          {node.parentUserId && (
            <button
              className="ut-action-btn ut-action-btn--unlink"
              onClick={() => onUnlink(node.id)}
              disabled={saving}
              title="Verknüpfung aufheben"
            >
              <Unlink size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ut-branch">
          <div className="ut-branch-line" />
          {node.children.map(c => (
            <TreeNodeRow
              key={c.id} node={c} level={level + 1}
              expanded={expanded} onToggle={onToggle}
              onLink={onLink} onUnlink={onUnlink}
              saving={saving} searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface Props { onToast: (type: "ok" | "error", msg: string) => void; }

export default function UserTreeView({ onToast }: Props) {
  const [allUsers, setAllUsers] = useState<TreeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [linkingUserId, setLinkingUserId] = useState<number | null>(null);

  // Fetch
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", { params: { limit: 500 } });
      setAllUsers(res.data.data || []);
    } catch { onToast("error", "Fehler beim Laden"); }
    finally { setLoading(false); }
  }, [onToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-expand parents on first load
  const didExpand = useRef(false);
  useEffect(() => {
    if (allUsers.length > 0 && !didExpand.current) {
      didExpand.current = true;
      const parentIds = new Set(allUsers.filter(u => u.parentUserId).map(u => u.parentUserId!));
      setExpanded(parentIds);
    }
  }, [allUsers]);

  // Build tree
  const tree = useMemo(() => {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];
    for (const u of allUsers) map.set(u.id, { ...u, children: [] });
    for (const u of allUsers) {
      const node = map.get(u.id)!;
      if (u.parentUserId && map.has(u.parentUserId)) {
        map.get(u.parentUserId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const prio: Record<string, number> = { ADMIN: 0, MITARBEITER: 1, HANDELSVERTRETER: 2, KUNDE: 3, SUBUNTERNEHMER: 4, ENDKUNDE_PORTAL: 5, DEMO: 6 };
    const sortNodes = (arr: TreeNode[]) => {
      arr.sort((a, b) => (prio[a.role] ?? 9) - (prio[b.role] ?? 9) || (a.name || a.email).localeCompare(b.name || b.email));
      arr.forEach(n => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }, [allUsers]);

  // Toggle
  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const expandAll = () => {
    const ids = new Set(allUsers.filter(u => allUsers.some(c => c.parentUserId === u.id)).map(u => u.id));
    setExpanded(ids);
  };
  const collapseAll = () => setExpanded(new Set());

  // Link user to parent
  const handleLink = async (childId: number, parentId: number) => {
    try {
      setSaving(true);
      await api.patch(`/admin/users/${childId}/set-parent`, { parentUserId: parentId });
      setAllUsers(prev => prev.map(u => u.id === childId ? { ...u, parentUserId: parentId } : u));
      setExpanded(prev => new Set(prev).add(parentId));
      const c = allUsers.find(u => u.id === childId);
      const p = allUsers.find(u => u.id === parentId);
      onToast("ok", `${c?.name || c?.email} → unter ${p?.name || p?.email}`);
    } catch (err: any) {
      onToast("error", err.response?.data?.error || "Fehler beim Verknüpfen");
    } finally {
      setSaving(false);
      setLinkingUserId(null);
    }
  };

  // Unlink user
  const handleUnlink = async (userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    const parent = allUsers.find(u => u.id === user.parentUserId);
    try {
      setSaving(true);
      await api.patch(`/admin/users/${userId}/set-parent`, { parentUserId: null });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, parentUserId: null } : u));
      onToast("ok", `${user.name || user.email} von ${parent?.name || parent?.email || "Parent"} entkoppelt`);
    } catch (err: any) {
      onToast("error", err.response?.data?.error || "Fehler");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const withParent = allUsers.filter(u => u.parentUserId).length;
  const hvCount = allUsers.filter(u => u.handelsvertreter).length;

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const linkingUser = linkingUserId ? allUsers.find(u => u.id === linkingUserId) || null : null;

  if (loading) {
    return <div className="ut-loading"><div className="kp-spinner" /><span>Stammbaum wird geladen...</span></div>;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="ut-toolbar">
        <div className="ut-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Benutzer suchen..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="ut-search-clear" onClick={() => setSearchTerm("")}><X size={12} /></button>
          )}
        </div>
        <div className="ut-toolbar-btns">
          <button className="ut-btn-sm" onClick={expandAll}><ChevronsUpDown size={13} /> Alle öffnen</button>
          <button className="ut-btn-sm" onClick={collapseAll}><ChevronUp size={13} /> Zuklappen</button>
        </div>
      </div>

      {/* Info bar */}
      <div className="ut-info-bar">
        <span>{allUsers.length} Benutzer</span>
        <span className="ut-dot" />
        <span>{withParent} verknüpft</span>
        <span className="ut-dot" />
        <span style={{ color: "#22d3ee" }}>{hvCount} Handelsvertreter</span>
        <span className="ut-dot" />
        <span className="ut-info-hint">
          <Link2 size={11} /> Klicke das Ketten-Symbol um einen Benutzer zu verknüpfen
        </span>
      </div>

      {/* Tree */}
      <div className={`ut-tree${saving ? " ut-tree--saving" : ""}`}>
        {tree.map(node => (
          <TreeNodeRow
            key={node.id}
            node={node}
            level={0}
            expanded={expanded}
            onToggle={toggle}
            onLink={(id) => setLinkingUserId(id)}
            onUnlink={handleUnlink}
            saving={saving}
            searchTerm={normalizedSearch}
          />
        ))}
      </div>

      {/* Link Picker Modal */}
      {linkingUser && (
        <LinkPicker
          allUsers={allUsers}
          currentUser={linkingUser}
          onLink={(parentId) => handleLink(linkingUser.id, parentId)}
          onClose={() => setLinkingUserId(null)}
        />
      )}
    </>
  );
}
