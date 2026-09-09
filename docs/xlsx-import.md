# XLSX import

TestApp imports spreadsheets entirely in the browser. The selected workbook is parsed locally and is not uploaded to GitHub or another server.

## Workflow

1. Open `/admin/import`.
2. Set a package ID and positive integer package version.
3. Optionally override subject ID/title; otherwise they are read from the sheet.
4. Select an `.xlsx`/`.xls` workbook.
5. Review errors, warnings and question preview.
6. Download the generated immutable JSON package and its manifest-entry snippet.
7. Commit the package under `public/content/packages/` and add/update its entry in `public/content/manifest.json`.

The UI also generates a starter XLSX template with a `Вопросы` sheet and a separate instruction sheet.

## Canonical columns

The importer accepts English and common Russian aliases. Canonical names are:

- `id` — stable question ID; recommended. If absent, a deterministic ID is generated and a warning is emitted;
- `revision` / `revision_id` — revision number or full revision ID; defaults to `r1`;
- `subject_id`, `subject` — discipline ID and title;
- `section_id`, `section` — optional section; missing section becomes `Общий раздел`;
- `topic_id`, `topic` — topic ID and title;
- `type` — `single_choice` or `multiple_choice`; may be inferred from the key;
- `question` — prompt text;
- `A`…`H` — answer options, at least two non-empty;
- `correct` — correct keys;
- `explanation` — general explanation shown after checking;
- `feedback_A`…`feedback_H` — optional per-option feedback.

## Correct-answer notation

Accepted key forms:

- Latin labels: `A`, `B`, `A;C`, `A,C`;
- Russian labels: `А`, `Б`, `А;В` (mapped by answer position);
- numeric positions: `1`, `2`, `1;3`.

Separators can be comma, semicolon, plus, slash, pipe or whitespace.

## Validation rules

The importer blocks package download when it finds errors such as:

- missing prompt, discipline, topic or correct key;
- fewer than two answer options;
- a key pointing to an empty option;
- duplicate question IDs;
- more than one correct answer in `single_choice`;
- mixed disciplines in a single package;
- invalid package ID/version metadata.

Warnings do not block export. Current warnings include generated question IDs, unknown question-type labels that were inferred automatically, and `multiple_choice` rows that only contain one correct answer.

## Stable identity

Generated IDs are deterministic from subject/topic/prompt, but a wording change will change such an ID. For long-lived content, keep explicit stable IDs in the source workbook after the first import. Revision changes should update `revision` while preserving `id`.

## Publication safety

Import does not write directly to GitHub. This is intentional: the public client never receives a GitHub write token. Publication stays a repository operation so package changes remain reviewable and auditable through Git history and CI.
