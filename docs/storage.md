# Storage model

TestApp deliberately separates shared educational content from personal learner state.

## Shared content

Shared content lives in versioned JSON files committed to GitHub and served with the application:

- `public/content/manifest.json` — global content index and package versions;
- `public/content/packages/*.json` — immutable subject/topic question packages;
- future media files — images referenced by packages.

The browser caches packages in the `testapp-content` IndexedDB database. Packages are keyed by `packageId@version`, so publishing a new version does not mutate an older cached package.

## Personal progress

Personal progress lives only in the browser's local IndexedDB storage:

- answer history;
- selected options;
- correctness;
- question revision shown to the learner;
- unresolved mistake state derived from answer history;
- local statistics;
- future review scheduling and unfinished attempts.

The current progress store is schema version 2 and automatically migrates the original MVP `localStorage` record on first read.

## Backup

The Settings screen exports learner progress as a `testapp-progress-YYYY-MM-DD.json` file. Import validates the TestApp backup marker before replacing the local progress store.

## Identity and revisions

A question has a stable semantic ID such as:

`pathology.circulation.thrombosis.000001`

A revision is explicit:

`pathology.circulation.thrombosis.000001-r2`

Learner history records both. Text corrections or answer-key fixes therefore do not require changing the question identity.

## Privacy consequence

The number of learners does not increase repository/database storage with their activity. GitHub receives only administrator-authored shared content and source-code changes; student answers are not uploaded.
