import Dexie, { type EntityTable } from 'dexie'

export type ExerciseFormat =
  | 'pick-english'
  | 'pick-audio'
  | 'speak-letter'
  | 'hear-pick-letter'
  | 'hear-type-letter'

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

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  enabledFormats: {
    'pick-english': true,
    'pick-audio': true,
    'speak-letter': true,
    'hear-pick-letter': true,
    'hear-type-letter': true,
  },
  autoPlayAudio: true,
  showIpaInLessons: true,
}

export class PolishLearnDB extends Dexie {
  attempts!: EntityTable<AttemptRecord, 'id'>
  memory!: EntityTable<MemoryState, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('PolishLearnDB')
    this.version(1).stores({
      attempts: '++id, timestamp, moduleId, letterId, format, correct',
      memory: 'id, moduleId, letterId, format, nextReview',
      settings: 'id',
    })
  }
}

export const db = new PolishLearnDB()

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('settings')
  if (existing) return existing
  await db.settings.put(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put(settings)
}

export function memoryKey(moduleId: string, letterId: string, format: ExerciseFormat): string {
  return `${moduleId}:${letterId}:${format}`
}
