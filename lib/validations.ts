import { z } from 'zod'

export const createProfileSchema = z.object({
  prefix: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((val) => {
      // Handle empty strings, null, or undefined
      if (!val || typeof val !== 'string') {
        return undefined
      }
      const trimmed = val.trim()
      // Return undefined if less than 2 characters, otherwise return trimmed string
      return trimmed.length >= 2 ? trimmed : undefined
    })
    .refine(
      (val) => val === undefined || (typeof val === 'string' && val.length >= 2 && val.length <= 10),
      { message: 'Prefix must be between 2 and 10 characters if provided' }
    )
    .optional(),
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

