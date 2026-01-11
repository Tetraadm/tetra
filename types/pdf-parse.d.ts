declare module 'pdf-parse' {
  type PDFData = {
    text?: string
    numrender?: number
    info?: Record<string, unknown>
    metadata?: unknown
    version?: string
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFData>

  export default pdfParse
}
