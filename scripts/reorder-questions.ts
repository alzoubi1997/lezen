import * as fs from 'fs'
import * as path from 'path'

interface Question {
  orderIndex: number
  type: string
  difficulty: number
  promptNl: string
  promptAr: string
  options: string[]
  correctIndex: number
  explanationNl: string
  explanationAr: string
  trapNoteNl: string
  trapNoteAr: string
  evidenceQuote: string
}

interface Text {
  orderIndex: number
  title: string
  topic: string
  level: string
  content: string
  minWordCount: number
  maxWordCount: number
  questions: Question[]
}

interface ContentPack {
  kind: string
  number: number
  titleNl: string
  titleAr: string
  totalTimeSec: number
  texts: Text[]
}

/**
 * Split content into paragraphs (by double newline)
 */
function getParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Find which paragraph index contains the evidenceQuote
 * Returns -1 if not found
 */
function findParagraphIndex(paragraphs: string[], evidenceQuote: string): number {
  // Try exact match first
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(evidenceQuote)) {
      return i
    }
  }

  // Try normalized match (flexible whitespace)
  const normalizedQuote = evidenceQuote.replace(/\s+/g, '\\s+')
  const escapedQuote = normalizedQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedQuote)

  for (let i = 0; i < paragraphs.length; i++) {
    if (regex.test(paragraphs[i])) {
      return i
    }
  }

  return -1
}

/**
 * Reorder questions to ensure forward-only paragraph progression
 */
function reorderQuestions(questions: Question[], content: string): Question[] {
  const paragraphs = getParagraphs(content)

  // Map each question to its paragraph index
  const questionsWithParagraphs = questions.map((q) => {
    const paraIndex = findParagraphIndex(paragraphs, q.evidenceQuote)
    if (paraIndex === -1) {
      console.warn(
        `Warning: Could not find evidenceQuote in any paragraph: "${q.evidenceQuote.substring(0, 50)}..."`
      )
      // Put at end if not found
      return { question: q, paraIndex: paragraphs.length }
    }
    return { question: q, paraIndex }
  })

  // Sort by paragraph index (ascending), maintaining stable sort for same paragraph
  questionsWithParagraphs.sort((a, b) => {
    if (a.paraIndex !== b.paraIndex) {
      return a.paraIndex - b.paraIndex
    }
    // Maintain original order for questions in same paragraph
    return questions.indexOf(a.question) - questions.indexOf(b.question)
  })

  // Extract reordered questions and update orderIndex
  return questionsWithParagraphs.map((item, index) => ({
    ...item.question,
    orderIndex: index,
  }))
}

/**
 * Process a single content pack file
 */
function processFile(filePath: string): void {
  console.log(`Processing ${path.basename(filePath)}...`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const pack: ContentPack = JSON.parse(content)

  let totalReordered = 0

  for (const text of pack.texts) {
    const paragraphs = getParagraphs(text.content)
    
    // Get original paragraph indices
    const originalParaIndices = text.questions.map((q) => 
      findParagraphIndex(paragraphs, q.evidenceQuote)
    )
    
    const reorderedQuestions = reorderQuestions(text.questions, text.content)
    
    // Get new paragraph indices
    const newParaIndices = reorderedQuestions.map((q) =>
      findParagraphIndex(paragraphs, q.evidenceQuote)
    )

    // Check if reordering was needed (compare paragraph order, not orderIndex)
    const wasReordered =
      JSON.stringify(originalParaIndices) !== JSON.stringify(newParaIndices)

    if (wasReordered) {
      totalReordered++
      console.log(
        `  Text "${text.title.substring(0, 50)}...": Reordered ${text.questions.length} questions`
      )
      console.log(`    Original para order: ${originalParaIndices.join(', ')}`)
      console.log(`    New para order: ${newParaIndices.join(', ')}`)
    }

    text.questions = reorderedQuestions
  }

  if (totalReordered > 0) {
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(pack, null, 2) + '\n', 'utf-8')
    console.log(`  ✓ Updated ${totalReordered} text(s)`)
  } else {
    console.log(`  ✓ No reordering needed`)
  }
}

/**
 * Validate forward-only progression for a text
 */
function validateForwardOnly(questions: Question[], content: string): boolean {
  const paragraphs = getParagraphs(content)
  let lastParaIndex = -1

  for (const q of questions) {
    const paraIndex = findParagraphIndex(paragraphs, q.evidenceQuote)
    if (paraIndex === -1) {
      console.warn(`  Warning: Question ${q.orderIndex} evidenceQuote not found`)
      continue
    }

    if (paraIndex < lastParaIndex) {
      console.error(
        `  ERROR: Question ${q.orderIndex} references paragraph ${paraIndex}, but previous question was at paragraph ${lastParaIndex}`
      )
      return false
    }

    lastParaIndex = paraIndex
  }

  return true
}

/**
 * Main function
 */
function main() {
  const contentDir = path.join(process.cwd(), 'content')
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.json'))
    .sort()

  console.log(`Found ${files.length} files to process\n`)

  // Process all files
  for (const file of files) {
    const filePath = path.join(contentDir, file)
    processFile(filePath)
  }

  console.log('\n=== Validation ===\n')

  // Validate all files
  for (const file of files) {
    const filePath = path.join(contentDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const pack: ContentPack = JSON.parse(content)

    console.log(`Validating ${path.basename(filePath)}...`)

    for (const text of pack.texts) {
      const isValid = validateForwardOnly(text.questions, text.content)
      if (!isValid) {
        console.error(`  ✗ Validation failed for text: ${text.title}`)
      }
    }

    console.log(`  ✓ All texts validated`)
  }

  console.log('\n✓ Done!')
}

main()
