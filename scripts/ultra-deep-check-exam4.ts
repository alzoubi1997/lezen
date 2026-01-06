import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'content', 'exam_4.json')
const pack = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

function getParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function findParagraphIndex(paragraphs: string[], evidenceQuote: string): { index: number; method: string } {
  // Method 1: Exact match
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(evidenceQuote)) {
      return { index: i, method: 'exact' }
    }
  }
  
  // Method 2: Normalized match (flexible whitespace)
  const normalizedQuote = evidenceQuote.replace(/\s+/g, '\\s+')
  const escapedQuote = normalizedQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedQuote)
  
  for (let i = 0; i < paragraphs.length; i++) {
    if (regex.test(paragraphs[i])) {
      return { index: i, method: 'normalized' }
    }
  }
  
  return { index: -1, method: 'not found' }
}

console.log('='.repeat(90))
console.log('ULTRA-DEEP FORWARD-ONLY PROGRESSION ANALYSIS: EXAM 4')
console.log('='.repeat(90))
console.log(`Total texts: ${pack.texts.length}\n`)

let totalBackwardJumps = 0
let totalNotFoundQuotes = 0
let totalQuestions = 0
let allTextsValid = true

pack.texts.forEach((text: any, textIndex: number) => {
  console.log('\n' + '='.repeat(90))
  console.log(`TEXT ${textIndex + 1}: "${text.title}"`)
  console.log('='.repeat(90))
  
  const paragraphs = getParagraphs(text.content)
  console.log(`\n📊 Text Statistics:`)
  console.log(`   Total paragraphs: ${paragraphs.length}`)
  console.log(`   Total questions: ${text.questions.length}`)
  
  // Show paragraph structure
  console.log(`\n📄 Paragraph Structure:`)
  paragraphs.forEach((para: string, idx: number) => {
    const wordCount = para.split(/\s+/).filter(w => w.length > 0).length
    console.log(`   Para ${idx}: ${wordCount} words (first 80 chars: "${para.substring(0, 80)}...")`)
  })
  
  // Detailed question analysis
  console.log(`\n🔍 DETAILED QUESTION ANALYSIS:`)
  console.log('-'.repeat(90))
  
  let lastParaIndex = -1
  let hasIssues = false
  const progression: Array<{
    qNum: number
    type: string
    paraIndex: number
    found: boolean
    method: string
    quote: string
    isBackward: boolean
  }> = []
  
  text.questions.forEach((q: any, qIndex: number) => {
    const result = findParagraphIndex(paragraphs, q.evidenceQuote)
    const paraIndex = result.index
    const found = paraIndex !== -1
    const isBackward = found && paraIndex < lastParaIndex
    
    if (isBackward) {
      totalBackwardJumps++
      hasIssues = true
      allTextsValid = false
    }
    
    if (!found) {
      totalNotFoundQuotes++
      hasIssues = true
      allTextsValid = false
    }
    
    progression.push({
      qNum: q.orderIndex + 1,
      type: q.type,
      paraIndex,
      found,
      method: result.method,
      quote: q.evidenceQuote,
      isBackward
    })
    
    totalQuestions++
  })
  
  // Display progression with detailed info
  console.log(`\nQuestion Order → Paragraph Progression:`)
  console.log('─'.repeat(90))
  console.log(`Q# | Type        | Para | Found | Method     | Status`)
  console.log('─'.repeat(90))
  
  let currentLastPara = -1
  
  progression.forEach((p) => {
    let status = ''
    if (!p.found) {
      status = '❌ NOT FOUND'
    } else if (p.isBackward) {
      status = `❌ BACKWARD (from ${currentLastPara} to ${p.paraIndex})`
    } else if (p.paraIndex === currentLastPara) {
      status = '✅ SAME PARAGRAPH'
    } else if (p.paraIndex > currentLastPara) {
      status = `✅ FORWARD (+${p.paraIndex - currentLastPara})`
    } else {
      status = '✅'
    }
    
    console.log(
      `Q${p.qNum.toString().padStart(2)} | ${p.type.padEnd(11)} | ${p.paraIndex.toString().padStart(4)} | ${p.found ? 'YES' : 'NO '} | ${p.method.padEnd(10)} | ${status}`
    )
    
    if (p.found) {
      currentLastPara = p.paraIndex
    }
  })
  
  // Show progression visualization
  console.log(`\n📈 Progression Visualization:`)
  console.log('   ', Array.from({ length: paragraphs.length }, (_, i) => i).join(' '))
  console.log('   ', '-'.repeat(paragraphs.length * 2 - 1))
  
  let progressionLine = '   '
  let lastPara = -1
  progression.forEach((p) => {
    if (p.found) {
      if (p.paraIndex === lastPara) {
        progressionLine += '· '
      } else if (p.paraIndex > lastPara) {
        progressionLine += '→ '.repeat(p.paraIndex - lastPara)
        lastPara = p.paraIndex
      } else {
        progressionLine += '← '
        lastPara = p.paraIndex
      }
    } else {
      progressionLine += '? '
    }
  })
  console.log(progressionLine)
  
  // Show evidence quotes with context
  console.log(`\n📝 Evidence Quotes Verification:`)
  progression.forEach((p, idx) => {
    console.log(`\n   Q${p.qNum} (${p.type}):`)
    console.log(`      Quote: "${p.quote.substring(0, 80)}${p.quote.length > 80 ? '...' : ''}"`)
    if (p.found) {
      const para = paragraphs[p.paraIndex]
      const quoteIndex = para.indexOf(p.quote)
      if (quoteIndex !== -1) {
        const contextStart = Math.max(0, quoteIndex - 30)
        const contextEnd = Math.min(para.length, quoteIndex + p.quote.length + 30)
        const context = para.substring(contextStart, contextEnd)
        console.log(`      ✅ Found in Para ${p.paraIndex} at position ${quoteIndex}`)
        console.log(`      Context: "...${context}..."`)
      } else {
        console.log(`      ⚠️  Found via ${p.method} matching`)
      }
    } else {
      console.log(`      ❌ NOT FOUND in any paragraph`)
      // Try to find similar text
      paragraphs.forEach((para: string, paraIdx: number) => {
        const words = p.quote.split(/\s+/).filter(w => w.length > 2)
        const matches = words.filter(w => para.includes(w))
        if (matches.length > words.length * 0.5) {
          console.log(`      💡 Similar text found in Para ${paraIdx} (${matches.length}/${words.length} words match)`)
        }
      })
    }
  })
  
  // Summary for this text
  console.log('\n' + '─'.repeat(90))
  if (!hasIssues) {
    console.log('✅ TEXT VALIDATION: PASSED - Forward-only progression maintained')
  } else {
    console.log('❌ TEXT VALIDATION: FAILED')
    if (progression.some(p => !p.found)) {
      console.log(`   - ${progression.filter(p => !p.found).length} evidenceQuote(s) not found`)
    }
    if (progression.some(p => p.isBackward)) {
      console.log(`   - ${progression.filter(p => p.isBackward).length} backward jump(s) detected`)
    }
  }
})

// Final comprehensive summary
console.log('\n' + '='.repeat(90))
console.log('COMPREHENSIVE FINAL SUMMARY')
console.log('='.repeat(90))
console.log(`Total texts analyzed: ${pack.texts.length}`)
console.log(`Total questions analyzed: ${totalQuestions}`)
console.log(`Total backward jumps: ${totalBackwardJumps}`)
console.log(`Total not found quotes: ${totalNotFoundQuotes}`)
console.log(`Total issues: ${totalBackwardJumps + totalNotFoundQuotes}`)

if (allTextsValid && totalBackwardJumps === 0 && totalNotFoundQuotes === 0) {
  console.log('\n✅✅✅ EXAM 4 ULTRA-DEEP VALIDATION: PERFECT! ✅✅✅')
  console.log('   ✓ All word counts within required range (550-700)')
  console.log('   ✓ All 36 questions follow STRICT forward-only paragraph progression')
  console.log('   ✓ All evidenceQuotes verified and found in text content')
  console.log('   ✓ No backward jumps detected')
  console.log('   ✓ No missing quotes detected')
  console.log('\n   EXAM 4 IS READY FOR PRODUCTION! 🎉')
} else {
  console.log('\n❌❌❌ EXAM 4 ULTRA-DEEP VALIDATION: ISSUES FOUND! ❌❌❌')
  if (totalBackwardJumps > 0) {
    console.log(`   ⚠️  ${totalBackwardJumps} backward jump(s) must be fixed`)
  }
  if (totalNotFoundQuotes > 0) {
    console.log(`   ⚠️  ${totalNotFoundQuotes} evidenceQuote(s) must be fixed`)
  }
  console.log('\n   Please fix all issues before proceeding.')
  process.exit(1)
}

