/**
 * LECA Enterprise Mobile - Theme System
 * Mit WhiteLabel Support
 */

// Default LECA Theme
const defaultTheme = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  
  secondary: '#3B82F6',
  secondaryDark: '#2563EB',
  
  accent: '#F59E0B',
  
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  background: '#09090B',
  backgroundSecondary: '#18181B',
  backgroundTertiary: '#27272A',
  
  surface: '#18181B',
  surfaceElevated: '#27272A',
  
  border: '#27272A',
  borderLight: '#3F3F46',
  
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#09090B',
  
  // Semantic Colors
  colors: {
    primary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
    },
    accent: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    success: {
      50: '#F0FDF4',
      500: '#22C55E',
      600: '#16A34A',
    },
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      600: '#D97706',
    },
    error: {
      50: '#FEF2F2',
      500: '#EF4444',
      600: '#DC2626',
    },
    info: {
      50: '#EFF6FF',
      500: '#3B82F6',
      600: '#2563EB',
    },
  },
  
  // Typography
  typography: {
    h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

// WhiteLabel Theme Override
let currentTheme = { ...defaultTheme };

export const applyWhiteLabel = (config) => {
  if (!config) return;
  
  try {
    const parsed = typeof config === 'string' ? JSON.parse(config) : config;
    
    if (parsed.primaryColor) {
      currentTheme.primary = parsed.primaryColor;
      currentTheme.primaryDark = adjustBrightness(parsed.primaryColor, -20);
      currentTheme.primaryLight = adjustBrightness(parsed.primaryColor, 20);
    }
    
    if (parsed.secondaryColor) {
      currentTheme.secondary = parsed.secondaryColor;
      currentTheme.secondaryDark = adjustBrightness(parsed.secondaryColor, -20);
    }
    
    if (parsed.backgroundColor) {
      currentTheme.background = parsed.backgroundColor;
    }
    
    // WhiteLabel theme applied
  } catch (e) {
    console.error('[Theme] WhiteLabel parse error:', e);
  }
};

export const resetTheme = () => {
  currentTheme = { ...defaultTheme };
};

// Helper to adjust color brightness
const adjustBrightness = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

// Status Colors & Labels (Vereinfachter Workflow)
export const STATUS_CONFIG = {
  EINGANG: { color: '#3B82F6', label: 'Eingang', icon: 'flash-outline' },
  BEIM_NB: { color: '#F59E0B', label: 'Beim NB', icon: 'time-outline' },
  RUECKFRAGE: { color: '#EF4444', label: 'Rückfrage', icon: 'alert-circle-outline' },
  GENEHMIGT: { color: '#22C55E', label: 'Genehmigt', icon: 'checkmark-circle-outline' },
  IBN: { color: '#8B5CF6', label: 'IBN', icon: 'clipboard-outline' },
  FERTIG: { color: '#10B981', label: 'Fertig', icon: 'checkmark-done-outline' },
  STORNIERT: { color: '#6B7280', label: 'Storniert', icon: 'ban-outline' },
};

export const getStatusConfig = (status) => {
  const normalized = String(status || '').toUpperCase().replace(/ /g, '_');
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.EINGANG;
};

// Anlagentyp Config
export const ANLAGENTYP_CONFIG = {
  PV: { icon: 'sunny-outline', label: 'PV-Anlage', color: '#F59E0B' },
  SPEICHER: { icon: 'battery-charging-outline', label: 'Speicher', color: '#22C55E' },
  WALLBOX: { icon: 'car-outline', label: 'Wallbox', color: '#3B82F6' },
  WAERMEPUMPE: { icon: 'thermometer-outline', label: 'Wärmepumpe', color: '#EF4444' },
  KOMBI: { icon: 'layers-outline', label: 'Kombi-Anlage', color: '#8B5CF6' },
};

export const getAnlagentypConfig = (typ) => {
  const normalized = String(typ || '').toUpperCase();
  return ANLAGENTYP_CONFIG[normalized] || ANLAGENTYP_CONFIG.PV;
};

// Document Categories
export const DOCUMENT_CATEGORIES = {
  LAGEPLAN: { icon: 'map-outline', label: 'Lageplan', color: '#3B82F6' },
  SCHALTPLAN: { icon: 'git-network-outline', label: 'Schaltplan', color: '#8B5CF6' },
  DATENBLATT: { icon: 'document-text-outline', label: 'Datenblatt', color: '#22C55E' },
  VOLLMACHT: { icon: 'person-outline', label: 'Vollmacht', color: '#F59E0B' },
  RECHNUNG: { icon: 'receipt-outline', label: 'Rechnung', color: '#EF4444' },
  ANTRAG: { icon: 'clipboard-outline', label: 'Antrag', color: '#06B6D4' },
  KORRESPONDENZ: { icon: 'mail-outline', label: 'Korrespondenz', color: '#71717A' },
  SONSTIGE: { icon: 'folder-outline', label: 'Sonstige', color: '#A1A1AA' },
};

export default currentTheme;
