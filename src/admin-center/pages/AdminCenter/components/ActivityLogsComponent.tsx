// pages/AdminCenter/components/ActivityLogsComponent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Search, Filter, RefreshCw, AlertTriangle, AlertCircle, Info, Bug, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { adminCenterApi } from '../../../api/admin-center.api';

interface ActivityLog { id: number; action: string; category: string; description?: string; details?: string; userName?: string; userRole?: string; entityType?: string; entityId?: number; level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'; ipAddress?: string; userAgent?: string; createdAt: string; user?: { id: number; name: string; email: string; role: string }; }

export const ActivityLogsComponent: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [filters, setFilters] = useState({ category: '', level: '', search: '', startDate: '', endDate: '' });

  const categories = ['SYSTEM', 'AUTH', 'USER', 'INSTALLATION', 'DOCUMENT', 'EMAIL', 'INVOICE', 'API', 'ERROR'];
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

  const loadLogs = useCallback(async () => {
    try { setLoading(true); const response = await adminCenterApi.getLogs({ page, limit: 50, ...filters }); setLogs(response.data); setTotalPages(response.pagination.totalPages); setTotal(response.pagination.total); }
    catch (error) { console.error('Failed to load logs:', error); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const getLevelConfig = (level: string) => ({ DEBUG: { icon: Bug, color: 'text-slate-400', bg: 'bg-slate-500/20' }, INFO: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' }, WARN: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/20' }, ERROR: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' }, CRITICAL: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/30' } }[level] || { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' });
  const getCategoryColor = (category: string) => ({ SYSTEM: 'bg-slate-500/20 text-slate-400', AUTH: 'bg-blue-500/20 text-blue-400', USER: 'bg-emerald-500/20 text-emerald-400', INSTALLATION: 'bg-violet-500/20 text-violet-400', DOCUMENT: 'bg-amber-500/20 text-amber-400', EMAIL: 'bg-pink-500/20 text-pink-400', INVOICE: 'bg-cyan-500/20 text-cyan-400', API: 'bg-amber-500/20 text-amber-400', ERROR: 'bg-red-500/20 text-red-400' }[category] || 'bg-slate-500/20 text-slate-400');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-white">Activity Logs</h2><p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} Einträge</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${showFilters ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><Filter className="w-4 h-4" />Filter</button>
          <button onClick={loadLogs} className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>
      {showFilters && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2"><label className="block text-sm font-medium text-slate-400 mb-2">Suche</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} placeholder="Action, User..." className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white" /></div></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-2">Kategorie</label><select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }} className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"><option value="">Alle</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-2">Level</label><select value={filters.level} onChange={(e) => { setFilters({ ...filters, level: e.target.value }); setPage(1); }} className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"><option value="">Alle</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="flex items-end"><button onClick={() => { setFilters({ category: '', level: '', search: '', startDate: '', endDate: '' }); setPage(1); }} className="w-full px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">Zurücksetzen</button></div>
          </div>
        </div>
      )}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-700/50"><th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-4">Level</th><th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-4">Action</th><th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-4">Kategorie</th><th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-4">User</th><th className="text-left text-xs font-medium text-slate-400 uppercase px-6 py-4">Zeit</th></tr></thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto" /></td></tr> : logs.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Keine Logs gefunden</td></tr> : logs.map(log => { const cfg = getLevelConfig(log.level); const Icon = cfg.icon; return (
                <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.color}`}><Icon className="w-3.5 h-3.5" />{log.level}</span></td>
                  <td className="px-6 py-4"><div className="text-white font-medium">{log.action}</div>{log.description && <div className="text-slate-400 text-sm truncate max-w-xs">{log.description}</div>}</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(log.category)}`}>{log.category}</span></td>
                  <td className="px-6 py-4 text-slate-300">{log.userName || log.user?.name || 'System'}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(log.createdAt).toLocaleString('de-DE')}</td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50"><p className="text-sm text-slate-400">Seite {page} von {totalPages}</p><div className="flex gap-2"><button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button><button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button></div></div>}
      </div>
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700"><h2 className="text-xl font-semibold text-white">Log Details</h2><button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-500 uppercase">Level</label><p className="text-white">{selectedLog.level}</p></div><div><label className="text-xs text-slate-500 uppercase">Kategorie</label><p className="text-white">{selectedLog.category}</p></div><div><label className="text-xs text-slate-500 uppercase">Action</label><p className="text-white font-mono">{selectedLog.action}</p></div><div><label className="text-xs text-slate-500 uppercase">Zeit</label><p className="text-white">{new Date(selectedLog.createdAt).toLocaleString('de-DE')}</p></div></div>
              {selectedLog.description && <div><label className="text-xs text-slate-500 uppercase">Beschreibung</label><p className="text-slate-300">{selectedLog.description}</p></div>}
              {selectedLog.ipAddress && <div><label className="text-xs text-slate-500 uppercase">IP</label><p className="text-white font-mono">{selectedLog.ipAddress}</p></div>}
              {selectedLog.details && <div><label className="text-xs text-slate-500 uppercase">Details</label><pre className="mt-2 p-4 bg-slate-900/50 rounded-xl text-sm text-slate-300 overflow-x-auto">{(() => { try { return JSON.stringify(JSON.parse(selectedLog.details), null, 2); } catch { return selectedLog.details; } })()}</pre></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsComponent;
