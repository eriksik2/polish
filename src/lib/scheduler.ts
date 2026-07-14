import { getAllUnitIds } from '../data/moduleRegistry'
import { EXERCISE_FORMATS, type ExerciseFormat } from '../data/modules'
import { getAllMemoryStates } from './tracking'
import type { MemoryState } from './db'
import { db, type AppSettings } from './db'

export interface ScheduledItem {
  letterId: string
  format: ExerciseFormat
  priority: number
  reason: string
}

const ADAPTATION_MIN_ATTEMPTS = 3
const STRONG_THRESHOLD = 20

interface RecentPerf {
  accuracy: number
  avgTime: number
  attempts: number
  recentStreak: number
}

/** Priority score — higher = more urgent to practice */
function computePriority(
  state: MemoryState | undefined,
  perf: RecentPerf,
  now: number,
): { priority: number; reason: string } {
  const reasons: string[] = []
  let priority = 0

  if (perf.attempts === 0) {
    return { priority: 100, reason: 'new' }
  }

  if (perf.attempts < ADAPTATION_MIN_ATTEMPTS) {
    priority = 75 + (ADAPTATION_MIN_ATTEMPTS - perf.attempts) * 8
    reasons.push('still learning')
  } else {
    const weakness = Math.max(0, 100 - perf.accuracy)
    priority = 15 + weakness * 1.4

    if (perf.accuracy >= 90 && perf.recentStreak >= 3) {
      priority = 4
      reasons.push('doing great')
    } else if (perf.accuracy >= 80 && perf.recentStreak >= 2) {
      priority = 12
      reasons.push('doing well')
    } else if (perf.accuracy < 55) {
      priority += 45
      reasons.push('struggling')
    } else if (perf.accuracy < 70) {
      priority += 25
      reasons.push('needs practice')
    }
  }

  if (state && state.nextReview <= now) {
    priority += 30 + Math.min(15, (now - state.nextReview) / 86400000)
    reasons.push('due review')
  }

  if (perf.avgTime > 5000) {
    priority += Math.min(20, (perf.avgTime - 5000) / 500)
    reasons.push('slow')
  }

  if (!perf.attempts) {
    reasons.push('new')
  }

  return { priority: Math.round(priority), reason: reasons.join(', ') || 'routine' }
}

async function getRecentPerformance(
  moduleId: string,
  letterId: string,
  format: ExerciseFormat,
): Promise<RecentPerf> {
  const all = (await db.attempts.toArray())
    .filter((a) => a.moduleId === moduleId && a.letterId === letterId && a.format === format)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)

  if (all.length === 0) {
    return { accuracy: 0, avgTime: 0, attempts: 0, recentStreak: 0 }
  }

  const correct = all.filter((a) => a.correct).length
  const avgTime = all.reduce((s, a) => s + a.responseTimeMs, 0) / all.length

  let recentStreak = 0
  for (const a of all) {
    if (a.correct) recentStreak++
    else break
  }

  return {
    accuracy: (correct / all.length) * 100,
    avgTime,
    attempts: all.length,
    recentStreak,
  }
}

function weightedPick(items: ScheduledItem[]): ScheduledItem {
  const weights = items.map((i) => Math.max(1, i.priority))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export async function buildExerciseQueue(
  moduleId: string,
  settings: AppSettings,
  count = 20,
): Promise<ScheduledItem[]> {
  const enabledFormats = EXERCISE_FORMATS.filter((f) => settings.enabledFormats[f.id]).map(
    (f) => f.id,
  )
  if (enabledFormats.length === 0) return []

  const units = getAllUnitIds(moduleId)
  const memoryStates = await getAllMemoryStates(moduleId)
  const memoryMap = new Map(memoryStates.map((m) => [`${m.letterId}:${m.format}`, m]))
  const now = Date.now()

  const items: ScheduledItem[] = []

  for (const letterId of units) {
    for (const format of enabledFormats) {
      const state = memoryMap.get(`${letterId}:${format}`)
      const perf = await getRecentPerformance(moduleId, letterId, format)
      const { priority, reason } = computePriority(state, perf, now)
      items.push({ letterId, format, priority, reason })
    }
  }

  const weakPool = items.filter((i) => i.priority >= STRONG_THRESHOLD)
  const strongPool = items.filter((i) => i.priority < STRONG_THRESHOLD)

  const result: ScheduledItem[] = []
  const used = new Set<string>()

  while (result.length < count) {
    const availableWeak = weakPool.filter((i) => !used.has(`${i.letterId}:${i.format}`))
    const availableStrong = strongPool.filter((i) => !used.has(`${i.letterId}:${i.format}`))

    if (availableWeak.length === 0 && availableStrong.length === 0) break

    const pickFromWeak =
      availableWeak.length === 0
        ? false
        : availableStrong.length === 0
          ? true
          : Math.random() < 0.88

    const pool = pickFromWeak ? availableWeak : availableStrong
    let chosen = weightedPick(pool)

    if (result.length > 0 && result[result.length - 1].letterId === chosen.letterId) {
      const alt = pool.find((t) => t.letterId !== chosen.letterId)
      if (alt) chosen = alt
    }

    used.add(`${chosen.letterId}:${chosen.format}`)
    result.push(chosen)
  }

  return result
}

export function qualityFromAttempt(correct: boolean, responseTimeMs: number): number {
  if (!correct) return 1
  if (responseTimeMs < 2000) return 5
  if (responseTimeMs < 4000) return 4
  if (responseTimeMs < 8000) return 3
  return 3
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
