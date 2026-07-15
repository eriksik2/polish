import { useState } from 'react'
import { getUnit } from '../../data/moduleRegistry'
import { getWord } from '../../data/wordBank'
import { getBasicWord } from '../../data/basicWords'
import { hasUnitRecording, hasWordPlayback, getWordAudioSource, playUnitAudio, playWordAudio, wordAudioSourceLabel } from '../../lib/speech/audio'
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

function WordBadge({ wordId }: { wordId: string }) {
  const [playing, setPlaying] = useState(false)
  const word = getWord(wordId)
  const basic = getBasicWord(wordId)
  if (!word) return null

  const playable = hasWordPlayback(wordId)
  const audioSource = getWordAudioSource(wordId)
  const fallbackLabel = wordAudioSourceLabel(audioSource)

  const handleClick = () => {
    if (!playable) return
    haptic('tap')
    setPlaying(true)
    playWordAudio(wordId, {
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!playable}
      title={playable ? `${word.meaning} — tap to hear` : word.meaning}
      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
        playing
          ? 'border-amber-400/50 bg-amber-500/15 ring-2 ring-amber-400/40'
          : playable
            ? 'border-slate-700 bg-slate-800 active:scale-[0.98] hover:border-slate-500'
            : 'border-slate-800 bg-slate-800/60 cursor-default'
      }`}
    >
      <span className="block font-serif text-lg text-red-400">{word.word}</span>
      <span className="block text-xs text-slate-500 mt-0.5">{word.meaning}</span>
      {fallbackLabel && (
        <span className="block text-[10px] text-amber-500/80 mt-1">{fallbackLabel}</span>
      )}
      {basic?.tip && (
        <span className="block text-[10px] text-slate-600 mt-1">{basic.tip}</span>
      )}
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
          case 'words':
            return (
              <div key={i}>
                {block.title && (
                  <p className="text-xs text-slate-500 mb-2">{block.title}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {block.wordIds.map((wordId) => (
                    <WordBadge key={wordId} wordId={wordId} />
                  ))}
                </div>
              </div>
            )
          case 'divider':
            return <hr key={i} className="border-slate-800" />
          default:
            return null
        }
      })}
    </div>
  )
}
