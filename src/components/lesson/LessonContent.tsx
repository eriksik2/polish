import { getUnit } from '../../data/moduleRegistry'
import { hasUnitRecording, playUnitAudio } from '../../lib/speech/audio'
import { haptic } from '../../lib/feedback'
import type { LessonBlock } from '../../types/lesson'
import type { PolishLetter } from '../../data/moduleRegistry'

function AudioButton({
  moduleId,
  unitId,
  label,
}: {
  moduleId: string
  unitId: string
  label?: string
}) {
  if (!hasUnitRecording(moduleId, unitId)) return null
  return (
    <button
      type="button"
      onClick={() => {
        haptic('tap')
        playUnitAudio(moduleId, unitId)
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-red-600/20 border border-red-500/30 px-4 py-2.5 text-sm text-red-300 active:scale-[0.98]"
    >
      🔊 {label ?? `Play ${unitId}`}
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
          case 'audio':
            return (
              <div key={i}>
                <AudioButton
                  moduleId={block.moduleId}
                  unitId={block.unitId}
                  label={block.label}
                />
              </div>
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
                  {units.map((u) => u && (
                    <span
                      key={u.id}
                      className="rounded-lg bg-slate-800 px-3 py-2 font-serif text-xl text-red-400"
                      title={u.englishApprox}
                    >
                      {u.upper}
                    </span>
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
