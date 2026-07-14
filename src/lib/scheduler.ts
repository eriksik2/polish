import { getAllLetterIds } from '../data/alphabet'
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

/** Priority score — higher = more urgent to practice */
function computePriority(
  state: MemoryState | undefined,
  recentAccuracy: number,
  avgResponseTime: number,
  now: number,
): { priority: number; reason: string } {
  let priority = 50
  const reasons: string[] = []

  if (!state || state.repetitions === 0) {
    priority += 40
    reasons.push('new')
  } else if (state.nextReview <= now) {
    priority += 30 + Math.min(20, (now - state.nextReview) / 86400000)
    reasons.push('due review')
  }

  if (recentAccuracy < 70) {
    priority += (70 - recentAccuracy) * 0.5
    reasons.push('low accuracy')
  }

  if (avgResponseTime > 5000) {
    priority += Math.min(15, (avgResponseTime - 5000) / 1000)
    reasons.push('slow')
  }

  if (state && state.interval >= 7 && recentAccuracy >= 90) {
    priority -= 30
    reasons.push('mastered')
  }

  return { priority, reason: reasons.join(', ') || 'routine' }
}

async function getRecentPerformance(
  moduleId: string,
  letterId: string,
  format: ExerciseFormat,
): Promise<{ accuracy: number; avgTime: number }> {
  const attempts = await db.attempts
    .where('[moduleId+letterId+format]')
    .equals([moduleId, letterId, format])
    .reverse()
    .limit(10)
    .toArray()
    .catch(() => [])

  // Dexie compound index may not exist — fallback
  const all = attempts.length
    ? attempts
    : (await db.attempts.toArray())
        .filter((a) => a.moduleId === moduleId && a.letterId === letterId && a.format === format)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)

  if (all.length === 0) return { accuracy: 0, avgTime: 0 }
  const correct = all.filter((a) => a.correct).length
  const avgTime = all.reduce((s, a) => s + a.responseTimeMs, 0) / all.length
  return { accuracy: (correct / all.length) * 100, avgTime }
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

  const letters = getAllLetterIds()
  const memoryStates = await getAllMemoryStates(moduleId)
  const memoryMap = new Map(memoryStates.map((m) => [`${m.letterId}:${m.format}`, m]))
  const now = Date.now()

  const items: ScheduledItem[] = []

  for (const letterId of letters) {
    for (const format of enabledFormats) {
      const state = memoryMap.get(`${letterId}:${format}`)
      const perf = await getRecentPerformance(moduleId, letterId, format)
      const { priority, reason } = computePriority(state, perf.accuracy, perf.avgTime, now)
      items.push({ letterId, format, priority, reason })
    }
  }

  items.sort((a, b) => b.priority - a.priority)

  // Interleave: take from priority bands with some randomness for variety
  const result: ScheduledItem[] = []
  const used = new Set<string>()

  while (result.length < count) {
    const band = items.filter((i) => !used.has(`${i.letterId}:${i.format}`))
    if (band.length === 0) break

    // Weighted random from top candidates
    const top = band.slice(0, Math.min(8, band.length))
    const weights = top.map((i) => i.priority + 10)
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let chosen = top[0]
    for (let i = 0; i < top.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        chosen = top[i]
        break
      }
    }

    // Avoid same letter back-to-back
    if (result.length > 0 && result[result.length - 1].letterId === chosen.letterId) {
      const alt = top.find((t) => t.letterId !== chosen.letterId)
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
