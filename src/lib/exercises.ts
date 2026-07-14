import {
  getUnit,
  isDigraphModule,
  type PolishLetter,
} from '../data/moduleRegistry'
import type { ExerciseFormat } from '../data/modules'
import { pickUnitOptionsForWord, pickWordOptions, pickWordOptionsWithAudio, pickWordWithAudio, buildGraphemeTiles, type GraphemeTile } from '../data/wordBank'
import { pickSimilarLabels, pickSimilarUnits } from '../lib/similarity'
import { shuffle } from './scheduler'

export interface Exercise {
  id: string
  moduleId: string
  letterId: string
  format: ExerciseFormat
  letter: PolishLetter
  options?: ExerciseOption[]
  correctAnswer: string
  correctIndex?: number
  prompt: string
  /** Word used in word-matching formats */
  targetWordId?: string
  highlightIndex?: number
  /** Grapheme tiles for sequence-building formats */
  sequenceTiles?: GraphemeTile[]
  /** Correct grapheme order for sequence-building */
  correctSequence?: string[]
  /** Graphemes to play in order (hear-sequence-pick-word) */
  playSequence?: string[]
}

export interface ExerciseOption {
  id: string
  label: string
  unitId?: string
  letterId?: string
  audioLetterId?: string
  wordId?: string
  meaning?: string
}

let exerciseCounter = 0

export function generateExercise(
  moduleId: string,
  letterId: string,
  format: ExerciseFormat,
): Exercise | null {
  const letter = getUnit(moduleId, letterId)
  if (!letter) return null

  const id = `ex-${++exerciseCounter}-${Date.now()}`

  switch (format) {
    case 'pick-english':
      return generatePickEnglish(id, moduleId, letter)
    case 'pick-audio':
      return generatePickAudio(id, moduleId, letter)
    case 'speak-letter':
      return generateSpeakLetter(id, moduleId, letter)
    case 'hear-pick-letter':
      return generateHearPickLetter(id, moduleId, letter)
    case 'hear-type-letter':
      return generateHearTypeLetter(id, moduleId, letter)
    case 'unit-pick-word':
      return generateUnitPickWord(id, moduleId, letter)
    case 'hear-unit-pick-word':
      return generateHearUnitPickWord(id, moduleId, letter)
    case 'word-pick-unit':
      return generateWordPickUnit(id, moduleId, letter)
    case 'hear-word-pick-letter':
      return generateHearWordPickLetter(id, moduleId, letter)
    case 'hear-word-build-sequence':
      return generateHearWordBuildSequence(id, moduleId, letter)
    case 'hear-sequence-pick-word':
      return generateHearSequencePickWord(id, moduleId, letter)
    default:
      return null
  }
}

function unitLabel(letter: PolishLetter): string {
  return letter.upper
}

function generatePickEnglish(id: string, moduleId: string, letter: PolishLetter): Exercise {
  const distractors = pickSimilarLabels(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.englishLabel, unitId: letter.id },
    ...distractors.map((d, i) => ({
      id: `d${i}`,
      label: d.label,
      unitId: d.unitId,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'pick-english',
    letter,
    options,
    correctAnswer: letter.englishLabel,
    correctIndex,
    prompt: `What sound does "${unitLabel(letter)}" make?`,
  }
}

function generatePickAudio(id: string, moduleId: string, letter: PolishLetter): Exercise {
  const distractors = pickSimilarUnits(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.upper, unitId: letter.id, audioLetterId: letter.id },
    ...distractors.map((d, i) => ({
      id: `d${i}`,
      label: d.upper,
      unitId: d.id,
      audioLetterId: d.id,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'pick-audio',
    letter,
    options,
    correctAnswer: letter.id,
    correctIndex,
    prompt: `Which audio matches "${unitLabel(letter)}"?`,
  }
}

function generateSpeakLetter(id: string, moduleId: string, letter: PolishLetter): Exercise {
  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'speak-letter',
    letter,
    correctAnswer: letter.id,
    prompt: `Pronounce "${unitLabel(letter)}" (${letter.englishApprox})`,
  }
}

function generateHearPickLetter(id: string, moduleId: string, letter: PolishLetter): Exercise {
  const distractors = pickSimilarUnits(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.upper, unitId: letter.id, letterId: letter.id },
    ...distractors.map((d, i) => ({
      id: `d${i}`,
      label: d.upper,
      unitId: d.id,
      letterId: d.id,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'hear-pick-letter',
    letter,
    options,
    correctAnswer: letter.id,
    correctIndex,
    prompt: isDigraphModule(moduleId)
      ? 'Listen and pick the correct digraph'
      : 'Listen and pick the correct letter',
  }
}

function generateHearTypeLetter(id: string, moduleId: string, letter: PolishLetter): Exercise {
  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'hear-type-letter',
    letter,
    correctAnswer: letter.lower,
    prompt: isDigraphModule(moduleId)
      ? 'Listen and type the digraph'
      : 'Listen and type the letter',
  }
}

function generateUnitPickWord(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const picked = pickWordOptions(moduleId, letter.id, 4)
  if (!picked) return null

  const options: ExerciseOption[] = shuffle([
    {
      id: 'correct',
      label: picked.correct.word,
      wordId: picked.correct.id,
      meaning: picked.correct.meaning,
    },
    ...picked.distractors.map((w, i) => ({
      id: `d${i}`,
      label: w.word,
      wordId: w.id,
      meaning: w.meaning,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'unit-pick-word',
    letter,
    options,
    correctAnswer: picked.correct.id,
    correctIndex,
    targetWordId: picked.correct.id,
    prompt: `Which word contains “${letter.upper}”?`,
  }
}

function generateHearUnitPickWord(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const base = generateUnitPickWord(id, moduleId, letter)
  if (!base) return null
  return {
    ...base,
    id,
    format: 'hear-unit-pick-word',
    prompt: isDigraphModule(moduleId)
      ? 'Listen to the digraph sound — which word contains it?'
      : 'Listen to the letter sound — which word contains it?',
  }
}

function generateWordPickUnit(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const picked = pickWordOptions(moduleId, letter.id, 1)
  if (!picked) return null

  const word = picked.correct
  const link = word.unitLinks.find((l) => l.unitId === letter.id)
  if (!link) return null

  const units = pickUnitOptionsForWord(
    moduleId,
    word,
    letter.id,
    link.index,
    4,
    (uid) => getUnit(moduleId, uid),
  )
  if (!units) return null

  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: units.correct.upper, unitId: units.correct.id },
    ...units.distractors.map((u, i) => ({
      id: `d${i}`,
      label: u.upper,
      unitId: u.id,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'word-pick-unit',
    letter,
    options,
    correctAnswer: letter.id,
    correctIndex,
    targetWordId: word.id,
    highlightIndex: link.index,
    prompt: 'Which letter or digraph is highlighted?',
  }
}

function generateHearWordPickLetter(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const word = pickWordWithAudio(moduleId, letter.id)
  if (!word) return null

  const link = word.unitLinks.find((l) => l.unitId === letter.id)
  if (!link) return null

  const units = pickUnitOptionsForWord(
    moduleId,
    word,
    letter.id,
    link.index,
    4,
    (uid) => getUnit(moduleId, uid),
  )
  if (!units) return null

  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: units.correct.upper, unitId: units.correct.id },
    ...units.distractors.map((u, i) => ({
      id: `d${i}`,
      label: u.upper,
      unitId: u.id,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'hear-word-pick-letter',
    letter,
    options,
    correctAnswer: letter.id,
    correctIndex,
    targetWordId: word.id,
    highlightIndex: link.index,
    prompt: 'Listen to the word — which letter or digraph do you hear in it?',
  }
}

function generateHearWordBuildSequence(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const word = pickWordWithAudio(moduleId, letter.id)
  if (!word) return null

  const minPool = Math.max(8, word.graphemes.length + 3)
  const { tiles, correctSequence } = buildGraphemeTiles(word, moduleId, minPool)

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'hear-word-build-sequence',
    letter,
    correctAnswer: correctSequence.join('|'),
    targetWordId: word.id,
    sequenceTiles: tiles,
    correctSequence,
    prompt: 'Listen to the word — tap graphemes in order to spell it',
  }
}

function generateHearSequencePickWord(id: string, moduleId: string, letter: PolishLetter): Exercise | null {
  const picked = pickWordOptionsWithAudio(moduleId, letter.id, 4)
  if (!picked) return null

  const options: ExerciseOption[] = shuffle([
    {
      id: 'correct',
      label: picked.correct.word,
      wordId: picked.correct.id,
      meaning: picked.correct.meaning,
    },
    ...picked.distractors.map((w, i) => ({
      id: `d${i}`,
      label: w.word,
      wordId: w.id,
      meaning: w.meaning,
    })),
  ])
  const correctIndex = options.findIndex((o) => o.id === 'correct')

  return {
    id,
    moduleId,
    letterId: letter.id,
    format: 'hear-sequence-pick-word',
    letter,
    options,
    correctAnswer: picked.correct.id,
    correctIndex,
    targetWordId: picked.correct.id,
    playSequence: [...picked.correct.graphemes],
    prompt: 'Listen to each sound in order — which word is it?',
  }
}

export function sequencesMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((g, i) => g === b[i])
}

export function normalizeLetterInput(input: string): string {
  return input.trim().toLowerCase()
}

export function checkLetterInput(input: string, letter: PolishLetter): boolean {
  const n = normalizeLetterInput(input)
  return n === letter.lower || n === letter.upper.toLowerCase() || n === letter.id
}

/** Map exercise options to unit ids for review explanations */
export function getOptionUnits(exercise: Exercise): { label: string; unitId: string }[] {
  if (!exercise.options) return []
  return exercise.options
    .map((o) => ({
      label: o.label,
      unitId: o.unitId ?? o.letterId ?? o.audioLetterId ?? '',
    }))
    .filter((o) => o.unitId)
}

export function getSelectedUnitId(
  exercise: Exercise,
  selectedIndex: number | null,
): string | undefined {
  if (selectedIndex === null || !exercise.options) return undefined
  const opt = exercise.options[selectedIndex]
  return opt.unitId ?? opt.letterId ?? opt.audioLetterId ?? opt.wordId
}

export function getOptionWords(exercise: Exercise): { label: string; wordId: string; meaning?: string }[] {
  if (!exercise.options) return []
  return exercise.options
    .filter((o) => o.wordId)
    .map((o) => ({
      label: o.label,
      wordId: o.wordId!,
      meaning: o.meaning,
    }))
}
export function getSelectedWordId(
  exercise: Exercise,
  selectedIndex: number | null,
): string | undefined {
  if (selectedIndex === null || !exercise.options) return undefined
  return exercise.options[selectedIndex]?.wordId
}
