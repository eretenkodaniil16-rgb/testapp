# Static content format

## Manifest

`public/content/manifest.json` is the only file the client must check to discover updates.

```json
{
  "schemaVersion": 1,
  "contentVersion": 3,
  "publishedAt": "2026-09-09T13:20:00Z",
  "packages": [
    {
      "id": "pathology-core",
      "subjectId": "pathology",
      "title": "Патологическая анатомия",
      "version": 2,
      "path": "/content/packages/pathology-core.v2.json",
      "questionCount": 500
    }
  ]
}
```

`contentVersion` changes whenever the manifest changes. Package `version` changes only when that package changes.

## Package

A package is immutable after publication. Corrections are published as a new package version.

```json
{
  "schemaVersion": 1,
  "id": "pathology-core",
  "version": 2,
  "subject": { "id": "pathology", "title": "Патологическая анатомия" },
  "sections": [],
  "questions": []
}
```

Every question contains a stable `id` and a `revisionId`. The stable ID remains the same across wording/key revisions.

## Update algorithm

1. Fetch manifest network-first.
2. Fall back to the last cached manifest when offline.
3. For every manifest entry, look for `packageId@version` in IndexedDB.
4. Download only missing package versions.
5. Use the embedded starter set only if neither network nor local cached content is available.

## Planned XLSX mapping

The importer will generate these package files. Expected canonical columns will include at least:

- stable question ID or generated stable code;
- discipline;
- section;
- topic;
- subtopic (optional);
- question type;
- prompt;
- answer options;
- correct option keys;
- explanation;
- source / source variant;
- tags.

Ambiguous or invalid rows must be rejected into a preview/error report rather than silently published.
