'use client'

import { useRef, useEffect } from 'react'
import { QuestionWithAttempt } from '@/lib/types'

interface TextDisplayProps {
  content: string
  questions: QuestionWithAttempt[]
  highlightEvidence?: boolean
  highlightedQuestionId?: string | null
}

export default function TextDisplay({
  content,
  questions,
  highlightEvidence = false,
  highlightedQuestionId = null,
}: TextDisplayProps) {
  const evidenceRefs = useRef<Map<string, HTMLMarkElement>>(new Map())

  // Scroll to highlighted evidence when it changes
  useEffect(() => {
    if (highlightedQuestionId) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Try multiple methods to find the element
        const scrollToEvidence = () => {
          // Method 1: Try ref map
          let evidenceElement = evidenceRefs.current.get(highlightedQuestionId)
          
          // Method 2: Try querySelector by ID
          if (!evidenceElement) {
            evidenceElement = document.querySelector(`#evidence-${highlightedQuestionId}`) as HTMLMarkElement
          }
          
          // Method 3: Try querySelector by data attribute
          if (!evidenceElement) {
            evidenceElement = document.querySelector(`[data-question-id="${highlightedQuestionId}"]`) as HTMLMarkElement
          }
          
          if (evidenceElement) {
            // Center the evidence on screen
            evidenceElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
            return true
          }
          return false
        }

        // Try immediately
        if (!scrollToEvidence()) {
          // If not found, try after a short delay
          setTimeout(() => {
            if (!scrollToEvidence()) {
              // Last attempt after a longer delay
              setTimeout(scrollToEvidence, 150)
            }
          }, 100)
        }
      })
    }
  }, [highlightedQuestionId])

  if (!highlightEvidence) {
    return (
      <div className="prose max-w-none rounded-lg border bg-white p-6">
        <div className="whitespace-pre-wrap text-base font-bold leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Helper function to find evidence span in text
  const findEvidenceSpan = (text: string, quote: string | null | undefined): { start: number; end: number } | null => {
    if (!quote) return null
    
    // Try exact match first
    let start = text.indexOf(quote)
    if (start !== -1) {
      return { start, end: start + quote.length }
    }
    
    // Try with normalized whitespace (escape regex special chars first)
    const escapedQuote = quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flexiblePattern = escapedQuote.replace(/\s+/g, '\\s+')
    const regex = new RegExp(flexiblePattern)
    const match = text.match(regex)
    
    if (match && match.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length }
    }
    
    return null
  }

  // Create highlighted content with evidence spans
  const parts: Array<{ text: string; highlight: boolean; questionId: string | null }> = []
  let lastIndex = 0

  // Build evidence ranges from questions
  const evidenceRanges = questions
    .map((q) => {
      // Use evidenceStart/evidenceEnd if available
      if (q.evidenceStart !== null && q.evidenceEnd !== null) {
        return {
          start: q.evidenceStart,
          end: q.evidenceEnd,
          questionId: q.id,
          evidenceQuote: q.evidenceQuote,
        }
      }
      // Otherwise, try to find it from evidenceQuote
      if (q.evidenceQuote) {
        const span = findEvidenceSpan(content, q.evidenceQuote)
        if (span) {
          return {
            start: span.start,
            end: span.end,
            questionId: q.id,
            evidenceQuote: q.evidenceQuote,
          }
        }
      }
      return null
    })
    .filter((range): range is NonNullable<typeof range> => range !== null)
    .sort((a, b) => a.start - b.start)

  evidenceRanges.forEach((range) => {
    if (range.start > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, range.start),
        highlight: false,
        questionId: null,
      })
    }
    parts.push({
      text: content.slice(range.start, range.end),
      highlight: true,
      questionId: range.questionId,
    })
    lastIndex = range.end
  })

  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      highlight: false,
      questionId: null,
    })
  }

  // If no evidence ranges found but we have evidence quotes, show them as fallback
  const questionsWithoutEvidence = questions.filter(
    (q) => (q.evidenceStart === null || q.evidenceEnd === null) && q.evidenceQuote
  )

  return (
    <div className="prose max-w-none rounded-lg border bg-white p-6">
      <div className="whitespace-pre-wrap text-base font-bold leading-relaxed">
        {parts.map((part, index) =>
          part.highlight && part.questionId ? (
            <mark
              key={`${part.questionId}-${index}`}
              ref={(el) => {
                if (el && part.questionId) {
                  evidenceRefs.current.set(part.questionId, el)
                } else if (part.questionId) {
                  evidenceRefs.current.delete(part.questionId)
                }
              }}
              id={`evidence-${part.questionId}`}
              data-question-id={part.questionId}
              className={`text-inherit font-bold not-italic transition-all duration-300 cursor-pointer ${
                highlightedQuestionId === part.questionId
                  ? 'bg-orange-400 animate-pulse shadow-lg'
                  : 'bg-yellow-200 hover:bg-yellow-300'
              }`}
              style={{ 
                color: 'inherit',
                padding: '2px 0',
                borderRadius: '2px',
                scrollMargin: '100px' // Add spacing when scrolling to center
              }}
            >
              {part.text}
            </mark>
          ) : (
            <span key={index} className="font-bold">{part.text}</span>
          )
        )}
      </div>
      {questionsWithoutEvidence.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-sm font-semibold text-gray-700">Evidence (not highlighted):</p>
          {questionsWithoutEvidence.map((q) => (
            <p key={q.id} className="text-sm text-gray-600 italic">
              {q.evidenceQuote}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

