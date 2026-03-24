/**
 * Pure text parser for Zählerwechsel-Termine.
 *
 * Extracts Name, Datum, Uhrzeit from each line.
 * NO database access, NO API calls, NO installation matching.
 *
 * Supported formats:
 *   "Benjamin Lenert 09.03.2026 11:30"
 *   "Daniel Bautz 10.03.2026 11:30"
 *   "Lay Thomas 16.03.26 15:30"
 *   "Müller, Max 15.03.2026 08:30"
 *   "Schmidt Anna | 16.03.2026 | 10:00"
 */

import { parseDateDE, parseTime } from './dateHelpers';

export interface ParseResult {
  customerName: string;
  datum: string;   // YYYY-MM-DD
  uhrzeit: string; // HH:MM
}

/**
 * Normalize a line: strip invisible Unicode chars, URLs, normalize whitespace,
 * remove carriage returns. This makes the parser robust against copy-paste
 * from email clients, Excel, PDFs etc.
 */
function normalizeLine(raw: string): string {
  return raw
    // Remove zero-width chars (ZWSP, ZWNJ, ZWJ, BOM, word joiner, etc.)
    .replace(/[\u200B\u200C\u200D\uFEFF\u2060\u00AD]/g, '')
    // Remove directional marks (LRM, RLM, LRE, RLE, PDF, LRO, RLO, LRI, RLI, FSI, PDI)
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    // Remove URLs (https://..., http://...) — they are never part of a name/date/time
    .replace(/https?:\/\/\S+/gi, '')
    // Normalize Unicode look-alike punctuation to ASCII equivalents
    .replace(/[\uFF0E\u2024\u2027\u00B7]/g, '.')  // full-width dot, one dot leader, middle dot
    .replace(/[\uFF1A\u2236\uFE55]/g, ':')         // full-width colon, ratio, small colon
    // Normalize Unicode digits (full-width ０-９) to ASCII 0-9
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30))
    // Replace ALL unicode whitespace (NBSP, en-space, em-space, etc.) with regular space
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    // Collapse multiple spaces/tabs into one
    .replace(/[ \t]+/g, ' ')
    // Remove carriage return
    .replace(/\r/g, '')
    .trim();
}

/**
 * Clean and normalize a customer name
 */
function cleanName(raw: string): string {
  return raw
    .replace(/[,;|–\-_]+\s*$/, '')  // trailing separators
    .replace(/^\s*[,;|–\-_]+/, '')   // leading separators
    .replace(/\s+/g, ' ')
    .trim();
}

// Date pattern: DD.MM.YYYY or DD.MM.YY (also with spaces around dots: "09. 03. 2026")
const DATE_PATTERN = /(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{4}|\d{2})/;
// Time pattern: H:MM or HH:MM (also with space around colon)
const TIME_PATTERN = /(\d{1,2})\s*:\s*(\d{2})/;

/**
 * Parse a single line into a Termin.
 * Strategy: find date and time anywhere in the line, everything else is the name.
 * Returns null only if no valid date+time can be found.
 */
export function parseTerminLine(line: string): ParseResult | null {
  const normalized = normalizeLine(line);
  if (!normalized || normalized.length < 5) return null;

  // Find date anywhere in line
  const dateMatch = normalized.match(DATE_PATTERN);
  if (!dateMatch) {
    console.warn('[TerminParser] No date found in:', JSON.stringify(normalized),
      'charCodes:', [...normalized].map(c => c.charCodeAt(0)));
    return null;
  }

  // Build date string from captured groups (handles spaces around dots)
  const dateStr = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
  const datum = parseDateDE(dateStr);
  if (!datum) {
    console.warn('[TerminParser] parseDateDE failed for:', dateStr);
    return null;
  }

  // Find time anywhere in line (search AFTER the date to avoid false matches)
  const afterDate = normalized.slice(dateMatch.index! + dateMatch[0].length);
  const beforeDate = normalized.slice(0, dateMatch.index!);
  const timeMatch = afterDate.match(TIME_PATTERN) || beforeDate.match(TIME_PATTERN);
  if (!timeMatch) {
    console.warn('[TerminParser] No time found in:', JSON.stringify(normalized));
    return null;
  }

  const timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
  const uhrzeit = parseTime(timeStr);
  if (!uhrzeit) {
    console.warn('[TerminParser] parseTime failed for:', timeStr);
    return null;
  }

  // Name = everything that's not date, time, or noise words
  // Remove the full date+time match (including any surrounding spaces)
  let nameRaw = normalized
    .replace(DATE_PATTERN, ' ')
    .replace(TIME_PATTERN, ' ')
    .replace(/\b(uhr|termin|zw|zaehlerwechsel|zählerwechsel)\b/gi, '')
    .replace(/[|;–]/g, ' ')
    .trim();

  // Handle "Nachname, Vorname" → keep as-is (just clean separators)
  const customerName = cleanName(nameRaw);
  if (!customerName || customerName.length < 2) {
    console.warn('[TerminParser] Name too short after cleanup:', JSON.stringify(customerName), 'from:', JSON.stringify(nameRaw));
    return null;
  }

  return { customerName, datum, uhrzeit };
}

/**
 * Parse multiple lines of text into Termine.
 * Returns { termine, errors } where errors contains lines that could not be parsed.
 */
export function parseTerminLines(text: string): {
  termine: ParseResult[];
  errors: string[];
} {
  // Split on any kind of line break (Unix, Windows, old Mac)
  const lines = text
    .split(/\r\n|\n|\r/)
    .map(l => normalizeLine(l))
    .filter(l => l.length > 0);

  console.info('[TerminParser] Parsing', lines.length, 'lines from input length', text.length);

  const termine: ParseResult[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const result = parseTerminLine(line);
    if (result) {
      termine.push(result);
    } else {
      // Only report as error if line looks like it should be data (not headers/separators)
      const isHeader = /^(name|datum|zeit|uhrzeit|termin|nr|#|\-{3,}|={3,})/i.test(line);
      if (!isHeader && line.length > 3) {
        errors.push(line);
      }
    }
  }

  console.info('[TerminParser] Result:', termine.length, 'parsed,', errors.length, 'errors');

  return { termine, errors };
}
