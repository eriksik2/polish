import { POLISH_ALPHABET } from '../data/alphabet'
import { POLISH_DIGRAPHS } from '../data/digraphs'
import type { PolishLetter } from '../data/alphabet'
import { getUnit } from '../data/moduleRegistry'
import {
  getKnowledgeNode,
  getOutgoingLinks,
  KNOWLEDGE_NODES,
  wordIdFromSurface,
} from '../data/knowledge/registry'
import type { KnowledgeKind, VocabTag } from '../data/knowledge/types'
import { hasWordRecording } from '../lib/speech/audio'
import { pickSimilarUnits, scoreWordAsDistractor, similarUnitIds } from '../lib/similarity'
import {
  highlightToUnitId,
  POLISH_DIGRAPH_IDS,
  tokenizeGraphemes,
  wordContainsUnit,
} from '../lib/graphemes'

export { wordIdFromSurface as wordIdFromWord }

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
  modules: ('alphabet' | 'digraphs' | 'basic-words')[]
  kind?: 'word' | 'phrase'
  wordIds?: string[]
  tags?: VocabTag[]
  tip?: string
}

function moduleForUnit(unitId: string): 'alphabet' | 'digraphs' {
  return POLISH_DIGRAPHS.some((d) => d.id === unitId) ? 'digraphs' : 'alphabet'
}

function buildFromKnowledge(): WordEntry[] {
  const entries: WordEntry[] = []

  for (const node of KNOWLEDGE_NODES.values()) {
    if (node.kind !== 'word' && node.kind !== 'phrase' && node.kind !== 'case') continue

    const teachesLinks = getIncomingLinksFromUnits(node.id)

    const modules = new Set<'alphabet' | 'digraphs' | 'basic-words'>()
    for (const link of teachesLinks) {
      modules.add(moduleForUnit(link.unitId))
    }

    const vocabEntry = node.kind === 'case' ? undefined : getKnowledgeNode(node.id)
    const isBasic = vocabEntry && (vocabEntry.tags?.some((t) => t !== 'phonics') ?? false)
    if (isBasic || node.kind === 'phrase') modules.add('basic-words')
    if (node.kind === 'case') modules.add('basic-words')

    entries.push({
      id: node.id,
      word: node.label,
      meaning: node.meaning ?? '',
      graphemes: node.graphemeIds ?? tokenizeGraphemes(node.label),
      unitLinks: teachesLinks,
      modules: [...modules],
      kind: node.kind === 'case' ? 'word' : node.kind,
      wordIds: node.wordIds,
      tags: node.tags,
      tip: node.tip,
    })
  }

  return entries
}

function getIncomingLinksFromUnits(wordId: string): WordUnitLink[] {
  const links: WordUnitLink[] = []
  for (const unit of [...POLISH_ALPHABET, ...POLISH_DIGRAPHS]) {
    const teachLink = getOutgoingLinks(unit.id, 'teaches').find((l) => l.to === wordId)
    if (teachLink) {
      links.push({
        unitId: unit.id,
        index: teachLink.index ?? 0,
      })
    }
  }
  return links
}

/** Curated, verified vocabulary — built from the knowledge graph */
export const WORD_BANK: WordEntry[] = buildFromKnowledge()

export const WORD_MAP = new Map(WORD_BANK.map((w) => [w.id, w]))

export function getWord(id: string): WordEntry | undefined {
  return WORD_MAP.get(id)
}

export function getWordsForUnit(moduleId: string, unitId: string): WordEntry[] {
  if (moduleId === 'basic-words') return []
  return WORD_BANK.filter(
    (w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs') && w.unitLinks.some((l) => l.unitId === unitId),
  )
}

export function getWordsWithAudioForUnit(moduleId: string, unitId: string): WordEntry[] {
  return getWordsForUnit(moduleId, unitId).filter((w) => hasWordRecording(w.id))
}

export function getWordsWithAudio(moduleId: string): WordEntry[] {
  return WORD_BANK.filter(
    (w) =>
      w.modules.includes(moduleId as 'alphabet' | 'digraphs' | 'basic-words') &&
      hasWordRecording(w.id),
  )
}

export function getWordsForModule(moduleId: string): WordEntry[] {
  return WORD_BANK.filter((w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs' | 'basic-words'))
}

export function getWordsByIds(ids: string[]): WordEntry[] {
  return ids.map((id) => WORD_MAP.get(id)).filter((w): w is WordEntry => Boolean(w))
}

/** Pick meaning options for vocabulary exercises from a lesson word pool */
export function pickVocabMeaningOptions(
  correctId: string,
  poolIds: string[],
  count: number,
): { correct: WordEntry; distractors: WordEntry[] } | null {
  const correct = WORD_MAP.get(correctId)
  if (!correct) return null
  const pool = getWordsByIds(poolIds).filter((w) => w.id !== correctId)
  if (pool.length < count - 1) return null
  const shuffled = shuffle([...pool])
  return { correct, distractors: shuffled.slice(0, count - 1) }
}

/** Pick Polish word options when shown an English meaning */
export function pickVocabWordOptions(
  correctId: string,
  poolIds: string[],
  count: number,
): { correct: WordEntry; distractors: WordEntry[] } | null {
  return pickVocabMeaningOptions(correctId, poolIds, count)
}

import { shuffle } from '../lib/scheduler'

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

export function getEntriesByKnowledgeKind(kind: KnowledgeKind): WordEntry[] {
  if (kind === 'letter' || kind === 'digraph') return []
  if (kind === 'word') {
    return WORD_BANK.filter(
      (w) => w.kind !== 'phrase' && w.modules.includes('basic-words'),
    )
  }
  if (kind === 'phrase') return WORD_BANK.filter((w) => w.kind === 'phrase')
  if (kind === 'case') {
    return [...KNOWLEDGE_NODES.values()]
      .filter((n) => n.kind === 'case')
      .map((n) => WORD_MAP.get(n.id))
      .filter((w): w is WordEntry => Boolean(w))
  }
  return []
}
