import type { LessonProgress } from '../types/lesson'
import { db } from './db'

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | undefined> {
  return db.lessonProgress.get(lessonId)
}

export async function saveLessonProgress(progress: LessonProgress): Promise<void> {
  await db.lessonProgress.put(progress)
}

export async function markSectionComplete(lessonId: string, sectionId: string): Promise<void> {
  const existing = (await getLessonProgress(lessonId)) ?? {
    lessonId,
    completedSectionIds: [],
    finalQuizPassed: false,
    weakSectionIds: [],
  }
  if (!existing.completedSectionIds.includes(sectionId)) {
    existing.completedSectionIds.push(sectionId)
  }
  await saveLessonProgress(existing)
}

export async function markLessonComplete(
  lessonId: string,
  weakSectionIds: string[] = [],
): Promise<void> {
  const existing = (await getLessonProgress(lessonId)) ?? {
    lessonId,
    completedSectionIds: [],
    finalQuizPassed: false,
    weakSectionIds: [],
  }
  existing.finalQuizPassed = true
  existing.completedAt = Date.now()
  existing.weakSectionIds = weakSectionIds
  await saveLessonProgress(existing)
}

export function isLessonComplete(progress: LessonProgress | undefined, sectionIds: string[]): boolean {
  if (!progress?.finalQuizPassed) return false
  return sectionIds.every((id) => progress.completedSectionIds.includes(id) || true)
}
