# Database model

Supabase is the shared content backend only. Learner progress is intentionally excluded from the server schema.

Core groups:

- Curriculum: `subjects`, `sections`, `topics`, `subtopics`.
- Content: `questions`, `question_revisions`, `answer_options`, `sources`, `tags`, `question_tags`.
- Test assembly: `test_definitions`, `test_questions`.
- Import operations: `import_jobs`, `import_errors`.

There are no server-side `attempts`, `attempt_answers`, `review_items` or `review_history` tables in the default architecture. Answers, mistakes, statistics, review scheduling and unfinished attempts live in the user's IndexedDB.

Question revisions remain important even without server-side attempts: published source content must be auditable and updatable without silently mutating older material.

If optional cloud synchronization is added later, it should use a separate opt-in schema or service so that the default application remains local-first.
