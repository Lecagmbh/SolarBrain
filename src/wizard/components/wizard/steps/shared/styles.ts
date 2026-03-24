/**
 * Wizard Steps - Styles
 * CSS Module Export mit Kompatibilitäts-Layer
 */

import styles from './steps.module.css';

// Re-export des CSS Moduls
export { styles };

// Mapping von alten lw-* Klassen zu neuen CSS Module Klassen
// Für einfachere Migration: cls('step') statt styles.step
export const cls = (...classNames: (string | boolean | undefined | null)[]): string => {
  return classNames
    .filter(Boolean)
    .map(name => {
      if (typeof name !== 'string') return '';
      // Direkter CSS Module Lookup
      return (styles as Record<string, string>)[name] || name;
    })
    .filter(Boolean)
    .join(' ');
};

// Helper für conditional classes: cx({ selected: isSelected, item: true })
export const cx = (classes: Record<string, boolean | undefined | null>): string => {
  return Object.entries(classes)
    .filter(([, value]) => value)
    .map(([key]) => (styles as Record<string, string>)[key] || key)
    .join(' ');
};

// Legacy: injectStyles ist jetzt ein no-op (CSS Module werden automatisch geladen)
export const injectStyles = () => {
  // No-op: CSS Module werden automatisch von Vite geladen
};
