import type { ReviewItem } from '../lib/explanations'

interface AnswerReviewProps {
  items: ReviewItem[]
}

export function AnswerReview({ items }: AnswerReviewProps) {
  if (items.length === 0) return null

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
          <p
            className={`font-semibold mb-1 ${
              item.status === 'correct'
                ? 'text-green-300'
                : item.status === 'your-answer'
                  ? 'text-red-300'
                  : 'text-slate-300'
            }`}
          >
            {item.heading}
          </p>
          <p className="text-slate-400 leading-relaxed">{item.body}</p>
        </div>
      ))}
    </div>
  )
}
