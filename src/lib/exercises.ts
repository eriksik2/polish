import {
  getUnit,
  isDigraphModule,
  type PolishLetter,
} from '../data/moduleRegistry'
import type { ExerciseFormat } from '../data/modules'
import { pickUnitOptionsForWord, pickWordOptions } from '../data/wordBank'
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
