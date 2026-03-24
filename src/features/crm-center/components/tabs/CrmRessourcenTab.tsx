import { useState, useEffect } from "react";
import { C, cardStyle, badgeStyle } from "../../crm.styles";
import { api } from "../../../../modules/api/client";

interface OrgUser { id: number; name: string; email: string; systemRole: string; crmRole: string }

export default function CrmRessourcenTab() {
  const [users, setUsers] = useState<OrgUser[]>([]);

  useEffect(() => {
    api.get("/crm/organisation/1/users").then(r => setUsers(r.data || [])).catch(() => {
      // Fallback: show empty state
    });
  }, []);

  return (
    <div className="crm-fade">
      <div style={{ fontSize: 22, fontWeight: 800, color: C.textBright, marginBottom: 16 }}>Ressourcen & Verfügbarkeiten</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {users.length > 0 ? users.map(u => (
          <div key={u.id} style={{ ...cardStyle, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textBright }}>{u.name || u.email}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{u.crmRole}</div>
              </div>
              <span style={badgeStyle(C.greenBg, C.green)}>Verfügbar</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginBottom: 4 }}>
                <span>Auslastung</span>
                <span style={{ fontWeight: 700, color: C.green }}>—</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99 }}>
                <div style={{ width: "0%", height: "100%", borderRadius: 99, background: C.green }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>Rolle: {u.systemRole}</div>
          </div>
        )) : (
          // Static placeholder
          ["Christian Z. — Admin", "Izabela Z. — Sales", "Hartmut B. — EFK"].map((name, i) => (
            <div key={i} style={{ ...cardStyle, padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.textBright, marginBottom: 4 }}>{name.split(" — ")[0]}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{name.split(" — ")[1]}</div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99, marginBottom: 6 }}>
                <div style={{ width: `${[87, 62, 45][i]}%`, height: "100%", borderRadius: 99, background: [C.red, C.yellow, C.green][i] }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted }}>
                <span>Auslastung</span>
                <span style={{ fontWeight: 700, color: [C.red, C.yellow, C.green][i] }}>{[87, 62, 45][i]}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
