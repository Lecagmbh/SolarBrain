import { useState } from "react";
import "./webhooks.css";

export function WebhooksPage() {
  const [hooks, setHooks] = useState<
    { id: string; url: string; active: boolean }[]
  >([]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Webhooks</h1>

      <button
        onClick={() =>
          setHooks((prev) => [
            ...prev,
            { id: Math.random().toString(36).slice(2), url: "", active: true },
          ])
        }
      >
        Neuer Webhook
      </button>

      {hooks.map((h) => (
        <div key={h.id} className="hook-item">
          <input
            value={h.url}
            onChange={(e) =>
              setHooks((prev) =>
                prev.map((x) =>
                  x.id === h.id ? { ...x, url: e.target.value } : x
                )
              )
            }
          />
          <button
            onClick={() =>
              setHooks((prev) =>
                prev.map((x) =>
                  x.id === h.id ? { ...x, active: !x.active } : x
                )
              )
            }
          >
            {h.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      ))}
    </div>
  );
}
