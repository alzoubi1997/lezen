import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'content', 'practice_1.json')
const content = fs.readFileSync(filePath, 'utf-8')
const pack = JSON.parse(content)

// Get the second text (Thuiswerken)
const text = pack.texts[1]

console.log(`Text: "${text.title}"\n`)
console.log('Paragraphs:\n')
const paragraphs = text.content.split(/\n\s*\n/).map((p: string) => p.trim()).filter((p: string) => p.length > 0)
paragraphs.forEach((para: string, idx: number) => {
  console.log(`Paragraph ${idx}: ${para.substring(0, 100)}...`)
})

console.log('\n\nQuestions and their paragraph locations:\n')
text.questions.forEach((q: any, idx: number) => {
  const paraIndex = paragraphs.findIndex((p: string) => p.includes(q.evidenceQuote))
  console.log(`Question ${q.orderIndex} (displayed as ${q.orderIndex + 1}): "${q.promptNl.substring(0, 50)}..."`)
  console.log(`  EvidenceQuote: "${q.evidenceQuote.substring(0, 60)}..."`)
  console.log(`  Paragraph: ${paraIndex}`)
  console.log()
})

