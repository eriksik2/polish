import { getLetter } from '../data/alphabet'
import type { Exercise } from '../lib/exercises'
import { speakLetterSound, speakLetterName } from '../lib/speech/tts'
import { useSettings } from '../hooks/useSettings'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useState, useEffect } from 'react'
import { listenOnce, scorePronunciation, isSTTSupported } from '../lib/speech/stt'
import { checkLetterInput } from '../lib/exercises'

interface ExerciseCardProps {
  exercise: Exercise
  onAnswer: (correct: boolean, responseTimeMs: number, meta?: Record<string, unknown>) => void
}

export function ExerciseCard({ exercise, onAnswer }: ExerciseCardProps) {
  const { settings } = useSettings()
  const { openLesson } = useLessonDrawer()
  const [startTime] = useState(Date.now())
  const [selected, setSelected] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    if (!settings?.autoPlayAudio) return
    if (exercise.format === 'hear-pick-letter' || exercise.format === 'hear-type-letter') {
      const timer = setTimeout(() => playAudio(), 400)
      return () => clearTimeout(timer)
    }
  }, [exercise.id, settings?.autoPlayAudio])

  const playAudio = () => {
    setPlayed(true)
    if (exercise.format === 'hear-type-letter') {
      speakLetterName(exercise.letter.polishName, settings?.preferredVoiceName)
    } else {
      speakLetterSound(exercise.letter, settings?.preferredVoiceName)
    }
  }

  const finish = (correct: boolean, meta?: Record<string, unknown>) => {
    if (submitted) return
    setSubmitted(true)
    onAnswer(correct, Date.now() - startTime, meta)
  }

  const handleOptionSelect = (index: number) => {
    if (submitted) return
    setSelected(index)
    const correct = index === exercise.correctIndex
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${exercise.correctAnswer}`)
    finish(correct)
  }

  const handleTypeSubmit = () => {
    if (submitted) return
    const correct = checkLetterInput(typed, exercise.letter)
    setFeedback(correct ? '✓ Correct!' : `✗ Answer: ${exercise.letter.upper}`)
    finish(correct)
  }

  const handleSpeak = async () => {
    if (submitted || listening) return
    if (!isSTTSupported()) {
      setFeedback('Speech recognition not supported in this browser. Try Chrome on Android or desktop.')
      return
    }
    setListening(true)
    setFeedback('Listening…')
    try {
      const result = await listenOnce()
      const scored = scorePronunciation(exercise.letterId, result.transcript, result.alternatives)
      setFeedback(scored.feedback)
      finish(scored.correct, { confidence: scored.score, transcript: result.transcript })
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Could not hear you. Try again.')
      setListening(false)
    }
  }

  const showLetter =
    exercise.format !== 'hear-pick-letter' && exercise.format !== 'hear-type-letter'

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-400">{exercise.prompt}</p>
        <button
          type="button"
          onClick={() => openLesson([exercise.letterId], exercise.letterId === 'general')}
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
            onClick={playAudio}
            className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-4 text-lg font-medium active:scale-95 transition-transform"
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
              className={`rounded-xl border px-4 py-3.5 text-left text-base transition-colors ${
                submitted
                  ? i === exercise.correctIndex
                    ? 'border-green-500 bg-green-500/20'
                    : selected === i
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500 active:scale-[0.98]'
              }`}
            >
              <span className="text-xl font-serif">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {exercise.format === 'pick-audio' && exercise.options && (
        <div className="grid grid-cols-2 gap-3">
          {exercise.options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => {
                if (opt.audioLetterId) {
                  const audioLetter = getLetter(opt.audioLetterId)
                  if (audioLetter) speakLetterSound(audioLetter, settings?.preferredVoiceName)
                }
                handleOptionSelect(i)
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-colors ${
                submitted
                  ? i === exercise.correctIndex
                    ? 'border-green-500 bg-green-500/20'
                    : selected === i
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <span className="text-2xl">🔊</span>
              <span className="text-sm text-slate-400">Option {i + 1}</span>
            </button>
          ))}
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
            className={`rounded-full p-8 text-4xl transition-all ${
              listening
                ? 'bg-red-500 animate-pulse'
                : 'bg-red-600 hover:bg-red-500 active:scale-95'
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
            className="w-full rounded-xl bg-red-600 py-3.5 font-medium disabled:opacity-40"
          >
            Check
          </button>
        </div>
      )}

      {feedback && (
        <p
          className={`text-center text-sm ${
            feedback.startsWith('✓') ? 'text-green-400' : feedback.startsWith('✗') ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          {feedback}
        </p>
      )}
    </div>
  )
}
