import { useEffect, useState } from 'react'
import { EXERCISE_FORMATS } from '../data/modules'
import { useSettings } from '../hooks/useSettings'
import { isSTTSupported } from '../lib/speech/stt'
import { isLetterAudioAvailable, LETTER_AUDIO_ATTRIBUTION } from '../lib/speech/audio'
import type { ExerciseFormat } from '../lib/db'

export function SettingsPage() {
  const { settings, loading, update } = useSettings()
  const [audioReady, setAudioReady] = useState(false)

  useEffect(() => {
    setAudioReady(isLetterAudioAvailable())
  }, [])

  if (loading || !settings) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  const toggleFormat = (format: ExerciseFormat) => {
    update({
      enabledFormats: {
        ...settings.enabledFormats,
        [format]: !settings.enabledFormats[format],
      },
    })
  }

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Exercise formats</h2>
        <p className="text-xs text-slate-500 mb-3">Enable or disable exercise types in your practice stream</p>
        <div className="space-y-2">
          {EXERCISE_FORMATS.map((f) => (
            <label
              key={f.id}
              className="flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-3"
            >
              <div>
                <p className="font-medium">{f.shortLabel}. {f.label}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enabledFormats[f.id]}
                onChange={() => toggleFormat(f.id)}
                className="h-5 w-5 accent-red-500"
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Audio & speech</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-3">
            <span>Auto-play audio in exercises</span>
            <input
              type="checkbox"
              checked={settings.autoPlayAudio}
              onChange={() => update({ autoPlayAudio: !settings.autoPlayAudio })}
              className="h-5 w-5 accent-red-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl bg-slate-800/60 px-4 py-3">
            <span>Show IPA in lessons</span>
            <input
              type="checkbox"
              checked={settings.showIpaInLessons}
              onChange={() => update({ showIpaInLessons: !settings.showIpaInLessons })}
              className="h-5 w-5 accent-red-500"
            />
          </label>

          <div className="rounded-xl bg-slate-800/60 px-4 py-3 text-sm space-y-2">
            <p className="text-slate-400">Letter pronunciation</p>
            <p>
              {audioReady
                ? '✓ Native recordings loaded (32 letters)'
                : '✗ Recordings unavailable — audio exercises disabled'}
            </p>
            <p className="text-xs text-slate-500">
              Source: {LETTER_AUDIO_ATTRIBUTION.title} by {LETTER_AUDIO_ATTRIBUTION.author} ({LETTER_AUDIO_ATTRIBUTION.license})
            </p>
          </div>

          <div className="rounded-xl bg-slate-800/60 px-4 py-3 text-sm space-y-1">
            <p className="text-slate-400">Speech recognition (speak exercises)</p>
            <p>STT: {isSTTSupported() ? '✓ Available (pl-PL)' : '✗ Not supported'}</p>
            <p className="text-xs text-slate-500 mt-2">
              For best Polish speech recognition, use Chrome on Android or desktop with microphone access.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 p-4 text-xs text-slate-500 space-y-2">
        <p className="font-medium text-slate-400">About knowledge sources</p>
        <p>
          Pronunciation data is sourced from Wiktionary IPA tables and Wikipedia's Polish alphabet reference.
          See <code className="text-slate-400">docs/</code> in the repository for full references.
        </p>
      </section>
    </div>
  )
}
