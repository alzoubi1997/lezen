import { calculateWordCount } from './utils'

/**
 * Validates that a text's word count is within the specified range
 */
export function validateWordCount(
  text: string,
  minWords: number,
  maxWords: number
): boolean {
  const wordCount = calculateWordCount(text)
  return wordCount >= minWords && wordCount <= maxWords
}

/**
 * Counts the number of paragraphs in a text (split on double newlines)
 */
export function countParagraphs(text: string): number {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  return paragraphs.length
}

/**
 * Counts the number of sections in a reglement text (based on headings)
 * Headings are identified by lines that:
 * - Start with a number or letter followed by a period/dash
 * - Are in ALL CAPS
 * - Are followed by a newline
 */
export function countSections(text: string): number {
  // Match headings like "1. TITLE", "A. TITLE", "HOOFDSTUK 1", etc.
  const headingPattern = /^(?:\d+\.|[A-Z]\.|[A-Z][A-Z\s]+|\d+\s+[A-Z])/gm
  const matches = text.match(headingPattern)
  return matches ? matches.length : 0
}

/**
 * Ensures a text meets all requirements by regenerating until valid
 * @param generator Function that generates text content
 * @param requirements Object with minWords, maxWords, minParagraphs, minSections
 * @param maxAttempts Maximum number of regeneration attempts (default: 10)
 * @returns Valid text content
 */
export function ensureTextMeetsRequirements(
  generator: () => string,
  requirements: {
    minWords: number
    maxWords: number
    minParagraphs?: number
    minSections?: number
  },
  maxAttempts: number = 10
): string {
  let attempts = 0
  let text = generator()
  let wordCount = calculateWordCount(text)
  let paragraphCount = countParagraphs(text)
  let sectionCount = requirements.minSections
    ? countSections(text)
    : undefined

  while (attempts < maxAttempts) {
    const wordCountValid = validateWordCount(
      text,
      requirements.minWords,
      requirements.maxWords
    )
    const paragraphValid = requirements.minParagraphs
      ? paragraphCount >= requirements.minParagraphs
      : true
    const sectionValid = requirements.minSections
      ? sectionCount !== undefined && sectionCount >= requirements.minSections
      : true

    if (wordCountValid && paragraphValid && sectionValid) {
      return text
    }

    // Regenerate
    attempts++
    text = generator()
    wordCount = calculateWordCount(text)
    paragraphCount = countParagraphs(text)
    if (requirements.minSections) {
      sectionCount = countSections(text)
    }
  }

  // If we couldn't generate a valid text, log warning and return the last attempt
  console.warn(
    `Warning: Could not generate text meeting requirements after ${maxAttempts} attempts.`
  )
  console.warn(
    `  Word count: ${wordCount} (required: ${requirements.minWords}-${requirements.maxWords})`
  )
  if (requirements.minParagraphs) {
    console.warn(
      `  Paragraphs: ${paragraphCount} (required: >= ${requirements.minParagraphs})`
    )
  }
  if (requirements.minSections) {
    console.warn(
      `  Sections: ${sectionCount} (required: >= ${requirements.minSections})`
    )
  }

  return text
}

