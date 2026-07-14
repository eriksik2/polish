import type { ExerciseFormat } from '../data/modules'

export type LessonBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'audio'; moduleId: string; unitId: string; label?: string }
  | { type: 'units'; moduleId: string; unitIds: string[]; title?: string }
  | { type: 'divider' }

export interface LessonPracticePreset {
  unitIds: string[]
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
}

export interface StructuredLesson {
  id: string
  moduleId: string
  title: string
  subtitle: string
  estimatedMinutes: number
  sections: LessonSection[]
  finalQuiz: LessonPracticePreset
}

export interface LessonProgress {
  lessonId: string
  completedSectionIds: string[]
  finalQuizPassed: boolean
  completedAt?: number
  weakSectionIds: string[]
}
