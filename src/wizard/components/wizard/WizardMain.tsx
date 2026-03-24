/**
 * Baunity Lead-Erfassung Main - Redesign V3
 * ===================================
 * 3-Column Layout: Left Sidebar + Content + Right Sidebar
 * Horizontale Step-Navigation
 * Vollständige Breite nutzen
 */

// CSS Imports
import '../../wizard.css';
import '../../styles/variables.css';
import '../../styles/wizard-redesign.css';

// Helper um Object-Rendering-Fehler zu vermeiden
const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('message' in (value as object)) return String((value as { message: unknown }).message);
    return '';
  }
  return String(value);
};

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../stores/wizardStore';
import { STEP_CONFIG } from '../../types/wizard.types';
import { analyzeWizardComplete, getNextRelevantStep, getPrevRelevantStep, calculateProgress } from '../../lib/intelligence';
// Original GridNetz steps (unused)
// import { Step1Kategorie, Step2Standort, Step3Eigentuemer, Step6Kunde, Step7Dokumente, Step8Abschluss } from './steps';
// import { Step4Netzbetreiber } from './step4';
// import { Step5Technik } from './step5';

// D2D Steps
import { D2DStep1, D2DStep2, D2DStep3, D2DStep4, D2DStep5, D2DStep6, D2DStep7, D2DStep8 } from './d2d-steps';
import { WizardInlineSuggestions } from './WizardInlineSuggestions';
import { UploadStatusNotification } from './UploadStatusNotification';
import { LeftSidebar, RightSidebar } from './sidebars';
import { wizardApi, netzbetreiberApi } from '../../lib/api';
import { useWhiteLabel } from '../../lib/stubs/whiteLabel';
import { useStepValidation, useCanProceed } from '../../hooks/useValidation';
import { useVisibleSteps, useVisibleStepIndex } from '../../hooks/useVisibleSteps';
import { useUploadStore } from '../../stores/uploadStore';
import { AdminModePanel } from './admin';

// Admin User Type
interface AdminSelectedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  kundeId: number | null;
  kundeName: string | null;
}

const STEPS = [
  D2DStep1,  // Kunde
  D2DStep2,  // Standort
  D2DStep3,  // Verbrauch
  D2DStep4,  // Dach
  D2DStep5,  // Technik
  D2DStep6,  // Extras
  D2DStep7,  // Ergebnis
  D2DStep8,  // Abschluss
];

// Helper: Prüft ob User Admin oder Mitarbeiter ist
const checkIsAdmin = (): boolean => {
  try {
    // 1. Prüfe JWT Token (primäre Methode) - gridnetz_token
    const tokenKeys = ['baunity_token', 'baunity_access_token', 'token', 'accessToken', 'access_token'];
    for (const tokenKey of tokenKeys) {
      const token = localStorage.getItem(tokenKey);
      if (token && token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const role = (payload.role || '').toUpperCase();
            console.log(`[Admin Check] Token ${tokenKey}: role=${role}`);
            if (role === 'ADMIN' || role === 'MITARBEITER') {
              console.log('[Admin Check] ✓ Admin/Mitarbeiter erkannt via JWT');
              return true;
            }
          }
        } catch (e) {
          // Token nicht decodierbar, weiter prüfen
        }
      }
    }

    // 2. Prüfe gridnetz_user (falls User-Objekt gespeichert)
    const userStr = localStorage.getItem('baunity_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = (user.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'MITARBEITER') {
          console.log('[Admin Check] ✓ Admin/Mitarbeiter erkannt via gridnetz_user');
          return true;
        }
      } catch {}
    }

    // 3. Prüfe weitere mögliche User-Speicherorte
    for (const key of ['auth', 'user', 'authState', 'baunity_auth']) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const role = (parsed.role || parsed.user?.role || '').toUpperCase();
          if (role === 'ADMIN' || role === 'MITARBEITER') {
            console.log(`[Admin Check] ✓ Admin/Mitarbeiter erkannt via ${key}`);
            return true;
          }
        } catch {}
      }
    }

    console.log('[Admin Check] ✗ Kein Admin/Mitarbeiter erkannt');
  } catch (e) {
    console.warn('[Admin Check] Error:', e);
  }
  return false;
};

export const WizardMain: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; publicId?: string; error?: string; createdFor?: { name: string; email: string } } | null>(null);
  const { data, currentStep, maxReachedStep, goToStep, resetWizard, checkUserMatch } = useWizardStore();

  // Admin Mode
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSelectedUser, setAdminSelectedUser] = useState<AdminSelectedUser | null>(null);
  const [adminPanelCollapsed, setAdminPanelCollapsed] = useState(false);

  // WhiteLabel
  const { brandName, logoUrl, isWhiteLabel } = useWhiteLabel();
  const wizardTitle = isWhiteLabel ? `${brandName} Wizard` : 'Baunity Lead-Erfassung';

  // Upload Store
  const resetUploadStore = useUploadStore(state => state.reset);

  // User-Check und Auto-Reset beim Mount
  useEffect(() => {
    checkUserMatch();

    // Admin-Check
    setIsAdmin(checkIsAdmin());

    const submitSuccess = localStorage.getItem('wizard_submit_success');
    if (submitSuccess === 'true') {
      localStorage.removeItem('wizard_submit_success');
      localStorage.removeItem('wizard_pending_upload');
      resetWizard();
      resetUploadStore();
      setAdminSelectedUser(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Session-Keepalive: Alle 5 Minuten pingen, damit Session nicht abläuft
  useEffect(() => {
    const KEEPALIVE_INTERVAL = 5 * 60 * 1000;
    const keepalive = window.setInterval(async () => {
      try {
        await fetch('/api/auth/me', { credentials: 'include' });
      } catch {
        // Netzwerkfehler ignorieren
      }
    }, KEEPALIVE_INTERVAL);
    return () => window.clearInterval(keepalive);
  }, []);

  const analysis = useMemo(() => analyzeWizardComplete(data, currentStep), [data, currentStep]);
  const progress = useMemo(() => calculateProgress(data, currentStep), [data, currentStep]);

  // Submit Handler
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      if (data.step4.netzbetreiberManuell === 'true' && data.step4.netzbetreiberName) {
        netzbetreiberApi.syncFromWizard(data.step4.netzbetreiberName, data.step2.plz, true)
          .catch(e => console.warn('NB Sync failed:', e));
      }

      let result;

      // Admin-Modus: Anlage für anderen User erstellen
      if (isAdmin && adminSelectedUser) {
        result = await wizardApi.submitForUser(data, adminSelectedUser.id);
      } else {
        result = await wizardApi.submitWithoutDocs(data);
      }

      if (result.success) {
        setSubmitResult({
          success: true,
          publicId: result.publicId,
          createdFor: adminSelectedUser ? {
            name: adminSelectedUser.name,
            email: adminSelectedUser.email,
          } : undefined,
        });

        localStorage.setItem('wizard_submit_success', 'true');
        localStorage.setItem('wizard_pending_upload', JSON.stringify({
          installationId: result.id,
          publicId: result.publicId,
          timestamp: Date.now(),
        }));

        wizardApi.uploadDocumentsBackground(result.id, data, result.publicId);

      } else {
        setSubmitResult({ success: false, error: 'Fehler beim Erstellen' });
      }
    } catch (error: any) {
      console.error('Submit failed:', error);
      let errorMessage = error.message || 'Ein Fehler ist aufgetreten.';
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Nicht autorisiert. Bitte melden Sie sich erneut an.';
      }
      if (error.message?.includes('403')) {
        errorMessage = 'Keine Berechtigung für diese Aktion.';
      }
      setSubmitResult({ success: false, error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }, [data, isSubmitting, isAdmin, adminSelectedUser]);

  // Navigation
  const handleNext = () => {
    if (!canProceed) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    if (currentStep === 1) {
      if (data.step1.kategorie) {
        goToStep(getNextRelevantStep(data, currentStep));
      }
      return;
    }
    goToStep(getNextRelevantStep(data, currentStep));
  };

  const handlePrev = () => goToStep(getPrevRelevantStep(data, currentStep));

  // Validation
  const stepValidation = useStepValidation(currentStep);
  const { canProceed, reason: validationReason } = useCanProceed(currentStep);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Visible Steps
  const visibleSteps = useVisibleSteps();
  const { index: currentStepIndex, total: totalSteps } = useVisibleStepIndex(currentStep);

  // ========== ERROR SCREEN ==========
  if (submitResult && !submitResult.success) {
    return (
      <div className="wizard-redesign">
        <div className="wizard-result-screen">
          <motion.div
            className="wizard-result-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            ❌
          </motion.div>
          <motion.h1
            className="wizard-result-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Fehler beim Erstellen
          </motion.h1>
          <motion.p
            className="wizard-result-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Es ist ein Fehler aufgetreten.
          </motion.p>

          <motion.div
            className="wizard-result-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="wizard-result-error-title">
              <span>⚠️</span>
              <span>Fehlerdetails</span>
            </div>
            <p className="wizard-result-error-text">
              {submitResult.error || 'Unbekannter Fehler'}
            </p>
          </motion.div>

          <motion.div
            className="wizard-result-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setSubmitResult(null)}
              className="wizard-btn wizard-btn-secondary"
            >
              ← Zurück zum Formular
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="wizard-btn wizard-btn-success"
            >
              {isSubmitting ? '⏳ Wird erneut versucht...' : '🔄 Erneut versuchen'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ========== SUCCESS SCREEN ==========
  if (submitResult?.success) {
    return (
      <div className="wizard-redesign">
        <div className="wizard-result-screen">
          <motion.div
            className="wizard-result-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            🎉
          </motion.div>
          <motion.h1
            className="wizard-result-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Lead erstellt!
          </motion.h1>
          <motion.p
            className="wizard-result-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {submitResult.createdFor
              ? `Der Lead wurde für ${submitResult.createdFor.name} erstellt.`
              : 'Ihr Lead wurde erfolgreich erstellt.'}
          </motion.p>

          {submitResult.createdFor && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '20px' }}>👤</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#a5b4fc' }}>
                  {submitResult.createdFor.name}
                </div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>
                  {submitResult.createdFor.email}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="wizard-result-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Interne Nr.: {submitResult.publicId}
          </motion.div>

          <motion.div
            className="wizard-result-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>📄</span>
            <span>Dokumente werden im Hintergrund generiert und hochgeladen.</span>
          </motion.div>

          <motion.div
            className="wizard-result-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="wizard-btn wizard-btn-success"
            >
              Zum Dashboard
            </button>
          </motion.div>
        </div>
        <UploadStatusNotification />
      </div>
    );
  }

  // ========== LOADING SCREEN ==========
  if (loading) {
    return (
      <div className="wizard-loading">
        <motion.div
          className="wizard-loading-logo"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
        >
          {logoUrl ? <img src={logoUrl} alt={brandName} /> : '⚡'}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {wizardTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Lade Intelligence Engine...
        </motion.p>
        <motion.div
          className="wizard-loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="wizard-loading-progress" />
        </motion.div>
      </div>
    );
  }

  const CurrentStep = STEPS[currentStep - 1];

  // ========== MAIN WIZARD ==========
  return (
    <div className="wizard-redesign">
      {/* Skip Link */}
      <a
        href="#wizard-main-content"
        style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #638bff, #4f7bff)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
          fontWeight: 600,
          zIndex: 9999,
          transition: 'top 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '16px'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-100px'; }}
      >
        Zum Hauptinhalt springen
      </a>

      {/* ========== HEADER ========== */}
      <header className="wizard-header">
        <div className="wizard-header-inner">
          {/* Logo */}
          <div className="wizard-header-logo">
            <motion.div
              className="wizard-header-logo-icon"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {logoUrl ? <img src={logoUrl} alt={brandName} /> : '⚡'}
            </motion.div>
            <div className="wizard-header-logo-text">
              <h1>{wizardTitle}</h1>
              <p className="wizard-header-logo-sub">{analysis.szenarioName}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="wizard-header-progress">
            <div className="wizard-header-progress-bar">
              <motion.div
                className="wizard-header-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="wizard-header-progress-text">{Math.round(progress)}%</span>
          </div>

          {/* Badge */}
          <motion.div
            className="wizard-header-badge"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {analysis.verfahren.typ}
          </motion.div>

          {/* Actions */}
          <div className="wizard-header-actions">
            <button
              className="wizard-header-btn"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* ========== STEP NAVIGATION ========== */}
      <nav className="wizard-nav" aria-label="Wizard Schritte">
        <div className="wizard-nav-inner">
          {visibleSteps.map((step, idx) => {
            const num = step.number;
            const stepConfig = STEP_CONFIG[num - 1];
            const isActive = currentStep === num;
            const isCompleted = currentStepIndex > idx;
            const isAccessible = num <= maxReachedStep;

            return (
              <React.Fragment key={step.number}>
                {idx > 0 && (
                  <div className={`wizard-nav-connector ${isCompleted || currentStepIndex > idx ? 'completed' : ''}`} />
                )}
                <motion.button
                  className={`wizard-nav-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => isAccessible && goToStep(num)}
                  disabled={!isAccessible}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Schritt ${idx + 1} von ${totalSteps}: ${stepConfig.title}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={isAccessible ? { y: -2 } : undefined}
                  whileTap={isAccessible ? { scale: 0.98 } : undefined}
                >
                  <span className="wizard-nav-dot" />
                  <span>{stepConfig.title}</span>
                </motion.button>
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* ========== 3-COLUMN BODY ========== */}
      <div className="wizard-body">
        {/* Left Sidebar */}
        <LeftSidebar progress={progress} />

        {/* Main Content */}
        <main id="wizard-main-content" className="wizard-main" role="main" aria-label="Wizard Formular">
          <div className="wizard-main-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                {/* Admin Mode Panel */}
                {isAdmin && currentStep === 1 && (
                  <AdminModePanel
                    isAdmin={isAdmin}
                    selectedUser={adminSelectedUser}
                    onSelectUser={setAdminSelectedUser}
                    collapsed={adminPanelCollapsed}
                    onToggleCollapse={() => setAdminPanelCollapsed(!adminPanelCollapsed)}
                  />
                )}

                <WizardInlineSuggestions />

                {/* Validation Summary */}
                {showValidationErrors && !stepValidation.isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '12px',
                      marginBottom: '20px',
                    }}
                    role="alert"
                  >
                    <div style={{ fontWeight: 600, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span>⚠️</span>
                      <span>Bitte folgende Felder ausfüllen:</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {stepValidation.errors.map((err, idx) => (
                        <li key={idx} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', padding: '4px 0', paddingLeft: 20, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 6, color: '#f87171' }}>•</span>
                          {safeString(err.message)}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <CurrentStep />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="wizard-footer">
            <motion.div
              className="wizard-footer-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                className="wizard-btn wizard-btn-secondary"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Zurück
              </motion.button>

              {currentStepIndex < totalSteps - 1 ? (
                <div style={{ position: 'relative' }}>
                  <motion.button
                    className="wizard-btn wizard-btn-primary"
                    onClick={handleNext}
                    whileHover={canProceed ? { x: 5 } : undefined}
                    whileTap={canProceed ? { scale: 0.98 } : undefined}
                    style={!canProceed ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    Weiter →
                    <span className="wizard-btn-hint">Enter</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  className="wizard-btn wizard-btn-success"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed}
                  whileHover={canProceed && !isSubmitting ? { scale: 1.02 } : undefined}
                  whileTap={canProceed && !isSubmitting ? { scale: 0.98 } : undefined}
                  style={!canProceed ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  {isSubmitting ? '⏳ Wird erstellt...' : '🚀 Absenden'}
                </motion.button>
              )}
            </motion.div>
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar currentStep={currentStep} />
      </div>

      {/* Upload Status Notification */}
      <UploadStatusNotification />
    </div>
  );
};

export default WizardMain;
