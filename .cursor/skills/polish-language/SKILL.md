# Polish Language Knowledge Skill

Use this skill when creating or editing Polish learning content, exercises, pronunciation data, or speech features.

## Authority hierarchy

1. `docs/polish-alphabet.md` — letter facts, IPA, English approximations, examples
2. `docs/polish-phonology.md` — phonological rules, TTS/STT guidance
3. `docs/learning-theory.md` — scheduler and pedagogy rules
4. `src/data/alphabet.ts` — runtime data (must match docs)

**Never invent pronunciation approximations.** Cross-check against Wiktionary IPA and Wikipedia Polish alphabet table.

## The 32 native letters

```
a ą b c ć d e ę f g h i j k l ł m n ń o ó p r s ś t u w y z ź ż
```

Exclude q, v, x (loanwords only).

## Non-negotiable facts

| Letter | Sound | Common mistake |
|--------|-------|----------------|
| ł | /w/ like English **will** | Pronouncing as English "l" |
| w | /v/ like English **vow** | Pronouncing as English "w" |
| c | /ts/ like **cats** | Pronouncing as "k" or "s" |
| y | /ɨ/ like **bit** | Confusing with Polish i (/i/ feet) |
| ó | /u/ same as u | Thinking it's a different sound |
| ą | /ɔw̃/ nasal | Omitting nasality |
| ę | /ɛw̃/ nasal | Omitting nasality |

## Soft vs hard pairs

- ć (soft) vs cz (hard) — only ć in alphabet module
- ś (soft) vs sz (hard) — only ś in alphabet module
- ź (soft) vs ż (hard) — both in alphabet module
- ń (soft) vs n — both in alphabet module

## Speech technology

### TTS
- **Always use bundled recordings** via `playLetterAudio()` from `src/lib/speech/audio.ts`
- **Never** use browser `speechSynthesis` for letter sounds
- Source: Wikimedia Commons `Polish_Alphabet.oga` (public domain)

### STT
- Always `lang: 'pl-PL'`
- Accept: Polish letter name, example words, English approximation keywords
- Never expect perfect single-phoneme recognition — use lenient scoring

## Exercise format definitions

| ID | Name | Prompt | Response |
|----|------|--------|----------|
| A | `pick-english` | Show letter | Pick English sound label |
| B | `pick-audio` | Show letter | Pick correct audio from options |
| C | `speak-letter` | Show letter | Speak into microphone |
| D | `hear-pick-letter` | Play letter sound | Pick letter from options |
| E | `hear-type-letter` | Play letter name | Type the letter |

## When adding new modules

1. Add reference doc under `docs/`
2. Add data file under `src/data/`
3. Update this skill
4. Register module in `src/data/modules.ts`
5. Extend tracking schema if needed

## External references

- https://en.wiktionary.org/wiki/Appendix:Polish_pronunciation
- https://en.wikipedia.org/wiki/Polish_alphabet
- https://en.wikipedia.org/wiki/Polish_phonology
