import { getAllUnitIds } from '../data/moduleRegistry'
import type { PracticeSessionConfig, SessionQueueItem } from '../types/practiceSession'
import { shuffle } from './scheduler'

export function buildSessionQueue(config: PracticeSessionConfig): SessionQueueItem[] {
  if (config.formats.length === 0 || config.moduleIds.length === 0) return []

  const pool: SessionQueueItem[] = []

  for (const moduleId of config.moduleIds) {
    const units = getAllUnitIds(moduleId).filter((id) => {
      if (!config.unitIds) return true
      return config.unitIds.includes(id)
    })

    for (const letterId of units) {
      for (const format of config.formats) {
        pool.push({ moduleId, letterId, format })
      }
    }
  }

  if (pool.length === 0) return []

  const shuffled = shuffle(pool)
  const result: SessionQueueItem[] = []
  let i = 0

  while (result.length < config.exerciseCount) {
    if (i >= shuffled.length) {
      i = 0
      shuffle(shuffled)
    }
    const item = shuffled[i++]
    if (result.length > 0) {
      const prev = result[result.length - 1]
      if (prev.letterId === item.letterId && prev.moduleId === item.moduleId && shuffled.length > 1) {
        continue
      }
    }
    result.push(item)
  }

  return result
}
