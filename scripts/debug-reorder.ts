import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'content', 'practice_1.json')
const content = fs.readFileSync(filePath, 'utf-8')
const pack = JSON.parse(content)

// Get the second text (Thuiswerken)
const text = pack.texts[1]

console.log(`Text: "${text.title}"\n`)

// Split paragraphs
const paragraphs = text.content
  .split(/\n\s*\n/)
  .map((p) => p.trim())
  .filter((p) => p.length > 0)

console.log(`Total paragraphs: ${paragraphs.length}\n`)

// Map questions to paragraphs
const questionParaMap = text.questions.map((q) => {
  const paraIndex = paragraphs.findIndex((p) => p.includes(q.evidenceQuote))
  return {
    orderIndex: q.orderIndex,
    prompt: q.promptNl.substring(0, 50),
    evidenceQuote: q.evidenceQuote.substring(0, 60),
    paraIndex,
  }
})

console.log('Current question order and paragraph locations:')
questionParaMap.forEach((q) => {
  console.log(
    `  Question ${q.orderIndex + 1} (orderIndex ${q.orderIndex}): Paragraph ${q.paraIndex}`
  )
  console.log(`    "${q.prompt}..."`)
  console.log(`    Evidence: "${q.evidenceQuote}..."`)
  console.log()
})

// Check for backward jumps
console.log('\nChecking for backward jumps:')
let lastPara = -1
let hasBackwardJump = false
for (const q of questionParaMap) {
  if (q.paraIndex < lastPara) {
    console.log(
      `  ❌ BACKWARD JUMP: Question ${q.orderIndex + 1} is in paragraph ${q.paraIndex}, but previous was paragraph ${lastPara}`
    )
    hasBackwardJump = true
  }
  lastPara = q.paraIndex
}

if (!hasBackwardJump) {
  console.log('  ✅ No backward jumps found - forward-only progression is correct!')
}

