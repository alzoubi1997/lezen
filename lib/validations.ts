import { z } from 'zod'

export const createProfileSchema = z.object({
  prefix: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        return trimmed.length >= 2 ? trimmed : undefined
      }
      return val
    },
    z.string().min(2).max(10).optional()
  ),
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const loginSchema = z.object({
  handle: z.string().min(1, 'Handle is required'),
  pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const startAttemptSchema = z.object({
  modelId: z.string().min(1),
  mode: z.enum(['EXAM', 'PRACTICE']),
})

export const saveAnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionId: z.string().min(1),
  chosenIndex: z.number().int().min(0).max(2).nullable(),
  flagged: z.boolean().optional(),
  confidence: z.number().int().min(0).max(100).nullable().optional(),
  timeSpentSec: z.number().int().min(0).optional(),
})

export const finishAttemptSchema = z.object({
  attemptId: z.string().min(1),
  totalTimeSec: z.number().int().min(0),
})

export const toggleDoneSchema = z.object({
  modelId: z.string().min(1),
  done: z.boolean(),
})

export const tagWrongReasonSchema = z.object({
  questionAttemptId: z.string().min(1),
  wrongReasonTag: z.enum([
    'SYNONYM_MISS',
    'NEGATION_MISS',
    'MAIN_IDEA',
    'INFERENCE_JUMP',
    'TIME_PRESSURE',
    'CARELESS',
  ]),
})

export const pdfFullSchema = z.object({
  attemptId: z.string().min(1),
  includeText: z.boolean().default(true),
})

export const pdfWrongSchema = z.object({
  attemptId: z.string().min(1),
})

