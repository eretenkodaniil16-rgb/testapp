# TestApp architecture

## Principle

TestApp is a local-first PWA backed by versioned static content packages. It does not require Supabase or another database service for the current product scope.

## Shared content

The repository contains `public/content/manifest.json` plus immutable versioned package files. The manifest is the update index; a package is changed by publishing a new package version and updating the manifest.

Curriculum keeps the hierarchy `subject → section → topic → subtopic`. Questions use stable IDs and separate revision IDs so wording/key corrections do not change semantic question identity.

## Learner data

Answers, exam results, mistake state, topic performance and spaced-repetition scheduling remain in browser IndexedDB. They are never written to GitHub or a central server by default.

The progress store automatically migrates the original localStorage MVP and older IndexedDB records. Backup/restore serializes the complete local learner state, including review scheduling.

## Spaced repetition

Every submitted answer updates a local review record keyed by stable question ID.

- incorrect answer: interval resets to 1 day, lapse counter increases and ease factor decreases;
- first correct answer: 2-day interval;
- second consecutive correct answer: 5-day interval;
- later correct answers: previous interval is multiplied by the current ease factor, with a minimum 7-day interval;
- correct answers gradually increase ease up to 3.0; incorrect answers reduce it down to a floor of 1.3.

The `/review` route shows due and upcoming reviews. `/practice?mode=review` loads only questions whose due date has arrived.

## Weak topics

Topic performance is derived from local answer history using `subjectId + topicId` as the key. A topic is classified as weak when it has at least two recorded answers and accuracy below 75%. `/weak-topics` ranks those topics from weakest upward, and `mode=weak_topics` builds an adaptive session from them.

## Exam mode

The training constructor can switch between learning and exam modes. Exam mode stores selections locally during the session, never reveals correctness between questions, then grades the whole set at completion. The final review shows the learner's selection, correct answer(s) and explanation. Only the completed exam batch is appended to persistent progress.

## Content caching and offline behavior

The app checks the manifest when online. Packages are cached by `package id + version` in a dedicated `testapp-content` IndexedDB database. The service worker caches the main routes, including the answer bank, review scheduler and weak-topic screen.

Learner history is stored separately from content, so updating question packages cannot erase progress.

## Navigation and study flows

The learner can navigate `discipline → section → topic` before starting a session. The training constructor can select one or more topics, limit the number of questions, optionally shuffle them and choose learning or exam mode.

The `/questions` route is read-only: it shows question text, correct answer(s) and explanation without writing progress.

## Study modes

- `learning`: immediate feedback and explanation;
- `exam`: delayed grading until the end;
- `mistakes`: unresolved incorrect questions;
- `weak_topics`: adaptive practice from low-accuracy topics;
- `review`: due spaced-repetition items;
- read-only answer bank: no progress write.

A mistake remains unresolved until two correct answers occur after the most recent wrong answer. This mistake queue is intentionally separate from spaced repetition.

## Import strategy

XLSX/CSV is the canonical bulk-import source. Import validates rows and generates deterministic JSON content packages rather than writing into a live database. DOCX import may be added later as a staged, review-required parser.

## Deployment model

GitHub stores source code, content packages and version history. CI validates content schemas, TypeScript and the production build. A static/Next-compatible host serves the PWA and files from `public/content`.

## Roadmap

1. Mobile-first PWA and local progress — implemented.
2. IndexedDB progress + backup/restore — implemented.
3. Static content manifest and versioned package loader — implemented.
4. Discipline/section/topic navigation and generated training sets — implemented.
5. XLSX import with schema validation and preview — implemented.
6. Read-only question bank with correct answers — implemented.
7. Exam mode, weak-topic analytics and spaced repetition — implemented.
8. Case, matching, ordering, text and numeric questions.
9. Stronger offline package management and install UX.
