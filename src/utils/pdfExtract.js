// Extracts plain text from a PDF file entirely in the browser using pdfjs-dist.
// The worker is loaded from unpkg at the exact installed version to avoid mismatches.

export async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  let fullText = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    fullText += pageText + '\n'
  }
  return fullText.trim()
}