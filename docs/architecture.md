# TestApp architecture

## Principle

TestApp is a question-bank engine, not a collection of independent test files. A stable question may appear in many generated or fixed tests without duplication.

## Content hierarchy

`subject → section → topic → subtopic`

Questions can additionally have tags, sources, source variants and stable codes. The hierarchy controls navigation; tags enable cross-cutting selections.

## Question versioning

A question has a stable `questions.id`. Editable content lives in `question_revisions`. Published content is revisioned so an updated key or wording never silently replaces the historical source version.

## Study modes

- `learning`: immediate feedback and explanation;
- `exam`: feedback after completion;
- `mistakes`: unresolved local review queue;
- `weak_topics`: generated from local topic-level performance.

The MVP implements learning mode and a local mistake queue. A mistake remains unresolved until two correct answers occur after the most recent wrong answer.

## Data boundary

TestApp is local-first for learner data.

Supabase stores shared content only: curriculum, questions, revisions, answer options, tags, sources and published test definitions. Learner answers, mistakes, statistics, review state and unfinished attempts are not uploaded to Supabase by default.

The browser stores learner progress in IndexedDB. The first IndexedDB read automatically migrates the original MVP `localStorage` record when present. This prevents server storage from growing with the number of students and keeps personal learning history private to the device.

Users can export their local progress to a TestApp JSON backup and restore it on another device. A future cloud-sync feature, if added, must remain optional.

## Offline strategy

The PWA may cache downloaded content packages and the application shell. Once a question set is cached, answering and progress tracking must continue without a network connection. Network access is needed only for content discovery/update and future optional services.

## Import strategy

XLSX/CSV is the canonical bulk-import route because its columns can map deterministically to the internal model. DOCX will be secondary and must stage parsed questions for validation rather than silently importing ambiguous structures.

## Roadmap

1. Bootstrap UI, domain types, IndexedDB learning history and local review queue.
2. Backup/restore of learner progress.
3. Connect Supabase as a shared content backend only.
4. Subject/topic navigation and generated tests.
5. XLSX import with validation and preview.
6. Exam mode, advanced analytics and spaced repetition scheduler.
7. Case, matching, ordering, text and numeric questions.
8. Offline content packages and richer PWA installation experience.
