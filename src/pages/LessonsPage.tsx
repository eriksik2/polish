import { useSearchParams } from 'react-router-dom'
import { getModuleUnits, getUnit, getGeneralLesson } from '../data/moduleRegistry'
import { UnitGrid, WordGrid, getKnowledgeWords } from '../components/LessonDrawer'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'
import { useMemo, useState } from 'react'
import { getModuleInfo } from '../data/moduleRegistry'

export function LessonsPage() {
  const [params] = useSearchParams()
  const moduleId = params.get('module') ?? 'alphabet'
  const moduleInfo = getModuleInfo(moduleId)
  const { openLesson, openWord, openGeneralLesson } = useLessonDrawer()
  const { settings } = useSettings()
  const [wordFilter, setWordFilter] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const units = getModuleUnits(moduleId)
  const generalLesson = getGeneralLesson(moduleId)
  const unit = selected ? getUnit(moduleId, selected) : null
  const allWords = useMemo(() => getKnowledgeWords(moduleId), [moduleId])
  const filteredWords = useMemo(() => {
    const q = wordFilter.trim().toLowerCase()
    if (!q) return allWords
    return allWords.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q),
    )
  }, [allWords, wordFilter])

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Knowledge base</h1>
        <p className="text-sm text-slate-400">
          {moduleInfo?.title ?? moduleId} — letters, digraphs & vocabulary
        </p>
      </header>

      {generalLesson && (
        <button
          type="button"
          onClick={() => openGeneralLesson(moduleId)}
          className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left"
        >
          <h2 className="font-semibold text-red-400">{generalLesson.title}</h2>
          <p className="text-sm text-slate-400 mt-1">Module overview and study tips</p>
        </button>
      )}

      {units.length > 0 && (
      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">
          Letters & digraphs ({units.length})
        </h2>
        <UnitGrid
          moduleId={moduleId}
          onSelect={(id) => {
            setSelected(id)
            openLesson(moduleId, [id])
          }}
        />
      </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-medium text-slate-400">
            Words ({allWords.length})
          </h2>
        </div>
        <input
          type="search"
          value={wordFilter}
          onChange={(e) => setWordFilter(e.target.value)}
          placeholder="Search words…"
          className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
        <WordGrid
          moduleId={moduleId}
          words={filteredWords}
          onSelect={(id) => openWord(moduleId, id)}
        />
      </section>

      {unit && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-serif text-red-400">{unit.upper}</span>
            <div>
              <p className="font-medium">{unit.polishName}</p>
              {settings?.showIpaInLessons && (
                <p className="font-mono text-sm text-slate-500">{unit.ipa}</p>
              )}
            </div>
          </div>
          <p className="text-slate-300">{unit.englishApprox}</p>
          <div className="flex flex-wrap gap-2">
            {unit.examples.map((ex) => (
              <span key={ex.word} className="rounded-lg bg-slate-800 px-2 py-1 text-sm">
                {ex.word} <span className="text-slate-500">({ex.meaning})</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
