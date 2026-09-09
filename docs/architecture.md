# TestApp architecture

## Principle

TestApp is a question-bank engine, not a collection of independent test files. A stable question may appear in many generated or fixed tests without duplication.

## Content hierarchy

`subject → section → topic → subtopic`

Questions can additionally have tags, sources, source variants and stable codes. The hierarchy controls navigation; tags enable cross-cutting selections.

## Question versioning

A question has a stable `questions.id`. Editable content lives in `question_revisions`. Every submitted answer points to the exact revision presented to the learner. Correct-answer fixes therefore do not rewrite historical results.

## Study modes

- `learning`: immediate feedback and explanation;
- `exam`: feedback after completion;
- `mistakes`: unresolved review queue;
- `weak_topics`: generated from topic-level performance.

The MVP implements learning mode and a local mistake queue. A mistake remains unresolved until two correct answers occur after the most recent wrong answer. The server model includes a dedicated review queue so this can evolve into spaced repetition.

## Data boundary

The browser prototype stores progress in `localStorage` only. Production persistence will use Supabase/PostgreSQL with Row Level Security. Content is globally readable to authenticated learners; attempts and review records are user-owned.

## Import strategy

XLSX/CSV is the canonical bulk-import route because its columns can map deterministically to the internal model. DOCX will be secondary and must stage parsed questions for validation rather than silently importing ambiguous structures.

## Roadmap

1. Bootstrap UI, domain types, local learning mode and review queue.
2. Connect Supabase Auth and database migrations.
3. Subject/topic navigation and generated tests.
4. XLSX import with validation and preview.
5. Exam mode, advanced analytics and spaced repetition scheduler.
6. Case, matching, ordering, text and numeric questions.
7. Offline data sync and richer PWA installation experience.
