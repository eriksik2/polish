import { POLISH_ALPHABET } from '../data/alphabet'
import { POLISH_DIGRAPHS } from '../data/digraphs'
import type { PolishLetter } from '../data/alphabet'
import {
  findHighlightIndex,
  graphemeAtIndex,
  highlightToUnitId,
  tokenizeGraphemes,
  wordContainsUnit,
} from '../lib/graphemes'

export interface WordUnitLink {
  unitId: string
  /** Grapheme index in `graphemes` for this unit's example */
  index: number
}

export interface WordEntry {
  id: string
  word: string
  meaning: string
  /** Verified grapheme sequence for this word */
  graphemes: string[]
  /** Which units this word can teach (with highlight position) */
  unitLinks: WordUnitLink[]
  modules: ('alphabet' | 'digraphs')[]
}

export function wordIdFromWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
}

function slugify(word: string): string {
  return wordIdFromWord(word)
}

function moduleForUnit(unitId: string): 'alphabet' | 'digraphs' {
  return POLISH_DIGRAPHS.some((d) => d.id === unitId) ? 'digraphs' : 'alphabet'
}

function buildEntry(
  word: string,
  meaning: string,
  unitId: string,
  highlight: string,
): WordEntry {
  const graphemes = tokenizeGraphemes(word)
  const index = findHighlightIndex(word, highlight)
  const grapheme = graphemeAtIndex(word, index)
  const expectedUnit = highlightToUnitId(highlight)

  if (grapheme !== expectedUnit && grapheme !== unitId && grapheme !== highlight.toLowerCase()) {
    // Allow dzi spelling: grapheme at 0 might be 'dz' but unit is dź
    if (!(unitId === 'dź' && word.toLowerCase().startsWith('dzi'))) {
      throw new Error(
        `Word "${word}": grapheme "${grapheme}" at ${index} does not match unit "${unitId}" (highlight "${highlight}")`,
      )
    }
  }

  if (!wordContainsUnit(word, unitId)) {
    throw new Error(`Word "${word}" does not contain unit "${unitId}"`)
  }

  const id = slugify(word)
  return {
    id,
    word,
    meaning,
    graphemes,
    unitLinks: [{ unitId, index }],
    modules: [moduleForUnit(unitId)],
  }
}

function mergeEntries(entries: WordEntry[]): WordEntry[] {
  const map = new Map<string, WordEntry>()

  for (const e of entries) {
    const existing = map.get(e.id)
    if (!existing) {
      map.set(e.id, { ...e, unitLinks: [...e.unitLinks], modules: [...e.modules] })
      continue
    }
    for (const link of e.unitLinks) {
      if (!existing.unitLinks.some((l) => l.unitId === link.unitId && l.index === link.index)) {
        existing.unitLinks.push(link)
      }
    }
    for (const m of e.modules) {
      if (!existing.modules.includes(m)) existing.modules.push(m)
    }
  }

  return [...map.values()]
}

function tryBuildEntry(
  word: string,
  meaning: string,
  unitId: string,
  highlight: string,
): WordEntry | null {
  try {
    return buildEntry(word, meaning, unitId, highlight)
  } catch {
    return null
  }
}

function buildFromUnits(units: PolishLetter[]): WordEntry[] {
  const raw: WordEntry[] = []
  for (const unit of units) {
    for (const ex of unit.examples) {
      const entry = tryBuildEntry(ex.word, ex.meaning, unit.id, ex.highlight)
      if (entry) raw.push(entry)
    }
  }
  return mergeEntries(raw)
}

/** Curated, verified vocabulary — grapheme sequences checked at build time */
export const WORD_BANK: WordEntry[] = mergeEntries([
  ...buildFromUnits(POLISH_ALPHABET),
  ...buildFromUnits(POLISH_DIGRAPHS),
])

export const WORD_MAP = new Map(WORD_BANK.map((w) => [w.id, w]))

export function getWord(id: string): WordEntry | undefined {
  return WORD_MAP.get(id)
}

export function getWordsForUnit(moduleId: string, unitId: string): WordEntry[] {
  return WORD_BANK.filter(
    (w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs') && w.unitLinks.some((l) => l.unitId === unitId),
  )
}

export function getWordsWithoutUnit(moduleId: string, unitId: string): WordEntry[] {
  return WORD_BANK.filter(
    (w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs') && !wordContainsUnit(w.word, unitId),
  )
}

/** Pick words for unit→word exercise: 1 correct + distractors that do NOT contain the unit */
export function pickWordOptions(
  moduleId: string,
  unitId: string,
  count: number,
): { correct: WordEntry; distractors: WordEntry[] } | null {
  const candidates = getWordsForUnit(moduleId, unitId)
  if (candidates.length === 0) return null

  const correct = candidates[Math.floor(Math.random() * candidates.length)]
  const pool = getWordsWithoutUnit(moduleId, unitId).filter((w) => w.id !== correct.id)

  if (pool.length < count - 1) return null

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return { correct, distractors: shuffled.slice(0, count - 1) }
}

/** Pick unit options for word→unit exercise at a specific highlight index */
export function pickUnitOptionsForWord(
  moduleId: string,
  word: WordEntry,
  unitId: string,
  highlightIndex: number,
  count: number,
  getUnit: (id: string) => PolishLetter | undefined,
): { correct: PolishLetter; distractors: PolishLetter[] } | null {
  const correct = getUnit(unitId)
  if (!correct) return null

  const actualGrapheme = word.graphemes[highlightIndex]
  if (actualGrapheme !== unitId && highlightToUnitId(actualGrapheme) !== unitId) {
    return null
  }

  const confused = correct.confusedWith ?? []
  const pool = confused
    .map((id) => getUnit(id))
    .filter((u): u is PolishLetter => Boolean(u))
    .filter((u) => u.id !== unitId)
    .filter((u) => word.graphemes[highlightIndex] !== u.id)

  // Distractors must NOT appear at highlight index (only one correct grapheme there)
  const valid = pool.filter((u) => {
    const g = word.graphemes[highlightIndex]
    return g !== u.id
  })

  while (valid.length < count - 1) {
    const extras = (moduleId === 'digraphs' ? POLISH_DIGRAPHS : POLISH_ALPHABET).filter(
      (u) =>
        u.id !== unitId &&
        word.graphemes[highlightIndex] !== u.id &&
        !valid.some((v) => v.id === u.id),
    )
    if (extras.length === 0) break
    valid.push(extras[Math.floor(Math.random() * extras.length)])
  }

  if (valid.length < count - 1) return null

  return {
    correct,
    distractors: valid.slice(0, count - 1),
  }
}
