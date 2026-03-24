/**
 * DETAIL VIEW 3D WRAPPER - Data Fetching Layer
 * =============================================
 * Fetches installation data and renders DetailView3D
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DetailView3D } from "./DetailView3D";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Background3D } from "./Background3D";
import "./DetailView3D.css";

interface DetailView3DWrapperProps {
  installationId: number;
  onClose: () => void;
}

// API function - Route is mounted at /api/installations
async function fetchInstallationDetail(id: number) {
  const res = await fetch(`/api/installations/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const json = await res.json();
  // API returns { data: {...} }, extract the data
  return json.data;
}

export function DetailView3DWrapper({ installationId, onClose }: DetailView3DWrapperProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["installation-detail-3d", installationId],
    queryFn: () => fetchInstallationDetail(installationId),
    staleTime: 30000,
  });

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/installations/${installationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ["installation-detail-3d", installationId] });
      queryClient.invalidateQueries({ queryKey: ["installations"] });
    } catch (err) {
      console.error("Status change failed:", err);
    }
  };

  const handleCreateInvoice = () => {
    // Navigate to invoice creation or open modal
    window.open(`/rechnungen/neu?installation=${installationId}`, "_blank");
  };

  // Loading state with 3D background
  if (isLoading) {
    return (
      <motion.div
        className="dv3d-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Background3D statusColor="#3b82f6" />
        <div className="dv3d-loading">
          <motion.div
            className="dv3d-loading__spinner"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 size={48} />
          </motion.div>
          <p className="dv3d-loading__text">Lade Details...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <motion.div
        className="dv3d-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Background3D statusColor="#ef4444" />
        <div className="dv3d-error">
          <p>Fehler beim Laden der Daten</p>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>{error?.message || "Keine Daten"}</p>
          <button className="dv3d-btn dv3d-btn--outline" onClick={onClose}>
            Zurück
          </button>
        </div>
      </motion.div>
    );
  }

  // Transform API data to component format
  const installationDetail = {
    id: data.id,
    publicId: data.publicId,
    customerName: data.customerName || "Unbekannt",
    customerType: data.customerType,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    strasse: data.strasse,
    hausNr: data.hausNr,
    plz: data.plz,
    ort: data.ort,
    status: data.status,
    statusLabel: data.statusLabel,
    gridOperator: data.gridOperator,
    nbCaseNumber: data.nbCaseNumber,
    nbPortalUrl: data.nbPortalUrl,
    nbEingereichtAm: data.nbEingereichtAm,
    nbGenehmigungAm: data.nbGenehmigungAm,
    // Technische Daten
    totalKwp: data.totalKwp,
    speicherKwh: data.speicherKwh,
    wallboxKw: data.wallboxKw,
    waermepumpeKw: data.waermepumpeKw,
    messkonzept: data.messkonzept,
    // Detaillierte Komponenten
    technicalDetails: data.technicalDetails,
    daysAtNb: data.daysAtNb,
    daysOld: data.daysOld,
    isBilled: data.isBilled,
    zaehlerwechselDatum: data.zaehlerwechselDatum,
    documents: data.documents,
    communications: data.communications?.map((c: any) => ({
      date: new Date(c.date || c.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      subject: c.subject || "E-Mail",
      preview: c.preview || c.snippet || "",
    })),
  };

  return (
    <DetailView3D
      installation={installationDetail}
      onClose={onClose}
      onStatusChange={handleStatusChange}
      onCreateInvoice={handleCreateInvoice}
    />
  );
}

export default DetailView3DWrapper;
