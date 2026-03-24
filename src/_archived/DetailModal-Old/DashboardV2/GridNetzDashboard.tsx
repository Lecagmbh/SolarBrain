import './BaunityDashboard.css';
import { T } from './styles';
import { useCopyToClipboard } from './hooks/useCopyToClipboard';
import { useDashboardData } from './hooks/useDashboardData';
import { TopBar } from './sections/TopBar';
import { AlertBar } from './sections/AlertBar';
import { LeftColumn } from './columns/LeftColumn';
import { CenterColumn } from './columns/CenterColumn';
import { RightColumn } from './columns/RightColumn';
import type { Installation } from './types';

interface BaunityDashboardProps {
  data: Installation;
  onStatusChange: (status: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onTabChange?: (tab: string) => void;
  onOpenUploadModal?: () => void;
  onOpenEmail?: (emailId: number) => void;
}

export function BaunityDashboard({
  data, onStatusChange, showToast, onTabChange, onOpenUploadModal, onOpenEmail
}: BaunityDashboardProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const {
    wizardData, emails, emailsLoading, alerts, alertsLoading,
    openAlert, openRueckfrageEmail, dedicatedEmail
  } = useDashboardData(data);

  return (
    <div className="gnz-dashboard" style={{
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      background: T.bg,
      color: T.t1,
      fontSize: 13,
      lineHeight: 1.5,
      fontFamily: T.font,
      isolation: 'isolate',
    }}>
      <TopBar data={data} onOpenUploadModal={onOpenUploadModal} onStatusChange={onStatusChange} />
      <AlertBar
        openAlert={openAlert}
        openRueckfrageEmail={openRueckfrageEmail}
        onOpenEmail={onOpenEmail}
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: '360px 1fr 280px',
        gap: 0,
        flex: '1 1 0%',
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <LeftColumn
          data={data}
          wizardData={wizardData}
          onCopy={copy}
          isCopied={isCopied}
          showToast={showToast}
        />
        <CenterColumn
          data={data}
          wizardData={wizardData}
          emails={emails}
          emailsLoading={emailsLoading}
          dedicatedEmail={dedicatedEmail}
          onCopy={copy}
          isCopied={isCopied}
          onOpenEmail={onOpenEmail}
          showToast={showToast}
        />
        <RightColumn
          data={data}
          wizardData={wizardData}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}
