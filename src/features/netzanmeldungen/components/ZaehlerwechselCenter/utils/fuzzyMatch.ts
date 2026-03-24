/**
 * Client-side fuzzy matching with Dice coefficient + token overlap
 */

/** Normalize German umlauts and special chars */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/** Generate bigrams from a string */
function bigrams(str: string): Set<string> {
  const s = str.replace(/\s+/g, '');
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    result.add(s.substring(i, i + 2));
  }
  return result;
}

/** Dice coefficient: 2 * |A ∩ B| / (|A| + |B|) */
function diceCoefficient(a: string, b: string): number {
  const biA = bigrams(normalize(a));
  const biB = bigrams(normalize(b));
  if (biA.size === 0 && biB.size === 0) return 1;
  if (biA.size === 0 || biB.size === 0) return 0;

  let intersection = 0;
  for (const bi of biA) {
    if (biB.has(bi)) intersection++;
  }

  return (2 * intersection) / (biA.size + biB.size);
}

/** Token overlap: how many tokens from query appear in target */
function tokenOverlap(query: string, target: string): number {
  const qTokens = normalize(query).split(/\s+/).filter(Boolean);
  const tTokens = normalize(target).split(/\s+/).filter(Boolean);
  if (qTokens.length === 0) return 0;

  let matches = 0;
  for (const qt of qTokens) {
    if (tTokens.some(tt => tt.includes(qt) || qt.includes(tt))) {
      matches++;
    }
  }
  return matches / qTokens.length;
}

/** Prefix match: check if query starts like target or vice versa */
function prefixMatch(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (t.startsWith(q) || q.startsWith(t)) return 1;

  // Check first token
  const qFirst = q.split(/\s+/)[0];
  const tFirst = t.split(/\s+/)[0];
  if (tFirst.startsWith(qFirst) || qFirst.startsWith(tFirst)) return 0.5;

  return 0;
}

export interface FuzzyCandidate {
  id: number;
  name: string;
  [key: string]: any;
}

export interface FuzzyResult {
  candidate: FuzzyCandidate;
  score: number;
}

/**
 * Find best matches for a name against a list of candidates.
 * Scoring: Dice 60% + TokenOverlap 20% + Prefix 20%
 */
export function fuzzyMatch(
  query: string,
  candidates: FuzzyCandidate[],
  topN = 5,
  minScore = 0.3
): FuzzyResult[] {
  if (!query.trim()) return [];

  const results: FuzzyResult[] = [];

  for (const candidate of candidates) {
    const dice = diceCoefficient(query, candidate.name);
    const token = tokenOverlap(query, candidate.name);
    const prefix = prefixMatch(query, candidate.name);

    const score = dice * 0.6 + token * 0.2 + prefix * 0.2;

    if (score >= minScore) {
      results.push({ candidate, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}
