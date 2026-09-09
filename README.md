# TestApp

Mobile-first PWA for solving educational test questions, preserving results and systematically repeating mistakes.

## Current MVP

- Next.js App Router + TypeScript;
- responsive phone-first UI;
- learning-mode question engine;
- single-choice and multiple-choice questions;
- immediate feedback and explanations;
- local answer history in IndexedDB;
- automatic migration from the original localStorage MVP;
- mistake queue: a question is cleared after two correct answers following the latest mistake;
- basic topic statistics;
- local progress backup/restore through a JSON file;
- PWA manifest + service worker shell;
- versioned PostgreSQL/Supabase content schema;
- CI typecheck and production build.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

The application is a unified question bank, not a folder of independent tests. Curriculum uses `subject → section → topic → subtopic`; questions may also have tags and sources. Editable content is revisioned.

Learner progress is local-first. Answers, mistakes, statistics, review state and unfinished attempts stay in IndexedDB on the user's device and are not written to Supabase by default. Supabase stores only shared curriculum and question content, so server storage does not grow proportionally to the number of students.

See `docs/architecture.md` and `docs/database.md`.

## Next milestone

Connect a free Supabase project as the shared content backend, apply `supabase/migrations/0001_initial_schema.sql`, build subject/topic browsing and then add validated XLSX import.
