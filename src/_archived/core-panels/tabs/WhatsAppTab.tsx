/**
 * WhatsAppTab Wrapper – Passes through to existing WhatsAppTab
 */

import { WhatsAppTab as LegacyWhatsAppTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/WhatsAppTab';

interface Props {
  installationId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedWhatsAppTab(props: Props) {
  return <LegacyWhatsAppTab {...props} />;
}
