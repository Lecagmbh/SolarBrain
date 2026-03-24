export function SystemDashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Systemstatus</h1>

      <div className="sys-grid">
        <div className="sys-card">
          <h3>E-Mail Engine</h3>
          <p>Letzte Mail: n/a</p>
        </div>

        <div className="sys-card">
          <h3>Automation Engine</h3>
          <p>Letzter Lauf: n/a</p>
        </div>

        <div className="sys-card">
          <h3>Dokumenten-KI</h3>
          <p>Analysezeit: n/a</p>
        </div>

        <div className="sys-card">
          <h3>Worker</h3>
          <p>Aktive Tasks: n/a</p>
        </div>
      </div>
    </div>
  );
}
