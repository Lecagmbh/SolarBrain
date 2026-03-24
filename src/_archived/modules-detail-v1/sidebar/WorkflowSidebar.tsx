
import { useInstallationDetail } from "../context/InstallationDetailContext";
import WorkflowStep from "./WorkflowStep";

import { STATUS_ORDER } from "../logic/statusEngine";


export default function WorkflowSidebar() {
  const { detail } = useInstallationDetail();
  const { updateStatus } = useInstallationDetail();
  

  if (!detail) return null;

  const current = detail.status;

  return (
    <aside
      style={{
        padding: "1rem",
        width: "200px",
        borderLeft: "1px solid rgba(15,23,42,0.9)",
      }}
    >
      {STATUS_ORDER.map((s) => (
        <WorkflowStep
          key={s}
          state={s}
          active={current === s}
          onClick={() => updateStatus(s)}
        />
      ))}
    </aside>
  );
}
