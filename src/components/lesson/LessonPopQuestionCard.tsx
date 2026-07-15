import { useState } from 'react'
import type { LessonPopQuestion } from '../../types/lesson'
import { haptic } from '../../lib/feedback'

interface LessonPopQuestionCardProps {
  question: LessonPopQuestion
  onAnswer: (correct: boolean) => void
  onContinue: () => void
}

export function LessonPopQuestionCard({
  question,
  onAnswer,
  onContinue,
}: LessonPopQuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (selected === null || submitted) return
    const correct = selected === question.correctIndex
    setSubmitted(true)
    haptic(correct ? 'success' : 'error')
    onAnswer(correct)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-400/90">Pop quiz</p>
      <p className="text-base font-medium text-slate-100">{question.prompt}</p>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selected === i
          const isCorrect = submitted && i === question.correctIndex
          const isWrong = submitted && isSelected && i !== question.correctIndex

          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => {
                if (submitted) return
                haptic('tap')
                setSelected(i)
              }}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isCorrect
                  ? 'border-green-500/50 bg-green-500/15 text-green-200'
                  : isWrong
                    ? 'border-red-500/50 bg-red-500/15 text-red-200'
                    : isSelected
                      ? 'border-red-400 bg-red-500/15 text-slate-100'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={selected === null}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-red-600 py-3.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          Check
        </button>
      ) : (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          {question.explanation && (
            <p className="text-sm text-slate-400">{question.explanation}</p>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl bg-slate-700 py-3 font-semibold text-slate-100 active:scale-[0.98] transition-transform"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
