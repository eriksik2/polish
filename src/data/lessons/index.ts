import { ALPHABET_LESSON } from './alphabet'
import { DIGRAPHS_LESSON } from './digraphs'
import type { StructuredLesson } from '../../types/lesson'

export const STRUCTURED_LESSONS: StructuredLesson[] = [ALPHABET_LESSON, DIGRAPHS_LESSON]

export const LESSON_MAP = new Map(STRUCTURED_LESSONS.map((l) => [l.id, l]))

export function getLesson(id: string): StructuredLesson | undefined {
  return LESSON_MAP.get(id)
}

export function getLessonsForModule(moduleId: string): StructuredLesson[] {
  return STRUCTURED_LESSONS.filter((l) => l.moduleId === moduleId)
}

/** Map unit id → section id for remediation after final quiz */
export function sectionForUnit(lesson: StructuredLesson, unitId: string): string | undefined {
  for (const section of lesson.sections) {
    if (section.practice?.unitIds.includes(unitId)) return section.id
    if (section.kind === 'teach' && section.blocks.some(
      (b) => b.type === 'units' && b.unitIds.includes(unitId),
    )) {
      return section.id
    }
  }
  return lesson.sections.find((s) => s.kind === 'intro')?.id
}
