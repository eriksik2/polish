import type { LessonProgress, StructuredLesson } from '../types/lesson'
import { db } from './db'

function defaultProgress(lessonId: string): LessonProgress {
  return {
    lessonId,
    completedSectionIds: [],
    readSectionIds: [],
    finalQuizPassed: false,
    weakSectionIds: [],
  }
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | undefined> {
  const record = await db.lessonProgress.get(lessonId)
  if (!record) return undefined
  return {
    ...record,
    readSectionIds: record.readSectionIds ?? [],
  }
}

export async function saveLessonProgress(progress: LessonProgress): Promise<void> {
  await db.lessonProgress.put(progress)
}

export async function markSectionRead(lessonId: string, sectionId: string): Promise<void> {
  const existing = (await getLessonProgress(lessonId)) ?? defaultProgress(lessonId)
  if (!existing.readSectionIds.includes(sectionId)) {
    existing.readSectionIds.push(sectionId)
  }
  await saveLessonProgress(existing)
}

export async function markSectionComplete(lessonId: string, sectionId: string): Promise<void> {
  const existing = (await getLessonProgress(lessonId)) ?? defaultProgress(lessonId)
  if (!existing.completedSectionIds.includes(sectionId)) {
    existing.completedSectionIds.push(sectionId)
  }
  if (!existing.readSectionIds.includes(sectionId)) {
    existing.readSectionIds.push(sectionId)
  }
  await saveLessonProgress(existing)
}

export async function markLessonComplete(
  lessonId: string,
  weakSectionIds: string[] = [],
): Promise<void> {
  const existing = (await getLessonProgress(lessonId)) ?? defaultProgress(lessonId)
  existing.finalQuizPassed = true
  existing.completedAt = Date.now()
  existing.weakSectionIds = weakSectionIds
  await saveLessonProgress(existing)
}

/** One progress unit per intro/recap (read), teach section (quiz passed), and final quiz */
export function lessonProgressUnits(lesson: StructuredLesson): number {
  let units = 1 // final quiz
  for (const section of lesson.sections) {
    if (section.kind === 'intro' || section.kind === 'recap') units++
    else if (section.practice) units++
  }
  return units
}

export function computeLessonProgressPercent(
  lesson: StructuredLesson,
  progress?: LessonProgress,
): number {
  if (!progress) return 0
  const total = lessonProgressUnits(lesson)
  if (total === 0) return 0

  let done = 0
  if (progress.finalQuizPassed) done++

  for (const section of lesson.sections) {
    if (section.kind === 'intro' || section.kind === 'recap') {
      if (progress.readSectionIds.includes(section.id)) done++
    } else if (section.practice && progress.completedSectionIds.includes(section.id)) {
      done++
    }
  }

  return Math.round((done / total) * 100)
}

export function sectionProgressState(
  section: StructuredLesson['sections'][number],
  progress?: LessonProgress,
): 'unstarted' | 'in-progress' | 'complete' {
  if (!progress) return 'unstarted'
  if (section.kind === 'intro' || section.kind === 'recap') {
    return progress.readSectionIds.includes(section.id) ? 'complete' : 'unstarted'
  }
  if (progress.completedSectionIds.includes(section.id)) return 'complete'
  if (progress.readSectionIds.includes(section.id)) return 'in-progress'
  return 'unstarted'
}

export function isLessonComplete(progress: LessonProgress | undefined, lesson: StructuredLesson): boolean {
  if (!progress?.finalQuizPassed) return false
  return computeLessonProgressPercent(lesson, progress) === 100
}
