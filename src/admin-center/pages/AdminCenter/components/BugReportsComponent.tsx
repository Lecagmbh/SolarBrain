import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Bug,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  X
} from 'lucide-react';
import { adminCenterApi } from '../../../api/admin-center.api';

// Local types - no imports from API
interface BugReport {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorMessage?: string;
  stackTrace?: string;
  browserInfo?: string;
  attachments?: unknown;
  reportedBy: { id: number; name: string; email: string };
  assignedTo?: { id: number; name: string; email: string };
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['UI', 'API', 'DATABASE', 'PERFORMANCE', 'SECURITY', 'INTEGRATION', 'OTHER'] as const;
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX'] as const;

export const BugReportsComponent: React.FC = () => {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);

  useEffect(() => {
    loadBugs();
  }, [pagination.page, status, severity]);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (severity) params.severity = severity;

      const data = await adminCenterApi.getBugs(params);
      setBugs(data.bugs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    loadBugs();
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'OPEN': return <AlertCircle size={14} />;
      case 'IN_PROGRESS': return <Clock size={14} />;
      case 'RESOLVED': return <CheckCircle size={14} />;
      case 'CLOSED': return <XCircle size={14} />;
      case 'WONT_FIX': return <X size={14} />;
      default: return <Bug size={14} />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'OPEN': return '#ef4444';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'RESOLVED': return '#10b981';
      case 'CLOSED': return '#6b7280';
      case 'WONT_FIX': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Bug Reports</h2>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} Einträge</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadBugs} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Bug melden
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Bug suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
          >
            <option value="">Alle Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={severity} 
            onChange={(e) => { setSeverity(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
          >
            <option value="">Alle Prioritäten</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Bugs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : bugs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <Bug className="w-12 h-12 mb-3 opacity-50" />
            <p>Keine Bugs gefunden</p>
          </div>
        ) : (
          bugs.map((bug) => (
            <div 
              key={bug.id} 
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 cursor-pointer hover:bg-slate-700/30 transition-all"
              onClick={() => setSelectedBug(bug)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: getSeverityColor(bug.severity) }}
                    >
                      {bug.severity}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-600/50 text-slate-300">
                      {bug.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{bug.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{bug.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {bug.reportedBy?.name || 'Unbekannt'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(bug.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
                <span 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                  style={{ backgroundColor: getStatusColor(bug.status) }}
                >
                  {getStatusIcon(bug.status)}
                  {bug.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-400">
            Seite {pagination.page} von {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <BugCreateModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => { setShowCreateModal(false); loadBugs(); }}
        />
      )}

      {/* Detail Modal */}
      {selectedBug && (
        <BugDetailModal 
          bug={selectedBug} 
          onClose={() => setSelectedBug(null)}
          onUpdated={() => { setSelectedBug(null); loadBugs(); }}
        />
      )}
    </div>
  );
};

// Bug Create Modal
const BugCreateModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    severity: 'MEDIUM',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    errorMessage: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCenterApi.createBug(form);
      onCreated();
    } catch (error) {
      console.error('Failed to create bug:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bug className="w-5 h-5" /> Bug melden
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Titel *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="Kurze Beschreibung des Problems"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kategorie</label>
              <select 
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priorität</label>
              <select 
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              >
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Beschreibung *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              required
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="Ausführliche Beschreibung des Bugs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Schritte zur Reproduktion</label>
            <textarea
              value={form.stepsToReproduce}
              onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="1. Gehe zu...&#10;2. Klicke auf...&#10;3. Beobachte..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Erwartetes Verhalten</label>
              <textarea
                value={form.expectedBehavior}
                onChange={(e) => setForm({ ...form, expectedBehavior: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tatsächliches Verhalten</label>
              <textarea
                value={form.actualBehavior}
                onChange={(e) => setForm({ ...form, actualBehavior: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Fehlermeldung</label>
            <textarea
              value={form.errorMessage}
              onChange={(e) => setForm({ ...form, errorMessage: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-mono text-sm"
              placeholder="Kopiere hier die Fehlermeldung..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">
              Abbrechen
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
            >
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus className="w-4 h-4" />}
              Bug melden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bug Detail Modal
const BugDetailModal: React.FC<{ bug: BugReport; onClose: () => void; onUpdated: () => void }> = ({ bug, onClose, onUpdated }) => {
  const [status, setStatus] = useState(bug.status);
  const [resolution, setResolution] = useState(bug.resolution || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await adminCenterApi.updateBug(bug.id, { status, resolution });
      onUpdated();
    } catch (error) {
      console.error('Failed to update bug:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Bug #{bug.id}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-white" style={{ 
              backgroundColor: bug.severity === 'CRITICAL' ? '#ef4444' : bug.severity === 'HIGH' ? '#f97316' : bug.severity === 'MEDIUM' ? '#f59e0b' : '#10b981'
            }}>{bug.severity}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-600/50 text-slate-300">{bug.category}</span>
            <span className="text-slate-400 text-sm">Gemeldet von: {bug.reportedBy?.name || 'Unbekannt'}</span>
          </div>

          <h3 className="text-lg font-semibold text-white">{bug.title}</h3>
          
          <div>
            <label className="text-xs text-slate-500 uppercase">Beschreibung</label>
            <p className="text-slate-300 mt-1">{bug.description}</p>
          </div>

          {bug.stepsToReproduce && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Schritte zur Reproduktion</label>
              <pre className="mt-1 p-3 bg-slate-900/50 rounded-xl text-sm text-slate-300 whitespace-pre-wrap">{bug.stepsToReproduce}</pre>
            </div>
          )}

          {bug.expectedBehavior && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Erwartetes Verhalten</label>
              <p className="text-slate-300 mt-1">{bug.expectedBehavior}</p>
            </div>
          )}

          {bug.actualBehavior && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Tatsächliches Verhalten</label>
              <p className="text-slate-300 mt-1">{bug.actualBehavior}</p>
            </div>
          )}

          {bug.errorMessage && (
            <div>
              <label className="text-xs text-slate-500 uppercase">Fehlermeldung</label>
              <pre className="mt-1 p-3 bg-red-900/20 border border-red-500/20 rounded-xl text-sm text-red-300 whitespace-pre-wrap">{bug.errorMessage}</pre>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status ändern</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Lösung / Kommentar</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                placeholder="Beschreibe die Lösung oder füge einen Kommentar hinzu..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">
            Schließen
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <CheckCircle className="w-4 h-4" />}
            Aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default BugReportsComponent;
