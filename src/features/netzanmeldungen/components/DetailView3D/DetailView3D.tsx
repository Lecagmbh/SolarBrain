/**
 * DETAIL VIEW 3D - Immersive Installation Detail
 * ===============================================
 * Three.js background with floating glassmorphism panels
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, MapPin, Phone, Mail, Zap, Battery, Car, Building2,
  Copy, ExternalLink, FileText, Upload, CheckCircle, Circle,
  Clock, Receipt, AlertTriangle, Send, ChevronLeft, Calendar,
  Thermometer, Sun, Gauge, Plug,
  type LucideIcon,
} from "lucide-react";
import { Background3D } from "./Background3D";
import { Timeline3D } from "./Timeline3D";
import "./DetailView3D.css";
import { usePermissions } from "../../../../hooks/usePermissions";

// Types
interface TechnicalComponent {
  id?: string;
  hersteller?: string;
  modell?: string;
  name?: string;
}

interface Dachflaeche extends TechnicalComponent {
  modulHersteller?: string;
  modulModell?: string;
  modulLeistungWp?: number;
  modulAnzahl?: number;
  ausrichtung?: string;
  neigung?: number;
}

interface Wechselrichter extends TechnicalComponent {
  leistungKw?: number;
  anzahl?: number;
}

interface Speicher extends TechnicalComponent {
  kapazitaetKwh?: number;
  kopplung?: 'ac' | 'dc';
  anzahl?: number;
}

interface Wallbox extends TechnicalComponent {
  leistungKw?: number;
  anzahl?: number;
}

interface Waermepumpe extends TechnicalComponent {
  leistungKw?: number;
  anzahl?: number;
}

interface TechnicalDetails {
  messkonzept?: string;
  dachflaechen?: Dachflaeche[];
  wechselrichter?: Wechselrichter[];
  speicher?: Speicher[];
  wallboxen?: Wallbox[];
  waermepumpen?: Waermepumpe[];
}

interface InstallationDetail {
  id: number;
  publicId: string;
  customerName: string;
  customerType?: string;
  contactEmail?: string;
  contactPhone?: string;
  strasse?: string;
  hausNr?: string;
  plz?: string;
  ort?: string;
  status: string;
  statusLabel?: string;
  gridOperator?: string;
  nbCaseNumber?: string;
  nbPortalUrl?: string;
  nbEingereichtAm?: string;
  nbGenehmigungAm?: string;
  totalKwp?: number;
  speicherKwh?: number;
  wallboxKw?: number;
  waermepumpeKw?: number;
  messkonzept?: string;
  technicalDetails?: TechnicalDetails;
  daysAtNb?: number;
  daysOld?: number;
  isBilled?: boolean;
  zaehlerwechselDatum?: string;
  documents?: { name: string; uploaded: boolean; id?: number; url?: string }[];
  communications?: { date: string; subject: string; preview: string }[];
}

interface DetailView3DProps {
  installation: InstallationDetail | null;
  onClose: () => void;
  onStatusChange?: (status: string) => void;
  onCreateInvoice?: () => void;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  eingang: { label: "Eingang", color: "#3b82f6", step: 0 },
  "beim-nb": { label: "Beim NB", color: "#eab308", step: 1 },
  beim_nb: { label: "Beim NB", color: "#eab308", step: 1 },
  rueckfrage: { label: "Rückfrage", color: "#ef4444", step: 1 },
  genehmigt: { label: "Genehmigt", color: "#22c55e", step: 2 },
  ibn: { label: "IBN", color: "#a855f7", step: 3 },
  fertig: { label: "Fertig", color: "#10b981", step: 4 },
  abgerechnet: { label: "Abgerechnet", color: "#f59e0b", step: 5 },
};

// Panel animation variants
const panelVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
};

// Floating Panel Component
function FloatingPanel({
  title,
  icon: Icon,
  children,
  className = "",
  index = 0,
  accentColor = "#3b82f6",
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  index?: number;
  accentColor?: string;
}) {
  return (
    <motion.div
      className={`dv3d-panel ${className}`}
      style={{ "--panel-accent": accentColor } as React.CSSProperties}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: index * 0.1, duration: 0.5 },
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="dv3d-panel__glow" />
      <div className="dv3d-panel__header">
        <Icon size={18} className="dv3d-panel__icon" />
        <h3 className="dv3d-panel__title">{title}</h3>
      </div>
      <div className="dv3d-panel__content">{children}</div>
    </motion.div>
  );
}

// Copyable Field
function CopyableField({ label, value, icon: Icon }: { label?: string; value: string; icon?: LucideIcon }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="dv3d-field dv3d-field--copyable" onClick={handleCopy}>
      {Icon && <Icon size={14} className="dv3d-field__icon" />}
      <span className="dv3d-field__value">{value}</span>
      <button className="dv3d-field__copy">
        {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

// Main Component
export function DetailView3D({ installation, onClose, onStatusChange, onCreateInvoice }: DetailView3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const permissions = usePermissions();

  useEffect(() => {
    if (installation) {
      setIsVisible(true);
    }
  }, [installation]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!installation) return null;

  const statusConfig = STATUS_CONFIG[installation.status] || { label: installation.status, color: "#64748b", step: 0 };
  const address = [installation.strasse, installation.hausNr].filter(Boolean).join(" ");
  const cityLine = [installation.plz, installation.ort].filter(Boolean).join(" ");

  // Mock documents (replace with real data)
  const documents = installation.documents || [
    { name: "Anmeldeformular", uploaded: true },
    { name: "Lageplan", uploaded: true },
    { name: "Modulzertifikat", uploaded: true },
    { name: "Einspeisezusage", uploaded: false },
    { name: "IBN-Protokoll", uploaded: false },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="dv3d-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 3D Background */}
          <Background3D statusColor={statusConfig.color} />

          {/* Close Button */}
          <motion.button
            className="dv3d-close"
            onClick={handleClose}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} />
          </motion.button>

          {/* Content Container */}
          <div className="dv3d-container">
            {/* Header */}
            <motion.div
              className="dv3d-header"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="dv3d-header__id">{installation.publicId}</span>
              <h1 className="dv3d-header__name">{installation.customerName}</h1>
            </motion.div>

            {/* Panels Grid */}
            <div className="dv3d-grid">
              {/* Customer Panel */}
              <FloatingPanel
                title="Kunde"
                icon={User}
                index={0}
                accentColor={statusConfig.color}
                className="dv3d-panel--customer"
              >
                <div className="dv3d-customer">
                  <div className="dv3d-customer__name">{installation.customerName}</div>
                  {installation.customerType && (
                    <span className="dv3d-customer__type">{installation.customerType === 'privat' ? 'Privatkunde' : 'Gewerbe'}</span>
                  )}

                  {address && (
                    <CopyableField icon={MapPin} value={`${address}, ${cityLine}`} />
                  )}

                  {installation.contactPhone && (
                    <CopyableField icon={Phone} value={installation.contactPhone} />
                  )}

                  {installation.contactEmail && (
                    <CopyableField icon={Mail} value={installation.contactEmail} />
                  )}
                </div>
              </FloatingPanel>

              {/* Technical Details Panel */}
              <FloatingPanel
                title="Technische Daten"
                icon={Zap}
                index={1}
                accentColor="#22c55e"
                className="dv3d-panel--tech"
              >
                <div className="dv3d-tech">
                  {/* Messkonzept Badge */}
                  {installation.messkonzept && (
                    <div className="dv3d-tech__messkonzept">
                      <Gauge size={14} />
                      <span>{installation.messkonzept.toUpperCase()}</span>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div className="dv3d-tech__summary">
                    {installation.totalKwp !== undefined && installation.totalKwp > 0 && (
                      <div className="dv3d-tech__stat dv3d-tech__stat--pv">
                        <Sun size={20} />
                        <div className="dv3d-tech__stat-value">{installation.totalKwp.toFixed(1)}</div>
                        <div className="dv3d-tech__stat-unit">kWp</div>
                      </div>
                    )}
                    {installation.speicherKwh !== undefined && installation.speicherKwh > 0 && (
                      <div className="dv3d-tech__stat dv3d-tech__stat--battery">
                        <Battery size={20} />
                        <div className="dv3d-tech__stat-value">{installation.speicherKwh.toFixed(1)}</div>
                        <div className="dv3d-tech__stat-unit">kWh</div>
                      </div>
                    )}
                    {installation.wallboxKw !== undefined && installation.wallboxKw > 0 && (
                      <div className="dv3d-tech__stat dv3d-tech__stat--wallbox">
                        <Car size={20} />
                        <div className="dv3d-tech__stat-value">{installation.wallboxKw.toFixed(1)}</div>
                        <div className="dv3d-tech__stat-unit">kW</div>
                      </div>
                    )}
                    {installation.waermepumpeKw !== undefined && installation.waermepumpeKw > 0 && (
                      <div className="dv3d-tech__stat dv3d-tech__stat--heatpump">
                        <Thermometer size={20} />
                        <div className="dv3d-tech__stat-value">{installation.waermepumpeKw.toFixed(1)}</div>
                        <div className="dv3d-tech__stat-unit">kW</div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Components */}
                  {installation.technicalDetails && (
                    <div className="dv3d-tech__details">
                      {/* PV Modules */}
                      {installation.technicalDetails.dachflaechen && installation.technicalDetails.dachflaechen.length > 0 && (
                        <div className="dv3d-tech__group">
                          <div className="dv3d-tech__group-title"><Sun size={14} /> PV-Module</div>
                          {installation.technicalDetails.dachflaechen.map((dach, i) => (
                            <div key={i} className="dv3d-tech__component">
                              <span className="dv3d-tech__component-name">{dach.name || `Dachfläche ${i + 1}`}</span>
                              <span className="dv3d-tech__component-detail">
                                {dach.modulAnzahl}x {dach.modulHersteller} {dach.modulModell}
                                {dach.modulLeistungWp && ` (${dach.modulLeistungWp}Wp)`}
                              </span>
                              {dach.ausrichtung && (
                                <span className="dv3d-tech__component-meta">
                                  {dach.ausrichtung} / {dach.neigung}°
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inverters */}
                      {installation.technicalDetails.wechselrichter && installation.technicalDetails.wechselrichter.length > 0 && (
                        <div className="dv3d-tech__group">
                          <div className="dv3d-tech__group-title"><Plug size={14} /> Wechselrichter</div>
                          {installation.technicalDetails.wechselrichter.map((wr, i) => (
                            <div key={i} className="dv3d-tech__component">
                              <span className="dv3d-tech__component-name">{wr.hersteller} {wr.modell}</span>
                              {wr.leistungKw && (
                                <span className="dv3d-tech__component-detail">{wr.leistungKw} kW</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Battery Storage */}
                      {installation.technicalDetails.speicher && installation.technicalDetails.speicher.length > 0 && (
                        <div className="dv3d-tech__group">
                          <div className="dv3d-tech__group-title"><Battery size={14} /> Speicher</div>
                          {installation.technicalDetails.speicher.map((sp, i) => (
                            <div key={i} className="dv3d-tech__component">
                              <span className="dv3d-tech__component-name">{sp.hersteller} {sp.modell}</span>
                              <span className="dv3d-tech__component-detail">
                                {sp.kapazitaetKwh} kWh
                                {sp.kopplung && ` (${sp.kopplung.toUpperCase()}-gekoppelt)`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Wallboxes */}
                      {installation.technicalDetails.wallboxen && installation.technicalDetails.wallboxen.length > 0 && (
                        <div className="dv3d-tech__group">
                          <div className="dv3d-tech__group-title"><Car size={14} /> Wallbox</div>
                          {installation.technicalDetails.wallboxen.map((wb, i) => (
                            <div key={i} className="dv3d-tech__component">
                              <span className="dv3d-tech__component-name">{wb.hersteller} {wb.modell}</span>
                              {wb.leistungKw && (
                                <span className="dv3d-tech__component-detail">{wb.leistungKw} kW</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Heat Pumps */}
                      {installation.technicalDetails.waermepumpen && installation.technicalDetails.waermepumpen.length > 0 && (
                        <div className="dv3d-tech__group">
                          <div className="dv3d-tech__group-title"><Thermometer size={14} /> Wärmepumpe</div>
                          {installation.technicalDetails.waermepumpen.map((wp, i) => (
                            <div key={i} className="dv3d-tech__component">
                              <span className="dv3d-tech__component-name">{wp.hersteller} {wp.modell}</span>
                              {wp.leistungKw && (
                                <span className="dv3d-tech__component-detail">{wp.leistungKw} kW</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No data fallback */}
                  {!installation.totalKwp && !installation.speicherKwh && !installation.wallboxKw && !installation.waermepumpeKw && (
                    <div className="dv3d-tech__empty">Keine technischen Daten vorhanden</div>
                  )}
                </div>
              </FloatingPanel>

              {/* Status & Timeline Panel */}
              <FloatingPanel
                title="Status & Timeline"
                icon={Clock}
                index={2}
                accentColor={statusConfig.color}
                className="dv3d-panel--status"
              >
                <Timeline3D currentStep={statusConfig.step} statusColor={statusConfig.color} />

                <div className="dv3d-status">
                  <div className="dv3d-status__current" style={{ color: statusConfig.color }}>
                    <span className="dv3d-status__dot" style={{ background: statusConfig.color }} />
                    {statusConfig.label}
                  </div>

                  <div className="dv3d-status__days">
                    {installation.daysAtNb !== null && installation.daysAtNb !== undefined ? (
                      <>Seit {installation.daysAtNb} Tagen beim NB</>
                    ) : (
                      <>Erstellt vor {installation.daysOld} Tagen</>
                    )}
                  </div>

                  <div className="dv3d-status__actions">
                    {installation.status === "beim-nb" || installation.status === "beim_nb" ? (
                      <>
                        <button
                          className="dv3d-btn dv3d-btn--success"
                          onClick={() => onStatusChange?.("genehmigt")}
                        >
                          <CheckCircle size={14} />
                          Genehmigt
                        </button>
                        <button
                          className="dv3d-btn dv3d-btn--danger"
                          onClick={() => onStatusChange?.("rueckfrage")}
                        >
                          <AlertTriangle size={14} />
                          Rückfrage
                        </button>
                      </>
                    ) : installation.status === "rueckfrage" ? (
                      <button
                        className="dv3d-btn dv3d-btn--primary"
                        onClick={() => onStatusChange?.("beim-nb")}
                      >
                        <Send size={14} />
                        Wieder eingereicht
                      </button>
                    ) : null}
                  </div>

                  {/* Abrechnung - nur für Admin sichtbar */}
                  {permissions.canMarkAsAbgerechnet && (
                    <>
                      <div className="dv3d-divider" />

                      <div className="dv3d-billing">
                        <div className="dv3d-billing__label">Abrechnung</div>
                        {installation.isBilled ? (
                          <div className="dv3d-billing__status dv3d-billing__status--done">
                            <CheckCircle size={14} />
                            Abgerechnet
                          </div>
                        ) : (
                          <>
                            <div className="dv3d-billing__status dv3d-billing__status--pending">
                              <AlertTriangle size={14} />
                              Nicht abgerechnet
                            </div>
                            <button className="dv3d-btn dv3d-btn--gold" onClick={onCreateInvoice}>
                              <Receipt size={14} />
                              Rechnung erstellen
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </FloatingPanel>

              {/* Grid Operator Panel */}
              <FloatingPanel
                title="Netzbetreiber"
                icon={Building2}
                index={3}
                accentColor="#f59e0b"
                className="dv3d-panel--nb"
              >
                <div className="dv3d-nb">
                  <div className="dv3d-nb__name">
                    <Building2 size={18} />
                    {installation.gridOperator || "Nicht zugewiesen"}
                  </div>

                  {installation.nbCaseNumber && (
                    <div className="dv3d-nb__case">
                      <span className="dv3d-nb__case-label">Vorgangsnr:</span>
                      <CopyableField value={installation.nbCaseNumber} />
                    </div>
                  )}

                  {installation.nbEingereichtAm && (
                    <div className="dv3d-nb__date">
                      <Calendar size={14} />
                      Eingereicht: {new Date(installation.nbEingereichtAm).toLocaleDateString("de-DE")}
                    </div>
                  )}

                  {installation.daysAtNb !== null && installation.daysAtNb !== undefined && (
                    <div className="dv3d-nb__wait">
                      <Clock size={14} />
                      Wartezeit: {installation.daysAtNb} Tage
                    </div>
                  )}

                  {installation.nbPortalUrl && (
                    <a
                      href={installation.nbPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dv3d-btn dv3d-btn--outline"
                    >
                      <ExternalLink size={14} />
                      Portal öffnen
                    </a>
                  )}
                </div>
              </FloatingPanel>

              {/* Documents Panel */}
              <FloatingPanel
                title="Dokumente"
                icon={FileText}
                index={4}
                accentColor="#a855f7"
                className="dv3d-panel--docs"
              >
                <div className="dv3d-docs">
                  {documents.map((doc, i) => (
                    <div
                      key={i}
                      className={`dv3d-doc ${doc.uploaded ? "dv3d-doc--done" : ""}`}
                    >
                      {doc.uploaded ? (
                        <CheckCircle size={14} className="dv3d-doc__icon" />
                      ) : (
                        <Circle size={14} className="dv3d-doc__icon" />
                      )}
                      <span className="dv3d-doc__name">{doc.name}</span>
                    </div>
                  ))}

                  <button className="dv3d-btn dv3d-btn--outline dv3d-btn--full">
                    <Upload size={14} />
                    Upload
                  </button>
                </div>
              </FloatingPanel>
            </div>

            {/* Communication Panel (Full Width) */}
            <FloatingPanel
              title="Kommunikation"
              icon={Mail}
              index={5}
              accentColor="#3b82f6"
              className="dv3d-panel--comm"
            >
              <div className="dv3d-comm">
                {installation.communications && installation.communications.length > 0 ? (
                  installation.communications.map((comm, i) => (
                    <div key={i} className="dv3d-comm__item">
                      <span className="dv3d-comm__date">{comm.date}</span>
                      <span className="dv3d-comm__subject">{comm.subject}</span>
                      <span className="dv3d-comm__preview">{comm.preview}</span>
                    </div>
                  ))
                ) : (
                  <div className="dv3d-comm__empty">
                    Keine Kommunikation vorhanden
                  </div>
                )}
              </div>
            </FloatingPanel>

            {/* Back Button */}
            <motion.button
              className="dv3d-back"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ x: -5 }}
            >
              <ChevronLeft size={20} />
              Zurück zur Liste
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DetailView3D;
