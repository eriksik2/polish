import {
  getDistractorLabelsForUnit,
  getDistractorUnits,
  getUnit,
  isDigraphModule,
  type PolishLetter,
} from '../data/moduleRegistry'
import type { ExerciseFormat } from '../data/modules'
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
}

export interface ExerciseOption {
  id: string
  label: string
  letterId?: string
  audioLetterId?: string
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
    default:
      return null
  }
}

function unitLabel(letter: PolishLetter): string {
  return letter.upper
}

function generatePickEnglish(id: string, moduleId: string, letter: PolishLetter): Exercise {
  const distractors = getDistractorLabelsForUnit(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.englishLabel },
    ...distractors.map((d, i) => ({ id: `d${i}`, label: d })),
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
  const distractors = getDistractorUnits(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.upper, audioLetterId: letter.id },
    ...distractors.map((d, i) => ({
      id: `d${i}`,
      label: d.upper,
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
  const distractors = getDistractorUnits(moduleId, letter, 3)
  const options: ExerciseOption[] = shuffle([
    { id: 'correct', label: letter.upper, letterId: letter.id },
    ...distractors.map((d, i) => ({
      id: `d${i}`,
      label: d.upper,
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

export function normalizeLetterInput(input: string): string {
  return input.trim().toLowerCase()
}

export function checkLetterInput(input: string, letter: PolishLetter): boolean {
  const n = normalizeLetterInput(input)
  return n === letter.lower || n === letter.upper.toLowerCase() || n === letter.id
}
