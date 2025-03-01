import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface TranscriptData {
  title: string
  generated: string
  doctorLanguage: string
  patientLanguage: string
  conversation: Array<{
    original_text: string
    translated_text: string
    timestamp: string
    date: string
    role: string
  }>
}

export async function generatePDF(data: TranscriptData) {
  // Create new PDF document
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Add title
  doc.setFontSize(20)
  doc.text(data.title, pageWidth / 2, 20, { align: "center" })

  // Add metadata
  doc.setFontSize(12)
  doc.text(`Generated: ${data.generated}`, 20, 35)
  doc.text(`Healthcare Provider's Language: ${data.doctorLanguage}`, 20, 45)
  doc.text(`Patient's Language: ${data.patientLanguage}`, 20, 55)

  // Group conversations by date
  const groupedByDate = data.conversation.reduce(
    (acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = []
      }
      acc[item.date].push(item)
      return acc
    },
    {} as Record<string, typeof data.conversation>,
  )

  let yPosition = 70

  // Iterate through dates
  Object.entries(groupedByDate).forEach(([date, conversations]) => {
    // Add date header
    if (yPosition > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.text(date, 20, yPosition)
    yPosition += 10

    // Add conversations
    conversations.forEach((conv) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(12)
      doc.text(`${conv.timestamp} - ${conv.role}`, 20, yPosition)
      yPosition += 10

      // Original text
      doc.setFontSize(10)
      const originalLines = doc.splitTextToSize(conv.original_text, pageWidth - 40)
      doc.text(originalLines, 20, yPosition)
      yPosition += originalLines.length * 7

      // Translation
      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage()
        yPosition = 20
      }
      const translationLines = doc.splitTextToSize(conv.translated_text, pageWidth - 40)
      doc.text(translationLines, 20, yPosition)
      yPosition += translationLines.length * 7 + 10
    })
  })

  // Add footer
  doc.setFontSize(10)
  const footer = `© ${new Date().getFullYear()} Healthcare Translation by Sebastian Romero. All rights reserved.`
  doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" })

  // Save the PDF
  doc.save(`medical-translation-transcript-${new Date().toISOString().slice(0, 10)}.pdf`)
}

