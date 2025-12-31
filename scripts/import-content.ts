import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { calculateWordCount } from '../lib/utils'

const prisma = new PrismaClient()

/**
 * Normalize text: collapse whitespace to single spaces and trim
 */
function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * Find evidence quote in text and compute start/end positions
 * Tries exact match first, then normalized match (whitespace-flexible)
 */
function findEvidenceSpan(
  textContent: string,
  evidenceQuote: string,
  textIndex: number,
  questionIndex: number,
  fileName: string
): { start: number; end: number } {
  // Try exact match first
  const exactStart = textContent.indexOf(evidenceQuote)
  
  if (exactStart !== -1) {
    return {
      start: exactStart,
      end: exactStart + evidenceQuote.length,
    }
  }

  // Try normalized match: escape regex special chars and make whitespace flexible
  const escapedQuote = evidenceQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const flexiblePattern = escapedQuote.replace(/\s+/g, '\\s+')
  const regex = new RegExp(flexiblePattern)
  const match = textContent.match(regex)

  if (match && match.index !== undefined) {
    return {
      start: match.index,
      end: match.index + match[0].length,
    }
  }

  // Not found - throw error
  throw new Error(
    `Evidence quote not found in text: ${fileName}, text orderIndex=${textIndex}, question orderIndex=${questionIndex}. Quote: "${evidenceQuote.substring(0, 50)}${evidenceQuote.length > 50 ? '...' : ''}"`
  )
}

interface QuestionData {
  orderIndex: number
  type: 'INFO' | 'MAIN_IDEA' | 'INFERENCE' | 'TONE' | 'INTENT' | 'PARAPHRASE' | 'NEGATION'
  difficulty: number
  promptNl: string
  promptAr: string
  options: string[]
  correctIndex: number
  explanationNl: string
  explanationAr: string
  trapNoteNl?: string | null
  trapNoteAr?: string | null
  evidenceQuote: string // Required: exact excerpt from text
  evidenceStart?: number | null // Optional: computed from evidenceQuote if not provided
  evidenceEnd?: number | null // Optional: computed from evidenceQuote if not provided
}

interface TextData {
  orderIndex: number
  title: string
  topic: string
  level: string
  content: string
  minWordCount?: number
  maxWordCount?: number
  questions: QuestionData[]
}

interface ContentPack {
  kind: 'EXAM' | 'PRACTICE'
  number?: number // Optional - will be auto-assigned if not provided
  titleNl: string
  titleAr: string
  totalTimeSec: number
  texts: TextData[]
}

/**
 * Validate question structure
 */
function validateQuestion(question: QuestionData, textIndex: number, questionIndex: number, fileName: string): void {
  if (!Array.isArray(question.options) || question.options.length !== 3) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: Must have exactly 3 options, got ${question.options?.length || 0}`
    )
  }

  if (question.correctIndex < 0 || question.correctIndex > 2) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: correctIndex must be 0, 1, or 2, got ${question.correctIndex}`
    )
  }

  const validTypes = ['INFO', 'MAIN_IDEA', 'INFERENCE', 'TONE', 'INTENT', 'PARAPHRASE', 'NEGATION']
  if (!validTypes.includes(question.type)) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: Invalid type "${question.type}", must be one of: ${validTypes.join(', ')}`
    )
  }

  if (question.difficulty < 1 || question.difficulty > 5) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: difficulty must be 1-5, got ${question.difficulty}`
    )
  }

  // Validate evidenceQuote
  if (!question.evidenceQuote || typeof question.evidenceQuote !== 'string') {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: evidenceQuote is required`
    )
  }

  const quoteLength = question.evidenceQuote.length
  if (quoteLength < 20 || quoteLength > 160) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}, Question ${questionIndex + 1}: evidenceQuote length must be 20-160 characters, got ${quoteLength}`
    )
  }
}

/**
 * Validate text structure and word count
 */
function validateText(text: TextData, textIndex: number, fileName: string, kind: 'EXAM' | 'PRACTICE'): void {
  const wordCount = calculateWordCount(text.content)
  
  if (text.minWordCount !== undefined && wordCount < text.minWordCount) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}: wordCount is ${wordCount}, but minimum is ${text.minWordCount}`
    )
  }

  if (text.maxWordCount !== undefined && wordCount > text.maxWordCount) {
    throw new Error(
      `Validation failed in ${fileName}: Text ${textIndex + 1}: wordCount is ${wordCount}, but maximum is ${text.maxWordCount}`
    )
  }

  // Validate questions
  text.questions.forEach((question, questionIndex) => {
    validateQuestion(question, textIndex, questionIndex, fileName)
  })
}

/**
 * Validate content pack structure
 */
function validateContentPack(pack: ContentPack, fileName: string): void {
  if (pack.kind !== 'EXAM' && pack.kind !== 'PRACTICE') {
    throw new Error(`Validation failed in ${fileName}: kind must be "EXAM" or "PRACTICE", got "${pack.kind}"`)
  }

  if (pack.kind === 'EXAM') {
    if (pack.texts.length !== 6) {
      throw new Error(
        `Validation failed in ${fileName}: EXAM must have exactly 6 texts, got ${pack.texts.length}`
      )
    }

    const expectedQuestionCounts = [5, 7, 6, 6, 6, 6]
    const actualQuestionCounts = pack.texts.map(t => t.questions.length)
    
    if (JSON.stringify(actualQuestionCounts) !== JSON.stringify(expectedQuestionCounts)) {
      throw new Error(
        `Validation failed in ${fileName}: EXAM question counts per text must be [5, 7, 6, 6, 6, 6], got [${actualQuestionCounts.join(', ')}]`
      )
    }

    const totalQuestions = pack.texts.reduce((sum, text) => sum + text.questions.length, 0)
    if (totalQuestions !== 36) {
      throw new Error(
        `Validation failed in ${fileName}: EXAM must have exactly 36 questions total, got ${totalQuestions}`
      )
    }
  } else if (pack.kind === 'PRACTICE') {
    if (pack.texts.length !== 2) {
      throw new Error(
        `Validation failed in ${fileName}: PRACTICE must have exactly 2 texts, got ${pack.texts.length}`
      )
    }

    pack.texts.forEach((text, index) => {
      if (text.questions.length !== 6) {
        throw new Error(
          `Validation failed in ${fileName}: PRACTICE Text ${index + 1} must have exactly 6 questions, got ${text.questions.length}`
        )
      }
    })

    const totalQuestions = pack.texts.reduce((sum, text) => sum + text.questions.length, 0)
    if (totalQuestions !== 12) {
      throw new Error(
        `Validation failed in ${fileName}: PRACTICE must have exactly 12 questions total, got ${totalQuestions}`
      )
    }
  }

  // Validate each text
  pack.texts.forEach((text, textIndex) => {
    validateText(text, textIndex, fileName, pack.kind)
  })
}

/**
 * Get the next sequential number for a given kind
 */
async function getNextNumber(kind: 'EXAM' | 'PRACTICE'): Promise<number> {
  const lastModel = await prisma.model.findFirst({
    where: { kind },
    orderBy: { number: 'desc' },
  })
  return lastModel ? lastModel.number + 1 : 1
}

/**
 * Import a content pack into the database
 */
async function importContentPack(pack: ContentPack, fileName: string): Promise<void> {
  // Determine the number to use
  let number = pack.number
  if (!number) {
    number = await getNextNumber(pack.kind)
    console.log(`Auto-assigned number ${number} for ${pack.kind}`)
  }

  // Create or update model
  const model = await prisma.model.upsert({
    where: {
      kind_number: {
        kind: pack.kind,
        number: number,
      },
    },
    update: {
      titleNl: pack.titleNl,
      titleAr: pack.titleAr,
      totalTimeSec: pack.totalTimeSec,
    },
    create: {
      kind: pack.kind,
      number: number,
      titleNl: pack.titleNl,
      titleAr: pack.titleAr,
      totalTimeSec: pack.totalTimeSec,
    },
  })

  // Delete existing texts and questions (cascade will handle questions)
  await prisma.text.deleteMany({
    where: { modelId: model.id },
  })

  // Create texts and questions
  for (const textData of pack.texts) {
    const wordCount = calculateWordCount(textData.content)
    
    const text = await prisma.text.create({
      data: {
        modelId: model.id,
        orderIndex: textData.orderIndex,
        title: textData.title,
        topic: textData.topic,
        level: textData.level,
        wordCount: wordCount,
        content: textData.content,
      },
    })

    // Create questions
    await prisma.question.createMany({
      data: textData.questions.map((q) => {
        // Compute evidenceStart/evidenceEnd from evidenceQuote if not provided
        let evidenceStart = q.evidenceStart
        let evidenceEnd = q.evidenceEnd

        if (evidenceStart === null || evidenceStart === undefined || 
            evidenceEnd === null || evidenceEnd === undefined) {
          const span = findEvidenceSpan(
            textData.content,
            q.evidenceQuote,
            textData.orderIndex,
            q.orderIndex,
            fileName
          )
          evidenceStart = span.start
          evidenceEnd = span.end
        }

        return {
          textId: text.id,
          orderIndex: q.orderIndex,
          type: q.type,
          difficulty: q.difficulty,
          promptNl: q.promptNl,
          promptAr: q.promptAr,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanationNl: q.explanationNl,
          explanationAr: q.explanationAr,
          trapNoteNl: q.trapNoteNl || null,
          trapNoteAr: q.trapNoteAr || null,
          evidenceQuote: q.evidenceQuote,
          evidenceStart: evidenceStart,
          evidenceEnd: evidenceEnd,
        }
      }),
    })
  }

  console.log(`✓ Successfully imported ${fileName} as ${pack.kind} ${number}`)
}

/**
 * Main import function
 */
async function main() {
  const fileName = process.argv[2]

  if (!fileName) {
    console.error('Usage: npm run import:content -- <filename.json>')
    console.error('Example: npm run import:content -- exam_3.json')
    process.exit(1)
  }

  // Resolve file path - check both content directory and current directory
  let filePath: string
  const contentDir = path.join(process.cwd(), 'content')
  const contentFilePath = path.join(contentDir, fileName)
  const directFilePath = path.isAbsolute(fileName) ? fileName : path.join(process.cwd(), fileName)

  if (fs.existsSync(contentFilePath)) {
    filePath = contentFilePath
  } else if (fs.existsSync(directFilePath)) {
    filePath = directFilePath
  } else {
    console.error(`File not found: ${fileName}`)
    console.error(`Checked: ${contentFilePath}`)
    console.error(`Checked: ${directFilePath}`)
    process.exit(1)
  }

  console.log(`Importing ${filePath}...`)

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const pack: ContentPack = JSON.parse(fileContent)

    // Validate structure
    validateContentPack(pack, fileName)

    // Import into database
    await importContentPack(pack, fileName)
    console.log('\n✓ Import completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n✗ Import failed: ${error.message}`)
    } else {
      console.error('\n✗ Import failed:', error)
    }
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })

