import { getWord, WORD_BANK, type WordEntry } from '../data/wordBank'
import { getModuleUnits, getUnit, getGeneralLesson, resolveUnitModule } from '../data/moduleRegistry'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'
import { hasUnitRecording, hasWordRecording, playUnitAudio, playWordAudio } from '../lib/speech/audio'
import { haptic } from '../lib/feedback'

function UnitEntry({
  moduleId,
  letterId,
}: {
  moduleId: string
  letterId: string
}) {
  const { settings } = useSettings()
  const letter = getUnit(moduleId, letterId)
  if (!letter) return null

  const playSound = () => {
    haptic('tap')
    playUnitAudio(moduleId, letter.id)
  }

  return (
    <div className="mb-6 space-y-3 border-b border-slate-800 pb-6 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="text-5xl font-serif text-red-400">{letter.upper}</span>
          <div>
            <p className="text-sm text-slate-400">{letter.polishName} · {letter.category}</p>
            {settings?.showIpaInLessons && (
              <p className="font-mono text-sm text-slate-500">{letter.ipa}</p>
            )}
          </div>
        </div>
        {hasUnitRecording(moduleId, letter.id) && (
          <button
            type="button"
            onClick={playSound}
            className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-lg"
            aria-label={`Play ${letter.upper} sound`}
          >
            🔊
          </button>
        )}
      </div>

      <div className="rounded-xl bg-slate-800/60 p-3">
        <p className="text-sm font-medium text-slate-300">Sound</p>
        <p className="text-slate-100">{letter.englishApprox}</p>
      </div>

      {letter.tips.length > 0 && (
        <ul className="space-y-1 text-sm text-amber-200/80">
          {letter.tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-slate-400">Examples</p>
        <div className="flex flex-wrap gap-2">
          {letter.examples.map((ex) => (
            <span
              key={ex.word}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm"
              title={ex.meaning}
            >
              <span className="text-red-400 font-medium">
                {ex.word.replace(new RegExp(`(${ex.highlight})`, 'i'), '[$1]')}
              </span>
              <span className="text-slate-500 ml-1">({ex.meaning})</span>
            </span>
          ))}
        </div>
      </div>

      {letter.confusedWith && (
        <p className="text-xs text-slate-500">
          Often confused with:{' '}
          {letter.confusedWith
            .map((id) => getUnit(moduleId, id)?.upper ?? id)
            .join(', ')}
        </p>
      )}
    </div>
  )
}

function WordEntryPanel({ word }: { word: WordEntry }) {
  const playSound = () => {
    haptic('tap')
    playWordAudio(word.id)
  }

  return (
    <div className="mb-6 space-y-3 border-b border-slate-800 pb-6 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl font-serif text-red-400">{word.word}</p>
          <p className="text-sm text-slate-400 mt-1">{word.meaning}</p>
        </div>
        {hasWordRecording(word.id) && (
          <button
            type="button"
            onClick={playSound}
            className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-lg"
            aria-label={`Play ${word.word}`}
          >
            🔊
          </button>
        )}
      </div>

      <div className="rounded-xl bg-slate-800/60 p-3">
        <p className="text-sm font-medium text-slate-300 mb-1">Graphemes</p>
        <p className="text-xl font-serif text-slate-100 tracking-wide">
          {word.graphemes.join(' · ')}
        </p>
      </div>

      {word.unitLinks.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Teaches</p>
          <div className="flex flex-wrap gap-2">
            {word.unitLinks.map((link) => {
              const mod = resolveUnitModule(link.unitId)
              const unit = getUnit(mod, link.unitId)
              return (
                <span
                  key={`${link.unitId}-${link.index}`}
                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-serif"
                >
                  {unit?.upper ?? link.unitId}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function LessonDrawer() {
  const { state, closeLesson } = useLessonDrawer()

  if (!state.open) return null

  const generalLesson = state.showGeneral ? getGeneralLesson(state.moduleId) : null
  const words = state.wordIds.map((id) => getWord(id)).filter(Boolean) as WordEntry[]

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={closeLesson}
        aria-label="Close knowledge panel"
      />
      <div className="relative max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-slate-900 border-t border-slate-700 p-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Knowledge</h2>
          <button
            type="button"
            onClick={closeLesson}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
          >
            Close
          </button>
        </div>

        {generalLesson && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-red-400">{generalLesson.title}</h3>
            {generalLesson.sections.map((s) => (
              <div key={s.heading}>
                <h4 className="font-semibold text-slate-200">{s.heading}</h4>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {state.letterIds.map((id) => (
          <UnitEntry key={id} moduleId={state.moduleId} letterId={id} />
        ))}

        {words.map((word) => (
          <WordEntryPanel key={word.id} word={word} />
        ))}
      </div>
    </div>
  )
}

export function UnitGrid({
  moduleId,
  onSelect,
}: {
  moduleId: string
  onSelect: (id: string) => void
}) {
  const units = getModuleUnits(moduleId)
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onSelect(u.id)}
          className="aspect-square rounded-xl bg-slate-800/80 text-xl font-serif hover:bg-slate-700 active:scale-95 transition-transform px-1"
        >
          {u.upper}
        </button>
      ))}
    </div>
  )
}

export function WordGrid({
  moduleId,
  words,
  onSelect,
}: {
  moduleId: string
  words: WordEntry[]
  onSelect: (wordId: string) => void
}) {
  const filtered = words.filter((w) => w.modules.includes(moduleId as 'alphabet' | 'digraphs'))
  const sorted = [...filtered].sort((a, b) => a.word.localeCompare(b.word, 'pl'))

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {sorted.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onSelect(w.id)}
          className="rounded-xl bg-slate-800/80 px-3 py-2.5 text-left hover:bg-slate-700 active:scale-[0.98] transition-transform"
        >
          <span className="block font-serif text-red-400">{w.word}</span>
          <span className="block text-xs text-slate-500 truncate">{w.meaning}</span>
        </button>
      ))}
    </div>
  )
}

export function getKnowledgeWords(moduleId: string): WordEntry[] {
  return WORD_BANK.filter((w) =>
    w.modules.includes(moduleId as 'alphabet' | 'digraphs' | 'basic-words'),
  )
}
