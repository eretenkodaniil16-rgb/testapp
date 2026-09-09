# TestApp

Mobile-first PWA for solving educational test questions, preserving results and systematically repeating mistakes.

## Current MVP

- Next.js App Router + TypeScript;
- responsive phone-first UI;
- learning-mode question engine;
- single-choice and multiple-choice questions;
- immediate feedback and explanations;
- local answer history;
- mistake queue: a question is cleared after two correct answers following the latest mistake;
- basic topic statistics;
- PWA manifest + service worker shell;
- versioned PostgreSQL/Supabase schema;
- CI typecheck and production build.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

The application is a unified question bank, not a folder of independent tests. Curriculum uses `subject → section → topic → subtopic`; questions may also have tags and sources. Editable content is revisioned, and each historical answer references the exact question revision shown to the learner.

See `docs/architecture.md` and `docs/database.md`.

## Next milestone

Connect a Supabase project, apply `supabase/migrations/0001_initial_schema.sql`, add authentication and replace browser-local progress with synchronized attempts while keeping offline-safe local writes.
