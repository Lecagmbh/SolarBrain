/**
 * TASK TEMPLATES - Aufgabenvorlagen
 * Wiederverwendbare Vorlagen für häufige Aufgaben
 */

import { useState } from "react";
import {
  Plus, Copy, Trash2, Edit3, Check, X, Save,
  FileText, Mail, Phone, Upload, CheckCircle, Clock,
  AlertTriangle, Zap, Building2, User, Loader2,
} from "lucide-react";

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: "low" | "medium" | "high";
  category: string;
  defaultDueDays: number; // Tage bis Fälligkeit
  checklist?: string[];
}

// Vordefinierte Vorlagen
export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: "dok_anfordern",
    name: "Dokumente vom Kunden anfordern",
    description: "Fehlende Unterlagen beim Kunden anfragen",
    icon: "upload",
    priority: "high",
    category: "Dokumente",
    defaultDueDays: 3,
    checklist: [
      "E-Mail an Kunden senden",
      "Frist setzen (3 Tage)",
      "Telefonische Erinnerung nach 2 Tagen",
    ],
  },
  {
    id: "nb_nachfassen",
    name: "Beim Netzbetreiber nachfassen",
    description: "Status der Anmeldung beim NB erfragen",
    icon: "building",
    priority: "medium",
    category: "Netzbetreiber",
    defaultDueDays: 7,
    checklist: [
      "Portal-Status prüfen",
      "Bei Bedarf anrufen",
      "Status in System aktualisieren",
    ],
  },
  {
    id: "vde_generieren",
    name: "VDE-Formulare generieren",
    description: "Alle erforderlichen VDE-Formulare erstellen",
    icon: "file",
    priority: "medium",
    category: "Dokumente",
    defaultDueDays: 1,
    checklist: [
      "E.1 Antragstellung",
      "E.2 Datenblatt Erzeugung",
      "E.3 Datenblatt Speicher (falls vorhanden)",
      "E.8 IBN-Protokoll",
    ],
  },
  {
    id: "nb_einreichen",
    name: "Beim Netzbetreiber einreichen",
    description: "Vollständige Unterlagen an NB senden",
    icon: "mail",
    priority: "high",
    category: "Netzbetreiber",
    defaultDueDays: 1,
    checklist: [
      "Alle Dokumente vollständig?",
      "Portal-Upload oder E-Mail",
      "Bestätigung archivieren",
      "Status auf 'Eingereicht' setzen",
    ],
  },
  {
    id: "kunde_update",
    name: "Kunden informieren",
    description: "Status-Update an Kunden senden",
    icon: "user",
    priority: "low",
    category: "Kommunikation",
    defaultDueDays: 1,
    checklist: [
      "E-Mail mit aktuellem Status",
      "Nächste Schritte erklären",
      "Geschätzte Dauer nennen",
    ],
  },
  {
    id: "abschluss",
    name: "Vorgang abschließen",
    description: "Netzanmeldung finalisieren",
    icon: "check",
    priority: "medium",
    category: "Abschluss",
    defaultDueDays: 2,
    checklist: [
      "NB-Bestätigung erhalten?",
      "Alle Dokumente archiviert?",
      "Kunde informiert?",
      "Rechnung erstellt?",
      "Status auf 'Abgeschlossen' setzen",
    ],
  },
  {
    id: "telefonat",
    name: "Telefonat führen",
    description: "Telefonischen Kontakt aufnehmen",
    icon: "phone",
    priority: "medium",
    category: "Kommunikation",
    defaultDueDays: 1,
    checklist: [
      "Anrufen",
      "Gesprächsnotiz erstellen",
      "Follow-up Aufgabe erstellen",
    ],
  },
  {
    id: "pruefung",
    name: "Unterlagen prüfen",
    description: "Eingereichte Dokumente kontrollieren",
    icon: "alert",
    priority: "high",
    category: "Dokumente",
    defaultDueDays: 1,
    checklist: [
      "Vollständigkeit prüfen",
      "Technische Daten korrekt?",
      "Unterschriften vorhanden?",
      "Bei Fehlern: Nachforderung erstellen",
    ],
  },
];

const ICON_MAP: Record<string, typeof FileText> = {
  file: FileText,
  mail: Mail,
  phone: Phone,
  upload: Upload,
  check: CheckCircle,
  clock: Clock,
  alert: AlertTriangle,
  zap: Zap,
  building: Building2,
  user: User,
};

interface TaskTemplatesProps {
  onSelectTemplate: (template: TaskTemplate) => void;
  onClose: () => void;
}

export function TaskTemplatesModal({ onSelectTemplate, onClose }: TaskTemplatesProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleSelect = (template: TaskTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (confirm("Vorlage wirklich löschen?")) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveEdit = (template: TaskTemplate) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    setEditingTemplate(null);
  };

  const handleCreateNew = () => {
    const newTemplate: TaskTemplate = {
      id: `custom_${Date.now()}`,
      name: "Neue Vorlage",
      description: "Beschreibung hier eingeben",
      icon: "file",
      priority: "medium",
      category: "Eigene",
      defaultDueDays: 3,
      checklist: ["Schritt 1", "Schritt 2"],
    };
    setTemplates(prev => [...prev, newTemplate]);
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  return (
    <div className="dp-modal-overlay" onClick={onClose}>
      <div className="dp-modal dp-modal--lg dp-templates-modal" onClick={e => e.stopPropagation()}>
        <div className="dp-modal__header">
          <div>
            <h3>Aufgabenvorlagen</h3>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Wähle eine Vorlage oder erstelle eine neue
            </p>
          </div>
          <button className="dp-btn dp-btn--icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="dp-templates-content">
          {/* Category Tabs */}
          <div className="dp-templates-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`dp-templates-cat ${selectedCategory === cat ? "dp-templates-cat--active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "Alle" : cat}
              </button>
            ))}
            <button className="dp-templates-cat dp-templates-cat--add" onClick={handleCreateNew}>
              <Plus size={14} /> Neue Vorlage
            </button>
          </div>

          {/* Templates Grid */}
          <div className="dp-templates-grid">
            {filteredTemplates.map(template => {
              const Icon = ICON_MAP[template.icon] || FileText;
              const isEditing = editingTemplate?.id === template.id;

              if (isEditing) {
                return (
                  <TemplateEditor
                    key={template.id}
                    template={editingTemplate}
                    onSave={handleSaveEdit}
                    onCancel={() => {
                      if (isCreating) {
                        setTemplates(prev => prev.filter(t => t.id !== template.id));
                      }
                      setEditingTemplate(null);
                      setIsCreating(false);
                    }}
                  />
                );
              }

              return (
                <div key={template.id} className="dp-template-card">
                  <div className="dp-template-card__header">
                    <div className={`dp-template-card__icon dp-template-card__icon--${template.priority}`}>
                      <Icon size={20} />
                    </div>
                    <div className="dp-template-card__actions">
                      <button onClick={() => setEditingTemplate(template)} title="Bearbeiten">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(template.id)} title="Löschen">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  
                  <div className="dp-template-card__meta">
                    <span className={`dp-template-card__priority dp-template-card__priority--${template.priority}`}>
                      {template.priority === "high" ? "Hoch" : template.priority === "medium" ? "Mittel" : "Niedrig"}
                    </span>
                    <span><Clock size={12} /> {template.defaultDueDays} Tag{template.defaultDueDays !== 1 ? "e" : ""}</span>
                  </div>

                  {template.checklist && template.checklist.length > 0 && (
                    <div className="dp-template-card__checklist">
                      {template.checklist.slice(0, 3).map((item, i) => (
                        <div key={i} className="dp-template-card__checklist-item">
                          <CheckCircle size={12} /> {item}
                        </div>
                      ))}
                      {template.checklist.length > 3 && (
                        <span className="dp-template-card__checklist-more">
                          +{template.checklist.length - 3} weitere
                        </span>
                      )}
                    </div>
                  )}

                  <button 
                    className="dp-btn dp-btn--primary dp-template-card__select"
                    onClick={() => handleSelect(template)}
                  >
                    <Copy size={14} /> Verwenden
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Editor Component
function TemplateEditor({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: TaskTemplate; 
  onSave: (t: TaskTemplate) => void; 
  onCancel: () => void;
}) {
  const [form, setForm] = useState(template);
  const [checklistText, setChecklistText] = useState(template.checklist?.join("\n") || "");

  const handleSave = () => {
    onSave({
      ...form,
      checklist: checklistText.split("\n").filter(s => s.trim()),
    });
  };

  return (
    <div className="dp-template-editor">
      <div className="dp-template-editor__field">
        <label>Name</label>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Vorlagenname"
        />
      </div>

      <div className="dp-template-editor__field">
        <label>Beschreibung</label>
        <input
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Kurze Beschreibung"
        />
      </div>

      <div className="dp-template-editor__row">
        <div className="dp-template-editor__field">
          <label>Priorität</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </div>

        <div className="dp-template-editor__field">
          <label>Fälligkeit (Tage)</label>
          <input
            type="number"
            value={form.defaultDueDays}
            onChange={e => setForm({ ...form, defaultDueDays: parseInt(e.target.value) || 1 })}
            min={1}
          />
        </div>

        <div className="dp-template-editor__field">
          <label>Kategorie</label>
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="z.B. Dokumente"
          />
        </div>
      </div>

      <div className="dp-template-editor__field">
        <label>Checkliste (eine Zeile pro Punkt)</label>
        <textarea
          value={checklistText}
          onChange={e => setChecklistText(e.target.value)}
          placeholder="Schritt 1&#10;Schritt 2&#10;Schritt 3"
          rows={4}
        />
      </div>

      <div className="dp-template-editor__actions">
        <button className="dp-btn" onClick={onCancel}>
          <X size={14} /> Abbrechen
        </button>
        <button className="dp-btn dp-btn--primary" onClick={handleSave}>
          <Save size={14} /> Speichern
        </button>
      </div>
    </div>
  );
}

export default TaskTemplatesModal;
