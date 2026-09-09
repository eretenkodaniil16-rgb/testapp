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
- browser-local XLSX import with validation, preview and JSON-package export;
- PWA manifest + service worker;
- CI content validation, typecheck and production build.

## No required backend database

TestApp does not require Supabase or another database service for the current product scope. Shared questions are committed as static JSON packages under `public/content`. GitHub provides source/content version history, while learner answers remain on each user's device.

Adding more students therefore does not create a growing central table of attempts or statistics.

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
- backup/transfer: exported TestApp JSON file;
- authoring import: local XLSX → validated JSON package.

Questions use stable IDs and explicit revision IDs so content corrections do not destroy learning history.

See:

- `docs/architecture.md`;
- `docs/storage.md`;
- `docs/content-format.md`;
- `docs/xlsx-import.md`.

## XLSX import

Open `/admin/import` in the running app. The workbook is parsed only on the device; it is not uploaded. The importer supports English and Russian column aliases, validates rows, previews questions and exports a versioned package plus a manifest-entry snippet.

## Next milestone

Expand navigation to `discipline → section → topic`, add generated training configuration and then build exam mode / weak-topic practice.
