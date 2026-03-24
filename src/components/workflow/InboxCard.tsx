// Workflow V2: Einzelne Inbox-Karte

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../services/apiClient";
import ActionButton from "./ActionButton";
import ActionFormModal from "./ActionFormModal";
import type { InboxAction } from "./ActionButton";

export interface InboxItemData {
  id: number;
  installationId: number;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  actions: InboxAction[] | null;
  metadata: Record<string, unknown> | null;
  autoCreated: boolean;
  resolvedAt: string | null;
  createdAt: string;
  installation: {
    id: number;
    publicId: string;
    customerName: string | null;
    gridOperator: string | null;
    phase: string | null;
    zustand: string | null;
  };
}

interface InboxCardProps {
  item: InboxItemData;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "jetzt";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

export default function InboxCard({ item }: InboxCardProps) {
  const [formAction, setFormAction] = useState<InboxAction | null>(null);
  const queryClient = useQueryClient();

  const resolve = useMutation({
    mutationFn: () => apiPost<unknown>(`/v2/inbox/${item.id}/resolve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", "v2", "inbox"] });
    },
  });

  const actions = item.actions || [];

  return (
    <>
      <div className={`inbox-card priority-${item.priority}`}>
        <div className={`inbox-priority-dot ${item.priority}`} />

        <div className="inbox-card-body">
          <div className="inbox-card-title">{item.title}</div>
          <div className="inbox-card-meta">
            <span>{item.installation.publicId}</span>
            {item.installation.customerName && <span>{item.installation.customerName}</span>}
            {item.installation.gridOperator && <span>{item.installation.gridOperator}</span>}
          </div>
          {item.description && <div className="inbox-card-desc">{item.description}</div>}

          <div className="inbox-card-actions">
            {actions.map((action) => (
              <ActionButton
                key={action.id}
                itemId={item.id}
                action={action}
                installationId={item.installationId}
                onFormOpen={setFormAction}
              />
            ))}
            <button
              className="action-btn resolve"
              onClick={() => resolve.mutate()}
              disabled={resolve.isPending}
            >
              {resolve.isPending ? "..." : "Erledigt"}
            </button>
          </div>
        </div>

        <div className="inbox-card-time">{timeAgo(item.createdAt)}</div>
      </div>

      {formAction && (
        <ActionFormModal
          itemId={item.id}
          action={formAction}
          onClose={() => setFormAction(null)}
        />
      )}
    </>
  );
}
