# TestApp

Mobile-first PWA for educational test practice with local progress, mistake review and versioned static question packages.

## Current MVP

- Next.js App Router + TypeScript;
- responsive phone-first UI;
- learning-mode engine for single-choice and multiple-choice questions;
- immediate feedback and explanations;
- learner history in IndexedDB;
- automatic migration from the original localStorage MVP;
- mistake queue: a question is cleared after two correct answers following the latest mistake;
- basic topic statistics;
- local JSON backup/restore;
- versioned static content manifest + package loader;
- per-subject practice links;
- PWA manifest + service worker;
- CI typecheck and production build.

## No required backend database

TestApp currently does not require Supabase or another database service. Shared questions are committed as static JSON packages under `public/content`. GitHub provides source/content version history, while learner answers remain on each user's device.

This means adding more students does not create a growing central table of attempts or statistics.

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
- learner progress: local IndexedDB only;
- backup/transfer: exported TestApp JSON file.

Questions use stable IDs and explicit revision IDs so content corrections do not destroy learning history.

See:

- `docs/architecture.md`;
- `docs/storage.md`;
- `docs/content-format.md`.

## Next milestone

Build the validated XLSX → preview → JSON-package import pipeline, then expand subject/topic navigation and generated training configuration.
