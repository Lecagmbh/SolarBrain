// ═══════════════════════════════════════════════════════════════════════════
// WIZARD PAGE - Bridge to new location
// ═══════════════════════════════════════════════════════════════════════════

import React, { Suspense, lazy } from 'react';

// Direkt WizardMain importieren, NICHT über Next.js WizardPage wrapper
const WizardMain = lazy(() => import("../../wizard/components/wizard/WizardMain"));

const WizardPageComponent: React.FC = () => {
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

export default WizardPageComponent;
export { WizardPageComponent as WizardPage };
