import {
  getDistractorLabels,
  getDistractorLetters,
  getLetter,
  POLISH_ALPHABET,
  GENERAL_ALPHABET_LESSON,
  type PolishLetter,
} from './alphabet'
import {
  getDigraph,
  POLISH_DIGRAPHS,
  GENERAL_DIGRAPH_LESSON,
} from './digraphs'
import {
  BASIC_WORD_ENTRIES,
  GENERAL_BASIC_WORDS_LESSON,
  getBasicWord,
} from './basicWords'
import { getWord, type WordEntry } from './wordBank'
import { MODULES, type ModuleInfo } from './modules'
import { pickSimilarLabels, pickSimilarUnits } from '../lib/similarity'

export type { PolishLetter }

export interface ModuleLesson {
  id: string
  title: string
  sections: { heading: string; body: string }[]
}

function vocabToUnit(word: WordEntry): PolishLetter {
  const basic = getBasicWord(word.id)
  return {
    id: word.id,
    lower: word.word,
    upper: word.word,
    polishName: word.word,
    englishLabel: word.meaning,
    englishApprox: word.meaning,
    englishAlternates: [],
    ipa: '',
    category: 'consonant',
    tips: basic?.tip ? [basic.tip] : [],
    examples: [],
  }
}

export function getModuleInfo(moduleId: string): ModuleInfo | undefined {
  return MODULES.find((m) => m.id === moduleId)
}

export function getModuleUnits(moduleId: string): PolishLetter[] {
  switch (moduleId) {
    case 'alphabet':
      return POLISH_ALPHABET
    case 'digraphs':
      return POLISH_DIGRAPHS
    case 'basic-words':
      return BASIC_WORD_ENTRIES.map(vocabToUnit)
    default:
      return []
  }
}

export function getUnit(moduleId: string, unitId: string): PolishLetter | undefined {
  if (moduleId === 'alphabet') return getLetter(unitId)
  if (moduleId === 'digraphs') return getDigraph(unitId)
  if (moduleId === 'basic-words') {
    const word = getWord(unitId)
    return word ? vocabToUnit(word) : undefined
  }
  return undefined
}

export function getAllUnitIds(moduleId: string): string[] {
  return getModuleUnits(moduleId).map((u) => u.id)
}

export function getGeneralLesson(moduleId: string): ModuleLesson | undefined {
  if (moduleId === 'alphabet') return GENERAL_ALPHABET_LESSON
  if (moduleId === 'digraphs') return GENERAL_DIGRAPH_LESSON
  if (moduleId === 'basic-words') return GENERAL_BASIC_WORDS_LESSON
  return undefined
}

export function getDistractorLabelsForUnit(
  moduleId: string,
  correct: PolishLetter,
  count: number,
): string[] {
  return pickSimilarLabels(moduleId, correct, count).map((d) => d.label)
}

export function getDistractorUnits(
  moduleId: string,
  correct: PolishLetter,
  count: number,
): PolishLetter[] {
  return pickSimilarUnits(moduleId, correct, count)
}

export function getUnitDisplayLabel(moduleId: string, unitId: string): string {
  if (moduleId === 'basic-words') return getBasicWord(unitId)?.word ?? unitId
  return getUnit(moduleId, unitId)?.upper ?? unitId
}

export function isDigraphModule(moduleId: string): boolean {
  return moduleId === 'digraphs'
}

export function isVocabModule(moduleId: string): boolean {
  return moduleId === 'basic-words'
}

export function resolveUnitModule(unitId: string): 'alphabet' | 'digraphs' | 'basic-words' {
  if (BASIC_WORD_ENTRIES.some((w) => w.id === unitId)) return 'basic-words'
  return POLISH_DIGRAPHS.some((d) => d.id === unitId) ? 'digraphs' : 'alphabet'
}

// Legacy exports used by alphabet.ts distractor helpers
export { getDistractorLabels, getDistractorLetters }
