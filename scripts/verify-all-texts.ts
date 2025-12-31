import * as fs from 'fs'
import * as path from 'path'

interface ContentPack {
  kind: string
  number: number
  texts: Array<{ title: string; questions: Array<{ orderIndex: number }> }>
}

function main() {
  const contentDir = path.join(process.cwd(), 'content')
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.json'))
    .sort()

  let totalTexts = 0
  let totalQuestions = 0

  console.log('Files and their texts:\n')

  for (const file of files) {
    const filePath = path.join(contentDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const pack: ContentPack = JSON.parse(content)

    const textCount = pack.texts.length
    const questionCount = pack.texts.reduce(
      (sum, text) => sum + text.questions.length,
      0
    )

    totalTexts += textCount
    totalQuestions += questionCount

    console.log(
      `${file}: ${textCount} text(s), ${questionCount} question(s) total`
    )
    pack.texts.forEach((text, idx) => {
      console.log(
        `  [${idx}] "${text.title.substring(0, 60)}..." - ${text.questions.length} questions`
      )
    })
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total files: ${files.length}`)
  console.log(`Total texts: ${totalTexts}`)
  console.log(`Total questions: ${totalQuestions}`)
}

main()

