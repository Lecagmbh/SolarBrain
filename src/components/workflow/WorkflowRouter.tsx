// Workflow Router: Feature-Flag-basierter Switch zwischen V1 und V2

import { lazy, Suspense, useState, useEffect } from "react";
import { getAccessToken } from "../../modules/auth/tokenStorage";

const WorkflowPage = lazy(() => import("../../pages/WorkflowPage"));
const WorkflowV2Page = lazy(() => import("../../pages/WorkflowV2Page"));

const Loader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "#64748b", gap: 10 }}>
    <div style={{ width: 20, height: 20, border: "2px solid #334155", borderTopColor: "#D4A843", borderRadius: "50%", animation: "wf2-spin 0.6s linear infinite" }} />
    Workflow lädt...
  </div>
);

export default function WorkflowRouter() {
  const [useV2, setUseV2] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setUseV2(false);
      return;
    }

    fetch("/api/admin/feature-flags/check/workflow_v2_inbox", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUseV2(data.data?.enabled === true))
      .catch(() => setUseV2(false));
  }, []);

  if (useV2 === null) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      {useV2 ? <WorkflowV2Page /> : <WorkflowPage />}
    </Suspense>
  );
}
