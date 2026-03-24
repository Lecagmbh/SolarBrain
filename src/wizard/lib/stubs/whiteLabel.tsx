/**
 * WhiteLabel Context Stubs for Wizard
 * Local version of contexts/WhiteLabelContext
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface WhiteLabelConfig {
  enabled: boolean;
  companyName: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
}

interface WhiteLabelContextType {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  isWhiteLabel: boolean;
  isLoading: boolean;
  config: WhiteLabelConfig | null;
}

const defaultContext: WhiteLabelContextType = {
  brandName: 'Baunity',
  logoUrl: null,
  primaryColor: '#D4A843',
  accentColor: '#10b981',
  isWhiteLabel: false,
  isLoading: false,
  config: null,
};

const WhiteLabelContext = createContext<WhiteLabelContextType>(defaultContext);

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  // In the wizard, white label is not used
  return (
    <WhiteLabelContext.Provider value={defaultContext}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel(): WhiteLabelContextType {
  return useContext(WhiteLabelContext);
}

export default WhiteLabelContext;
