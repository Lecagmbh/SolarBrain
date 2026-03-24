import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function LayoutShell() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: "var(--sidebar-width)" }}>
        <Outlet />
      </main>
    </div>
  );
}
