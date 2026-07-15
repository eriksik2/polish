import { useState } from 'react'
import { getUnit } from '../../data/moduleRegistry'
import { hasUnitRecording, playUnitAudio } from '../../lib/speech/audio'
import { haptic } from '../../lib/feedback'
import type { LessonBlock } from '../../types/lesson'
import type { PolishLetter } from '../../data/moduleRegistry'

function LetterBadge({
  unit,
  moduleId,
}: {
  unit: PolishLetter
  moduleId: string
}) {
  const [playing, setPlaying] = useState(false)
  const playable = hasUnitRecording(moduleId, unit.id)

  const handleClick = () => {
    if (!playable) return
    haptic('tap')
    setPlaying(true)
    playUnitAudio(moduleId, unit.id, {
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!playable}
      title={playable ? `${unit.englishApprox} — tap to hear` : unit.englishApprox}
      className={`rounded-lg px-3 py-2 font-serif text-xl transition-colors ${
        playing
          ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/50'
          : playable
            ? 'bg-slate-800 text-red-400 active:scale-95 hover:bg-slate-700'
            : 'bg-slate-800/60 text-red-400/70 cursor-default'
      }`}
    >
      {unit.upper}
    </button>
  )
}

export function LessonContent({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3 key={i} className="text-lg font-semibold text-slate-100 pt-2">
                {block.text}
              </h3>
            )
          case 'paragraph':
            return (
              <p key={i} className="text-slate-300">
                {block.text}
              </p>
            )
          case 'tip':
            return (
              <p key={i} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90">
                💡 {block.text}
              </p>
            )
          case 'units': {
            const units = block.unitIds
              .map((id: string) => getUnit(block.moduleId, id))
              .filter((u): u is PolishLetter => Boolean(u))
            return (
              <div key={i}>
                {block.title && (
                  <p className="text-xs text-slate-500 mb-2">{block.title}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {units.map((u) => (
                    <LetterBadge key={u.id} unit={u} moduleId={block.moduleId} />
                  ))}
                </div>
              </div>
            )
          }
          case 'divider':
            return <hr key={i} className="border-slate-800" />
          default:
            return null
        }
      })}
    </div>
  )
}
