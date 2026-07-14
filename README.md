# Polish Learn

A mobile-first web app for learning and practicing Polish. Start with the **alphabet module** — 32 letters, short lessons, and five exercise formats with spaced-repetition scheduling and detailed progress tracking.

## Features

- **Alphabet module** — mini-lessons for each letter plus a general overview
- **5 exercise formats**
  - A: See letter → pick English sound description
  - B: See letter → pick matching audio
  - C: See letter → speak aloud (microphone)
  - D: Hear sound → pick letter
  - E: Hear letter name → type the letter
- **Continuous practice stream** with inline lesson drawer (no leaving the exercise)
- **Toggle exercise formats** in Settings
- **Robust tracking** — accuracy, response time, streaks by letter, format, and timeframe
- **SM-2 spaced repetition** scheduler prioritizes weak/due items
- **Polish TTS/STT** via Web Speech API (`pl-PL`)
- **PWA** — installable on phone, works on desktop

## Knowledge base

Pronunciation content is research-backed and documented in:

- `docs/polish-alphabet.md` — canonical letter data
- `docs/polish-phonology.md` — phonology & speech tech notes
- `docs/learning-theory.md` — pedagogy & scheduler rules
- `.cursor/skills/polish-language/SKILL.md` — skill for future content work

Runtime data in `src/data/alphabet.ts` must match the docs.

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. For speech features, use Chrome (desktop or Android) with microphone permission.

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Speech notes

- **TTS**: Uses `speechSynthesis` with `pl-PL`. Select a Polish voice in Settings if available.
- **STT**: Uses `SpeechRecognition` with `pl-PL`. Single-phoneme recognition is imperfect; the app uses lenient scoring against letter names, example words, and English approximations.

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS 4 · Dexie (IndexedDB) · vite-plugin-pwa
