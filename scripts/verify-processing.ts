import * as fs from 'fs'
import * as path from 'path'

interface Question {
  orderIndex: number
  evidenceQuote: string
}

interface Text {
  title: string
  content: string
  questions: Question[]
}

interface ContentPack {
  kind: string
  number: number
  texts: Text[]
}

function getParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function findParagraphIndex(paragraphs: string[], evidenceQuote: string): number {
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(evidenceQuote)) {
      return i
    }
  }
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

function validateForwardOnly(questions: Question[], content: string): boolean {
  const paragraphs = getParagraphs(content)
  let lastParaIndex = -1

  for (const q of questions) {
    const paraIndex = findParagraphIndex(paragraphs, q.evidenceQuote)
    if (paraIndex === -1) {
      return false // Quote not found
    }
    if (paraIndex < lastParaIndex) {
      return false // Backward jump detected
    }
    lastParaIndex = paraIndex
  }
  return true
}

function main() {
  const contentDir = path.join(process.cwd(), 'content')
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.json'))
    .sort()

  let totalTexts = 0
  let totalValid = 0
  let totalInvalid = 0

  console.log('Verifying all texts were processed and follow forward-only progression:\n')

  for (const file of files) {
    const filePath = path.join(contentDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const pack: ContentPack = JSON.parse(content)

    for (const text of pack.texts) {
      totalTexts++
      const isValid = validateForwardOnly(text.questions, text.content)
      if (isValid) {
        totalValid++
      } else {
        totalInvalid++
        console.log(`❌ ${file} - "${text.title.substring(0, 60)}..."`)
      }
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total texts processed: ${totalTexts}`)
  console.log(`✓ Valid (forward-only): ${totalValid}`)
  if (totalInvalid > 0) {
    console.log(`✗ Invalid (has backward jumps): ${totalInvalid}`)
  } else {
    console.log(`✗ Invalid: 0`)
  }
  console.log(`\n${totalInvalid === 0 ? '✅ All texts follow forward-only progression!' : '❌ Some texts need attention'}`)
}

main()

