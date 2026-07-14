import type { FeedbackResult } from '../lib/feedback'

interface FeedbackOverlayProps {
  result: FeedbackResult
  message?: string
}

export function FeedbackOverlay({ result, message }: FeedbackOverlayProps) {
  if (!result) return null

  const correct = result === 'correct'

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      aria-live="polite"
    >
      <div
        className={`flex flex-col items-center gap-3 rounded-3xl px-10 py-8 shadow-2xl backdrop-blur-md ${
          correct
            ? 'bg-green-500/20 border border-green-400/40 animate-celebrate'
            : 'bg-red-500/20 border border-red-400/40 animate-shake'
        }`}
      >
        <span
          className={`text-6xl ${correct ? 'animate-pop' : ''}`}
          role="img"
          aria-hidden
        >
          {correct ? '🎉' : '😬'}
        </span>
        <p className={`text-xl font-bold ${correct ? 'text-green-300' : 'text-red-300'}`}>
          {message ?? (correct ? 'Correct!' : 'Not quite')}
        </p>
        {correct && (
          <div className="flex gap-1" aria-hidden>
            {['✨', '⭐', '✨'].map((s, i) => (
              <span key={i} className="animate-sparkle text-lg" style={{ animationDelay: `${i * 0.1}s` }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
