# Live content from GitHub

TestApp separates application releases from question-bank releases.

## Source

The browser reads the live manifest from:

`https://raw.githubusercontent.com/eretenkodaniil16-rgb/testapp/content-live/public/content/manifest.json`

The `content-live` branch is therefore the authoritative source for published test packages. The application keeps a bundled copy only as an offline/first-run fallback.

## Publishing a new test package

1. Generate or prepare a versioned JSON package, for example `pathology-core.v3.json`.
2. Add it under `public/content/packages/` in the `content-live` branch.
3. Increment the package `version` and any changed question `revisionId` values.
4. Update `public/content/manifest.json`: increase `contentVersion`, point the package entry to the new file, and update `questionCount` if necessary.
5. Commit the changes to `content-live`.

No application rebuild is required. On the next content check, TestApp downloads the new manifest and any package whose version is not already cached on the device.

## Explanations for every answer option

Each option may contain an optional `feedback` field. XLSX import also recognizes `feedback_A` through `feedback_H` (and their documented aliases). Use this to explain why both correct and incorrect variants are correct or incorrect.

## Safety rules

- Never rewrite an already published package version. Publish a new version instead.
- Keep stable question `id` values across edits.
- Increment `revisionId` when question wording, answer keys, global explanation, or per-option feedback changes materially.
- The `Validate live test content` workflow checks content structure on pushes to `content-live`.
