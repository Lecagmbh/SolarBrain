/**
 * KundenDashboard (B2B)
 * =====================
 * Dediziertes Dashboard für KUNDE-Rolle (Solarteure).
 * 2-Spalten Layout auf Desktop, 1-Spalte auf Mobile.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Building,
  AlertTriangle,
  CheckCircle2,
  Plus,
  FileText,
  Receipt,
  MessageSquare,
  ArrowRight,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { PipelineStage, CustomerAnlage, ActivityItem, TerminItem, ActionItem } from '../types';

interface KundenDashboardProps {
  userName?: string;
  pipelineStages: PipelineStage[];
  anlagen: CustomerAnlage[];
  activities: ActivityItem[];
  termine: TerminItem[];
  actionItems: ActionItem[];
  onNewAnmeldung: () => void;
  onStageClick: (stageKey: string) => void;
  onAnlageClick: (anlage: CustomerAnlage) => void;
  isRefreshing: boolean;
}

interface KPICard {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  urgent?: boolean;
}

export function KundenDashboard({
  userName,
  pipelineStages,
  anlagen,
  activities,
  termine,
  actionItems,
  onNewAnmeldung,
  onStageClick,
  onAnlageClick,
  isRefreshing,
}: KundenDashboardProps) {
  const navigate = useNavigate();

  // KPI calculations — Backend pipeline keys: eingang, beim_nb, rueckfrage, genehmigt, ibn, fertig
  const totalAnlagen = pipelineStages.reduce((sum, s) => sum + s.count, 0);
  const beimNB = pipelineStages
    .filter(s => s.key === 'beim_nb')
    .reduce((sum, s) => sum + s.count, 0);
  const rueckfragen = pipelineStages
    .filter(s => s.key === 'rueckfrage')
    .reduce((sum, s) => sum + s.count, 0);
  const genehmigt = pipelineStages
    .filter(s => s.key === 'genehmigt')
    .reduce((sum, s) => sum + s.count, 0);

  const kpis: KPICard[] = [
    { label: 'Gesamt-Anlagen', value: totalAnlagen, icon: Zap, color: '#EAD068', bgColor: 'rgba(212, 168, 67, 0.12)' },
    { label: 'Beim NB', value: beimNB, icon: Building, color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.12)' },
    { label: 'Rückfragen', value: rueckfragen, icon: AlertTriangle, color: '#f87171', bgColor: 'rgba(239, 68, 68, 0.12)', urgent: rueckfragen > 0 },
    { label: 'Genehmigt', value: genehmigt, icon: CheckCircle2, color: '#4ade80', bgColor: 'rgba(34, 197, 94, 0.12)' },
  ];

  const quickActions = [
    { id: 'new', label: 'Neue Anlage', icon: Plus, onClick: onNewAnmeldung, primary: true },
    { id: 'docs', label: 'Dokumente', icon: FileText, onClick: () => navigate('/dokumente') },
    { id: 'invoices', label: 'Rechnungen', icon: Receipt, onClick: () => navigate('/rechnungen') },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, onClick: () => navigate('/whatsapp') },
  ];

  const recentAnlagen = anlagen.slice(0, 5);
  const recentActivities = activities.slice(0, 5);

  return (
    <>
      <div className="kd-dashboard">
        {/* Header */}
        <motion.div
          className="kd-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="kd-title">
              Willkommen{userName ? `, ${userName.split(' ')[0]}` : ''}
            </h1>
            <p className="kd-subtitle">Ihr Anlagen-Überblick</p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="kd-kpis">
          {kpis.map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              className={`kd-kpi-card ${kpi.urgent ? 'kd-kpi-card--urgent' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div className="kd-kpi-icon" style={{ background: kpi.bgColor, color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
              <div className="kd-kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="kd-kpi-label">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Rückfrage Banner — deaktiviert */}

        {/* Two-Column Layout */}
        <div className="kd-columns">
          {/* Left Column */}
          <div className="kd-col-left">
            {/* Pipeline Overview (simplified) */}
            <motion.div
              className="kd-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="kd-card-title">Pipeline</h2>
              <div className="kd-pipeline">
                {pipelineStages.filter(s => s.count > 0).map((stage) => (
                  <button
                    key={stage.key}
                    className="kd-pipeline-item"
                    onClick={() => onStageClick(stage.key)}
                  >
                    <span className="kd-pipeline-count">{stage.count}</span>
                    <span className="kd-pipeline-label">{stage.label}</span>
                  </button>
                ))}
                {pipelineStages.every(s => s.count === 0) && (
                  <p className="kd-empty-text">Noch keine Anlagen in der Pipeline</p>
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className="kd-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h2 className="kd-card-title">Letzte Aktivität</h2>
              <div className="kd-activity-list">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="kd-activity-item"
                    onClick={() => activity.publicId && navigate(`/netzanmeldungen/${activity.publicId}`)}
                  >
                    <div className="kd-activity-dot" />
                    <div className="kd-activity-content">
                      <span className="kd-activity-title">{activity.title}</span>
                      {activity.description && (
                        <span className="kd-activity-desc">{activity.description}</span>
                      )}
                      <span className="kd-activity-time">
                        <Clock size={12} />
                        {new Date(activity.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="kd-empty-text">Noch keine Aktivitäten</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="kd-col-right">
            {/* Quick Actions */}
            <motion.div
              className="kd-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="kd-card-title">Schnellzugriff</h2>
              <div className="kd-quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    className={`kd-quick-btn ${action.primary ? 'kd-quick-btn--primary' : ''}`}
                    onClick={action.onClick}
                  >
                    <action.icon size={18} />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Termine */}
            {termine.length > 0 && (
              <motion.div
                className="kd-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="kd-card-title">Nächste Termine</h2>
                <div className="kd-termine-list">
                  {termine.slice(0, 3).map((termin) => (
                    <div key={termin.id} className="kd-termin-item">
                      <div className="kd-termin-date">
                        {new Date(termin.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="kd-termin-info">
                        <span className="kd-termin-title">{termin.title}</span>
                        {termin.time && <span className="kd-termin-time">{termin.time} Uhr</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* My Anlagen */}
            <motion.div
              className="kd-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="kd-card-header">
                <h2 className="kd-card-title">Meine Anlagen</h2>
                {anlagen.length > 5 && (
                  <button className="kd-link-btn" onClick={() => navigate('/netzanmeldungen')}>
                    Alle anzeigen
                  </button>
                )}
              </div>
              <div className="kd-anlagen-list">
                {recentAnlagen.length > 0 ? recentAnlagen.map((anlage) => (
                  <div
                    key={anlage.id}
                    className="kd-anlage-item"
                    onClick={() => onAnlageClick(anlage)}
                  >
                    <div className="kd-anlage-info">
                      <span className="kd-anlage-standort">{anlage.standort}</span>
                      {anlage.leistung && <span className="kd-anlage-kwp">{anlage.leistung} kWp</span>}
                    </div>
                    <span className={`kd-anlage-status kd-status--${anlage.status.toLowerCase().replace(/[äöü_]/g, c => ({ä:'ae',ö:'oe',ü:'ue',_:'-'}[c] || c))}`}>
                      {anlage.statusLabel}
                    </span>
                  </div>
                )) : (
                  <p className="kd-empty-text">Noch keine Anlagen angelegt</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <style>{kundenDashboardStyles}</style>
    </>
  );
}

const kundenDashboardStyles = `
  .kd-dashboard {
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
    animation: kdFadeIn 0.4s ease;
  }

  @keyframes kdFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Header */
  .kd-header {
    margin-bottom: 28px;
  }

  .kd-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .kd-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);
  }

  /* KPI Cards */
  .kd-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .kd-kpi-card {
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: all 0.2s;
  }

  .kd-kpi-card:hover {
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  .kd-kpi-card--urgent {
    border-color: rgba(239, 68, 68, 0.3);
    animation: kdUrgentPulse 2s ease-in-out infinite;
  }

  @keyframes kdUrgentPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
  }

  .kd-kpi-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kd-kpi-value {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
  }

  .kd-kpi-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    font-weight: 500;
  }

  /* Alert Banner */
  .kd-alert-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04));
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .kd-alert-banner:hover {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.08));
    border-color: rgba(239, 68, 68, 0.4);
  }

  .kd-alert-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f87171;
    flex-shrink: 0;
  }

  .kd-alert-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .kd-alert-text strong {
    font-size: 15px;
    color: #fca5a5;
  }

  .kd-alert-text span {
    font-size: 13px;
    color: rgba(252, 165, 165, 0.7);
  }

  .kd-alert-arrow {
    color: rgba(252, 165, 165, 0.5);
    flex-shrink: 0;
  }

  /* Two-Column Layout */
  .kd-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  /* Cards */
  .kd-card {
    background: rgba(10, 10, 15, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .kd-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .kd-card-title {
    font-size: 16px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 16px;
  }

  .kd-card-header .kd-card-title {
    margin-bottom: 0;
  }

  .kd-link-btn {
    background: none;
    border: none;
    color: #EAD068;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .kd-link-btn:hover {
    background: rgba(212, 168, 67, 0.1);
  }

  .kd-empty-text {
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
    text-align: center;
    padding: 20px 0;
    margin: 0;
  }

  /* Pipeline */
  .kd-pipeline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .kd-pipeline-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }

  .kd-pipeline-item:hover {
    background: rgba(212, 168, 67, 0.1);
    border-color: rgba(212, 168, 67, 0.25);
    color: #fff;
  }

  .kd-pipeline-count {
    font-weight: 700;
    font-size: 16px;
    color: #EAD068;
  }

  .kd-pipeline-label {
    font-weight: 500;
  }

  /* Activity */
  .kd-activity-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .kd-activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    cursor: pointer;
    transition: background 0.15s;
    border-radius: 6px;
    padding: 10px 8px;
  }

  .kd-activity-item:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .kd-activity-item:last-child {
    border-bottom: none;
  }

  .kd-activity-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #D4A843;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .kd-activity-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .kd-activity-title {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .kd-activity-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kd-activity-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
  }

  /* Quick Actions */
  .kd-quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .kd-quick-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }

  .kd-quick-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: #fff;
    transform: translateY(-1px);
  }

  .kd-quick-btn--primary {
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(139, 92, 246, 0.15));
    border-color: rgba(212, 168, 67, 0.3);
    color: #a5b4fc;
  }

  .kd-quick-btn--primary:hover {
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.3), rgba(139, 92, 246, 0.25));
    border-color: rgba(212, 168, 67, 0.5);
    color: #c7d2fe;
  }

  /* Termine */
  .kd-termine-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kd-termin-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 10px;
  }

  .kd-termin-date {
    padding: 6px 10px;
    background: rgba(212, 168, 67, 0.15);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #EAD068;
    white-space: nowrap;
  }

  .kd-termin-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .kd-termin-title {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .kd-termin-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Anlagen List */
  .kd-anlagen-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 16px;
  }

  .kd-anlage-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .kd-anlage-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .kd-anlage-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .kd-anlage-standort {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kd-anlage-kwp {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .kd-anlage-status {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.6);
  }

  .kd-status--genehmigt {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
  }

  .kd-status--fertig {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .kd-status--rueckfrage {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
  }

  .kd-status--beim-nb {
    background: rgba(96, 165, 250, 0.12);
    color: #60a5fa;
  }

  .kd-status--ibn {
    background: rgba(251, 191, 36, 0.12);
    color: #fbbf24;
  }

  .kd-status--eingang {
    background: rgba(148, 163, 184, 0.12);
    color: #94a3b8;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .kd-kpis {
      grid-template-columns: repeat(2, 1fr);
    }

    .kd-columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .kd-dashboard {
      padding: 16px;
    }

    .kd-title {
      font-size: 22px;
    }

    .kd-kpis {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .kd-kpi-card {
      padding: 16px;
    }

    .kd-kpi-value {
      font-size: 24px;
    }

    .kd-quick-actions {
      grid-template-columns: 1fr;
    }

    .kd-card {
      padding: 18px;
    }
  }
`;

export default KundenDashboard;
