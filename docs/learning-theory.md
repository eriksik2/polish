# Learning Theory — App Design Principles

This app applies evidence-based learning science to Polish practice.

## Core principles implemented

### 1. Spaced repetition (SM-2 variant)

Each letter × exercise format has a memory state:

- **ease factor** — how quickly intervals grow
- **interval** — days until next priority review
- **repetitions** — successful reviews in a row

Failed attempts reset or shorten intervals. The scheduler prioritizes items due for review.

### 2. Interleaving

Exercises mix letters and formats rather than blocking one letter at a time. Research shows interleaved practice improves discrimination (especially critical for Polish ś/sz, ć/cz, ź/ż pairs).

### 3. Retrieval practice

All exercise formats require **active recall** — no passive re-reading. Lessons are available on demand but never substitute for retrieval.

### 4. Desirable difficulty

The scheduler weights:

- Lower accuracy items → more frequent
- Longer response time → more frequent
- Recently failed formats → boosted priority
- Mastered items → longer intervals

### 5. Feedback timing

Immediate corrective feedback after each attempt, with link to relevant lesson content.

### 6. Multi-format encoding

Each letter is practiced through:

| Format | Cognitive skill |
|--------|----------------|
| A — pick English label | Symbol → sound mapping (verbal) |
| B — pick audio | Symbol → auditory discrimination |
| C — speak aloud | Motor/auditory production |
| D — hear → pick letter | Auditory → symbol |
| E — hear → type letter | Auditory → production (spelling) |

Multiple modalities strengthen memory traces (dual coding theory).

## Performance tracking dimensions

| Dimension | Granularity |
|-----------|-------------|
| Time | session, today, 7d, 30d, 90d, all-time |
| Module | alphabet (more later) |
| Letter | each of 32 letters |
| Format | A, B, C, D, E |
| Cross-tabs | letter×format, module×format |

Metrics per cell:

- attempts, correct, accuracy %
- avg response time
- streak (current & best)
- last practiced timestamp
- SM-2 memory state

## Mastery criteria

A letter×format is "mastered" when:

- ≥ 90% accuracy over last 10 attempts
- avg response time < 5s
- SM-2 interval ≥ 7 days

## Session design

- Stream of exercises with no fixed end — learner stops when ready
- Lesson drawer accessible without leaving exercise
- Format toggles let learners focus on weak skills

---

*This document governs scheduler and analytics behavior in code.*
