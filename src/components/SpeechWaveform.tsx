interface SpeechWaveformProps {
  levels: number[]
  active: boolean
  status?: 'idle' | 'listening' | 'processing'
}

export function SpeechWaveform({ levels, active, status = 'idle' }: SpeechWaveformProps) {
  const bars = levels.length > 0 ? levels : Array.from({ length: 28 }, () => 0.08)
  const processing = status === 'processing'

  return (
    <div
      className={`flex h-16 w-full items-center justify-center gap-0.5 rounded-xl border px-3 ${
        active
          ? processing
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-red-500/40 bg-red-500/5'
          : 'border-slate-700 bg-slate-800/50'
      }`}
      aria-hidden
    >
      {bars.map((level, i) => {
        const h = Math.max(4, Math.round(level * 48))
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-[height] duration-75 ${
              active
                ? processing
                  ? 'bg-amber-400'
                  : 'bg-red-400'
                : 'bg-slate-600'
            }`}
            style={{ height: `${h}px` }}
          />
        )
      })}
    </div>
  )
}
