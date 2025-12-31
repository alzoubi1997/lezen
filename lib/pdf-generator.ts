import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { AttemptReview, QuestionWithAttempt } from './types'

// Helper to check if text contains Arabic characters
function containsArabic(text: string): boolean {
  if (!text) return false
  // Arabic Unicode range: U+0600 to U+06FF
  return /[\u0600-\u06FF]/.test(text)
}

// Helper to normalize text and remove problematic invisible characters
// For WinAnsi encoding, we need to handle Arabic text specially
function normalizeTextForPDF(text: string, allowArabic: boolean = false): string {
  if (!text) return ''
  
  // If text contains Arabic and we're using WinAnsi (StandardFonts), we can't encode it
  // Return empty string or a placeholder if Arabic is not allowed
  if (!allowArabic && containsArabic(text)) {
    return '' // Return empty to skip, or could return a placeholder
  }
  
  // Clean up invisible/problematic characters while preserving accents and special characters
  return text
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
    .replace(/\u200B/g, '') // Remove zero-width spaces
    .replace(/\uFEFF/g, '') // Remove BOM
    .replace(/\u200C/g, '') // Remove zero-width non-joiner
    .replace(/\u200D/g, '') // Remove zero-width joiner
    .replace(/[\u2028-\u2029]/g, ' ') // Replace line/paragraph separators with spaces
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
}

// Helper to draw wrapped text with proper spacing and page break handling
function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any,
  lineHeightMultiplier: number = 1.4,
  paragraphSpacingMultiplier: number = 0.8,
  pageHeight: number = 842,
  getNewPage?: () => any
): { finalY: number; currentPage: any } {
  const lines = wrapText(text, maxWidth, font, fontSize)
  const lineHeight = fontSize * lineHeightMultiplier
  const paragraphSpacing = fontSize * paragraphSpacingMultiplier
  let currentY = y
  let currentPage = page

  lines.forEach((line) => {
    // Check for page break
    if (currentY < 50 && getNewPage) {
      currentPage = getNewPage()
      currentY = pageHeight - 50
    }

    if (line === '') {
      // Empty line = paragraph break
      currentY -= paragraphSpacing
    } else {
      currentPage.drawText(line, {
        x: x,
        y: currentY,
        size: fontSize,
        font: font,
      })
      currentY -= lineHeight
    }
  })

  return { finalY: currentY, currentPage }
}

// Helper to draw wrapped text with highlights for evidence sections
function drawWrappedTextWithHighlights(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any,
  highlightRanges: Array<{ start: number; end: number }>,
  lineHeightMultiplier: number = 1.4,
  paragraphSpacingMultiplier: number = 0.8,
  pageHeight: number = 842,
  getNewPage?: () => any
): { finalY: number; currentPage: any } {
  const lineHeight = fontSize * lineHeightMultiplier
  const paragraphSpacing = fontSize * paragraphSpacingMultiplier
  let currentY = y
  let currentPage = page
  
  // Split text into segments (highlighted and non-highlighted)
  const segments: Array<{ text: string; highlight: boolean }> = []
  let lastIndex = 0
  
  // Sort and merge overlapping ranges
  const sortedRanges = [...highlightRanges].sort((a, b) => a.start - b.start)
  const mergedRanges: Array<{ start: number; end: number }> = []
  
  sortedRanges.forEach((range) => {
    if (mergedRanges.length === 0) {
      mergedRanges.push({ ...range })
    } else {
      const last = mergedRanges[mergedRanges.length - 1]
      if (range.start <= last.end) {
        // Overlapping or adjacent, merge
        last.end = Math.max(last.end, range.end)
      } else {
        mergedRanges.push({ ...range })
      }
    }
  })
  
  // Build segments from merged ranges
  mergedRanges.forEach((range) => {
    if (range.start > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, range.start),
        highlight: false,
      })
    }
    segments.push({
      text: text.slice(range.start, range.end),
      highlight: true,
    })
    lastIndex = range.end
  })
  
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      highlight: false,
    })
  }
  
  // Draw each segment with wrapping
  segments.forEach((segment) => {
    const lines = wrapText(segment.text, maxWidth, font, fontSize)
    
    lines.forEach((line) => {
      // Check for page break
      if (currentY < 50 && getNewPage) {
        currentPage = getNewPage()
        currentY = pageHeight - 50
      }
      
      if (line === '') {
        // Empty line = paragraph break
        currentY -= paragraphSpacing
      } else {
        if (segment.highlight) {
          // Calculate width for highlight background
          let lineWidth: number
          try {
            lineWidth = font.widthOfTextAtSize(line, fontSize)
          } catch (e) {
            lineWidth = line.length * fontSize * 0.6
          }
          
          // Draw yellow highlight background
          currentPage.drawRectangle({
            x: x,
            y: currentY - fontSize * 0.2,
            width: lineWidth,
            height: fontSize * 1.2,
            color: rgb(1, 1, 0.8), // Light yellow background
            borderColor: rgb(1, 1, 0.6), // Slightly darker yellow border
            borderWidth: 0.5,
          })
        }
        
        // Draw text on top
        currentPage.drawText(line, {
          x: x,
          y: currentY,
          size: fontSize,
          font: font,
        })
        
        currentY -= lineHeight
      }
    })
  })

  return { finalY: currentY, currentPage }
}

export async function generateFullPDF(
  review: AttemptReview,
  includeText: boolean,
  locale: 'nl' | 'ar',
  showAnswers: boolean = false // If true, show user answers, highlights, and explanations
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // Use Helvetica for better clarity and readability
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const modelTitle = locale === 'ar' ? review.model.titleAr : review.model.titleNl
  const isRTL = locale === 'ar'

  // Cover page
  const coverPage = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = coverPage.getSize()

  // Draw wrapped, centered model title on cover page
  const coverTitleMaxWidth = width - 100
  const coverTitleX = isRTL ? width - 50 : 50
  let coverTitleY = height - 150
  coverTitleY = drawCenteredWrappedTitle(
    coverPage,
    normalizeTextForPDF(modelTitle),
    coverTitleX,
    coverTitleY,
    coverTitleMaxWidth,
    24,
    boldFont,
    isRTL,
    1.5
  )

  coverPage.drawText(`Score: ${review.scorePercent.toFixed(1)}%`, {
    x: isRTL ? width - 200 : 50,
    y: height - 200,
    size: 18,
    font: font,
  })

  coverPage.drawText(
    `Datum: ${new Date(review.finishedAt || review.startedAt).toLocaleDateString()}`,
    {
      x: isRTL ? width - 200 : 50,
      y: height - 250,
      size: 12,
      font: font,
    }
  )

  coverPage.drawText(
    `Tijd: ${Math.floor(review.totalTimeSec / 60)} minuten`,
    {
      x: isRTL ? width - 200 : 50,
      y: height - 280,
      size: 12,
      font: font,
    }
  )

  coverPage.drawText(
    `Correct: ${review.correctCount} / ${review.totalQuestions}`,
    {
      x: isRTL ? width - 200 : 50,
      y: height - 310,
      size: 12,
      font: font,
    }
  )

  // Questions pages
  let yPosition = height - 50
  let currentPage = pdfDoc.addPage([595, 842])
  let globalQuestionNumber = 1 // Continuous numbering across all texts

  // Sort texts by orderIndex to ensure correct order (used for both questions and answer key)
  const sortedTexts = [...review.texts].sort((a, b) => a.orderIndex - b.orderIndex)

  sortedTexts.forEach((text, textIndex) => {
    if (includeText) {
      // Add text content
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }

      // Draw wrapped, centered title
      const titleText = `Tekst ${text.orderIndex + 1}: ${text.title}`
      const titleMaxWidth = width - 100 // 50px margin on each side
      const titleX = isRTL ? width - 50 : 50
      yPosition = drawCenteredWrappedTitle(
        currentPage,
        normalizeTextForPDF(titleText),
        titleX,
        yPosition,
        titleMaxWidth,
        16,
        boldFont,
        isRTL,
        1.4,
        width
      )
      yPosition -= 10 // Extra space after title

      // Calculate actual text width (page width - margins)
      const textWidth = width - 100 // 50px margin on each side
      const fontSize = 10
      const textX = isRTL ? width - 50 - textWidth : 50
      
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
      
      // If showing answers, highlight evidence sections in the text
      if (showAnswers) {
        // Build evidence ranges from questions in this text
        const sortedQuestions = [...text.questions].sort((a, b) => a.orderIndex - b.orderIndex)
        const evidenceRanges = sortedQuestions
          .map((q) => {
            // Use evidenceStart/evidenceEnd if available
            if (q.evidenceStart !== null && q.evidenceEnd !== null) {
              return {
                start: q.evidenceStart,
                end: q.evidenceEnd,
              }
            }
            // Otherwise, try to find it from evidenceQuote
            if (q.evidenceQuote) {
              const quote = q.evidenceQuote
              let start = text.content.indexOf(quote)
              if (start !== -1) {
                return {
                  start,
                  end: start + quote.length,
                }
              }
              // Try with normalized whitespace
              const escapedQuote = quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              const flexiblePattern = escapedQuote.replace(/\s+/g, '\\s+')
              const regex = new RegExp(flexiblePattern)
              const match = text.content.match(regex)
              if (match && match.index !== undefined) {
                return {
                  start: match.index,
                  end: match.index + match[0].length,
                }
              }
            }
            return null
          })
          .filter((range): range is NonNullable<typeof range> => range !== null)
          .sort((a, b) => a.start - b.start)

        // Draw text with highlights
        const textResult = drawWrappedTextWithHighlights(
          currentPage,
          normalizeTextForPDF(text.content),
          textX,
          yPosition,
          textWidth,
          fontSize,
          font,
          evidenceRanges,
          1.4, // line height
          0.8, // paragraph spacing
          height,
          () => {
            const newPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
            return newPage
          }
        )
        currentPage = textResult.currentPage
        yPosition = textResult.finalY
      } else {
        // Regular text without highlights
        const textResult = drawWrappedText(
          currentPage,
          normalizeTextForPDF(text.content),
          textX,
          yPosition,
          textWidth,
          fontSize,
          font,
          1.4, // line height
          0.8, // paragraph spacing
          height,
          () => {
            const newPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
            return newPage
          }
        )
        currentPage = textResult.currentPage
        yPosition = textResult.finalY
      }
      
      yPosition -= fontSize * 1.6 // Extra space after text block
    }

    // Sort questions by orderIndex to ensure correct order
    const sortedQuestions = [...text.questions].sort((a, b) => a.orderIndex - b.orderIndex)

    // Add questions with continuous numbering across all texts
    sortedQuestions.forEach((question) => {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }

      const prompt = locale === 'ar' ? question.promptAr : question.promptNl
      const options = JSON.parse(question.optionsJson) as string[]
      const attempt = question.questionAttempt

      // Use global question number (continuous across texts)
      currentPage.drawText(`Vraag ${globalQuestionNumber}`, {
        x: isRTL ? width - 200 : 50,
        y: yPosition,
        size: 14,
        font: boldFont,
      })
      yPosition -= 25

      const promptFontSize = 11
      const promptTextWidth = width - 100
      const promptX = isRTL ? width - 50 - promptTextWidth : 50
      
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
      
      const promptResult = drawWrappedText(
        currentPage,
        normalizeTextForPDF(prompt),
        promptX,
        yPosition,
        promptTextWidth,
        promptFontSize,
        font,
        1.4,
        0.8,
        height,
        () => {
          const newPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
          return newPage
        }
      )
      currentPage = promptResult.currentPage
      yPosition = promptResult.finalY
      
      yPosition -= promptFontSize * 0.8

      const optionFontSize = 10
      const optionTextWidth = width - 100
      const optionX = isRTL ? width - 50 - optionTextWidth : 50
      const optionLineHeight = optionFontSize * 1.4

      // Show options - with or without answer indicators based on showAnswers
      if (showAnswers && attempt) {
        // Show user's answers with highlights (correct/incorrect)
        options.forEach((option, optIndex) => {
          if (yPosition < 50) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }

          const prefix = `${String.fromCharCode(65 + optIndex)}) `
          const isSelected = attempt.chosenIndex === optIndex
          const isCorrect = optIndex === question.correctIndex

          if (isSelected || isCorrect) {
            let optionText = prefix + normalizeTextForPDF(option)
            if (isSelected && !isCorrect) {
              optionText += ' [Jouw antwoord - FOUT]'
            } else if (isSelected && isCorrect) {
              optionText += ' [Jouw antwoord - CORRECT]'
            } else if (isCorrect && !isSelected) {
              optionText += ' [Correct antwoord]'
            }

            const optionLines = wrapText(optionText, optionTextWidth, font, optionFontSize)
            optionLines.forEach((line) => {
              if (yPosition < 50) {
                currentPage = pdfDoc.addPage([595, 842])
                yPosition = height - 50
              }
              currentPage.drawText(line, {
                x: optionX,
                y: yPosition,
                size: optionFontSize,
                font: boldFont,
                color: isCorrect ? rgb(0, 0.7, 0) : rgb(0.7, 0, 0),
              })
              yPosition -= optionLineHeight
            })
          } else {
            // Show other options in regular text
            const optionText = prefix + normalizeTextForPDF(option)
            const optionLines = wrapText(optionText, optionTextWidth, font, optionFontSize)
            optionLines.forEach((line) => {
              if (yPosition < 50) {
                currentPage = pdfDoc.addPage([595, 842])
                yPosition = height - 50
              }
              currentPage.drawText(line, {
                x: optionX,
                y: yPosition,
                size: optionFontSize,
                font: font,
                color: rgb(0, 0, 0),
              })
              yPosition -= optionLineHeight
            })
          }
        })

        // Add explanation, evidence, and trap note if showAnswers is true
        yPosition -= 10

        // Evidence
        if (question.evidenceStart !== null && question.evidenceEnd !== null) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }

          currentPage.drawText('Bewijs:', {
            x: isRTL ? width - 200 : 50,
            y: yPosition,
            size: 11,
            font: boldFont,
          })
          yPosition -= 20

          const evidence = text.content.slice(
            question.evidenceStart,
            question.evidenceEnd
          )
          const evidenceFontSize = 10
          const evidenceTextWidth = width - 100
          const evidenceX = isRTL ? width - 50 - evidenceTextWidth : 50
          
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          
          const evidenceResult = drawWrappedText(
            currentPage,
            normalizeTextForPDF(evidence),
            evidenceX,
            yPosition,
            evidenceTextWidth,
            evidenceFontSize,
            font,
            1.4,
            0.8,
            height,
            () => {
              const newPage = pdfDoc.addPage([595, 842])
              yPosition = height - 50
              return newPage
            }
          )
          currentPage = evidenceResult.currentPage
          yPosition = evidenceResult.finalY
          
          yPosition -= evidenceFontSize * 0.8
        } else if (question.evidenceQuote) {
          // Fallback to evidenceQuote
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }

          currentPage.drawText('Bewijs:', {
            x: isRTL ? width - 200 : 50,
            y: yPosition,
            size: 11,
            font: boldFont,
          })
          yPosition -= 20

          const evidenceFontSize = 10
          const evidenceTextWidth = width - 100
          const evidenceX = isRTL ? width - 50 - evidenceTextWidth : 50
          
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          
          const quoteResult = drawWrappedText(
            currentPage,
            normalizeTextForPDF(question.evidenceQuote),
            evidenceX,
            yPosition,
            evidenceTextWidth,
            evidenceFontSize,
            font,
            1.4,
            0.8,
            height,
            () => {
              const newPage = pdfDoc.addPage([595, 842])
              yPosition = height - 50
              return newPage
            }
          )
          currentPage = quoteResult.currentPage
          yPosition = quoteResult.finalY
          
          yPosition -= evidenceFontSize * 0.8
        }

        // Explanation
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        currentPage.drawText('Uitleg:', {
          x: isRTL ? width - 200 : 50,
          y: yPosition,
          size: 11,
          font: boldFont,
        })
        yPosition -= 20

        const explanation = question.explanationNl
        
        if (explanation) {
          const explanationFontSize = 10
          const explanationTextWidth = width - 100
          const explanationX = isRTL ? width - 50 - explanationTextWidth : 50
          
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          
          const normalizedExplanation = normalizeTextForPDF(explanation, false)
          if (normalizedExplanation) {
            const explanationResult = drawWrappedText(
              currentPage,
              normalizedExplanation,
              explanationX,
              yPosition,
              explanationTextWidth,
              explanationFontSize,
              font,
              1.4,
              0.8,
              height,
              () => {
                const newPage = pdfDoc.addPage([595, 842])
                yPosition = height - 50
                return newPage
              }
            )
            currentPage = explanationResult.currentPage
            yPosition = explanationResult.finalY
          }
        }

        // Trap note
        if (question.trapNoteNl) {
          yPosition -= 10
          if (yPosition < 80) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }

          currentPage.drawText('Waarom verleidelijk?', {
            x: isRTL ? width - 200 : 50,
            y: yPosition,
            size: 11,
            font: boldFont,
          })
          yPosition -= 20

          const trapNote = locale === 'ar' ? question.trapNoteAr || question.trapNoteNl : question.trapNoteNl
          const trapFontSize = 10
          const trapTextWidth = width - 100
          const trapX = isRTL ? width - 50 - trapTextWidth : 50
          
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          
          const trapResult = drawWrappedText(
            currentPage,
            normalizeTextForPDF(trapNote),
            trapX,
            yPosition,
            trapTextWidth,
            trapFontSize,
            font,
            1.4,
            0.8,
            height,
            () => {
              const newPage = pdfDoc.addPage([595, 842])
              yPosition = height - 50
              return newPage
            }
          )
          currentPage = trapResult.currentPage
          yPosition = trapResult.finalY
        }

        yPosition -= 20
      } else {
        // Show options WITHOUT any answer indicators (clean version)
        options.forEach((option, optIndex) => {
          if (yPosition < 50) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }

          const prefix = `${String.fromCharCode(65 + optIndex)}) `
          const optionText = prefix + normalizeTextForPDF(option)

          const optionLines = wrapText(optionText, optionTextWidth, font, optionFontSize)
          optionLines.forEach((line) => {
            if (yPosition < 50) {
              currentPage = pdfDoc.addPage([595, 842])
              yPosition = height - 50
            }
            currentPage.drawText(line, {
              x: optionX,
              y: yPosition,
              size: optionFontSize,
              font: font,
              color: rgb(0, 0, 0), // All options in black, no indication
            })
            yPosition -= optionLineHeight
          })
        })
      }

      yPosition -= 20
      globalQuestionNumber++ // Increment for next question (continues across texts)
    })
  })

  // Answer key page - only show if not showing answers (clean version)
  if (!showAnswers) {
    const answerKeyPage = pdfDoc.addPage([595, 842])
    answerKeyPage.drawText('Antwoordsleutel', {
      x: isRTL ? width - 200 : 50,
      y: height - 50,
      size: 20,
      font: boldFont,
    })

    // Start answers well below the title to avoid overlap
    let answerY = height - 120
    let currentAnswerPage = answerKeyPage
  // Reset globalQuestionNumber for answer key (starts from 1 again)
  globalQuestionNumber = 1

  // Group questions by text but continue numbering across texts
  // Reuse sortedTexts from above (already sorted by orderIndex)
  sortedTexts.forEach((text, textIndex) => {
    // Add text header
    if (answerY < 80) {
      currentAnswerPage = pdfDoc.addPage([595, 842])
      answerY = height - 50
    }

    // Draw wrapped, centered title
    const answerTitleText = `Tekst ${text.orderIndex + 1}: ${text.title}`
    const answerTitleMaxWidth = width - 100
    const answerTitleX = isRTL ? width - 50 : 50
    answerY = drawCenteredWrappedTitle(
      currentAnswerPage,
      normalizeTextForPDF(answerTitleText),
      answerTitleX,
      answerY,
      answerTitleMaxWidth,
      14,
      boldFont,
      isRTL,
      1.4,
      width
    )
    answerY -= 10 // Extra space after title

    // Sort questions by orderIndex to ensure correct order
    const sortedQuestions = [...text.questions].sort((a, b) => a.orderIndex - b.orderIndex)
    
    // Show questions for this text with cumulative numbering (continues from previous text)
    sortedQuestions.forEach((question) => {
      if (answerY < 50) {
        currentAnswerPage = pdfDoc.addPage([595, 842])
        answerY = height - 50
      }

      const correctAnswer = String.fromCharCode(65 + question.correctIndex)
      currentAnswerPage.drawText(
        `  ${globalQuestionNumber}. ${correctAnswer}`,
        {
          x: isRTL ? width - 200 : 50,
          y: answerY,
          size: 12,
          font: font,
        }
      )
      answerY -= 20
      globalQuestionNumber++ // Increment for next question
    })

    // Add spacing between texts
    answerY -= 10
    })

  }

  return await pdfDoc.save()
}

export async function generateWrongPDF(
  review: AttemptReview,
  locale: 'nl' | 'ar',
  explanationMode: 'nl' | 'both'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // Use Helvetica for better clarity and readability
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const isRTL = locale === 'ar'
  const { width, height } = { width: 595, height: 842 } // A4

  let currentPage = pdfDoc.addPage([595, 842])
  let yPosition = height - 50

  currentPage.drawText('Fouten + Uitleg', {
    x: isRTL ? width - 200 : 50,
    y: yPosition,
    size: 20,
    font: boldFont,
  })
  yPosition -= 40

  // Sort texts by orderIndex to ensure correct order
  const sortedTexts = [...review.texts].sort((a, b) => a.orderIndex - b.orderIndex)
  
  // Calculate global question numbers for all questions first
  let globalQuestionNumber = 1
  const questionToGlobalNumber = new Map<string, number>()
  
  sortedTexts.forEach((text) => {
    const sortedQuestions = [...text.questions].sort((a, b) => a.orderIndex - b.orderIndex)
    sortedQuestions.forEach((question) => {
      questionToGlobalNumber.set(question.id, globalQuestionNumber)
      globalQuestionNumber++
    })
  })

  sortedTexts.forEach((text) => {
    const sortedQuestions = [...text.questions].sort((a, b) => a.orderIndex - b.orderIndex)
    const wrongQuestions = sortedQuestions.filter(
      (q) => q.questionAttempt && !q.questionAttempt.isCorrect
    )

    if (wrongQuestions.length === 0) return

    wrongQuestions.forEach((question) => {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }

      const prompt = locale === 'ar' ? question.promptAr : question.promptNl
      const options = JSON.parse(question.optionsJson) as string[]
      const attempt = question.questionAttempt!
      const globalQuestionNum = questionToGlobalNumber.get(question.id) || 1

      currentPage.drawText(`Vraag ${globalQuestionNum}`, {
        x: isRTL ? width - 200 : 50,
        y: yPosition,
        size: 14,
        font: boldFont,
      })
      yPosition -= 25

      const promptFontSize = 11
      const promptTextWidth = width - 100
      const promptX = isRTL ? width - 50 - promptTextWidth : 50
      
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
      
      const promptResult = drawWrappedText(
        currentPage,
        normalizeTextForPDF(prompt),
        promptX,
        yPosition,
        promptTextWidth,
        promptFontSize,
        font,
        1.4,
        0.8,
        height,
        () => {
          const newPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
          return newPage
        }
      )
      currentPage = promptResult.currentPage
      yPosition = promptResult.finalY
      
      yPosition -= promptFontSize * 0.8

      // Show selected (wrong) and correct answer
      options.forEach((option, optIndex) => {
        if (yPosition < 50) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        const prefix = `${String.fromCharCode(65 + optIndex)}) `
        const isSelected = attempt.chosenIndex === optIndex
        const isCorrect = optIndex === question.correctIndex

        if (isSelected || isCorrect) {
          let optionText = prefix + normalizeTextForPDF(option)
          if (isSelected) optionText += ' [Jouw antwoord - FOUT]'
          if (isCorrect) optionText += ' [Correct antwoord]'

          currentPage.drawText(optionText, {
            x: isRTL ? width - 545 : 50,
            y: yPosition,
            size: 10,
            font: boldFont,
            color: isCorrect ? rgb(0, 0.7, 0) : rgb(0.7, 0, 0),
          })
          yPosition -= 15
        }
      })

      yPosition -= 10

      // Evidence
      if (question.evidenceStart !== null && question.evidenceEnd !== null) {
        if (yPosition < 80) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        currentPage.drawText('Bewijs:', {
          x: isRTL ? width - 200 : 50,
          y: yPosition,
          size: 11,
          font: boldFont,
        })
        yPosition -= 20

        const evidence = text.content.slice(
          question.evidenceStart,
          question.evidenceEnd
        )
        const evidenceFontSize = 10
        const evidenceTextWidth = width - 100
        const evidenceX = isRTL ? width - 50 - evidenceTextWidth : 50
        
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }
        
        const evidenceResult = drawWrappedText(
          currentPage,
          normalizeTextForPDF(evidence),
          evidenceX,
          yPosition,
          evidenceTextWidth,
          evidenceFontSize,
          font,
          1.4,
          0.8,
          height,
          () => {
            const newPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
            return newPage
          }
        )
        currentPage = evidenceResult.currentPage
        yPosition = evidenceResult.finalY
        
        yPosition -= evidenceFontSize * 0.8
      } else if (question.evidenceQuote) {
        // Fallback to evidenceQuote if evidenceStart/evidenceEnd are not available
        if (yPosition < 80) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        currentPage.drawText('Bewijs:', {
          x: isRTL ? width - 200 : 50,
          y: yPosition,
          size: 11,
          font: boldFont,
        })
        yPosition -= 20

        const evidenceFontSize = 10
        const evidenceTextWidth = width - 100
        const evidenceX = isRTL ? width - 50 - evidenceTextWidth : 50
        
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }
        
        const quoteResult = drawWrappedText(
          currentPage,
          normalizeTextForPDF(question.evidenceQuote),
          evidenceX,
          yPosition,
          evidenceTextWidth,
          evidenceFontSize,
          font,
          1.4,
          0.8,
          height,
          () => {
            const newPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
            return newPage
          }
        )
        currentPage = quoteResult.currentPage
        yPosition = quoteResult.finalY
        
        yPosition -= evidenceFontSize * 0.8
      }

      // Explanation
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }

      currentPage.drawText('Uitleg:', {
        x: isRTL ? width - 200 : 50,
        y: yPosition,
        size: 11,
        font: boldFont,
      })
      yPosition -= 20

      // Always use Dutch explanation in PDF since StandardFonts can encode it
      // Arabic cannot be encoded with WinAnsi encoding used by StandardFonts
      const explanation = question.explanationNl
      
      if (!explanation) {
        // Skip if explanation is missing - just move to next question
        yPosition -= 30
      } else {
        const explanationFontSize = 10
        const explanationTextWidth = width - 100
        const explanationX = isRTL ? width - 50 - explanationTextWidth : 50
        
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }
        
        const normalizedExplanation = normalizeTextForPDF(explanation, false)
        if (normalizedExplanation) {
          const explanationResult = drawWrappedText(
            currentPage,
            normalizedExplanation,
            explanationX,
            yPosition,
            explanationTextWidth,
            explanationFontSize,
            font,
            1.4,
            0.8,
            height,
            () => {
              const newPage = pdfDoc.addPage([595, 842])
              yPosition = height - 50
              return newPage
            }
          )
          currentPage = explanationResult.currentPage
          yPosition = explanationResult.finalY
        }
      }

      if (explanationMode === 'both') {
        // When both are requested, show Arabic explanation note
        // Since Arabic can't be encoded with StandardFonts, we show a note
        const arabicExplanation = question.explanationAr
        if (arabicExplanation && containsArabic(arabicExplanation)) {
          yPosition -= 10
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          currentPage.drawText('(Arabic explanation available in web version)', {
            x: isRTL ? width - 500 : 50,
            y: yPosition,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          })
          yPosition -= 15
        }
      }

      // Trap note
      if (question.trapNoteNl) {
        yPosition -= 10
        if (yPosition < 80) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        currentPage.drawText('Waarom verleidelijk?', {
          x: isRTL ? width - 200 : 50,
          y: yPosition,
          size: 11,
          font: boldFont,
        })
        yPosition -= 20

        const trapNote = locale === 'ar' ? question.trapNoteAr || question.trapNoteNl : question.trapNoteNl
        const trapFontSize = 10
        const trapTextWidth = width - 100
        const trapX = isRTL ? width - 50 - trapTextWidth : 50
        
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }
        
        const trapResult = drawWrappedText(
          currentPage,
          normalizeTextForPDF(trapNote),
          trapX,
          yPosition,
          trapTextWidth,
          trapFontSize,
          font,
          1.4,
          0.8,
          height,
          () => {
            const newPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
            return newPage
          }
        )
        currentPage = trapResult.currentPage
        yPosition = trapResult.finalY
      }

      yPosition -= 30
    })
  })


  return await pdfDoc.save()
}

export async function generateQuestionsOnlyPDF(
  review: AttemptReview,
  locale: 'nl' | 'ar'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  // Use Helvetica for better clarity and readability
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const modelTitle = locale === 'ar' ? review.model.titleAr : review.model.titleNl
  const isRTL = locale === 'ar'
  const { width, height } = { width: 595, height: 842 } // A4

  // Cover page
  const coverPage = pdfDoc.addPage([595, 842])
  
  // Draw wrapped, centered model title on cover page
  const coverTitleMaxWidth = width - 100
  const coverTitleX = isRTL ? width - 50 : 50
  let coverTitleY = height - 150
  coverTitleY = drawCenteredWrappedTitle(
    coverPage,
    normalizeTextForPDF(modelTitle),
    coverTitleX,
    coverTitleY,
    coverTitleMaxWidth,
    24,
    boldFont,
    isRTL,
    1.5,
    width
  )

  const titleText = locale === 'ar' ? 'الأسئلة فقط' : 'Vragen alleen'
  coverPage.drawText(titleText, {
    x: isRTL ? width - 200 : 50,
    y: height - 200,
    size: 18,
    font: font,
  })

  // Questions pages - NO ANSWERS, NO ANSWER KEY
  let currentPage = pdfDoc.addPage([595, 842])
  let yPosition = height - 50
  let questionNumber = 1

  review.texts.forEach((text) => {
    text.questions.forEach((question) => {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }

      const prompt = locale === 'ar' ? question.promptAr : question.promptNl
      const options = JSON.parse(question.optionsJson) as string[]

      // Question number and prompt
      currentPage.drawText(`${locale === 'ar' ? 'سؤال' : 'Vraag'} ${questionNumber}`, {
        x: isRTL ? width - 200 : 50,
        y: yPosition,
        size: 14,
        font: boldFont,
      })
      yPosition -= 25

      const promptFontSize = 11
      const promptTextWidth = width - 100
      const promptX = isRTL ? width - 50 - promptTextWidth : 50
      
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([595, 842])
        yPosition = height - 50
      }
      
      const promptResult = drawWrappedText(
        currentPage,
        normalizeTextForPDF(prompt),
        promptX,
        yPosition,
        promptTextWidth,
        promptFontSize,
        font,
        1.4,
        0.8,
        height,
        () => {
          const newPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
          return newPage
        }
      )
      currentPage = promptResult.currentPage
      yPosition = promptResult.finalY
      
      yPosition -= promptFontSize * 0.8

      // Show all options - NO indication of correct answer
      const optionFontSize = 10
      const optionTextWidth = width - 100
      const optionX = isRTL ? width - 50 - optionTextWidth : 50
      const optionLineHeight = optionFontSize * 1.4

      options.forEach((option, optIndex) => {
        if (yPosition < 50) {
          currentPage = pdfDoc.addPage([595, 842])
          yPosition = height - 50
        }

        const prefix = `${String.fromCharCode(65 + optIndex)}) `
        const optionText = prefix + normalizeTextForPDF(option)

        const optionLines = wrapText(optionText, optionTextWidth, font, optionFontSize)
        optionLines.forEach((line) => {
          if (yPosition < 50) {
            currentPage = pdfDoc.addPage([595, 842])
            yPosition = height - 50
          }
          currentPage.drawText(line, {
            x: optionX,
            y: yPosition,
            size: optionFontSize,
            font: font,
            color: rgb(0, 0, 0), // All options in black, no indication
          })
          yPosition -= optionLineHeight
        })
      })

      yPosition -= 20
      questionNumber++
    })
  })


  return await pdfDoc.save()
}

// Proper text wrapping using actual font width measurement
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  if (!text) return []
  
  // First, split by newlines to preserve paragraphs
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
  const lines: string[] = []

  paragraphs.forEach((paragraph, paraIndex) => {
    // Add empty line between paragraphs (except first)
    if (paraIndex > 0) {
      lines.push('')
    }

    const words = paragraph.trim().split(/\s+/).filter(w => w.length > 0)
    let currentLine = ''

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      let width: number
      try {
        width = font.widthOfTextAtSize(testLine, fontSize)
      } catch (e) {
        // Fallback: estimate width (rough approximation)
        width = testLine.length * fontSize * 0.6
      }

      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        // If single word is too long, break it (shouldn't happen but safety)
        let wordWidth: number
        try {
          wordWidth = font.widthOfTextAtSize(word, fontSize)
        } catch (e) {
          wordWidth = word.length * fontSize * 0.6
        }
        
        if (wordWidth > maxWidth) {
          // Break long word - split by characters
          let wordPart = ''
          for (const char of word) {
            const testWordPart = wordPart + char
            let partWidth: number
            try {
              partWidth = font.widthOfTextAtSize(testWordPart, fontSize)
            } catch (e) {
              partWidth = testWordPart.length * fontSize * 0.6
            }
            
            if (partWidth > maxWidth) {
              if (wordPart) lines.push(wordPart)
              wordPart = char
            } else {
              wordPart = testWordPart
            }
          }
          currentLine = wordPart
        } else {
          currentLine = word
        }
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }
  })

  return lines
}

// Helper to draw centered, wrapped title text
function drawCenteredWrappedTitle(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any,
  isRTL: boolean = false,
  lineHeightMultiplier: number = 1.4,
  pageWidth: number = 595
): number {
  const lines = wrapText(text, maxWidth, font, fontSize)
  const lineHeight = fontSize * lineHeightMultiplier
  let currentY = y

  lines.forEach((line) => {
    // Calculate width of the line
    let lineWidth: number
    try {
      lineWidth = font.widthOfTextAtSize(line, fontSize)
    } catch (e) {
      lineWidth = line.length * fontSize * 0.6
    }
    
    // Center the line on the page (page center is always at pageWidth / 2)
    const centeredX = (pageWidth / 2) - (lineWidth / 2)
    
    page.drawText(line, {
      x: centeredX,
      y: currentY,
      size: fontSize,
      font: font,
    })
    currentY -= lineHeight
  })

  return currentY
}

