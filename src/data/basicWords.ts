export {
  VOCABULARY as BASIC_WORDS,
  VOCABULARY_MAP as BASIC_WORD_MAP,
  getVocabEntry as getBasicWord,
  wordIdFromSurface as wordIdFromWord,
} from './knowledge/vocabulary'

export type { VocabEntry as BasicWord, VocabTag as BasicWordTag } from './knowledge/types'

import { VOCABULARY, type VocabEntry } from './knowledge/vocabulary'
import type { VocabTag } from './knowledge/types'
import { tokenizeGraphemes } from '../lib/graphemes'
import type { WordEntry } from './wordBank'

export function getBasicWordsByTag(tag: VocabTag): VocabEntry[] {
  return VOCABULARY.filter((w) => w.tags?.includes(tag))
}

export function basicWordToEntry(word: VocabEntry): WordEntry {
  return {
    id: word.id,
    word: word.surface,
    meaning: word.meaning,
    graphemes: tokenizeGraphemes(word.surface),
    unitLinks: [],
    modules: ['basic-words'],
    kind: word.kind,
    wordIds: word.wordIds,
    tip: word.tip,
    tags: word.tags,
  }
}

export const BASIC_WORD_ENTRIES: WordEntry[] = VOCABULARY.map(basicWordToEntry)

export const GENERAL_BASIC_WORDS_LESSON = {
  id: 'basic-words-overview',
  title: 'Basic Polish Words',
  sections: [
    {
      heading: 'Everyday vocabulary',
      body: 'This module collects high-frequency words for greetings, numbers, politeness, and daily life. Use structured lessons for guided study, or browse the full word list here.',
    },
    {
      heading: 'Tips',
      body: 'Tap any word to hear it. Native recordings play full words; words marked “Letter sounds” spell out using alphabet and digraph clips until a native recording is added.',
    },
  ],
}
