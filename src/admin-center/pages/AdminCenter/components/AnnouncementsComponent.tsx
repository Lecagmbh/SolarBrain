// pages/AdminCenter/components/AnnouncementsComponent.tsx
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit3, Trash2, Eye, EyeOff, Sparkles, AlertTriangle, Info, Wrench, Clock, Users, Check, X, Calendar } from 'lucide-react';
import { adminCenterApi } from '../../../api/admin-center.api';

interface Announcement { id: number; title: string; content: string; version?: string; type: 'UPDATE' | 'BUGFIX' | 'MAINTENANCE' | 'INFO' | 'WARNING' | 'BREAKING'; priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'; isActive: boolean; showOnLogin: boolean; activeFrom: string; activeTo?: string; targetRoles?: string; createdBy: { id: number; name: string }; _count: { reads: number }; createdAt: string; }

export const AnnouncementsComponent: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => { loadAnnouncements(); }, [includeInactive]);

  const loadAnnouncements = async () => { try { setLoading(true); const r = await adminCenterApi.getAnnouncements({ includeInactive }); setAnnouncements(r.data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleDelete = async (id: number) => { if (!confirm('Announcement wirklich löschen?')) return; try { await adminCenterApi.deleteAnnouncement(id); loadAnnouncements(); } catch (e) { console.error(e); } };
  const handleToggleActive = async (a: Announcement) => { try { await adminCenterApi.updateAnnouncement(a.id, { isActive: !a.isActive }); loadAnnouncements(); } catch (e) { console.error(e); } };

  const getTypeIcon = (type: string) => ({ UPDATE: <Sparkles className="w-4 h-4" />, BUGFIX: <Wrench className="w-4 h-4" />, MAINTENANCE: <Clock className="w-4 h-4" />, INFO: <Info className="w-4 h-4" />, WARNING: <AlertTriangle className="w-4 h-4" />, BREAKING: <AlertTriangle className="w-4 h-4" /> }[type] || <Bell className="w-4 h-4" />);
  const getTypeColor = (type: string) => ({ UPDATE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', BUGFIX: 'bg-blue-500/20 text-blue-400 border-blue-500/30', MAINTENANCE: 'bg-amber-500/20 text-amber-400 border-amber-500/30', INFO: 'bg-slate-500/20 text-slate-400 border-slate-500/30', WARNING: 'bg-orange-500/20 text-orange-400 border-orange-500/30', BREAKING: 'bg-red-500/20 text-red-400 border-red-500/30' }[type] || 'bg-slate-500/20 text-slate-400');
  const getPriorityBadge = (priority: string) => ({ LOW: 'bg-slate-500/20 text-slate-400', NORMAL: 'bg-blue-500/20 text-blue-400', HIGH: 'bg-amber-500/20 text-amber-400', URGENT: 'bg-red-500/20 text-red-400 animate-pulse' }[priority] || 'bg-blue-500/20 text-blue-400');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-white">Announcements</h2><p className="text-slate-400 text-sm mt-1">System-Neuigkeiten für Benutzer verwalten</p></div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer"><input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="rounded border-slate-600 bg-slate-700 text-violet-500" />Inaktive anzeigen</label>
          <button onClick={() => { setEditingAnnouncement(null); setShowEditor(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg"><Plus className="w-4 h-4" />Neue Ankündigung</button>
        </div>
      </div>
      <div className="space-y-4">
        {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div> : announcements.length === 0 ? <div className="flex flex-col items-center py-12 text-slate-400"><Bell className="w-12 h-12 mb-3 opacity-50" /><p>Keine Announcements</p></div> : announcements.map(a => (
          <div key={a.id} className={`bg-slate-800/50 rounded-2xl border p-6 ${a.isActive ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getTypeColor(a.type)}`}>{getTypeIcon(a.type)}{a.type}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityBadge(a.priority)}`}>{a.priority}</span>
                  {a.version && <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium">{a.version}</span>}
                  {!a.isActive && <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-lg text-xs">Inaktiv</span>}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{a.content}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(a.createdAt).toLocaleDateString('de-DE')}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{a._count.reads} gelesen</span>
                  <span>von {a.createdBy.name}</span>
                  {a.showOnLogin && <span className="flex items-center gap-1 text-emerald-400"><Eye className="w-3.5 h-3.5" />Zeigt bei Login</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleActive(a)} className={`p-2 rounded-lg ${a.isActive ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-400 hover:bg-slate-700'}`}>{a.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                <button onClick={() => { setEditingAnnouncement(a); setShowEditor(true); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showEditor && <AnnouncementEditor announcement={editingAnnouncement} onClose={() => setShowEditor(false)} onSave={() => { setShowEditor(false); loadAnnouncements(); }} />}
    </div>
  );
};

const AnnouncementEditor: React.FC<{ announcement: Announcement | null; onClose: () => void; onSave: () => void }> = ({ announcement, onClose, onSave }) => {
  const [form, setForm] = useState({ title: announcement?.title || '', content: announcement?.content || '', version: announcement?.version || '', type: announcement?.type || 'UPDATE', priority: announcement?.priority || 'NORMAL', isActive: announcement?.isActive ?? true, showOnLogin: announcement?.showOnLogin ?? true, activeFrom: announcement?.activeFrom ? new Date(announcement.activeFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16), activeTo: announcement?.activeTo ? new Date(announcement.activeTo).toISOString().slice(0, 16) : '', targetRoles: announcement?.targetRoles ? JSON.parse(announcement.targetRoles) : [] });
  const [saving, setSaving] = useState(false);
  const types = ['UPDATE', 'BUGFIX', 'MAINTENANCE', 'INFO', 'WARNING', 'BREAKING'];
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  const roles = ['ADMIN', 'MITARBEITER', 'KUNDE', 'SUBUNTERNEHMER'];

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { setSaving(true); const data = { ...form, targetRoles: form.targetRoles.length > 0 ? form.targetRoles : null, activeTo: form.activeTo || undefined }; if (announcement) await adminCenterApi.updateAnnouncement(announcement.id, data); else await adminCenterApi.createAnnouncement(data); onSave(); } catch (err) { console.error(err); } finally { setSaving(false); } };
  const toggleRole = (role: string) => setForm(prev => ({ ...prev, targetRoles: prev.targetRoles.includes(role) ? prev.targetRoles.filter((r: string) => r !== role) : [...prev.targetRoles, role] }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700"><h2 className="text-xl font-semibold text-white">{announcement ? 'Announcement bearbeiten' : 'Neue Ankündigung'}</h2><button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Titel *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" placeholder="z.B. Neue Funktion: Automatische Benachrichtigungen" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Typ</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white">{types.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Priorität</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white">{priorities.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Version (optional)</label><input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" placeholder="z.B. v2.5.0" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Inhalt * (Markdown)</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={8} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-mono text-sm" placeholder="## Neue Features&#10;&#10;- Feature 1&#10;- Feature 2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Aktiv ab</label><input type="datetime-local" value={form.activeFrom} onChange={(e) => setForm({ ...form, activeFrom: e.target.value })} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Aktiv bis</label><input type="datetime-local" value={form.activeTo} onChange={(e) => setForm({ ...form, activeTo: e.target.value })} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">Zielgruppe (leer = alle)</label><div className="flex flex-wrap gap-2">{roles.map(role => <button key={role} type="button" onClick={() => toggleRole(role)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${form.targetRoles.includes(role) ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>{role}</button>)}</div></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-600 bg-slate-700 text-violet-500" /><span className="text-sm text-slate-300">Aktiv</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.showOnLogin} onChange={(e) => setForm({ ...form, showOnLogin: e.target.checked })} className="rounded border-slate-600 bg-slate-700 text-violet-500" /><span className="text-sm text-slate-300">Bei Login anzeigen</span></label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700"><button type="button" onClick={onClose} className="px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl">Abbrechen</button><button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium shadow-lg disabled:opacity-50">{saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Check className="w-4 h-4" />}{announcement ? 'Speichern' : 'Erstellen'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementsComponent;
