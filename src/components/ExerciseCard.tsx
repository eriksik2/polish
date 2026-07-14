import { getWord } from '../data/wordBank'
import { getUnit } from '../data/moduleRegistry'
import type { Exercise } from '../lib/exercises'
import {
  checkLetterInput,
  getOptionUnits,
  getOptionWords,
  getSelectedUnitId,
  getSelectedWordId,
} from '../lib/exercises'
import { playUnitAudio, stopUnitAudio } from '../lib/speech/audio'
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
  const listenAbortRef = useRef<(() => void) | null>(null)

  const usesPreviewConfirm =
    exercise.format === 'pick-audio' || exercise.format === 'hear-pick-letter'

  const usesWordOptions =
    exercise.format === 'unit-pick-word' || exercise.format === 'hear-unit-pick-word'

  const usesAudio =
    exercise.format === 'pick-audio' ||
    exercise.format === 'hear-pick-letter' ||
    exercise.format === 'hear-type-letter' ||
    exercise.format === 'hear-unit-pick-word'

  const selectedIndex = usesPreviewConfirm ? previewSelected : selected

  useEffect(() => {
    return () => {
      stopUnitAudio()
      listenAbortRef.current?.()
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
    listenAbortRef.current?.()
    listenAbortRef.current = null
  }, [exercise.id])

  useEffect(() => {
    if (!settings?.autoPlayAudio) return
    if (exercise.format === 'hear-pick-letter' || exercise.format === 'hear-type-letter' || exercise.format === 'hear-unit-pick-word') {
      const timer = setTimeout(() => playPromptAudio(), 400)
      return () => clearTimeout(timer)
    }
  }, [exercise.id, settings?.autoPlayAudio])

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
    playLetter(exercise.letterId)
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

    const isWordFormat = usesWordOptions || exercise.format === 'word-pick-unit'

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
    })
  }, [
    submitted,
    answerCorrect,
    exercise,
    selectedIndex,
    typed,
    transcript,
    alternatives,
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
    exercise.format !== 'word-pick-unit'

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
            📖 Lesson
          </button>
        </div>

        {showLetter && (
          <div className="flex justify-center py-4">
            <span className="text-7xl font-serif text-red-400">{exercise.letter.upper}</span>
          </div>
        )}

        {(exercise.format === 'hear-pick-letter' ||
          exercise.format === 'hear-type-letter' ||
          exercise.format === 'hear-unit-pick-word') && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={playPromptAudio}
              className={`flex items-center gap-2 rounded-2xl px-6 py-4 text-lg font-medium active:scale-95 transition-transform ${
                playingIndex !== null ? 'bg-amber-600' : 'bg-red-600'
              }`}
            >
              🔊 {played ? 'Play again' : 'Play sound'}
            </button>
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

        {submitted && <AnswerReview items={reviewItems} />}

        {submitted && (
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl bg-slate-700 py-3.5 font-semibold text-slate-100 active:scale-[0.98] transition-transform"
          >
            Continue →
          </button>
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
