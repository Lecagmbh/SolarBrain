// components/AnnouncementPopup/AnnouncementPopup.tsx
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wrench, Clock, Info, AlertTriangle, ChevronLeft, ChevronRight, Check, Rocket } from 'lucide-react';
import { adminCenterApi } from '../../api/admin-center.api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  version?: string;
  type: 'UPDATE' | 'BUGFIX' | 'MAINTENANCE' | 'INFO' | 'WARNING' | 'BREAKING';
  priority: string;
  createdBy: { name: string };
  createdAt: string;
}

interface AnnouncementPopupProps {
  onClose: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
  },
  modal: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '24px',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  header: {
    position: 'relative' as const,
    padding: '1.5rem',
    borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconBox: {
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #EAD068 0%, #7c3aed 100%)',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '0.25rem 0 0',
  },
  closeBtn: {
    padding: '0.5rem',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  body: {
    padding: '1.5rem',
    maxHeight: '50vh',
    overflowY: 'auto' as const,
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: '1rem',
    lineHeight: 1.3,
  },
  content: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    lineHeight: 1.7,
  },
  section: {
    marginTop: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.375rem 0',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  bullet: {
    color: '#EAD068',
    marginTop: '0.125rem',
  },
  meta: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(71, 85, 105, 0.3)',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(71, 85, 105, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#475569',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dotActive: {
    width: '24px',
    borderRadius: '4px',
    background: '#EAD068',
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1rem',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.25rem',
    background: 'linear-gradient(135deg, #EAD068 0%, #7c3aed 100%)',
    border: 'none',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
};

const typeConfig: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
  UPDATE: { icon: Sparkles, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', label: 'Update' },
  BUGFIX: { icon: Wrench, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', label: 'Bugfix' },
  MAINTENANCE: { icon: Clock, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Wartung' },
  INFO: { icon: Info, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', label: 'Info' },
  WARNING: { icon: AlertTriangle, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', label: 'Warnung' },
  BREAKING: { icon: AlertTriangle, color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', label: 'Breaking' },
};

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminCenterApi.getUnreadAnnouncements();
        setAnnouncements(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClose = async () => {
    if (announcements.length > 0) {
      try {
        await adminCenterApi.markAllAsRead(announcements.map(a => a.id));
      } catch (e) {
        console.error(e);
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    return (
      <div>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          // Section header (emoji + title)
          if (trimmed.match(/^[📊⚡📄🏷️📧🎉–]/)) {
            return <div key={idx} style={{ ...styles.sectionTitle, marginTop: idx > 0 ? '1.25rem' : '0' }}>{trimmed}</div>;
          }
          // Regular content line
          return (
            <div key={idx} style={styles.listItem}>
              <span style={styles.bullet}>•</span>
              <span>{trimmed}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const cfg = typeConfig[current.type] || typeConfig.INFO;
  const TypeIcon = cfg.icon;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <div style={styles.iconBox}>
                <Rocket size={24} color="white" />
              </div>
              <div>
                <h2 style={styles.headerTitle}>Was gibt's Neues?</h2>
                <p style={styles.headerSubtitle}>
                  {announcements.length} Update{announcements.length > 1 ? 's' : ''} verfügbar
                </p>
              </div>
            </div>
            <button 
              style={styles.closeBtn} 
              onClick={handleClose}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.5)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Badges */}
          <div style={styles.badges}>
            <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
              <TypeIcon size={14} />
              {cfg.label}
            </span>
            {current.version && (
              <span style={{ ...styles.badge, background: 'rgba(139, 92, 246, 0.15)', color: '#f0d878' }}>
                {current.version}
              </span>
            )}
            {current.priority === 'URGENT' && (
              <span style={{ ...styles.badge, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                Wichtig
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={styles.title}>{current.title}</h3>

          {/* Content */}
          <div style={styles.content}>
            {renderContent(current.content)}
          </div>

          {/* Meta */}
          <div style={styles.meta}>
            {new Date(current.createdAt).toLocaleDateString('de-DE', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })} • von {current.createdBy.name}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {/* Dots */}
          {announcements.length > 1 ? (
            <div style={styles.dots}>
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    ...styles.dot,
                    ...(idx === currentIndex ? styles.dotActive : {}),
                  }}
                />
              ))}
            </div>
          ) : (
            <div />
          )}

          {/* Buttons */}
          <div style={styles.buttons}>
            {announcements.length > 1 && currentIndex > 0 && (
              <button 
                style={styles.btnSecondary} 
                onClick={handlePrev}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(71, 85, 105, 0.3)';
                  e.currentTarget.style.color = '#f8fafc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <ChevronLeft size={16} />
                Zurück
              </button>
            )}
            <button 
              style={styles.btnPrimary} 
              onClick={handleNext}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {currentIndex < announcements.length - 1 ? (
                <>Weiter <ChevronRight size={16} /></>
              ) : (
                <><Check size={16} /> Verstanden</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useAnnouncementPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await adminCenterApi.getUnreadAnnouncements();
        if (a.length > 0) setTimeout(() => setShowPopup(true), 500);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return {
    showPopup,
    closePopup: () => setShowPopup(false),
    AnnouncementPopup: showPopup ? <AnnouncementPopup onClose={() => setShowPopup(false)} /> : null,
  };
};

export default AnnouncementPopup;
