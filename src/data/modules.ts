export type ExerciseFormat =
  | 'pick-english'
  | 'pick-audio'
  | 'speak-letter'
  | 'hear-pick-letter'
  | 'hear-type-letter'
  | 'unit-pick-word'
  | 'hear-unit-pick-word'
  | 'word-pick-unit'

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
    description: 'See a letter → listen to options, then confirm your choice',
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
  {
    id: 'unit-pick-word',
    label: 'Letter → pick word',
    shortLabel: 'F',
    description: 'See a letter → pick a Polish word that contains it',
  },
  {
    id: 'hear-unit-pick-word',
    label: 'Hear letter → pick word',
    shortLabel: 'G',
    description: 'Hear a letter sound → pick a word that contains it',
  },
  {
    id: 'word-pick-unit',
    label: 'Word → pick letter',
    shortLabel: 'H',
    description: 'See a highlighted word → pick the matching letter (disabled by default — letter is already shown)',
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
  {
    id: 'digraphs',
    title: 'Digraphs',
    description: 'Master ch, cz, dz, dź, dż, rz, sz — two-letter sound pairs',
    icon: 'sz',
    available: true,
  },
]
