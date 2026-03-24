/**
 * ChatTab Wrapper – Passes through to existing ChatTab
 */

import { ChatTab as LegacyChatTab } from '../../../features/netzanmeldungen/components/DetailPanel/tabs/ChatTab';

interface Props {
  installationId: number;
  showToast: (msg: string, type: 'success' | 'error') => void;
  isKunde?: boolean;
}

export function UnifiedChatTab(props: Props) {
  return <LegacyChatTab {...props} />;
}
