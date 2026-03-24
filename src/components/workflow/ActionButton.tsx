// Workflow V2: Action-Button für InboxItems

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "../../services/apiClient";

interface InboxAction {
  id: string;
  label: string;
  type: "confirm" | "form" | "link" | "api_call";
  endpoint?: string;
  url?: string;
}

interface ActionButtonProps {
  itemId: number;
  action: InboxAction;
  installationId: number;
  onFormOpen?: (action: InboxAction) => void;
}

export default function ActionButton({ itemId, action, installationId, onFormOpen }: ActionButtonProps) {
  const queryClient = useQueryClient();

  const executeAction = useMutation({
    mutationFn: () => apiPost(`/v2/inbox/${itemId}/action/${action.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", "v2", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["workflow", "v2", "pipeline"] });
    },
  });

  const handleClick = () => {
    if (action.type === "link" && action.url) {
      window.location.hash = "";
      window.location.pathname = action.url;
      return;
    }

    if (action.type === "form" && onFormOpen) {
      onFormOpen(action);
      return;
    }

    // confirm oder api_call
    executeAction.mutate();
  };

  const isPrimary = action.type === "api_call" || action.type === "confirm";

  return (
    <button
      className={`action-btn ${isPrimary ? "primary" : ""}`}
      onClick={handleClick}
      disabled={executeAction.isPending}
    >
      {executeAction.isPending ? "..." : action.label}
    </button>
  );
}

export type { InboxAction };
