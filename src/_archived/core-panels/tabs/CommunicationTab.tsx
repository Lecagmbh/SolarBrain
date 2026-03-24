/**
 * CommunicationTab Wrapper – Passes through to existing KommunikationTab
 */

import { KommunikationTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/KommunikationTab';
import type { InstallationDetail, GridOperator } from '../../../features/netzanmeldungen/types';

interface Props {
  detail: InstallationDetail;
  gridOperator: GridOperator | null;
  installationId: number;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedCommunicationTab(props: Props) {
  return <KommunikationTab {...props} />;
}
