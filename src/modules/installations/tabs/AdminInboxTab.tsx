import { useGlobalEmailStore } from "../context/GlobalEmailStore";

export function AdminInboxTab() {
  const { unassignedCount } = useGlobalEmailStore();

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin-Inbox</h2>
      <p>
        Unzugeordnete NB-Mails:{" "}
        <strong>{unassignedCount}</strong>
      </p>
      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
        Dieses Tab wird später mit der vollständigen Admin-Inbox
        und Matching-Engine gefüllt.
      </p>
    </div>
  );
}

export default AdminInboxTab;
