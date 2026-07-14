# Polish Phonology — General Reference

> **Sources:** [Wiktionary: Polish pronunciation](https://en.wiktionary.org/wiki/Appendix:Polish_pronunciation), [Wikipedia: Polish phonology](https://en.wikipedia.org/wiki/Polish_phonology)

## Consonant system highlights

### Voicing assimilation

Polish has **regressive voicing assimilation**:

- Voiced obstruents **b, d, ɡ, v, z, ʐ, ʑ, dʐ, dʑ** devoice at word end and before voiceless consonants.
- Voiceless obstruents voice before voiced ones (with exceptions).

**App implication:** Letter-isolated exercises teach canonical values; word-context modules should teach assimilation later.

### Hard vs soft (retroflex vs alveolo-palatal)

Polish distinguishes:

| Hard (retroflex) | Soft (alveolo-palatal) |
|------------------|------------------------|
| sz /ʂ/ | ś /ɕ/ |
| cz /tʂ/ | ć /t͡ɕ/ |
| ż /ʐ/ | ź /ʑ/ |
| rz /ʐ/ | (same as ż) |

Soft sounds involve the **middle of the tongue raised** — often described as having a slight "ee" color.

### Critical English-speaker traps

1. **w = /v/** (not English w)
2. **ł = /w/** (not English l)
3. **c = /ts/** (never /k/ or /s/)
4. **j = /j/** (like English y in yes)
5. **y ≠ i** — different vowels

## Vowel system

| IPA | Letters | Description |
|-----|---------|-------------|
| /a/ | a | open central |
| /ɛ/ | e | open-mid front |
| /i/ | i | close front |
| /ɨ/ | y | close central — unique to Slavic |
| /ɔ/ | o | open-mid back |
| /u/ | u, ó | close back |
| /ɔw̃/ | ą | nasalized /ɔ/ |
| /ɛw̃/ | ę | nasalized /ɛ/ |

## Stress

- Primary stress on **penultimate** syllable in most words
- Secondary stress possible in long compounds

## Speech technology notes

### Text-to-speech (TTS)

- Use `pl-PL` locale
- Prefer voices: Google polski, Microsoft Paulina/Zofia, any native pl-PL voice
- For isolated letters: speak the **Polish letter name** (e.g. "eł" for ł)
- For sounds: use **example words** with the letter (e.g. "łapa" for ł sound)

### Speech recognition (STT)

- Use `pl-PL` locale via Web Speech API
- Letter pronunciation exercises should accept:
  - Polish letter names
  - Example words from lessons
  - English approximation keywords (lenient matching)
- Single-phoneme recognition is inherently unreliable; combine multiple signals and provide clear feedback

---

*Last verified: July 2026*
