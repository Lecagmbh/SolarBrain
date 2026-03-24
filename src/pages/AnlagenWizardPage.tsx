import React, { Suspense, lazy } from "react";

// Direkt WizardMain importieren, NICHT über Next.js WizardPage wrapper
const WizardMain = lazy(() => import("../wizard/components/wizard/WizardMain"));

const AnlagenWizardPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff'
      }}>
        <div>Lade Wizard...</div>
      </div>
    }>
      <WizardMain />
    </Suspense>
  );
};

export default AnlagenWizardPage;
