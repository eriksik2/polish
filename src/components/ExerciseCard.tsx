import { getWord } from '../data/wordBank'
import { getUnit } from '../data/moduleRegistry'
import type { Exercise } from '../lib/exercises'
import {
  checkLetterInput,
  getOptionUnits,
  getOptionWords,
  getSelectedUnitId,
  getSelectedWordId,
  sequencesMatch,
} from '../lib/exercises'
import { playGraphemeSequence, playUnitAudio, playWordAudio, stopUnitAudio } from '../lib/speech/audio'
import { useSettings } from '../hooks/useSettings'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { listenInteractive, scorePronunciation, isSTTSupported } from '../lib/speech/stt'
import { haptic, type FeedbackResult } from '../lib/feedback'
import { FeedbackOverlay } from './FeedbackOverlay'
import { AnswerReview } from './AnswerReview'
import { HighlightedWord } from './HighlightedWord'
import { SpeechWaveform } from './SpeechWaveform'
import { buildAnswerReview } from '../lib/explanations'
import { playCorrectAnswerAudio } from '../lib/answerAudio'

interface ExerciseCardProps {
  exercise: Exercise
  onAnswer: (correct: boolean, responseTimeMs: number, meta?: Record<string, unknown>) => void
  onContinue: () => void
}

export function ExerciseCard({ exercise, onAnswer, onContinue }: ExerciseCardProps) {
  const { settings } = useSettings()
  const { openLesson } = useLessonDrawer()
  const [startTime] = useState(Date.now())
  const [selected, setSelected] = useState<number | null>(null)
  const [previewSelected, setPreviewSelected] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult>(null)
  const [listening, setListening] = useState(false)
  const [played, setPlayed] = useState(false)
  const [transcript, setTranscript] = useState<string>()
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null)
  const [waveformLevels, setWaveformLevels] = useState<number[]>([])
  const [listenStatus, setListenStatus] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [builtSequence, setBuiltSequence] = useState<string[]>([])
  const [builtTileIds, setBuiltTileIds] = useState<string[]>([])
  const [sequencePlaying, setSequencePlaying] = useState(false)
  const [sequenceStep, setSequenceStep] = useState<number | null>(null)
  const listenAbortRef = useRef<(() => void) | null>(null)
  const sequenceAbortRef = useRef<(() => void) | null>(null)
  const continueRef = useRef<HTMLDivElement>(null)

  const usesPreviewConfirm =
    exercise.format === 'pick-audio' || exercise.format === 'hear-pick-letter'

  const usesWordOptions =
    exercise.format === 'unit-pick-word' ||
    exercise.format === 'hear-unit-pick-word' ||
    exercise.format === 'hear-sequence-pick-word'

  const usesSequenceBuild = exercise.format === 'hear-word-build-sequence'

  const usesAudio =
    exercise.format === 'pick-audio' ||
    exercise.format === 'hear-pick-letter' ||
    exercise.format === 'hear-type-letter' ||
    exercise.format === 'hear-unit-pick-word' ||
    exercise.format === 'hear-word-pick-letter' ||
    exercise.format === 'hear-word-build-sequence' ||
    exercise.format === 'hear-sequence-pick-word'

  const selectedIndex = usesPreviewConfirm ? previewSelected : selected

  useEffect(() => {
    return () => {
      stopUnitAudio()
      listenAbortRef.current?.()
      sequenceAbortRef.current?.()
    }
  }, [exercise.id])

  useEffect(() => {
    setSelected(null)
    setPreviewSelected(null)
    setPlayingIndex(null)
    setTyped('')
    setSubmitted(false)
    setFeedback(null)
    setFeedbackResult(null)
    setListening(false)
    setPlayed(false)
    setTranscript(undefined)
    setAlternatives([])
    setAnswerCorrect(null)
    setWaveformLevels([])
    setListenStatus('idle')
    setBuiltSequence([])
    setBuiltTileIds([])
    setSequencePlaying(false)
    setSequenceStep(null)
    listenAbortRef.current?.()
    listenAbortRef.current = null
    sequenceAbortRef.current?.()
    sequenceAbortRef.current = null
  }, [exercise.id])

  useEffect(() => {
    if (!settings?.autoPlayAudio) return
    if (
      exercise.format === 'hear-pick-letter' ||
      exercise.format === 'hear-type-letter' ||
      exercise.format === 'hear-unit-pick-word' ||
      exercise.format === 'hear-word-pick-letter' ||
      exercise.format === 'hear-word-build-sequence' ||
      exercise.format === 'hear-sequence-pick-word'
    ) {
      const timer = setTimeout(() => playPromptAudio(), 400)
      return () => clearTimeout(timer)
    }
  }, [exercise.id, settings?.autoPlayAudio])

  useEffect(() => {
    if (!submitted) return
    const timer = setTimeout(() => {
      continueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 200)
    return () => clearTimeout(timer)
  }, [submitted])

  const playLetter = useCallback(
    (unitId: string, index?: number) => {
      setPlayingIndex(index ?? null)
      const ok = playUnitAudio(exercise.moduleId, unitId, {
        onEnd: () => setPlayingIndex(null),
        onError: () => {
          setPlayingIndex(null)
          setFeedback('Audio unavailable.')
        },
      })
      if (!ok) setFeedback('Audio unavailable.')
      return ok
    },
    [exercise.moduleId],
  )

  const playPromptAudio = () => {
    setPlayed(true)
    haptic('tap')
    if (exercise.format === 'hear-sequence-pick-word' && exercise.playSequence) {
      playGraphemeSequenceAudio()
      return
    }
    if (
      (exercise.format === 'hear-word-pick-letter' ||
        exercise.format === 'hear-word-build-sequence') &&
      exercise.targetWordId
    ) {
      setPlayingIndex(-1)
      const ok = playWordAudio(exercise.targetWordId, {
        onEnd: () => setPlayingIndex(null),
        onError: () => {
          setPlayingIndex(null)
          setFeedback('Word audio unavailable.')
        },
      })
      if (!ok) setFeedback('Word audio unavailable.')
      return
    }
    playLetter(exercise.letterId)
  }

  const playGraphemeSequenceAudio = () => {
    if (!exercise.playSequence?.length) return
    sequenceAbortRef.current?.()
    setSequencePlaying(true)
    setSequenceStep(null)
    setPlayed(true)
    haptic('tap')
    sequenceAbortRef.current = playGraphemeSequence(exercise.playSequence, {
      onStep: (i) => setSequenceStep(i),
      onEnd: () => {
        setSequencePlaying(false)
        setSequenceStep(null)
        sequenceAbortRef.current = null
      },
      onError: () => {
        setSequencePlaying(false)
        setSequenceStep(null)
        setFeedback('Audio unavailable.')
      },
    })
  }

  const showFeedback = (correct: boolean, message: string) => {
    setFeedback(message)
    setFeedbackResult(correct ? 'correct' : 'incorrect')
    haptic(correct ? 'success' : 'error')
    // Brief overlay only — review panel stays until user taps Continue
    setTimeout(() => setFeedbackResult(null), correct ? 700 : 900)
  }

  const reviewItems = useMemo(() => {
    if (!submitted || answerCorrect === null) return []

    const isWordFormat =
      usesWordOptions ||
      exercise.format === 'word-pick-unit' ||
      usesSequenceBuild

    const selectedUnitId =
      exercise.format === 'hear-type-letter'
        ? resolveTypedUnitId(exercise.moduleId, typed)
        : isWordFormat && usesWordOptions
          ? getSelectedWordId(exercise, selectedIndex)
          : getSelectedUnitId(exercise, selectedIndex)

    const selectedLabel =
      exercise.format === 'pick-english' && selectedIndex !== null
        ? exercise.options?.[selectedIndex]?.label
        : undefined

    return buildAnswerReview({
      moduleId: exercise.moduleId,
      format: exercise.format,
      correctUnitId: exercise.letterId,
      selectedUnitId,
      selectedLabel,
      typedAnswer: typed,
      transcript,
      alternatives,
      optionUnitIds: getOptionUnits(exercise),
      optionWordIds: getOptionWords(exercise),
      targetWordId: exercise.targetWordId,
      highlightIndex: exercise.highlightIndex,
      answerCorrect,
      builtSequence: usesSequenceBuild ? builtSequence : undefined,
      correctSequence: exercise.correctSequence,
    })
  }, [
    submitted,
    answerCorrect,
    exercise,
    selectedIndex,
    typed,
    transcript,
    alternatives,
    builtSequence,
    usesSequenceBuild,
  ])

  function resolveTypedUnitId(moduleId: string, input: string): string | undefined {
    const n = input.trim().toLowerCase()
    if (!n) return undefined
    return getUnit(moduleId, n)?.id
  }

  const finish = (
    correct: boolean,
    message: string,
    meta?: Record<string, unknown>,
  ) => {
    if (submitted) return
    setAnswerCorrect(correct)
    setSubmitted(true)
    showFeedback(correct, message)
    playCorrectAnswerAudio(exercise)
    onAnswer(correct, Date.now() - startTime, meta)
  }

  const submitChoice = (index: number) => {
    if (submitted) return
    haptic('confirm')
    setSelected(index)
    if (usesPreviewConfirm) setPreviewSelected(index)
    const correct = index === exercise.correctIndex
    const msg = correct
      ? '✓ Correct!'
      : `✗ Correct: ${
          exercise.format === 'pick-english'
            ? exercise.correctAnswer
            : usesWordOptions
              ? getWord(exercise.correctAnswer)?.word ?? exercise.correctAnswer
              : getUnit(exercise.moduleId, exercise.correctAnswer)?.upper ?? exercise.correctAnswer
        }`
    finish(correct, msg)
  }

  const handleOptionSelect = (index: number) => {
    if (submitted) return
    if (usesPreviewConfirm) return
    haptic('tap')
    submitChoice(index)
  }

  const getOptionAudioId = (opt: NonNullable<Exercise['options']>[number]) =>
    opt.audioLetterId ?? opt.letterId ?? opt.unitId

  const handleAudioPreview = (index: number, letterId?: string) => {
    if (submitted || !letterId) return
    haptic('tap')
    setPreviewSelected(index)
    playLetter(letterId, index)
  }

  const handleAudioConfirm = () => {
    if (submitted || previewSelected === null) return
    submitChoice(previewSelected)
  }

  const handleSequenceTile = (tileId: string, grapheme: string) => {
    if (submitted || builtTileIds.includes(tileId)) return
    haptic('tap')
    setBuiltTileIds((prev) => [...prev, tileId])
    setBuiltSequence((prev) => [...prev, grapheme])
  }

  const handleSequenceUndo = () => {
    if (submitted || builtSequence.length === 0) return
    haptic('tap')
    setBuiltTileIds((prev) => prev.slice(0, -1))
    setBuiltSequence((prev) => prev.slice(0, -1))
  }

  const handleSequenceClear = () => {
    if (submitted) return
    haptic('tap')
    setBuiltSequence([])
    setBuiltTileIds([])
  }

  const handleSequenceSubmit = () => {
    if (submitted || !exercise.correctSequence) return
    haptic('confirm')
    const correct = sequencesMatch(builtSequence, exercise.correctSequence)
    const word = exercise.targetWordId ? getWord(exercise.targetWordId) : undefined
    finish(
      correct,
      correct
        ? '✓ Correct!'
        : `✗ Correct: ${word?.word ?? exercise.correctSequence.join('')}`,
    )
  }

  const handleTypeSubmit = () => {
    if (submitted) return
    haptic('confirm')
    const correct = checkLetterInput(typed, exercise.letter)
    finish(correct, correct ? '✓ Correct!' : `✗ Answer: ${exercise.letter.upper}`)
  }

  const handleSpeak = async () => {
    if (submitted || listening) return
    if (!isSTTSupported()) {
      setFeedback('Speech recognition not supported in this browser. Try Chrome on Android or desktop.')
      return
    }
    haptic('confirm')
    setListening(true)
    setWaveformLevels([])
    setFeedback(null)

    const { promise, abort } = listenInteractive({
      onLevels: setWaveformLevels,
      onStatus: setListenStatus,
    })
    listenAbortRef.current = abort

    try {
      const result = await promise
      setTranscript(result.transcript)
      setAlternatives(result.alternatives)
      const scored = scorePronunciation(
        exercise.moduleId,
        exercise.letterId,
        result.transcript,
        result.alternatives,
      )
      finish(scored.correct, scored.feedback, {
        confidence: scored.score,
        transcript: result.transcript,
      })
    } catch (err) {
      haptic('error')
      setFeedback(err instanceof Error ? err.message : 'Could not hear you. Try again.')
    } finally {
      setListening(false)
      setListenStatus('idle')
      listenAbortRef.current = null
    }
  }

  const showLetter =
    exercise.format !== 'hear-pick-letter' &&
    exercise.format !== 'hear-type-letter' &&
    exercise.format !== 'hear-unit-pick-word' &&
    exercise.format !== 'word-pick-unit' &&
    exercise.format !== 'hear-word-pick-letter' &&
    exercise.format !== 'hear-word-build-sequence' &&
    exercise.format !== 'hear-sequence-pick-word'

  const usedTileSet = new Set(builtTileIds)

  const targetWord = exercise.targetWordId ? getWord(exercise.targetWordId) : undefined

  const cardShake = submitted && feedbackResult === 'incorrect' ? 'animate-shake' : ''

  return (
    <>
      <FeedbackOverlay result={feedbackResult} message={feedback?.replace(/^[✓✗]\s*/, '') ?? undefined} />

      <div className={`space-y-4 ${cardShake}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-400">{exercise.prompt}</p>
          <button
            type="button"
            onClick={() => openLesson(exercise.moduleId, [exercise.letterId])}
            className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-red-400"
          >
            📖 Info
          </button>
        </div>

        {showLetter && (
          <div className="flex justify-center py-4">
            <span className="text-7xl font-serif text-red-400">{exercise.letter.upper}</span>
          </div>
        )}

        {(exercise.format === 'hear-pick-letter' ||
          exercise.format === 'hear-type-letter' ||
          exercise.format === 'hear-unit-pick-word' ||
          exercise.format === 'hear-word-pick-letter' ||
          exercise.format === 'hear-word-build-sequence' ||
          exercise.format === 'hear-sequence-pick-word') && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={playPromptAudio}
              disabled={sequencePlaying}
              className={`flex items-center gap-2 rounded-2xl px-6 py-4 text-lg font-medium active:scale-95 transition-transform ${
                playingIndex !== null || sequencePlaying ? 'bg-amber-600' : 'bg-red-600'
              }`}
            >
              🔊{' '}
              {sequencePlaying
                ? `Playing ${(sequenceStep ?? 0) + 1}/${exercise.playSequence?.length ?? '?'}…`
                : played
                  ? 'Play again'
                  : exercise.format === 'hear-sequence-pick-word'
                    ? 'Play sounds'
                    : 'Play word'}
            </button>
            {exercise.format === 'hear-word-pick-letter' && targetWord && submitted && (
              <p className="text-xs text-slate-500">{targetWord.meaning}</p>
            )}
          </div>
        )}

        {exercise.format === 'word-pick-unit' && targetWord && exercise.highlightIndex !== undefined && (
          <div className="flex flex-col items-center gap-2 py-4">
            <HighlightedWord
              word={targetWord.word}
              highlightIndex={exercise.highlightIndex}
            />
            <p className="text-sm text-slate-500">{targetWord.meaning}</p>
          </div>
        )}

        {exercise.options && !usesPreviewConfirm && !usesWordOptions && (
          <div className="grid gap-2">
            {exercise.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                disabled={submitted}
                onClick={() => handleOptionSelect(i)}
                className={`rounded-xl border px-4 py-3.5 text-left text-base transition-all active:scale-[0.98] ${
                  submitted
                    ? i === exercise.correctIndex
                      ? 'border-green-500 bg-green-500/20'
                      : selectedIndex === i
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}
              >
                <span className="text-xl font-serif">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {exercise.options && usesWordOptions && (
          <div className="grid gap-2">
            {exercise.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                disabled={submitted}
                onClick={() => handleOptionSelect(i)}
                className={`rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.98] ${
                  submitted
                    ? i === exercise.correctIndex
                      ? 'border-green-500 bg-green-500/20'
                      : selectedIndex === i
                        ? 'border-red-500 bg-red-500/20'
                        : 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}
              >
                <span className="text-xl font-serif">{opt.label}</span>
                {opt.meaning && (
                  <span className="block text-sm text-slate-500 mt-0.5">{opt.meaning}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {usesPreviewConfirm && exercise.options && (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-500">
              {exercise.format === 'hear-pick-letter'
                ? 'Tap a letter to hear it, then confirm your choice'
                : 'Tap each option to hear it, then confirm your choice'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {exercise.options.map((opt, i) => {
                const audioId = getOptionAudioId(opt)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={submitted}
                    onClick={() => handleAudioPreview(i, audioId)}
                    className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-all active:scale-[0.97] ${
                      submitted
                        ? i === exercise.correctIndex
                          ? 'border-green-500 bg-green-500/20'
                          : selectedIndex === i
                            ? 'border-red-500 bg-red-500/20'
                            : 'border-slate-700 bg-slate-800/50'
                        : previewSelected === i
                          ? 'option-selected'
                          : playingIndex === i
                            ? 'option-playing'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{playingIndex === i ? '🔉' : '🔊'}</span>
                    <span className="text-sm text-slate-400 font-serif">
                      {submitted || exercise.format === 'hear-pick-letter'
                        ? opt.label
                        : previewSelected === i
                          ? 'Selected'
                          : `Option ${i + 1}`}
                    </span>
                  </button>
                )
              })}
            </div>
            {!submitted && (
              <button
                type="button"
                disabled={previewSelected === null}
                onClick={handleAudioConfirm}
                className="w-full rounded-xl bg-red-600 py-3.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Confirm answer
              </button>
            )}
          </div>
        )}

        {exercise.format === 'speak-letter' && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className="text-center text-sm text-slate-400">
              Tap the mic and say the letter sound or Polish name
            </p>
            <SpeechWaveform
              levels={waveformLevels}
              active={listening}
              status={listenStatus}
            />
            <p className="text-center text-xs text-slate-500 min-h-[1.25rem]">
              {listenStatus === 'listening'
                ? 'Listening… stop speaking when done'
                : listenStatus === 'processing'
                  ? 'Processing…'
                  : submitted
                    ? null
                    : 'Tap to start'}
            </p>
            <button
              type="button"
              disabled={submitted || listening}
              onClick={handleSpeak}
              className={`rounded-full p-8 text-4xl transition-all active:scale-95 ${
                listening ? 'bg-red-500 animate-pulse' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              🎤
            </button>
          </div>
        )}

        {usesSequenceBuild && exercise.sequenceTiles && (
          <div className="space-y-3">
            <div className="min-h-[3rem] rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2">
              <p className="text-xs text-slate-500 mb-1">Your sequence</p>
              <p className="text-2xl font-serif tracking-wide min-h-[1.75rem]">
                {builtSequence.length > 0 ? (
                  builtSequence.map((g, i) => (
                    <span key={`${g}-${i}`} className="text-red-300">
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600 text-base">Tap graphemes below…</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {exercise.sequenceTiles.map((tile) => {
                const used = usedTileSet.has(tile.id)
                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={submitted || used}
                    onClick={() => handleSequenceTile(tile.id, tile.grapheme)}
                    className={`rounded-xl border px-4 py-3 text-xl font-serif transition-all active:scale-95 ${
                      used
                        ? 'border-slate-800 bg-slate-900/40 text-slate-600'
                        : 'border-slate-600 bg-slate-800 hover:border-red-500/50'
                    }`}
                  >
                    {tile.grapheme}
                  </button>
                )
              })}
            </div>
            {!submitted && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={builtSequence.length === 0}
                  onClick={handleSequenceUndo}
                  className="flex-1 rounded-xl border border-slate-700 py-3 text-sm text-slate-300 disabled:opacity-40"
                >
                  Undo
                </button>
                <button
                  type="button"
                  disabled={builtSequence.length === 0}
                  onClick={handleSequenceClear}
                  className="flex-1 rounded-xl border border-slate-700 py-3 text-sm text-slate-300 disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  disabled={
                    !exercise.correctSequence ||
                    builtSequence.length !== exercise.correctSequence.length
                  }
                  onClick={handleSequenceSubmit}
                  className="flex-[2] rounded-xl bg-red-600 py-3 font-semibold disabled:opacity-40 active:scale-[0.98]"
                >
                  Check
                </button>
              </div>
            )}
          </div>
        )}

        {exercise.format === 'hear-type-letter' && (
          <div className="space-y-3">
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={submitted}
              placeholder="Type the letter…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-center text-3xl font-serif focus:border-red-500 focus:outline-none"
              maxLength={exercise.letter.category === 'digraph' ? 3 : 2}
              onKeyDown={(e) => e.key === 'Enter' && handleTypeSubmit()}
            />
            <button
              type="button"
              disabled={submitted || !typed.trim()}
              onClick={handleTypeSubmit}
              className="w-full rounded-xl bg-red-600 py-3.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Check
            </button>
          </div>
        )}

        {feedback && !feedbackResult && (
          <p className="text-center text-sm text-slate-400">{feedback}</p>
        )}

        {submitted && (
          <div ref={continueRef} className="mt-4 space-y-3 border-t border-slate-800 pt-4">
            <AnswerReview items={reviewItems} moduleId={exercise.moduleId} />
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-xl bg-slate-700 py-3 font-semibold text-slate-100 active:scale-[0.98] transition-transform"
            >
              Continue →
            </button>
          </div>
        )}

        {usesAudio && !submitted && (
          <p className="text-center text-[10px] text-slate-600">
            Native recordings · Wikimedia Commons (public domain)
          </p>
        )}
      </div>
    </>
  )
}
