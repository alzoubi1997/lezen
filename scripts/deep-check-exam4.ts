import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'content', 'exam_4.json')
const pack = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

function calculateWordCount(text: string): number {
  const normalized = text.trim().replace(/\s+/g, ' ')
  const words = normalized.split(' ').filter(word => word.length > 0)
  return words.length
}

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

console.log('='.repeat(80))
console.log('DEEP CHECK: EXAM 4')
console.log('='.repeat(80))
console.log(`Total texts: ${pack.texts.length}\n`)

let totalIssues = 0
let totalQuestions = 0

pack.texts.forEach((text: any, textIndex: number) => {
  console.log('\n' + '='.repeat(80))
  console.log(`Text ${textIndex + 1}: "${text.title}"`)
  console.log('='.repeat(80))
  
  // Check word count
  const wordCount = calculateWordCount(text.content)
  const minWords = text.minWordCount || 0
  const maxWords = text.maxWordCount || Infinity
  const wordCountOK = wordCount >= minWords && wordCount <= maxWords
  
  console.log(`\n📊 Word Count Check:`)
  console.log(`   Word count: ${wordCount}`)
  console.log(`   Required range: ${minWords}-${maxWords}`)
  console.log(`   Status: ${wordCountOK ? '✅ PASS' : '❌ FAIL'}`)
  
  if (!wordCountOK) {
    totalIssues++
    console.log(`   ⚠️  Word count ${wordCount} is outside required range ${minWords}-${maxWords}`)
  }
  
  // Check forward-only progression
  const paragraphs = getParagraphs(text.content)
  console.log(`\n📝 Paragraph Analysis:`)
  console.log(`   Total paragraphs: ${paragraphs.length}`)
  console.log(`   Total questions: ${text.questions.length}`)
  
  let lastParaIndex = -1
  let hasBackwardJumps = false
  let hasNotFoundQuotes = false
  
  console.log(`\n🔍 Question → Paragraph Mapping:`)
  console.log('-'.repeat(80))
  
  text.questions.forEach((q: any, qIndex: number) => {
    const paraIndex = findParagraphIndex(paragraphs, q.evidenceQuote)
    const found = paraIndex !== -1
    const isBackward = found && paraIndex < lastParaIndex
    
    let status = ''
    if (!found) {
      status = '❌ NOT FOUND'
      hasNotFoundQuotes = true
      totalIssues++
    } else if (isBackward) {
      status = '❌ BACKWARD JUMP'
      hasBackwardJumps = true
      totalIssues++
    } else {
      status = '✅'
    }
    
    console.log(
      `Q${q.orderIndex + 1} (${q.type.padEnd(12)}) → Para ${paraIndex.toString().padStart(2)} ${status}`
    )
    
    if (!found) {
      console.log(`         ⚠️  EvidenceQuote NOT FOUND: "${q.evidenceQuote.substring(0, 60)}..."`)
    } else if (isBackward) {
      console.log(
        `         ⚠️  JUMPED BACK from paragraph ${lastParaIndex} to ${paraIndex}`
      )
    }
    
    if (found) {
      lastParaIndex = paraIndex
    }
    
    totalQuestions++
  })
  
  // Summary for this text
  console.log('\n' + '-'.repeat(80))
  if (wordCountOK && !hasBackwardJumps && !hasNotFoundQuotes) {
    console.log('✅ Text validation: PASSED')
  } else {
    console.log('❌ Text validation: FAILED')
    if (!wordCountOK) {
      console.log('   - Word count issue')
    }
    if (hasBackwardJumps) {
      console.log('   - Backward jumps detected')
    }
    if (hasNotFoundQuotes) {
      console.log('   - EvidenceQuotes not found')
    }
  }
})

// Final summary
console.log('\n' + '='.repeat(80))
console.log('FINAL SUMMARY')
console.log('='.repeat(80))
console.log(`Total texts checked: ${pack.texts.length}`)
console.log(`Total questions checked: ${totalQuestions}`)
console.log(`Total issues found: ${totalIssues}`)

if (totalIssues === 0) {
  console.log('\n✅ EXAM 4 VALIDATION: ALL CHECKS PASSED!')
  console.log('   - All word counts within required range (550-700)')
  console.log('   - All questions follow forward-only paragraph progression')
  console.log('   - All evidenceQuotes found in text content')
} else {
  console.log('\n❌ EXAM 4 VALIDATION: ISSUES FOUND!')
  console.log(`   Please fix ${totalIssues} issue(s) before proceeding.`)
  process.exit(1)
}

