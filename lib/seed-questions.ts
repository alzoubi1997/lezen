import { QuestionWithAttempt } from './types'

/**
 * Question creation data structure
 */
export interface QuestionData {
  orderIndex: number
  type: 'INFO' | 'MAIN_IDEA' | 'INFERENCE' | 'TONE' | 'INTENT' | 'PARAPHRASE' | 'NEGATION'
  difficulty: number
  promptNl: string
  promptAr: string
  optionsJson: string // JSON array of exactly 3 options
  correctIndex: number // 0, 1, or 2
  explanationNl: string
  explanationAr: string
  trapNoteNl: string | null
  trapNoteAr: string | null
  evidenceStart: number | null
  evidenceEnd: number | null
}

/**
 * Type distribution tracker
 */
export interface TypeDistribution {
  INFO: number
  MAIN_IDEA: number
  INFERENCE: number
  TONE: number
  INTENT: number
  PARAPHRASE: number
  NEGATION: number
}

/**
 * Initialize type distribution tracker
 */
export function initTypeDistribution(): TypeDistribution {
  return {
    INFO: 0,
    MAIN_IDEA: 0,
    INFERENCE: 0,
    TONE: 0,
    INTENT: 0,
    PARAPHRASE: 0,
    NEGATION: 0,
  }
}

/**
 * Validate that options array has exactly 3 elements
 */
export function validateOptions(options: string[]): boolean {
  return Array.isArray(options) && options.length === 3
}

/**
 * Calculate evidence span for a question based on text content
 * This is a helper - actual evidence spans should be set based on where
 * the answer is found in the text
 */
export function calculateEvidenceSpan(
  textContent: string,
  searchTerm: string,
  contextChars: number = 100
): { start: number; end: number } | null {
  const index = textContent.toLowerCase().indexOf(searchTerm.toLowerCase())
  if (index === -1) {
    return null
  }
  return {
    start: Math.max(0, index - contextChars),
    end: Math.min(textContent.length, index + searchTerm.length + contextChars),
  }
}

/**
 * Create a question data object with validation
 */
export function createQuestionData(
  orderIndex: number,
  type: QuestionData['type'],
  difficulty: number,
  promptNl: string,
  promptAr: string,
  options: string[],
  correctIndex: number,
  explanationNl: string,
  explanationAr: string,
  trapNoteNl: string | null = null,
  trapNoteAr: string | null = null,
  evidenceStart: number | null = null,
  evidenceEnd: number | null = null
): QuestionData {
  // Validate options
  if (!validateOptions(options)) {
    throw new Error(`Question ${orderIndex}: Must have exactly 3 options, got ${options.length}`)
  }

  // Validate correctIndex
  if (correctIndex < 0 || correctIndex > 2) {
    throw new Error(`Question ${orderIndex}: correctIndex must be 0, 1, or 2, got ${correctIndex}`)
  }

  return {
    orderIndex,
    type,
    difficulty,
    promptNl,
    promptAr,
    optionsJson: JSON.stringify(options),
    correctIndex,
    explanationNl,
    explanationAr,
    trapNoteNl,
    trapNoteAr,
    evidenceStart,
    evidenceEnd,
  }
}

/**
 * Helper to get question type distribution summary
 */
export function getTypeDistributionSummary(dist: TypeDistribution): string {
  return `INFO=${dist.INFO}, MAIN_IDEA=${dist.MAIN_IDEA}, INFERENCE=${dist.INFERENCE}, TONE=${dist.TONE}, INTENT=${dist.INTENT}, PARAPHRASE=${dist.PARAPHRASE}, NEGATION=${dist.NEGATION}`
}

/**
 * Validate type distribution meets targets
 */
export function validateTypeDistribution(dist: TypeDistribution): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Target ranges
  if (dist.INFO < 14 || dist.INFO > 16) {
    issues.push(`INFO count (${dist.INFO}) should be 14-16`)
  }
  if (dist.MAIN_IDEA < 6 || dist.MAIN_IDEA > 7) {
    issues.push(`MAIN_IDEA count (${dist.MAIN_IDEA}) should be 6-7`)
  }
  if (dist.INFERENCE < 10 || dist.INFERENCE > 12) {
    issues.push(`INFERENCE count (${dist.INFERENCE}) should be 10-12`)
  }
  const toneIntentTotal = dist.TONE + dist.INTENT
  if (toneIntentTotal < 2 || toneIntentTotal > 3) {
    issues.push(`TONE+INTENT total (${toneIntentTotal}) should be 2-3`)
  }
  if (dist.NEGATION < 4 || dist.NEGATION > 6) {
    issues.push(`NEGATION count (${dist.NEGATION}) should be 4-6 (10-15% of 36)`)
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

