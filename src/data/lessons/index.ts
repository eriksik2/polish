import { ALPHABET_LESSON } from './alphabet'
import { DIGRAPHS_LESSON } from './digraphs'
import { GREETINGS_LESSON } from './greetings'
import { NUMBERS_LESSON } from './numbers'
import type { LessonCategoryId, StructuredLesson } from '../../types/lesson'
import { LESSON_CATEGORIES } from '../../types/lesson'

export const STRUCTURED_LESSONS: StructuredLesson[] = [
  ALPHABET_LESSON,
  DIGRAPHS_LESSON,
  GREETINGS_LESSON,
  NUMBERS_LESSON,
]

export const LESSON_MAP = new Map(STRUCTURED_LESSONS.map((l) => [l.id, l]))

export function getLesson(id: string): StructuredLesson | undefined {
  return LESSON_MAP.get(id)
}

export function getLessonsForModule(moduleId: string): StructuredLesson[] {
  return STRUCTURED_LESSONS.filter((l) => l.moduleId === moduleId)
}

export function getLessonsByCategory(categoryId: LessonCategoryId): StructuredLesson[] {
  return STRUCTURED_LESSONS.filter((l) => l.category === categoryId)
}

export { LESSON_CATEGORIES }

/** Map unit/word id → section id for remediation after final quiz */
export function sectionForUnit(lesson: StructuredLesson, unitId: string): string | undefined {
  for (const section of lesson.sections) {
    if (section.practice?.unitIds.includes(unitId)) return section.id
    if (section.practice?.wordIds?.includes(unitId)) return section.id
    if (section.kind === 'teach' && section.blocks.some((b) => {
      if (b.type === 'units' && b.unitIds.includes(unitId)) return true
      if (b.type === 'words' && b.wordIds.includes(unitId)) return true
      return false
    })) {
      return section.id
    }
  }
  return lesson.sections.find((s) => s.kind === 'intro')?.id
}

/** All word ids referenced in a lesson (for vocab exercise pools) */
export function lessonWordPool(lesson: StructuredLesson): string[] {
  const ids = new Set<string>()
  for (const section of lesson.sections) {
    section.practice?.wordIds?.forEach((id) => ids.add(id))
    for (const block of section.blocks) {
      if (block.type === 'words') block.wordIds.forEach((id) => ids.add(id))
    }
  }
  lesson.finalQuiz.wordIds?.forEach((id) => ids.add(id))
  return [...ids]
}
