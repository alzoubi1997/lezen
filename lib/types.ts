// Note: Using string types instead of enums for SQLite compatibility
type QuestionType = 'INFO' | 'MAIN_IDEA' | 'INFERENCE' | 'TONE' | 'INTENT' | 'PARAPHRASE' | 'NEGATION'
type WrongReasonTag = 'SYNONYM_MISS' | 'NEGATION_MISS' | 'MAIN_IDEA' | 'INFERENCE_JUMP' | 'TIME_PRESSURE' | 'CARELESS'

export type Locale = 'nl' | 'ar'

export interface QuestionOption {
  label: string
  value: string
}

export interface QuestionWithAttempt {
  id: string
  textId: string
  orderIndex: number
  type: QuestionType
  difficulty: number
  promptNl: string
  promptAr: string
  optionsJson: string
  correctIndex: number
  explanationNl: string
  explanationAr: string
  trapNoteNl: string | null
  trapNoteAr: string | null
  evidenceQuote: string | null
  evidenceStart: number | null
  evidenceEnd: number | null
  questionAttempt?: {
    id?: string
    chosenIndex: number | null
    isCorrect: boolean
    timeSpentSec: number
    flagged: boolean
    confidence: number | null
    wrongReasonTag: WrongReasonTag | null
  }
}

export interface TextWithQuestions {
  id: string
  title: string
  topic: string
  level: string
  wordCount: number
  content: string
  orderIndex: number
  questions: QuestionWithAttempt[]
}

export interface AttemptReview {
  id: string
  mode: string
  startedAt: Date
  finishedAt: Date | null
  totalQuestions: number
  correctCount: number
  scorePercent: number
  totalTimeSec: number
  model: {
    id: string
    kind: string
    number: number
    titleNl: string
    titleAr: string
  }
  texts: TextWithQuestions[]
}

export interface DashboardSummary {
  totalAttempts: number
  averageScore: number
  totalTimeSpent: number
  completedModels: number
  totalModels: number
  recentAttempts: Array<{
    id: string
    modelTitle: string
    score: number
    finishedAt: Date
  }>
}

