import type { PolishLetter } from '../data/alphabet'
import { POLISH_ALPHABET } from '../data/alphabet'
import { POLISH_DIGRAPHS } from '../data/digraphs'

/** Extra phonetic neighbours when confusedWith alone is too short */
const ALPHABET_NEIGHBOURS: Record<string, string[]> = {
  a: ['ą', 'o', 'e'],
  b: ['p', 'd', 'f'],
  f: ['w', 'h', 'p'],
  g: ['k', 'h', 'ch'],
  j: ['i', 'y', 'ć'],
  k: ['g', 'c', 'ch'],
  m: ['n', 'ń'],
  p: ['b', 't', 'f'],
  r: ['l', 'ż', 'rz'],
  t: ['d', 'c', 'cz'],
  h: ['ch', 'k', 'f'],
}

const DIGRAPH_NEIGHBOURS: Record<string, string[]> = {
  ch: ['h', 'sz', 'cz'],
  cz: ['ć', 'sz', 'dż'],
  dz: ['c', 'dź', 'dż'],
  'dź': ['ć', 'dz', 'dż'],
  'dż': ['cz', 'ż', 'dz'],
  rz: ['ż', 'sz', 'ź'],
  sz: ['ś', 'cz', 'ch'],
}

function unitsForModule(moduleId: string): PolishLetter[] {
  return moduleId === 'digraphs' ? POLISH_DIGRAPHS : POLISH_ALPHABET
}

function neighboursFor(moduleId: string, id: string): string[] {
  const map = moduleId === 'digraphs' ? DIGRAPH_NEIGHBOURS : ALPHABET_NEIGHBOURS
  return map[id] ?? []
}

/** Unit ids that sound or look confusable with the target */
export function similarUnitIds(moduleId: string, unit: PolishLetter): Set<string> {
  return new Set([...(unit.confusedWith ?? []), ...neighboursFor(moduleId, unit.id)])
}

/**
 * Score how good a word is as a distractor for unit→word exercises.
 * Higher = contains similar (but not identical) graphemes — good for beginners.
 */
export function scoreWordAsDistractor(
  graphemes: string[],
  targetUnit: PolishLetter,
  moduleId: string,
  getUnit: (id: string) => PolishLetter | undefined,
): number {
  const similarIds = similarUnitIds(moduleId, targetUnit)
  let bestMatch = 0
  let matchCount = 0

  for (const g of graphemes) {
    if (g === targetUnit.id) continue
    if (!similarIds.has(g)) continue
    const neighbour = getUnit(g)
    if (!neighbour) continue
    bestMatch = Math.max(bestMatch, similarityScore(targetUnit, neighbour))
    matchCount++
  }

  if (matchCount === 0) return 0
  // One clear neighbour grapheme is ideal; too many similar letters gets confusing
  const countBonus = matchCount === 1 ? 25 : matchCount === 2 ? 10 : -10
  return bestMatch + countBonus
}

/** Rank how similar two units are (higher = more confusable) */
export function similarityScore(a: PolishLetter, b: PolishLetter): number {
  if (a.id === b.id) return 100
  let score = 0
  if (a.confusedWith?.includes(b.id)) score += 50
  if (b.confusedWith?.includes(a.id)) score += 30
  if (a.englishLabel === b.englishLabel) score += 40
  if (a.ipa === b.ipa) score += 35
  if (a.category === b.category && a.category !== 'digraph') score += 5
  // Soft/hard pairs
  const softHard: [string, string][] = [
    ['ć', 'cz'], ['ś', 'sz'], ['ź', 'ż'], ['ń', 'n'], ['dź', 'dż'], ['c', 'dz'],
  ]
  for (const [x, y] of softHard) {
    if ((a.id === x && b.id === y) || (a.id === y && b.id === x)) score += 45
  }
  return score
}

/** Pick `count` distractors prioritising similar/confusable units */
export function pickSimilarUnits(
  moduleId: string,
  correct: PolishLetter,
  count: number,
): PolishLetter[] {
  return pickSimilarUnitsUnique(moduleId, correct, count, (u) => u.id)
}

function pickSimilarUnitsUnique(
  moduleId: string,
  correct: PolishLetter,
  count: number,
  uniqueKey: (unit: PolishLetter) => string,
): PolishLetter[] {
  const all = unitsForModule(moduleId).filter((u) => u.id !== correct.id)

  const priorityIds = new Set<string>([
    ...(correct.confusedWith ?? []),
    ...neighboursFor(moduleId, correct.id),
  ])

  const ranked = all
    .map((u) => ({
      unit: u,
      score:
        similarityScore(correct, u) +
        (priorityIds.has(u.id) ? 25 : 0),
    }))
    .sort((a, b) => b.score - a.score)

  const picked: PolishLetter[] = []
  const usedIds = new Set<string>()
  const usedKeys = new Set<string>([uniqueKey(correct)])

  for (const { unit, score } of ranked) {
    if (picked.length >= count) break
    if (score < 10 && picked.length >= Math.min(2, count)) continue
    const key = uniqueKey(unit)
    if (!usedIds.has(unit.id) && !usedKeys.has(key)) {
      picked.push(unit)
      usedIds.add(unit.id)
      usedKeys.add(key)
    }
  }

  for (const { unit } of ranked) {
    if (picked.length >= count) break
    const key = uniqueKey(unit)
    if (!usedIds.has(unit.id) && !usedKeys.has(key)) {
      picked.push(unit)
      usedIds.add(unit.id)
      usedKeys.add(key)
    }
  }

  return picked.slice(0, count)
}

export function pickSimilarLabels(
  moduleId: string,
  correct: PolishLetter,
  count: number,
): { label: string; unitId: string }[] {
  return pickSimilarUnitsUnique(moduleId, correct, count, (u) => u.englishLabel).map((u) => ({
    label: u.englishLabel,
    unitId: u.id,
  }))
}
