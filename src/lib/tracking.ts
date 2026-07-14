import { db, memoryKey, type AttemptRecord, type ExerciseFormat, type MemoryState } from './db'

export type Timeframe = 'session' | 'today' | '7d' | '30d' | '90d' | 'all'

export interface StatsFilter {
  timeframe: Timeframe
  moduleId?: string
  letterId?: string
  format?: ExerciseFormat
}

export interface StatsSummary {
  attempts: number
  correct: number
  accuracy: number
  avgResponseTimeMs: number
  currentStreak: number
  bestStreak: number
}

export interface LetterFormatStats extends StatsSummary {
  letterId: string
  format: ExerciseFormat
}

export interface DimensionStats {
  key: string
  label: string
  summary: StatsSummary
}

function timeframeStart(tf: Timeframe, sessionStart?: number): number {
  const now = Date.now()
  switch (tf) {
    case 'session':
      return sessionStart ?? now - 3600000
    case 'today': {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    case '7d':
      return now - 7 * 86400000
    case '30d':
      return now - 30 * 86400000
    case '90d':
      return now - 90 * 86400000
    case 'all':
      return 0
  }
}

function computeStreaks(attempts: AttemptRecord[]): { current: number; best: number } {
  if (attempts.length === 0) return { current: 0, best: 0 }
  const sorted = [...attempts].sort((a, b) => b.timestamp - a.timestamp)
  let current = 0
  let best = 0
  let run = 0
  for (const a of sorted) {
    if (a.correct) {
      run++
      best = Math.max(best, run)
    } else {
      if (current === 0) current = run
      run = 0
    }
  }
  if (current === 0) current = run
  return { current, best }
}

function summarize(attempts: AttemptRecord[]): StatsSummary {
  if (attempts.length === 0) {
    return { attempts: 0, correct: 0, accuracy: 0, avgResponseTimeMs: 0, currentStreak: 0, bestStreak: 0 }
  }
  const correct = attempts.filter((a) => a.correct).length
  const avgResponseTimeMs = attempts.reduce((s, a) => s + a.responseTimeMs, 0) / attempts.length
  const { current, best } = computeStreaks(attempts)
  return {
    attempts: attempts.length,
    correct,
    accuracy: Math.round((correct / attempts.length) * 100),
    avgResponseTimeMs: Math.round(avgResponseTimeMs),
    currentStreak: current,
    bestStreak: best,
  }
}

export async function filterAttempts(
  filter: StatsFilter,
  sessionStart?: number,
): Promise<AttemptRecord[]> {
  const start = timeframeStart(filter.timeframe, sessionStart)
  let collection = db.attempts.where('timestamp').aboveOrEqual(start)

  const all = await collection.toArray()

  return all.filter((a) => {
    if (filter.moduleId && a.moduleId !== filter.moduleId) return false
    if (filter.letterId && a.letterId !== filter.letterId) return false
    if (filter.format && a.format !== filter.format) return false
    return true
  })
}

export async function getStatsSummary(
  filter: StatsFilter,
  sessionStart?: number,
): Promise<StatsSummary> {
  const attempts = await filterAttempts(filter, sessionStart)
  return summarize(attempts)
}

export async function getStatsByLetter(
  moduleId: string,
  timeframe: Timeframe,
  sessionStart?: number,
): Promise<DimensionStats[]> {
  const attempts = await filterAttempts({ timeframe, moduleId }, sessionStart)
  const groups = new Map<string, AttemptRecord[]>()
  for (const a of attempts) {
    const list = groups.get(a.letterId) ?? []
    list.push(a)
    groups.set(a.letterId, list)
  }
  return [...groups.entries()]
    .map(([key, list]) => ({ key, label: key, summary: summarize(list) }))
    .sort((a, b) => a.key.localeCompare(b.key, 'pl'))
}

export async function getStatsByFormat(
  moduleId: string,
  timeframe: Timeframe,
  sessionStart?: number,
): Promise<DimensionStats[]> {
  const attempts = await filterAttempts({ timeframe, moduleId }, sessionStart)
  const groups = new Map<string, AttemptRecord[]>()
  for (const a of attempts) {
    const list = groups.get(a.format) ?? []
    list.push(a)
    groups.set(a.format, list)
  }
  return [...groups.entries()].map(([key, list]) => ({
    key,
    label: key,
    summary: summarize(list),
  }))
}

export async function getLetterFormatMatrix(
  moduleId: string,
  timeframe: Timeframe,
  sessionStart?: number,
): Promise<LetterFormatStats[]> {
  const attempts = await filterAttempts({ timeframe, moduleId }, sessionStart)
  const groups = new Map<string, AttemptRecord[]>()
  for (const a of attempts) {
    const key = `${a.letterId}:${a.format}`
    const list = groups.get(key) ?? []
    list.push(a)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([key, list]) => {
    const [letterId, format] = key.split(':') as [string, ExerciseFormat]
    return { letterId, format, ...summarize(list) }
  })
}

export async function recordAttempt(
  attempt: Omit<AttemptRecord, 'id' | 'timestamp'>,
): Promise<void> {
  await db.attempts.add({ ...attempt, timestamp: Date.now() })
}

/** SM-2 spaced repetition update */
export async function updateMemoryAfterAttempt(
  moduleId: string,
  letterId: string,
  format: ExerciseFormat,
  correct: boolean,
  quality: number,
): Promise<MemoryState> {
  const id = memoryKey(moduleId, letterId, format)
  const existing = await db.memory.get(id)
  const now = Date.now()

  let state: MemoryState = existing ?? {
    id,
    moduleId,
    letterId,
    format,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastReview: 0,
  }

  if (!correct || quality < 3) {
    state.repetitions = 0
    state.interval = 0
    state.nextReview = now
    state.easeFactor = Math.max(1.3, state.easeFactor - 0.2)
  } else {
    state.repetitions += 1
    if (state.repetitions === 1) {
      state.interval = 1
    } else if (state.repetitions === 2) {
      state.interval = 3
    } else {
      state.interval = Math.round(state.interval * state.easeFactor)
    }
    state.easeFactor = Math.min(3.0, state.easeFactor + 0.1 * (quality - 3))
    state.nextReview = now + state.interval * 86400000
  }

  state.lastReview = now
  await db.memory.put(state)
  return state
}

export async function getMemoryState(
  moduleId: string,
  letterId: string,
  format: ExerciseFormat,
): Promise<MemoryState | undefined> {
  return db.memory.get(memoryKey(moduleId, letterId, format))
}

export async function getAllMemoryStates(moduleId: string): Promise<MemoryState[]> {
  return db.memory.where('moduleId').equals(moduleId).toArray()
}

export function isMastered(state: MemoryState | undefined, recentAccuracy: number): boolean {
  if (!state) return false
  return state.interval >= 7 && state.repetitions >= 3 && recentAccuracy >= 90
}
