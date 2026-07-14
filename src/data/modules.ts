export type ExerciseFormat =
  | 'pick-english'
  | 'pick-audio'
  | 'speak-letter'
  | 'hear-pick-letter'
  | 'hear-type-letter'

export const EXERCISE_FORMATS: {
  id: ExerciseFormat
  label: string
  shortLabel: string
  description: string
}[] = [
  {
    id: 'pick-english',
    label: 'Pick sound (English)',
    shortLabel: 'A',
    description: 'See a letter → pick how the sound is written in English',
  },
  {
    id: 'pick-audio',
    label: 'Pick audio',
    shortLabel: 'B',
    description: 'See a letter → pick the matching pronunciation',
  },
  {
    id: 'speak-letter',
    label: 'Speak aloud',
    shortLabel: 'C',
    description: 'See a letter → pronounce it using your microphone',
  },
  {
    id: 'hear-pick-letter',
    label: 'Hear → pick letter',
    shortLabel: 'D',
    description: 'Hear a sound → pick the correct letter',
  },
  {
    id: 'hear-type-letter',
    label: 'Hear → type letter',
    shortLabel: 'E',
    description: 'Hear a letter name → type the letter',
  },
]

export interface ModuleInfo {
  id: string
  title: string
  description: string
  icon: string
  available: boolean
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'alphabet',
    title: 'Alphabet',
    description: 'Learn all 32 Polish letters, their sounds, and pronunciation',
    icon: 'ą',
    available: true,
  },
]
