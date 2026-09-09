# TestApp architecture

## Principle

TestApp is a local-first PWA backed by versioned static content packages. It does not require Supabase or another database service for the current product scope.

## Shared content

The repository contains a small `public/content/manifest.json` plus one or more immutable package files. The manifest is the update index; a package is replaced by publishing a new package version and then updating the manifest.

Curriculum keeps the logical hierarchy `subject → section → topic → subtopic`. Questions use stable IDs and separate revision IDs. A wording/key correction therefore creates a new revision without changing the stable question identity.

## Learner data

Answers, mistakes, statistics, review state and unfinished work remain on the learner's device in IndexedDB. They are never written to GitHub or a central server by default.

The app supports JSON backup/restore for moving progress between devices or protecting it before browser-data cleanup. Future cloud sync, if ever added, must remain optional.

## Content caching and offline behavior

The app checks the manifest when online. Packages are cached by `package id + version` in a dedicated `testapp-content` IndexedDB database. A new manifest version can point to new package versions while old cached packages remain harmless. The service worker also caches fetched GET resources as an additional offline layer.

The learner history is stored separately from content, so updating or replacing question packages cannot erase progress.

## Current study modes

- `learning`: immediate feedback and explanation;
- `mistakes`: unresolved local review queue;
- `exam`: planned;
- `weak_topics`: planned from local statistics.

A mistake stays unresolved until two correct answers occur after the most recent wrong answer.

## Import strategy

XLSX/CSV will be the canonical bulk-import source. Import does not write directly into a live database. Instead it validates rows and generates deterministic JSON content packages plus an updated manifest. DOCX import may be added later as a staged, review-required parser.

## Deployment model

GitHub stores source code, content packages and version history. CI validates TypeScript/builds and later will also validate content schemas. A static/Next-compatible host serves the PWA and files from `public/content`.

## Roadmap

1. Mobile-first PWA and local progress.
2. IndexedDB progress + backup/restore.
3. Static content manifest and versioned package loader.
4. Subject/topic navigation and generated training sets.
5. XLSX import with schema validation and preview.
6. Exam mode, weak-topic analytics and spaced repetition.
7. Case, matching, ordering, text and numeric questions.
8. Stronger offline package management and install UX.
