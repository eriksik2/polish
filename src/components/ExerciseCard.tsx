import { getLetter } from '../data/alphabet'
import type { Exercise } from '../lib/exercises'
import { playLetterAudio, stopLetterAudio } from '../lib/speech/audio'
import { useSettings } from '../hooks/useSettings'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useState, useEffect, useCallback } from 'react'
import { listenOnce, scorePronunciation, isSTTSupported } from '../lib/speech/stt'
import { checkLetterInput } from '../lib/exercises'
import { haptic, type FeedbackResult } from '../lib/feedback'
import { FeedbackOverlay } from './FeedbackOverlay'

interface ExerciseCardProps {
  exercise: Exercise
  onAnswer: (correct: boolean, responseTimeMs: number, meta?: Record<string, unknown>) => void
}

export function ExerciseCard({ exercise, onAnswer }: ExerciseCardProps) {
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

  const usesAudio =
    exercise.format === 'pick-audio' ||
    exercise.format === 'hear-pick-letter' ||
    exercise.format === 'hear-type-letter'

  useEffect(() => {
    return () => stopLetterAudio()
  }, [exercise.id])

  useEffect(() => {
    if (!settings?.autoPlayAudio) return
    if (exercise.format === 'hear-pick-letter' || exercise.format === 'hear-type-letter') {
      const timer = setTimeout(() => playPromptAudio(), 400)
      return () => clearTimeout(timer)
    }
  }, [exercise.id, settings?.autoPlayAudio])

  const playLetter = useCallback((letterId: string, index?: number) => {
    setPlayingIndex(index ?? null)
    const ok = playLetterAudio(letterId, {
      onEnd: () => setPlayingIndex(null),
      onError: () => {
        setPlayingIndex(null)
        setFeedback('Audio unavailable for this letter.')
      },
    })
    if (!ok) setFeedback('Audio unavailable for this letter.')
    return ok
  }, [])

  const playPromptAudio = () => {
    setPlayed(true)
    haptic('tap')
    playLetter(exercise.letterId)
  }

  const showFeedback = (correct: boolean, message: string) => {
    setFeedback(message)
    setFeedbackResult(correct ? 'correct' : 'incorrect')
    haptic(correct ? 'success' : 'error')
    setTimeout(() => setFeedbackResult(null), correct ? 900 : 1100)
  }

  const finish = (correct: boolean, message: string, meta?: Record<string, unknown>) => {
    if (submitted) return
    setSubmitted(true)
    showFeedback(correct, message)
    onAnswer(correct, Date.now() - startTime, meta)
  }

  const submitChoice = (index: number) => {
    if (submitted) return
    haptic('confirm')
    setSelected(index)
    const correct = index === exercise.correctIndex
    const msg = correct
      ? '✓ Correct!'
      : `✗ Correct: ${exercise.format === 'pick-english' ? exercise.correctAnswer : getLetter(exercise.correctAnswer)?.upper ?? exercise.correctAnswer}`
    finish(correct, msg)
  }

  const handleOptionSelect = (index: number) => {
    if (submitted) return
    if (exercise.format === 'pick-audio') return
    haptic('tap')
    submitChoice(index)
  }

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
    setFeedback('Listening…')
    try {
      const result = await listenOnce()
      const scored = scorePronunciation(exercise.letterId, result.transcript, result.alternatives)
      finish(scored.correct, scored.feedback, { confidence: scored.score, transcript: result.transcript })
    } catch (err) {
      haptic('error')
      setFeedback(err instanceof Error ? err.message : 'Could not hear you. Try again.')
      setListening(false)
    }
  }

  const showLetter =
    exercise.format !== 'hear-pick-letter' && exercise.format !== 'hear-type-letter'

  const cardShake = submitted && feedbackResult === 'incorrect' ? 'animate-shake' : ''

  return (
    <>
      <FeedbackOverlay result={feedbackResult} message={feedback?.replace(/^[✓✗]\s*/, '') ?? undefined} />

      <div className={`space-y-4 ${cardShake}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-400">{exercise.prompt}</p>
          <button
            type="button"
            onClick={() => openLesson([exercise.letterId])}
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

        {(exercise.format === 'hear-pick-letter' || exercise.format === 'hear-type-letter') && (
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

        {exercise.options && exercise.format !== 'pick-audio' && (
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
                      : selected === i
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

        {exercise.format === 'pick-audio' && exercise.options && (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-500">
              Tap each option to hear it, then confirm your choice
            </p>
            <div className="grid grid-cols-2 gap-3">
              {exercise.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => handleAudioPreview(i, opt.audioLetterId)}
                  className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-all active:scale-[0.97] ${
                    submitted
                      ? i === exercise.correctIndex
                        ? 'border-green-500 bg-green-500/20'
                        : selected === i
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
                  <span className="text-sm text-slate-400">
                    {previewSelected === i ? 'Selected' : `Option ${i + 1}`}
                  </span>
                </button>
              ))}
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
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm text-slate-400">
              Say the letter sound or Polish name
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
              maxLength={2}
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

        {usesAudio && (
          <p className="text-center text-[10px] text-slate-600">
            Native recordings · Wikimedia Commons (public domain)
          </p>
        )}
      </div>
    </>
  )
}
