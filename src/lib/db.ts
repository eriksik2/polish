import Dexie, { type EntityTable } from 'dexie'
import type { ExerciseFormat } from '../data/modules'
import { EXERCISE_FORMATS, FORMATS_DISABLED_BY_DEFAULT } from '../data/modules'

export type { ExerciseFormat }

export interface AttemptRecord {
  id?: number
  timestamp: number
  moduleId: string
  letterId: string
  format: ExerciseFormat
  correct: boolean
  responseTimeMs: number
  userAnswer?: string
  expectedAnswer?: string
  confidence?: number
}

export interface MemoryState {
  id: string // `${moduleId}:${letterId}:${format}`
  moduleId: string
  letterId: string
  format: ExerciseFormat
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: number
  lastReview: number
}

export interface AppSettings {
  id: 'settings'
  enabledFormats: Record<ExerciseFormat, boolean>
  preferredVoiceName?: string
  autoPlayAudio: boolean
  showIpaInLessons: boolean
}

export interface LessonProgressRecord {
  lessonId: string
  completedSectionIds: string[]
  finalQuizPassed: boolean
  completedAt?: number
  weakSectionIds: string[]
}

const DEFAULT_ENABLED: Record<ExerciseFormat, boolean> = Object.fromEntries(
  EXERCISE_FORMATS.map((f) => [f.id, !FORMATS_DISABLED_BY_DEFAULT.has(f.id)]),
) as Record<ExerciseFormat, boolean>

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  enabledFormats: DEFAULT_ENABLED,
  autoPlayAudio: true,
  showIpaInLessons: true,
}

export class PolishLearnDB extends Dexie {
  attempts!: EntityTable<AttemptRecord, 'id'>
  memory!: EntityTable<MemoryState, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  lessonProgress!: EntityTable<LessonProgressRecord, 'lessonId'>

  constructor() {
    super('PolishLearnDB')
    this.version(1).stores({
      attempts: '++id, timestamp, moduleId, letterId, format, correct',
      memory: 'id, moduleId, letterId, format, nextReview',
      settings: 'id',
    })
    this.version(2).stores({
      lessonProgress: 'lessonId',
    })
  }
}

export const db = new PolishLearnDB()

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('settings')
  if (existing) {
    let changed = false
    for (const f of EXERCISE_FORMATS) {
      if (existing.enabledFormats[f.id] === undefined) {
        existing.enabledFormats[f.id] = !FORMATS_DISABLED_BY_DEFAULT.has(f.id)
        changed = true
      }
    }
    if (existing.enabledFormats['word-pick-unit']) {
      existing.enabledFormats['word-pick-unit'] = false
      changed = true
    }
    if (existing.enabledFormats['unit-pick-word']) {
      existing.enabledFormats['unit-pick-word'] = false
      changed = true
    }
    if (changed) await db.settings.put(existing)
    return existing
  }
  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put(settings)
}

export function memoryKey(moduleId: string, letterId: string, format: ExerciseFormat): string {
  return `${moduleId}:${letterId}:${format}`
}
