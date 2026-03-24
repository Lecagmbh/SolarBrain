/**
 * TechTab Wrapper – Passes through to existing TechTab
 */

import { TechTab as LegacyTechTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/TechTab';
import type { InstallationDetail } from '../../../features/netzanmeldungen/types';

interface Props {
  detail: InstallationDetail;
  onUpdate: (data: Partial<InstallationDetail>) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedTechTab(props: Props) {
  return <LegacyTechTab {...props} />;
}
