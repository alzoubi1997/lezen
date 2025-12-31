// NT2 Scoring Constants
export const OFFICIAL_TOTAL = 36
export const OFFICIAL_PASS_CORRECT = 23
export const PASS_PERCENT_36 = (OFFICIAL_PASS_CORRECT / OFFICIAL_TOTAL) * 100 // 63.89%

// For 12-question attempts
export const REQUIRED_CORRECT_12 = 8 // ceil(12 * 23/36) = ceil(7.67) = 8
export const PASS_PERCENT_12 = (REQUIRED_CORRECT_12 / 12) * 100 // 66.67%

// Layer 1: Per-Attempt (12 questions)
export interface AttemptMetrics {
  id: string
  date: Date
  totalQuestions: number
  correctAnswers: number
  requiredCorrectAttempt: number
  passPercentAttempt: number
  yourPercentAttempt: number
  passFailAttempt: boolean
  missingQAttempt: number
  missingPctAttempt: number
  safetyAttempt: number
  deltaAttempt: number | null // vs previous attempt
  trendAttempt: 'Up' | 'Down' | 'Flat'
  modelKind: string // "EXAM" or "PRACTICE"
  modelNumber: number
  modelTitle: string
}

export function calculateAttemptMetrics(
  attempt: {
    id: string
    finishedAt: Date | null
    totalQuestions: number
    correctCount: number
    modelKind: string
    modelNumber: number
    modelTitle: string
  },
  prevAttempt: AttemptMetrics | null
): AttemptMetrics {
  const totalQuestions = attempt.totalQuestions
  const correctAnswers = attempt.correctCount

  // Determine pass requirements based on attempt type
  // Exams have 36 questions, practices have 12 questions
  const isExam = attempt.modelKind === 'EXAM' || totalQuestions === 36
  const requiredCorrectAttempt = isExam ? OFFICIAL_PASS_CORRECT : REQUIRED_CORRECT_12
  const passPercentAttempt = isExam ? PASS_PERCENT_36 : PASS_PERCENT_12
  const yourPercentAttempt = (correctAnswers / totalQuestions) * 100
  const passFailAttempt = yourPercentAttempt >= passPercentAttempt
  const missingQAttempt = Math.max(0, requiredCorrectAttempt - correctAnswers)
  const missingPctAttempt = Math.max(0, passPercentAttempt - yourPercentAttempt)
  const safetyAttempt = yourPercentAttempt - passPercentAttempt

  const deltaAttempt = prevAttempt
    ? yourPercentAttempt - prevAttempt.yourPercentAttempt
    : null

  let trendAttempt: 'Up' | 'Down' | 'Flat' = 'Flat'
  if (deltaAttempt !== null) {
    if (deltaAttempt > 0) trendAttempt = 'Up'
    else if (deltaAttempt < 0) trendAttempt = 'Down'
  }

  return {
    id: attempt.id,
    date: attempt.finishedAt || new Date(),
    totalQuestions,
    correctAnswers,
    requiredCorrectAttempt,
    passPercentAttempt,
    yourPercentAttempt,
    passFailAttempt,
    missingQAttempt,
    missingPctAttempt,
    safetyAttempt,
    deltaAttempt,
    trendAttempt,
    modelKind: attempt.modelKind,
    modelNumber: attempt.modelNumber,
    modelTitle: attempt.modelTitle,
  }
}

// Layer 2: Exam36 Blocks (3 attempts = 36 questions)
export interface Block36Metrics {
  blockIndex: number
  blockDate: Date
  attemptIds: string[]
  practiceNames: string[] // e.g., ["Oefening 1", "Oefening 4", "Oefening 9"]
  correct36: number
  total36: number
  yourPercent36: number
  passFail36: boolean
  missingQ36: number
  missingPct36: number
  safety36: number
  delta36: number | null // vs previous block
  trend36: 'Up' | 'Down' | 'Flat'
  attempts: AttemptMetrics[]
}

export function calculateBlock36Metrics(
  attempts: AttemptMetrics[],
  prevBlock: Block36Metrics | null
): Block36Metrics {
  // Only count complete groups of 3
  if (attempts.length !== 3) {
    throw new Error('Block must contain exactly 3 attempts')
  }

  const correct36 = attempts.reduce(
    (sum, a) => sum + a.correctAnswers,
    0
  )
  const total36 = 36
  const yourPercent36 = (correct36 / total36) * 100
  const passFail36 = yourPercent36 >= PASS_PERCENT_36
  const missingQ36 = Math.max(0, OFFICIAL_PASS_CORRECT - correct36)
  const missingPct36 = Math.max(0, PASS_PERCENT_36 - yourPercent36)
  const safety36 = yourPercent36 - PASS_PERCENT_36

  const delta36 = prevBlock
    ? yourPercent36 - prevBlock.yourPercent36
    : null

  let trend36: 'Up' | 'Down' | 'Flat' = 'Flat'
  if (delta36 !== null) {
    if (delta36 > 0) trend36 = 'Up'
    else if (delta36 < 0) trend36 = 'Down'
  }

  return {
    blockIndex: prevBlock ? prevBlock.blockIndex + 1 : 0,
    blockDate: attempts[attempts.length - 1].date,
    attemptIds: attempts.map((a) => a.id),
    practiceNames: attempts.map((a) => a.modelTitle),
    correct36,
    total36,
    yourPercent36,
    passFail36,
    missingQ36,
    missingPct36,
    safety36,
    delta36,
    trend36,
    attempts,
  }
}

// Calculate block metrics for a single exam (exams already have 36 questions)
export function calculateExamBlockMetrics(
  attempt: AttemptMetrics,
  prevBlock: Block36Metrics | null
): Block36Metrics {
  if (attempt.modelKind !== 'EXAM') {
    throw new Error('This function is only for EXAM attempts')
  }
  if (attempt.totalQuestions !== 36) {
    throw new Error('Exam must have exactly 36 questions')
  }

  const correct36 = attempt.correctAnswers
  const total36 = 36
  const yourPercent36 = (correct36 / total36) * 100
  const passFail36 = yourPercent36 >= PASS_PERCENT_36
  const missingQ36 = Math.max(0, OFFICIAL_PASS_CORRECT - correct36)
  const missingPct36 = Math.max(0, PASS_PERCENT_36 - yourPercent36)
  const safety36 = yourPercent36 - PASS_PERCENT_36

  const delta36 = prevBlock
    ? yourPercent36 - prevBlock.yourPercent36
    : null

  let trend36: 'Up' | 'Down' | 'Flat' = 'Flat'
  if (delta36 !== null) {
    if (delta36 > 0) trend36 = 'Up'
    else if (delta36 < 0) trend36 = 'Down'
  }

  return {
    blockIndex: prevBlock ? prevBlock.blockIndex + 1 : 0,
    blockDate: attempt.date,
    attemptIds: [attempt.id],
    practiceNames: [attempt.modelTitle],
    correct36,
    total36,
    yourPercent36,
    passFail36,
    missingQ36,
    missingPct36,
    safety36,
    delta36,
    trend36,
    attempts: [attempt],
  }
}

// Layer 3: Overall Stats
export interface OverallStats {
  sumCorrect: number
  sumTotal: number
  overallPercent: number
  overallMissingPct: number
  avgLast5_12: number | null
  avgLast5_36: number | null
  best12: number
  best36: number
  streakPass12: number
  streakFail12: number
  streakPass36: number
  streakFail36: number
}

export function calculateOverallStats(
  attempts: AttemptMetrics[],
  blocks: Block36Metrics[]
): OverallStats {
  const sumCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0)
  const sumTotal = attempts.reduce((sum, a) => sum + a.totalQuestions, 0)
  const overallPercent = sumTotal > 0 ? (sumCorrect / sumTotal) * 100 : 0
  const overallMissingPct = Math.max(0, PASS_PERCENT_36 - overallPercent)

  // Average of last 5 attempts (12 questions)
  const last5Attempts = attempts.slice(-5)
  const avgLast5_12 =
    last5Attempts.length > 0
      ? last5Attempts.reduce((sum, a) => sum + a.yourPercentAttempt, 0) /
        last5Attempts.length
      : null

  // Average of last 5 blocks (36 questions)
  const last5Blocks = blocks.slice(-5)
  const avgLast5_36 =
    last5Blocks.length > 0
      ? last5Blocks.reduce((sum, b) => sum + b.yourPercent36, 0) /
        last5Blocks.length
      : null

  // Best scores
  const best12 =
    attempts.length > 0
      ? Math.max(...attempts.map((a) => a.yourPercentAttempt))
      : 0
  const best36 =
    blocks.length > 0
      ? Math.max(...blocks.map((b) => b.yourPercent36))
      : 0

  // Streaks (from most recent)
  let streakPass12 = 0
  let streakFail12 = 0
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].passFailAttempt) {
      if (streakFail12 === 0) streakPass12++
      else break
    } else {
      if (streakPass12 === 0) streakFail12++
      else break
    }
  }

  let streakPass36 = 0
  let streakFail36 = 0
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].passFail36) {
      if (streakFail36 === 0) streakPass36++
      else break
    } else {
      if (streakPass36 === 0) streakFail36++
      else break
    }
  }

  return {
    sumCorrect,
    sumTotal,
    overallPercent,
    overallMissingPct,
    avgLast5_12,
    avgLast5_36,
    best12,
    best36,
    streakPass12,
    streakFail12,
    streakPass36,
    streakFail36,
  }
}

