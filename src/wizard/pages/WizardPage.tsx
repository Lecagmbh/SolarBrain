import { lazy, Suspense } from 'react';

const WizardMain = lazy(() => import('../components/wizard/WizardMain'));

const Loader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#060b18',
    color: '#fff'
  }}>
    <div>Lade Wizard...</div>
  </div>
);

export default function WizardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <WizardMain />
    </Suspense>
  );
}

export { WizardPage };
