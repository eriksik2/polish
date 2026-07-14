import type { ReviewItem } from '../lib/explanations'
import { playReviewItemAudio } from '../lib/answerAudio'
import { hasUnitRecording, hasWordRecording } from '../lib/speech/audio'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { resolveUnitModule } from '../data/moduleRegistry'
import { haptic } from '../lib/feedback'

interface AnswerReviewProps {
  items: ReviewItem[]
  moduleId: string
}

function itemHasAudio(item: ReviewItem): boolean {
  if (item.wordId) return hasWordRecording(item.wordId)
  if (item.unitId) {
    const mod = item.unitModuleId ?? resolveUnitModule(item.unitId)
    return hasUnitRecording(mod, item.unitId)
  }
  return false
}

function itemIsOpenable(item: ReviewItem): boolean {
  return Boolean(item.unitId || item.wordId)
}

export function AnswerReview({ items, moduleId }: AnswerReviewProps) {
  const { openLesson, openWord } = useLessonDrawer()

  if (items.length === 0) return null

  const openItem = (item: ReviewItem) => {
    haptic('tap')
    if (item.wordId) {
      openWord(moduleId, item.wordId)
      return
    }
    if (item.unitId) {
      openLesson(item.unitModuleId ?? resolveUnitModule(item.unitId), [item.unitId])
    }
  }

  const playItem = (item: ReviewItem) => {
    haptic('tap')
    playReviewItemAudio(item)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-300">Answer breakdown</p>

      {items.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className={`rounded-xl border p-4 text-sm ${
            item.status === 'correct'
              ? 'border-green-500/40 bg-green-500/10'
              : item.status === 'your-answer'
                ? 'border-red-500/40 bg-red-500/10'
                : 'border-slate-700 bg-slate-800/50'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className={`font-semibold flex-1 ${
                item.status === 'correct'
                  ? 'text-green-300'
                  : item.status === 'your-answer'
                    ? 'text-red-300'
                    : 'text-slate-300'
              }`}
            >
              {item.heading}
            </p>
            <div className="flex shrink-0 gap-1">
              {itemHasAudio(item) && (
                <button
                  type="button"
                  onClick={() => playItem(item)}
                  className="rounded-lg bg-slate-800/80 px-2 py-1 text-base leading-none"
                  aria-label="Play sound"
                >
                  🔊
                </button>
              )}
              {itemIsOpenable(item) && (
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="rounded-lg bg-slate-800/80 px-2 py-1 text-xs text-red-400"
                >
                  Info
                </button>
              )}
            </div>
          </div>
          <p className="text-slate-400 leading-relaxed">{item.body}</p>
        </div>
      ))}
    </div>
  )
}
