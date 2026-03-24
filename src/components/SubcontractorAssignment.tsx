/**
 * Baunity - Subunternehmer-Zuweisung Komponente
 * ==========================================
 * Ermöglicht die Zuweisung von Installationen an Subunternehmer
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccessToken } from '../modules/auth/tokenStorage';

interface Subcontractor {
  id: number;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  assignedCount: number;
}

interface SubcontractorAssignmentProps {
  installationId: number;
  currentAssignedToId?: number | null;
  currentAssignedToName?: string | null;
  onAssigned?: (subcontractorId: number | null, name: string | null) => void;
  compact?: boolean;
}

export const SubcontractorAssignment: React.FC<SubcontractorAssignmentProps> = ({
  installationId,
  currentAssignedToId,
  currentAssignedToName,
  onAssigned,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedId, setAssignedId] = useState<number | null>(currentAssignedToId || null);
  const [assignedName, setAssignedName] = useState<string | null>(currentAssignedToName || null);

  // Subunternehmer laden
  useEffect(() => {
    if (isOpen && subcontractors.length === 0) {
      loadSubcontractors();
    }
  }, [isOpen]);

  const loadSubcontractors = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const res = await fetch('/api/subcontractors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubcontractors(data || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Subunternehmer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (subcontractorId: number | null) => {
    try {
      setLoading(true);
      const token = getAccessToken();
      await fetch('/api/subcontractors/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          installationId,
          subcontractorId,
        }),
      });

      const sub = subcontractors.find(s => s.id === subcontractorId);
      setAssignedId(subcontractorId);
      setAssignedName(sub?.name || null);
      onAssigned?.(subcontractorId, sub?.name || null);
      setIsOpen(false);
    } catch (err) {
      console.error('Fehler beim Zuweisen:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubcontractors = subcontractors.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (compact) {
    return (
      <div className="sub-assign-compact">
        <button
          className={`sub-assign-btn ${assignedId ? 'assigned' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          {assignedId ? (
            <>
              <span className="sub-assign-icon">👷</span>
              <span className="sub-assign-name">{assignedName}</span>
            </>
          ) : (
            <>
              <span className="sub-assign-icon">➕</span>
              <span>Zuweisen</span>
            </>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <SubcontractorModal
              subcontractors={filteredSubcontractors}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              currentAssignedId={assignedId}
              onSelect={handleAssign}
              onClose={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>

        <style>{compactStyles}</style>
      </div>
    );
  }

  return (
    <div className="sub-assign">
      <div className="sub-assign-header">
        <h4>Subunternehmer</h4>
        {assignedId && (
          <button className="sub-assign-remove" onClick={() => handleAssign(null)}>
            Zuweisung entfernen
          </button>
        )}
      </div>

      {assignedId ? (
        <div className="sub-assign-current" onClick={() => setIsOpen(true)}>
          <div className="sub-assign-avatar">👷</div>
          <div className="sub-assign-info">
            <span className="sub-assign-name">{assignedName}</span>
            <span className="sub-assign-hint">Klicken zum Ändern</span>
          </div>
          <span className="sub-assign-badge">Zugewiesen</span>
        </div>
      ) : (
        <button className="sub-assign-add" onClick={() => setIsOpen(true)}>
          <span>➕</span>
          Subunternehmer zuweisen
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <SubcontractorModal
            subcontractors={filteredSubcontractors}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentAssignedId={assignedId}
            onSelect={handleAssign}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <style>{fullStyles}</style>
    </div>
  );
};

// Modal Komponente
interface SubcontractorModalProps {
  subcontractors: Subcontractor[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentAssignedId: number | null;
  onSelect: (id: number | null) => void;
  onClose: () => void;
}

const SubcontractorModal: React.FC<SubcontractorModalProps> = ({
  subcontractors,
  loading,
  searchTerm,
  setSearchTerm,
  currentAssignedId,
  onSelect,
  onClose,
}) => (
  <motion.div
    className="sub-modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="sub-modal"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sub-modal-header">
        <h3>Subunternehmer zuweisen</h3>
        <button className="sub-modal-close" onClick={onClose}>×</button>
      </div>

      <div className="sub-modal-search">
        <input
          type="text"
          placeholder="Suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="sub-modal-list">
        {loading ? (
          <div className="sub-modal-loading">Lade...</div>
        ) : subcontractors.length === 0 ? (
          <div className="sub-modal-empty">
            Keine Subunternehmer gefunden
          </div>
        ) : (
          <>
            {currentAssignedId && (
              <button
                className="sub-modal-item sub-modal-item--remove"
                onClick={() => onSelect(null)}
              >
                <span className="sub-modal-item-icon">🚫</span>
                <div className="sub-modal-item-info">
                  <span className="sub-modal-item-name">Zuweisung entfernen</span>
                </div>
              </button>
            )}
            {subcontractors.map((sub) => (
              <button
                key={sub.id}
                className={`sub-modal-item ${currentAssignedId === sub.id ? 'selected' : ''}`}
                onClick={() => onSelect(sub.id)}
              >
                <span className="sub-modal-item-icon">👷</span>
                <div className="sub-modal-item-info">
                  <span className="sub-modal-item-name">{sub.name}</span>
                  <span className="sub-modal-item-meta">
                    {sub.companyName && `${sub.companyName} • `}
                    {sub.email}
                  </span>
                </div>
                {currentAssignedId === sub.id && (
                  <span className="sub-modal-item-check">✓</span>
                )}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="sub-modal-footer">
        <p>⚠️ Subunternehmer erhalten keine automatischen E-Mails</p>
      </div>
    </motion.div>
  </motion.div>
);

const compactStyles = `
  .sub-assign-compact {
    display: inline-block;
  }
  
  .sub-assign-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(212, 168, 67, 0.1);
    border: 1px solid rgba(212, 168, 67, 0.3);
    border-radius: 8px;
    color: #EAD068;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .sub-assign-btn:hover {
    background: rgba(212, 168, 67, 0.2);
    border-color: rgba(212, 168, 67, 0.5);
  }
  
  .sub-assign-btn.assigned {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #6ee7b7;
  }
`;

const fullStyles = `
  .sub-assign {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
  }
  
  .sub-assign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .sub-assign-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .sub-assign-remove {
    background: none;
    border: none;
    color: #f87171;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
  }
  
  .sub-assign-remove:hover {
    background: rgba(248, 113, 113, 0.1);
  }
  
  .sub-assign-current {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .sub-assign-current:hover {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.5);
  }
  
  .sub-assign-avatar {
    width: 40px;
    height: 40px;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  
  .sub-assign-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .sub-assign-name {
    font-weight: 600;
    color: #f8fafc;
  }
  
  .sub-assign-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .sub-assign-badge {
    padding: 4px 10px;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #6ee7b7;
  }
  
  .sub-assign-add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: rgba(212, 168, 67, 0.1);
    border: 1px dashed rgba(212, 168, 67, 0.4);
    border-radius: 10px;
    color: #a5b4fc;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .sub-assign-add:hover {
    background: rgba(212, 168, 67, 0.15);
    border-style: solid;
  }
  
  /* Modal */
  .sub-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .sub-modal {
    width: 100%;
    max-width: 480px;
    max-height: 80vh;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .sub-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sub-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .sub-modal-close {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: #f8fafc;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .sub-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .sub-modal-search {
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .sub-modal-search input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 14px;
  }
  
  .sub-modal-search input:focus {
    outline: none;
    border-color: rgba(212, 168, 67, 0.5);
  }
  
  .sub-modal-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  
  .sub-modal-loading,
  .sub-modal-empty {
    padding: 40px 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
  }
  
  .sub-modal-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  
  .sub-modal-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .sub-modal-item.selected {
    background: rgba(212, 168, 67, 0.1);
    border-color: rgba(212, 168, 67, 0.3);
  }
  
  .sub-modal-item--remove {
    margin-bottom: 8px;
    border-color: rgba(248, 113, 113, 0.2);
  }
  
  .sub-modal-item--remove:hover {
    background: rgba(248, 113, 113, 0.1);
  }
  
  .sub-modal-item-icon {
    font-size: 24px;
  }
  
  .sub-modal-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  
  .sub-modal-item-name {
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sub-modal-item-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sub-modal-item-count {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .sub-modal-item-check {
    width: 24px;
    height: 24px;
    background: #D4A843;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
  }
  
  .sub-modal-footer {
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(245, 158, 11, 0.05);
  }
  
  .sub-modal-footer p {
    margin: 0;
    font-size: 12px;
    color: #fbbf24;
    text-align: center;
  }
`;

export default SubcontractorAssignment;
