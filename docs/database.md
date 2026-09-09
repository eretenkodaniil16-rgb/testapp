# Database model

Core groups:

- Curriculum: `subjects`, `sections`, `topics`, `subtopics`.
- Content: `questions`, `question_revisions`, `answer_options`, `sources`, `tags`, `question_tags`.
- Test assembly: `test_definitions`, `test_questions`.
- Learning history: `attempts`, `attempt_answers`.
- Review: `review_items`, `review_history`.
- Import operations: `import_jobs`, `import_errors`.

Every `attempt_answers` row references `question_revision_id`; this is required for reproducible historical scoring.

A generated test should store the presented revisions when the attempt starts. Do not resolve 'current revision' again when grading an existing attempt.
