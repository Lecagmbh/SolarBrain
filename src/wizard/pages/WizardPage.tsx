'use client';

// Baunity Wizard Page - Entry Point
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with react-router
const WizardMain = dynamic(() => import('../components/wizard/WizardMain'), {
  ssr: false,
  loading: () => (
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
  ),
});

export default function WizardPage() {
  return <WizardMain />;
}

export { WizardPage };
