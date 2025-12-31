# Seed Content Expansion Note

The seed file (`prisma/seed.ts`) currently includes:

- ✅ Complete structure for all models (2 exams, 3 practice sets)
- ✅ Example texts and questions demonstrating the pattern
- ⚠️ **Needs expansion**: Full content for all texts and questions

## Required Content

### Exam Models (2 total)
Each exam needs:
- 6 texts
- 35 questions total (distributed across texts)
- All questions must have:
  - Bilingual prompts (NL + AR)
  - 3 options (A, B, C) - no D option
  - Bilingual explanations
  - Trap notes (why tempting wrong answers are wrong)
  - Evidence spans (start/end character positions)

### Practice Models (3 total)
Each practice needs:
- 2 texts
- 12 questions total
- Same question structure as exams

## Question Types to Include

- INFO: Factual information
- MAIN_IDEA: Main idea identification
- INFERENCE: Inference and conclusions
- TONE: Author's tone/attitude
- INTENT: Author's purpose
- PARAPHRASE: Word/phrase meaning in context
- NEGATION: What is NOT mentioned

## Content Guidelines

- All texts must be **ORIGINAL** (not copyrighted exam materials)
- B2+/C1 level Dutch vocabulary and complexity
- Topics: current events, culture, science, society, technology, environment
- Questions should include calibrated traps (synonyms, negation, intent/tone confusion)
- Difficulty scale: 1-5

## Current Status

The seed file has:
- ✅ Exam 1: Text 1 (5 questions) + Text 2 (2 questions) = 7/35 questions
- ⚠️ Need: 4 more texts + ~28 more questions for Exam 1
- ⚠️ Need: Complete Exam 2 (6 texts, 35 questions)
- ⚠️ Need: Complete Practice 1, 2, 3 (2 texts, 12 questions each)

## How to Expand

Follow the pattern in the existing seed file:
1. Create text with `prisma.text.create()`
2. Use `calculateWordCount()` for wordCount
3. Create questions with `prisma.question.createMany()`
4. Ensure all fields are filled (promptNl, promptAr, optionsJson, etc.)
5. Set evidenceStart and evidenceEnd based on character positions in content

The structure is complete and ready for content expansion!

