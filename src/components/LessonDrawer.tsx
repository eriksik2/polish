import { getWord, WORD_BANK, type WordEntry } from '../data/wordBank'
import { getModuleUnits, getUnit, getGeneralLesson, resolveUnitModule } from '../data/moduleRegistry'
import {
  getConstituents,
  getKnowledgeNode,
  getLemmaForms,
  getParents,
  getTeachesWords,
  CASE_USAGE_RULES,
} from '../data/knowledge/registry'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'
import {
  hasUnitRecording,
  hasWordPlayback,
  getWordAudioSource,
  playUnitAudio,
  playWordAudio,
  wordAudioSourceLabel,
} from '../lib/speech/audio'
import { haptic } from '../lib/feedback'
import type { KnowledgeNode } from '../data/knowledge/types'

function LinkChip({
  label,
  sublabel,
  onClick,
}: {
  label: string
  sublabel?: string
  onClick?: () => void
}) {
  const className =
    'rounded-lg bg-slate-800 px-2.5 py-1 text-sm font-serif text-left hover:bg-slate-700 transition-colors'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <span className="text-red-400">{label}</span>
        {sublabel && <span className="block text-[10px] text-slate-500 truncate">{sublabel}</span>}
      </button>
    )
  }
  return (
    <span className={className}>
      <span className="text-red-400">{label}</span>
      {sublabel && <span className="block text-[10px] text-slate-500 truncate">{sublabel}</span>}
    </span>
  )
}

function useKnowledgeNavigation() {
  const { openLesson, openWord } = useLessonDrawer()
  return {
    openNode: (node: KnowledgeNode) => {
      haptic('tap')
      if (node.kind === 'letter') openLesson('alphabet', [node.id])
      else if (node.kind === 'digraph') openLesson('digraphs', [node.id])
      else if (node.kind === 'word' || node.kind === 'phrase' || node.kind === 'case') {
        openWord('basic-words', node.id)
      }
    },
  }
}

function ConstituentsSection({ nodeId, title }: { nodeId: string; title: string }) {
  const { openNode } = useKnowledgeNavigation()
  const parts = getConstituents(nodeId)
  if (!parts.length) return null
  return (
    <div>
      <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {parts.map((p) => (
          <LinkChip
            key={p.id}
            label={p.label}
            sublabel={p.meaning}
            onClick={() => openNode(p)}
          />
        ))}
      </div>
    </div>
  )
}

function ParentsSection({ nodeId }: { nodeId: string }) {
  const { openNode } = useKnowledgeNavigation()
  const parents = getParents(nodeId).filter(
    (p) => p.kind === 'phrase' || p.kind === 'letter' || p.kind === 'digraph' || p.kind === 'word',
  )
  if (!parents.length) return null
  return (
    <div>
      <p className="text-sm font-medium text-slate-400 mb-2">Part of</p>
      <div className="flex flex-wrap gap-2">
        {parents.map((p) => (
          <LinkChip
            key={p.id}
            label={p.label}
            sublabel={p.meaning}
            onClick={() => openNode(p)}
          />
        ))}
      </div>
    </div>
  )
}

function UnitEntry({
  moduleId,
  letterId,
}: {
  moduleId: string
  letterId: string
}) {
  const { settings } = useSettings()
  const { openNode } = useKnowledgeNavigation()
  const letter = getUnit(moduleId, letterId)
  if (!letter) return null

  const node = getKnowledgeNode(letterId)
  const exampleWords = getTeachesWords(letterId)

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
            <p className="text-sm text-slate-400">
              {letter.polishName} · {node?.kind ?? letter.category}
            </p>
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

      {node?.kind === 'digraph' && (
        <ConstituentsSection nodeId={letterId} title="Made of letters" />
      )}

      {exampleWords.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-400">Example words</p>
          <div className="flex flex-wrap gap-2">
            {exampleWords.map((ex) => (
              <LinkChip
                key={ex.id}
                label={ex.label}
                sublabel={ex.meaning}
                onClick={() => openNode(ex)}
              />
            ))}
          </div>
        </div>
      )}

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

function CaseEntryPanel({ node }: { node: KnowledgeNode }) {
  const audioSource = getWordAudioSource(node.id)
  const fallbackLabel = wordAudioSourceLabel(audioSource)
  const lemma = node.lemmaId ? getKnowledgeNode(node.lemmaId) : undefined
  const rule = CASE_USAGE_RULES.find((r) => r.case === node.case)
  const { openNode } = useKnowledgeNavigation()

  const playSound = () => {
    haptic('tap')
    playWordAudio(node.id)
  }

  return (
    <div className="mb-6 space-y-3 border-b border-slate-800 pb-6 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-500/80">Case form</p>
          <p className="text-3xl font-serif text-red-400">{node.label}</p>
          <p className="text-sm text-slate-400 mt-1">{node.meaning}</p>
          {node.case && (
            <p className="text-xs text-slate-500 mt-1 capitalize">{node.case}</p>
          )}
          {fallbackLabel && (
            <p className="text-[10px] text-amber-500/80 mt-1">{fallbackLabel}</p>
          )}
        </div>
        {hasWordPlayback(node.id) && (
          <button
            type="button"
            onClick={playSound}
            className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-lg"
            aria-label={`Play ${node.label}`}
          >
            🔊
          </button>
        )}
      </div>

      {node.usageNote && (
        <div className="rounded-xl bg-slate-800/60 p-3">
          <p className="text-sm font-medium text-slate-300">When to use</p>
          <p className="text-sm text-slate-400 mt-1">{node.usageNote}</p>
        </div>
      )}

      {rule && (
        <div className="rounded-xl bg-slate-800/40 p-3">
          <p className="text-sm font-medium text-slate-300 capitalize">{rule.case}</p>
          <p className="text-sm text-slate-400 mt-1">{rule.summary}</p>
        </div>
      )}

      {lemma && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Lemma</p>
          <LinkChip label={lemma.label} sublabel={lemma.meaning} onClick={() => openNode(lemma)} />
        </div>
      )}

      <ConstituentsSection nodeId={node.id} title="Graphemes" />
    </div>
  )
}

function WordEntryPanel({ word }: { word: WordEntry }) {
  const audioSource = getWordAudioSource(word.id)
  const fallbackLabel = wordAudioSourceLabel(audioSource)
  const node = getKnowledgeNode(word.id)
  const { openNode } = useKnowledgeNavigation()

  const playSound = () => {
    haptic('tap')
    playWordAudio(word.id)
  }

  return (
    <div className="mb-6 space-y-3 border-b border-slate-800 pb-6 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          {node?.kind === 'phrase' && (
            <p className="text-xs uppercase tracking-wide text-sky-500/80">Phrase</p>
          )}
          <p className="text-3xl font-serif text-red-400">{word.word}</p>
          <p className="text-sm text-slate-400 mt-1">{word.meaning}</p>
          {word.tip && <p className="text-xs text-amber-200/70 mt-1">{word.tip}</p>}
          {fallbackLabel && (
            <p className="text-[10px] text-amber-500/80 mt-1">{fallbackLabel}</p>
          )}
        </div>
        {hasWordPlayback(word.id) && (
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

      {node?.kind === 'phrase' && word.wordIds && (
        <ConstituentsSection nodeId={word.id} title="Made of words" />
      )}

      {node?.kind !== 'phrase' && (
        <ConstituentsSection nodeId={word.id} title="Graphemes" />
      )}

      {word.unitLinks.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Teaches</p>
          <div className="flex flex-wrap gap-2">
            {word.unitLinks.map((link) => {
              const mod = resolveUnitModule(link.unitId)
              const unit = getUnit(mod, link.unitId)
              const unitNode = getKnowledgeNode(link.unitId)
              return (
                <LinkChip
                  key={`${link.unitId}-${link.index}`}
                  label={unit?.upper ?? link.unitId}
                  onClick={unitNode ? () => openNode(unitNode) : undefined}
                />
              )
            })}
          </div>
        </div>
      )}

      <ParentsSection nodeId={word.id} />

      {node && getLemmaForms(word.id).length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Case forms</p>
          <div className="flex flex-wrap gap-2">
            {getLemmaForms(word.id).map((form) => (
              <LinkChip
                key={form.id}
                label={form.label}
                sublabel={form.case}
                onClick={() => openNode(form)}
              />
            ))}
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
  const caseNodes = state.wordIds
    .map((id) => getKnowledgeNode(id))
    .filter((n): n is KnowledgeNode => n?.kind === 'case')

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

        {words
          .filter((w) => getKnowledgeNode(w.id)?.kind !== 'case')
          .map((word) => (
            <WordEntryPanel key={word.id} word={word} />
          ))}

        {caseNodes.map((node) => (
          <CaseEntryPanel key={node.id} node={node} />
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
  words,
  onSelect,
  badge,
}: {
  moduleId?: string
  words: WordEntry[]
  onSelect: (wordId: string) => void
  badge?: (word: WordEntry) => string | null
}) {
  const sorted = [...words].sort((a, b) => a.word.localeCompare(b.word, 'pl'))

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
          {badge?.(w) && (
            <span className="block text-[10px] text-slate-600 mt-0.5">{badge(w)}</span>
          )}
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

export function getKnowledgeByType(
  type: 'letters' | 'digraphs' | 'words' | 'phrases' | 'cases',
): WordEntry[] | { id: string; label: string }[] {
  if (type === 'letters') {
    return WORD_BANK.filter(() => false)
  }
  if (type === 'words') {
    return WORD_BANK.filter((w) => w.kind !== 'phrase' && w.modules.includes('basic-words'))
  }
  if (type === 'phrases') {
    return WORD_BANK.filter((w) => w.kind === 'phrase')
  }
  if (type === 'cases') {
    return WORD_BANK.filter((w) => getKnowledgeNode(w.id)?.kind === 'case')
  }
  return []
}
