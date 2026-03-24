/**
 * Utility Functions - OHNE externe Dependencies
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function isValidPLZ(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\/\(\)]/g, '');
  return /^(\+49|0049|0)[1-9]\d{6,12}$/.test(cleaned);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getBundeslandFromPLZ(plz: string): string {
  const p = parseInt(plz.substring(0, 2));
  if (p >= 1 && p <= 9) return 'Sachsen';
  if (p >= 10 && p <= 16) return 'Brandenburg';
  if (p >= 17 && p <= 19) return 'Mecklenburg-Vorpommern';
  if (p >= 20 && p <= 21) return 'Hamburg';
  if (p >= 22 && p <= 25) return 'Schleswig-Holstein';
  if (p >= 26 && p <= 27) return 'Niedersachsen';
  if (p >= 28 && p <= 28) return 'Bremen';
  if (p >= 29 && p <= 31) return 'Niedersachsen';
  if (p >= 32 && p <= 33) return 'Nordrhein-Westfalen';
  if (p >= 34 && p <= 36) return 'Hessen';
  if (p >= 37 && p <= 37) return 'Niedersachsen';
  if (p >= 38 && p <= 39) return 'Sachsen-Anhalt';
  if (p >= 40 && p <= 51) return 'Nordrhein-Westfalen';
  if (p >= 52 && p <= 53) return 'Nordrhein-Westfalen';
  if (p >= 54 && p <= 56) return 'Rheinland-Pfalz';
  if (p >= 57 && p <= 59) return 'Nordrhein-Westfalen';
  if (p >= 60 && p <= 65) return 'Hessen';
  if (p >= 66 && p <= 66) return 'Saarland';
  if (p >= 67 && p <= 67) return 'Rheinland-Pfalz';
  if (p >= 68 && p <= 69) return 'Baden-Württemberg';
  if (p >= 70 && p <= 76) return 'Baden-Württemberg';
  if (p >= 77 && p <= 79) return 'Baden-Württemberg';
  if (p >= 80 && p <= 87) return 'Bayern';
  if (p >= 88 && p <= 89) return 'Baden-Württemberg';
  if (p >= 90 && p <= 97) return 'Bayern';
  if (p >= 98 && p <= 99) return 'Thüringen';
  return '';
}
