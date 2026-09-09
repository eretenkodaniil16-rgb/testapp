# TestApp

Mobile-first local-first PWA for educational test practice with static versioned question packages.

## Current MVP

- Next.js App Router + TypeScript;
- responsive phone-first UI;
- discipline → section → topic navigation;
- configurable learning sessions;
- exam mode with delayed grading and post-exam review;
- single-choice and multiple-choice questions;
- read-only question bank with correct answers and explanations;
- local answer history in IndexedDB;
- unresolved mistake queue;
- weak-topic detection from local accuracy;
- spaced-repetition schedule stored locally;
- statistics and topic analytics;
- local JSON backup/restore;
- static content manifest + immutable versioned packages;
- browser-local XLSX import with validation, preview and JSON-package export;
- PWA manifest + service worker;
- CI content validation, typecheck and production build.

## No required backend database

TestApp does not require Supabase or another database service for the current product scope. Shared questions are committed as static JSON packages under `public/content`. GitHub provides source/content version history, while learner answers, mistakes, exam results and review scheduling remain on each user's device.

Adding more students therefore does not create a growing central table of attempts or statistics.

## Study modes

- Learning: immediate grading and explanation.
- Exam: grading and explanations are hidden until the final question is submitted.
- Mistakes: unresolved incorrect questions are repeated separately.
- Weak topics: topics with at least two attempts and accuracy below 75% are surfaced automatically.
- Spaced repetition: every answered question receives a local next-review date. Incorrect answers return after 1 day; consecutive correct answers progressively increase the interval.
- Answer bank: `/questions` shows questions and correct answers without writing progress.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

Shared content and learner state are intentionally separate:

- shared content: `public/content/manifest.json` + immutable versioned package files;
- content cache: browser `testapp-content` IndexedDB;
- learner progress and spaced-repetition state: local `testapp` IndexedDB;
- backup/transfer: exported TestApp JSON file;
- authoring import: local XLSX → validated JSON package.

Questions use stable IDs and explicit revision IDs so content corrections do not destroy learning history.

See `docs/architecture.md`, `docs/storage.md`, `docs/content-format.md` and `docs/xlsx-import.md`.

## Next milestone

Expand question types to case, matching, ordering, text and numeric answers, then strengthen offline package management and install UX.
