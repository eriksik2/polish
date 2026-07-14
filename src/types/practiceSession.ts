import type { ExerciseFormat } from '../data/modules'

export interface PracticeSessionConfig {
  noHelp: boolean
  /** Total session time in seconds; null = unlimited */
  totalTimeLimitSec: number | null
  /** Per-exercise time in seconds; null = unlimited */
  itemTimeLimitSec: number | null
  exerciseCount: number
  /** Brief feedback then auto-advance — no review panel */
  quickMode: boolean
  moduleIds: string[]
  formats: ExerciseFormat[]
  /** If set, only these unit ids (across selected modules) */
  unitIds: string[] | null
}

export interface SessionQueueItem {
  moduleId: string
  letterId: string
  format: ExerciseFormat
}

export const SESSION_STORAGE_KEY = 'polish-practice-session'

export const DEFAULT_PRACTICE_SESSION: PracticeSessionConfig = {
  noHelp: false,
  totalTimeLimitSec: null,
  itemTimeLimitSec: null,
  exerciseCount: 20,
  quickMode: false,
  moduleIds: ['alphabet'],
  formats: [],
  unitIds: null,
}

export function loadSessionConfig(): PracticeSessionConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PracticeSessionConfig
  } catch {
    return null
  }
}

export function saveSessionConfig(config: PracticeSessionConfig): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(config))
}

export function clearSessionConfig(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY)
}
