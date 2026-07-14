import { POLISH_ALPHABET } from '../data/alphabet'
import { POLISH_DIGRAPHS } from '../data/digraphs'
import type { PolishLetter } from '../data/alphabet'
import { getUnit } from '../data/moduleRegistry'
import { hasWordRecording } from '../lib/speech/audio'
import { pickSimilarUnits, scoreWordAsDistractor, similarUnitIds } from '../lib/similarity'
import {
  findHighlightIndex,
  graphemeAtIndex,
  highlightToUnitId,
  POLISH_DIGRAPH_IDS,
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

export function getWordsWithAudioForUnit(moduleId: string, unitId: string): WordEntry[] {
  return getWordsForUnit(moduleId, unitId).filter((w) => hasWordRecording(w.id))
}

export function getWordsWithAudio(moduleId: string): WordEntry[] {
  return WORD_BANK.filter(
    (w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs') && hasWordRecording(w.id),
  )
}

function moduleForGrapheme(g: string): 'alphabet' | 'digraphs' {
  return (POLISH_DIGRAPH_IDS as Set<string>).has(g) ? 'digraphs' : 'alphabet'
}

function lookupGraphemeUnit(g: string): PolishLetter | undefined {
  return getUnit(moduleForGrapheme(g), g)
}

export interface GraphemeTile {
  id: string
  grapheme: string
}

/** Tiles for building a word's grapheme sequence, with distractors to reach minPool size */
export function buildGraphemeTiles(
  word: WordEntry,
  moduleId: string,
  minPool = 8,
): { tiles: GraphemeTile[]; correctSequence: string[] } {
  const correctSequence = [...word.graphemes]
  const tiles: GraphemeTile[] = []
  const usedCount = new Map<string, number>()

  for (const g of correctSequence) {
    const n = usedCount.get(g) ?? 0
    tiles.push({ id: `${g}-${n}`, grapheme: g })
    usedCount.set(g, n + 1)
  }

  const inWord = new Set(correctSequence)
  const distractorCandidates = new Set<string>()

  for (const g of correctSequence) {
    const unit = lookupGraphemeUnit(g)
    if (!unit) continue
    for (const id of similarUnitIds(moduleId, unit)) {
      if (!inWord.has(id)) distractorCandidates.add(id)
    }
  }

  for (const u of [...POLISH_ALPHABET, ...POLISH_DIGRAPHS]) {
    if (!inWord.has(u.id)) distractorCandidates.add(u.id)
  }

  const shuffledDistractors = [...distractorCandidates].sort(() => Math.random() - 0.5)
  let di = 0
  while (tiles.length < minPool && di < shuffledDistractors.length) {
    const g = shuffledDistractors[di++]
    tiles.push({ id: `x-${g}-${di}`, grapheme: g })
  }

  return {
    tiles: tiles.sort(() => Math.random() - 0.5),
    correctSequence,
  }
}

/** Pick words with audio: 1 correct + similar distractors (also with audio) */
export function pickWordOptionsWithAudio(
  moduleId: string,
  unitId: string,
  count: number,
): { correct: WordEntry; distractors: WordEntry[] } | null {
  const candidates = getWordsWithAudioForUnit(moduleId, unitId)
  if (candidates.length === 0) return null

  const correct = candidates[Math.floor(Math.random() * candidates.length)]
  const pool = getWordsWithAudio(moduleId).filter(
    (w) => w.id !== correct.id && !wordContainsUnit(w.word, unitId),
  )
  const needed = count - 1
  if (pool.length < needed) return null

  const targetUnit = getUnit(moduleId, unitId)
  if (!targetUnit) return null

  const lookup = (id: string) => getUnit(moduleId, id)
  const ranked = pool
    .map((w) => ({
      word: w,
      score: scoreWordAsDistractor(w.graphemes, targetUnit, moduleId, lookup),
    }))
    .sort((a, b) => b.score - a.score)

  const picked: WordEntry[] = []
  const used = new Set<string>()

  for (const { word, score } of ranked) {
    if (picked.length >= needed) break
    if (score < 35 && picked.length >= Math.min(2, needed)) continue
    if (!used.has(word.id)) {
      picked.push(word)
      used.add(word.id)
    }
  }

  for (const { word } of ranked) {
    if (picked.length >= needed) break
    if (!used.has(word.id)) {
      picked.push(word)
      used.add(word.id)
    }
  }

  if (picked.length < needed) return null
  return { correct, distractors: picked.slice(0, needed) }
}

/** Pick a random word with audio for a unit */
export function pickWordWithAudio(
  moduleId: string,
  unitId: string,
): WordEntry | null {
  const candidates = getWordsWithAudioForUnit(moduleId, unitId)
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export function graphemeModuleId(grapheme: string): 'alphabet' | 'digraphs' {
  return moduleForGrapheme(grapheme)
}

export function getWordsWithoutUnit(moduleId: string, unitId: string): WordEntry[] {
  return WORD_BANK.filter(
    (w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs') && !wordContainsUnit(w.word, unitId),
  )
}

/** Pick words for unit→word exercise: 1 correct + similar-but-unambiguous distractors */
export function pickWordOptions(
  moduleId: string,
  unitId: string,
  count: number,
): { correct: WordEntry; distractors: WordEntry[] } | null {
  const targetUnit = getUnit(moduleId, unitId)
  if (!targetUnit) return null

  const candidates = getWordsForUnit(moduleId, unitId)
  if (candidates.length === 0) return null

  const correct = candidates[Math.floor(Math.random() * candidates.length)]
  const pool = getWordsWithoutUnit(moduleId, unitId).filter((w) => w.id !== correct.id)
  const needed = count - 1

  if (pool.length < needed) return null

  const lookup = (id: string) => getUnit(moduleId, id)
  const ranked = pool
    .map((w) => ({
      word: w,
      score: scoreWordAsDistractor(w.graphemes, targetUnit, moduleId, lookup),
    }))
    .sort((a, b) => b.score - a.score)

  const picked: WordEntry[] = []
  const used = new Set<string>()

  // Prefer words with at least one similar grapheme (score ≥ 35 ≈ one confused neighbour)
  for (const { word, score } of ranked) {
    if (picked.length >= needed) break
    if (score < 35 && picked.length >= Math.min(2, needed)) continue
    if (!used.has(word.id)) {
      picked.push(word)
      used.add(word.id)
    }
  }

  for (const { word } of ranked) {
    if (picked.length >= needed) break
    if (!used.has(word.id)) {
      picked.push(word)
      used.add(word.id)
    }
  }

  if (picked.length < needed) return null

  return { correct, distractors: picked.slice(0, needed) }
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

  const highlightGrapheme = word.graphemes[highlightIndex]
  const distractors = pickSimilarUnits(moduleId, correct, count - 1).filter(
    (u) => u.id !== unitId && u.id !== highlightGrapheme,
  )

  if (distractors.length < count - 1) return null

  return {
    correct,
    distractors: distractors.slice(0, count - 1),
  }
}
