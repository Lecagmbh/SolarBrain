// Workflow V2: Modal für Form-Actions

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../services/apiClient";
import type { InboxAction } from "./ActionButton";

interface ActionFormModalProps {
  itemId: number;
  action: InboxAction;
  onClose: () => void;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

export default function ActionFormModal({ itemId, action, onClose }: ActionFormModalProps) {
  const fields = (action as unknown as { fields?: FormField[] }).fields || [];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: () => apiPost(`/v2/inbox/${itemId}/action/${action.id}`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", "v2", "inbox"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{action.label}</h3>
          <button className="close-btn" onClick={onClose} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((field) => (
              <div key={field.name} className="form-group">
                <label>{field.label}{field.required && " *"}</label>
                {field.type === "textarea" ? (
                  <textarea
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.required}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="action-btn" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="action-btn primary" disabled={submit.isPending}>
              {submit.isPending ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
