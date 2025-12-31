import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const contentDir = path.join(process.cwd(), 'content')
const files = fs
  .readdirSync(contentDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

console.log(`Re-importing ${files.length} files into database...\n`)

for (const file of files) {
  console.log(`Importing ${file}...`)
  try {
    execSync(`npx tsx scripts/import-content.ts ${file}`, {
      cwd: process.cwd(),
      stdio: 'inherit',
    })
    console.log(`✓ ${file} imported\n`)
  } catch (error) {
    console.error(`✗ Failed to import ${file}`)
    process.exit(1)
  }
}

console.log('✓ All files re-imported successfully!')

