# Content Pack JSON Structure

Content packs are stored as JSON files in this directory.

## File Naming

- Exam packs: `exam_1.json`, `exam_2.json`, etc.
- Practice packs: `practice_1.json`, `practice_2.json`, etc.

## JSON Structure

```json
{
  "kind": "EXAM" | "PRACTICE",
  "number": 1,
  "titleNl": "Examen 1",
  "titleAr": "الامتحان 1",
  "totalTimeSec": 6000,
  "texts": [
    {
      "orderIndex": 0,
      "title": "Text Title",
      "topic": "Topic",
      "level": "B2",
      "content": "Full text content here...",
      "minWordCount": 200,
      "maxWordCount": 300,
      "questions": [
        {
          "orderIndex": 0,
          "type": "INFO",
          "difficulty": 3,
          "promptNl": "Question in Dutch",
          "promptAr": "سؤال بالعربية",
          "options": ["Option A", "Option B", "Option C"],
          "correctIndex": 0,
          "explanationNl": "Explanation in Dutch",
          "explanationAr": "شرح بالعربية",
          "trapNoteNl": "Trap note in Dutch (optional)",
          "trapNoteAr": "ملاحظة الفخ بالعربية (اختياري)",
          "evidenceQuote": "Exact excerpt from text content that provides evidence for the answer",
          "evidenceStart": null,
          "evidenceEnd": null
        }
      ]
    }
  ]
}
```

## Validation Rules

### Exams
- Must have exactly 6 texts
- Question counts per text: [5, 7, 6, 6, 6, 6] (total 36)
- Each question must have exactly 3 options
- Each question must have evidenceQuote (20-160 characters)
- evidenceStart/evidenceEnd are optional (computed automatically from evidenceQuote)
- wordCount must be within minWordCount/maxWordCount if specified

### Practice
- Must have exactly 2 texts
- Each text must have exactly 6 questions (total 12)
- Each question must have exactly 3 options
- Each question must have evidenceQuote (20-160 characters)
- evidenceStart/evidenceEnd are optional (computed automatically from evidenceQuote)
- wordCount must be within minWordCount/maxWordCount if specified

## Question Types

Valid types: `INFO`, `MAIN_IDEA`, `INFERENCE`, `TONE`, `INTENT`, `PARAPHRASE`, `NEGATION`

## Usage

### Seed all content packs:
```bash
npm run db:seed
```

### Import a single content pack:
```bash
npm run import:content -- exam_3.json
```

If `number` is not specified in the JSON, it will be auto-assigned sequentially.

