// src/features/nb-portal/forms/DynamicFormPage.tsx
/**
 * Dynamic Form Page
 * =================
 * Full page wrapper for the dynamic form with header, progress, and navigation
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import { useDynamicFormStore } from './store/dynamicFormStore';
import { getFormDefinition, submitFormData, saveFormDraft } from '../nbPortalApi';

interface LocationState {
  produktTitle?: string;
  installationId?: number;
  variant?: string;
}

export function DynamicFormPage() {
  const { portalId, typeId } = useParams<{ portalId: string; typeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const {
    definition,
    values,
    errors,
    touched,
    uploadedFiles,
    loading,
    submitting,
    loadError,
    submitError,
    currentGroupIndex,
    setDefinition,
    setContext,
    setValue,
    setTouched,
    setLoading,
    setSubmitting,
    setLoadError,
    setSubmitError,
    nextGroup,
    prevGroup,
    validateGroup,
    validateAll,
    setAllTouched,
    setErrors,
    reset
  } = useDynamicFormStore();

  // Load form definition on mount
  useEffect(() => {
    if (!portalId || !typeId) {
      setLoadError('Ungültige Parameter');
      return;
    }

    setContext(portalId, typeId);
    setLoading(true);
    setLoadError(null);

    getFormDefinition(portalId, typeId)
      .then(def => {
        setDefinition(def);
      })
      .catch(err => {
        console.error('Failed to load form:', err);
        setLoadError('Formular konnte nicht geladen werden');
      })
      .finally(() => setLoading(false));

    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [portalId, typeId]);

  // Handle navigation to next group
  const handleNext = () => {
    const validation = validateGroup(currentGroupIndex);
    if (!validation.valid) {
      // Touch all fields to show errors
      definition?.groups[currentGroupIndex].components.forEach(c => {
        setTouched(c.key);
      });
      setErrors(validation.errors);
      return;
    }
    nextGroup();
    // Auto-save draft in background when proceeding to next step
    handleSaveDraft();
  };

  // Handle saving draft
  const handleSaveDraft = async () => {
    if (!portalId || !typeId) return;

    try {
      const result = await saveFormDraft(portalId, typeId, values, {
        installationId: locationState?.installationId,
        variant: locationState?.variant,
      });
      if (result.success) {
        // Draft saved successfully
      }
    } catch (err) {
      // Draft save is best-effort, don't block the user
      console.warn('Failed to save draft:', err);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!portalId || !typeId) return;

    // Validate all groups
    const validation = validateAll();
    if (!validation.valid) {
      setAllTouched();
      setErrors(validation.errors);
      // Navigate to first group with error
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey && definition) {
        const groupIndex = definition.groups.findIndex(g =>
          g.components.some(c => c.key === firstErrorKey)
        );
        if (groupIndex >= 0) {
          useDynamicFormStore.getState().goToGroup(groupIndex);
        }
      }
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitFormData(portalId, typeId, values, {
        installationId: locationState?.installationId,
        variant: locationState?.variant,
      });
      if (result.success) {
        // Navigate to success or netzanmeldungen
        navigate('/netzanmeldungen', {
          state: { successMessage: 'Formular erfolgreich übermittelt' }
        });
      } else {
        setSubmitError(result.message || 'Fehler beim Absenden');
        if (result.errors) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach(e => {
            errorMap[e.field] = e.message;
          });
          setErrors(errorMap);
        }
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/nb-portal/${portalId}`);
  };

  const productTitle = locationState?.produktTitle || definition?.productName?.de || typeId || 'Formular';
  const totalGroups = definition?.groups.length || 1;
  const isLastGroup = currentGroupIndex === totalGroups - 1;
  const progress = ((currentGroupIndex + 1) / totalGroups) * 100;

  // Loading state
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.centerContent}>
          <Loader2 style={{ ...styles.spinner, animation: 'spin 1s linear infinite' }} />
          <span style={styles.loadingText}>Formular wird geladen...</span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div style={styles.page}>
        <div style={styles.centerContent}>
          <AlertCircle style={styles.errorIcon} />
          <h2 style={styles.errorTitle}>Fehler</h2>
          <p style={styles.errorText}>{loadError}</p>
          <button onClick={handleBack} style={styles.errorButton}>
            Zurück zur Auswahl
          </button>
        </div>
      </div>
    );
  }

  if (!definition) return null;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            <button onClick={handleBack} style={styles.backButton}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <p style={styles.headerLabel}>NB-Portal · {portalId}</p>
              <h1 style={styles.headerTitle}>{productTitle}</h1>
            </div>
          </div>

          {/* Progress */}
          <div style={styles.progressContainer}>
            <span style={styles.progressText}>
              Schritt {currentGroupIndex + 1} von {totalGroups}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressBarContainer}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.formContainer}>
          {/* Submit Error */}
          {submitError && (
            <div style={styles.submitError}>
              <AlertCircle size={18} />
              <span>{submitError}</span>
            </div>
          )}

          {/* Form Renderer */}
          <DynamicFormRenderer
            definition={definition}
            currentGroupIndex={currentGroupIndex}
            values={values}
            errors={errors}
            touched={touched}
            uploadedFiles={uploadedFiles}
            portalId={portalId!}
            productId={typeId!}
            onValueChange={setValue}
            onTouched={setTouched}
          />

          {/* Navigation Buttons */}
          <div style={styles.navigation}>
            <button
              onClick={prevGroup}
              disabled={currentGroupIndex === 0}
              style={{
                ...styles.navButton,
                ...(currentGroupIndex === 0 ? styles.navButtonDisabled : {})
              }}
            >
              <ChevronLeft size={18} />
              <span>Zurück</span>
            </button>

            {isLastGroup ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={styles.submitButton}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Wird gesendet...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Absenden</span>
                  </>
                )}
              </button>
            ) : (
              <button onClick={handleNext} style={styles.nextButton}>
                <span>Weiter</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>Daten werden sicher an {portalId} übermittelt</span>
        <span>Powered by Baunity</span>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #374151',
  },

  headerInner: {
    maxWidth: '48rem',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },

  backButton: {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },

  headerTitle: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
  },

  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  progressText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
  },

  progressBarContainer: {
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#a855f7',
    transition: 'width 0.3s ease',
  },

  // Main
  main: {
    flex: 1,
    padding: '2rem 1.5rem',
  },

  formContainer: {
    maxWidth: '48rem',
    margin: '0 auto',
  },

  submitError: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '0.75rem',
    marginBottom: '1.5rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },

  // Navigation
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },

  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  nextButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#7c3aed',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#ffffff',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Footer
  footer: {
    borderTop: '1px solid #374151',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6b7280',
  },

  // Loading/Error states
  centerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    textAlign: 'center',
    padding: '2rem',
  },

  spinner: {
    width: '2.5rem',
    height: '2.5rem',
    color: '#a855f7',
  },

  loadingText: {
    color: '#9ca3af',
    fontSize: '0.875rem',
  },

  errorIcon: {
    width: '3rem',
    height: '3rem',
    color: '#ef4444',
  },

  errorTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
  },

  errorText: {
    color: '#9ca3af',
    margin: 0,
  },

  errorButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#7c3aed',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#ffffff',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default DynamicFormPage;
