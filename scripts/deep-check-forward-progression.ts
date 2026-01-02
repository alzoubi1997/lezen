import * as fs from 'fs'
import * as path from 'path'

function getParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function findParagraphIndex(paragraphs: string[], evidenceQuote: string): number {
  // Try exact match first
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(evidenceQuote)) {
      return i
    }
  }
  return -1
}

const filePath = path.join(process.cwd(), 'content', 'exam_3.json')
const content = fs.readFileSync(filePath, 'utf-8')
const pack = JSON.parse(content)

console.log('=== DEEP CHECK: Forward-Only Paragraph Progression ===\n')
console.log(`Checking EXAM 3 with ${pack.texts.length} texts...\n`)

let totalIssues = 0
let totalQuestions = 0

pack.texts.forEach((text: any, textIndex: number) => {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`Text ${textIndex + 1}: "${text.title}"`)
  console.log(`${'='.repeat(70)}`)

  const paragraphs = getParagraphs(text.content)
  console.log(`\nTotal paragraphs: ${paragraphs.length}`)
  console.log(`Total questions: ${text.questions.length}\n`)

  let lastParaIndex = -1
  let hasIssues = false
  const questionMappings: Array<{ order: number; para: number; quote: string; found: boolean }> = []

  // Map all questions to paragraphs
  text.questions.forEach((q: any) => {
    const paraIndex = findParagraphIndex(paragraphs, q.evidenceQuote)
    const found = paraIndex !== -1
    questionMappings.push({
      order: q.orderIndex,
      para: paraIndex,
      quote: q.evidenceQuote.substring(0, 60) + '...',
      found,
    })
  })

  // Check progression
  console.log('Question → Paragraph Mapping:')
  console.log('-'.repeat(70))
  questionMappings.forEach((mapping, idx) => {
    const q = text.questions[idx]
    const status = mapping.found
      ? mapping.para >= lastParaIndex
        ? '✅'
        : '❌ BACKWARD JUMP'
      : '❌ NOT FOUND'

    if (!mapping.found || mapping.para < lastParaIndex) {
      hasIssues = true
      totalIssues++
    }

    console.log(
      `Q${mapping.order + 1} (${q.type.padEnd(12)}) → Para ${mapping.para.toString().padStart(2)} ${status}`
    )
    if (!mapping.found) {
      console.log(`         EvidenceQuote NOT FOUND in any paragraph`)
      console.log(`         Quote: "${mapping.quote}"`)
    } else if (mapping.para < lastParaIndex) {
      console.log(
        `         ⚠️  JUMPED BACK from paragraph ${lastParaIndex} to ${mapping.para}`
      )
    }

    if (mapping.found) {
      lastParaIndex = mapping.para
    }
  })

  // Summary for this text
  if (hasIssues) {
    console.log(`\n❌ ISSUES FOUND in this text`)
  } else {
    console.log(`\n✅ All questions follow forward-only progression`)
  }

  totalQuestions += text.questions.length
})

// Final summary
console.log(`\n\n${'='.repeat(70)}`)
console.log('FINAL SUMMARY')
console.log(`${'='.repeat(70)}`)
console.log(`Total texts checked: ${pack.texts.length}`)
console.log(`Total questions checked: ${totalQuestions}`)
console.log(`Total issues found: ${totalIssues}`)

if (totalIssues === 0) {
  console.log(`\n✅ ALL TEXTS PASS: Forward-only progression is correct!`)
} else {
  console.log(`\n❌ ISSUES DETECTED: ${totalIssues} question(s) violate forward-only progression`)
}

