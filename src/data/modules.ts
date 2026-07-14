export type ExerciseFormat =
  | 'pick-english'
  | 'pick-audio'
  | 'speak-letter'
  | 'hear-pick-letter'
  | 'hear-type-letter'
  | 'unit-pick-word'
  | 'hear-unit-pick-word'
  | 'word-pick-unit'
  | 'hear-word-pick-letter'
  | 'hear-word-build-sequence'
  | 'hear-sequence-pick-word'

/** Formats turned off for new users — enable in Settings */
export const FORMATS_DISABLED_BY_DEFAULT = new Set<ExerciseFormat>([
  'unit-pick-word',
  'word-pick-unit',
])

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
    description: 'See a letter → pick a Polish word that contains it (disabled by default)',
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
  {
    id: 'hear-word-pick-letter',
    label: 'Hear word → pick letter',
    shortLabel: 'I',
    description: 'Hear a Polish word → pick which letter or digraph from this lesson it contains',
  },
  {
    id: 'hear-word-build-sequence',
    label: 'Hear word → build spelling',
    shortLabel: 'J',
    description: 'Hear a word → tap graphemes in order to build its letter/digraph sequence',
  },
  {
    id: 'hear-sequence-pick-word',
    label: 'Hear sounds → pick word',
    shortLabel: 'K',
    description: 'Hear graphemes played one after another → pick the written word',
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
