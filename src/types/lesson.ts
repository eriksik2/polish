import type { ExerciseFormat } from '../data/modules'

export const SECTION_QUIZ_SIZE = 10
export const FINAL_QUIZ_SIZE = 20

export type LessonCategoryId = 'first-steps' | 'first-words'

export interface LessonCategory {
  id: LessonCategoryId
  title: string
  description: string
}

export const LESSON_CATEGORIES: LessonCategory[] = [
  {
    id: 'first-steps',
    title: 'First steps',
    description: 'Alphabet and digraphs — the sounds of written Polish',
  },
  {
    id: 'first-words',
    title: 'First words',
    description: 'Greetings, numbers, and everyday vocabulary',
  },
]

export type LessonBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'units'; moduleId: string; unitIds: string[]; title?: string }
  | { type: 'words'; wordIds: string[]; title?: string }
  | { type: 'divider' }

export interface LessonPopQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface LessonPracticePreset {
  /** Letter/digraph ids (alphabet & digraphs modules) */
  unitIds: string[]
  /** Word ids (basic-words module) */
  wordIds?: string[]
  formats: ExerciseFormat[]
  exerciseCount: number
  timeLimitSec: number | null
  helpAllowed: boolean
  passAccuracy: number
}

export interface LessonSection {
  id: string
  title: string
  /** intro sections have no practice quiz */
  kind: 'intro' | 'teach' | 'recap'
  blocks: LessonBlock[]
  practice?: LessonPracticePreset
  /** Section-specific knowledge checks mixed ~50/50 into section quizzes */
  popQuestions?: LessonPopQuestion[]
}

export interface StructuredLesson {
  id: string
  moduleId: string
  category: LessonCategoryId
  title: string
  subtitle: string
  estimatedMinutes: number
  sections: LessonSection[]
  finalQuiz: LessonPracticePreset
}

export interface LessonProgress {
  lessonId: string
  completedSectionIds: string[]
  readSectionIds: string[]
  finalQuizPassed: boolean
  completedAt?: number
  weakSectionIds: string[]
}
