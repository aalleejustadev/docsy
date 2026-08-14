export type LibraryDocument = {
  id: string
  name: string
  /** Size and shape of the document, e.g. "2.4 MB · 18 pages". */
  meta: string
  /** Extension pill on the right of the row. */
  format: string
  /**
   * Still being read and chunked. It can't answer questions yet, so it can't
   * be added to a chat either.
   */
  indexing?: boolean
}

/**
 * Design copy — the real library lands with uploads and its own page. Matches
 * `ui-design/dashboard/light/choose-from-library-modal.png`.
 */
export const libraryDocuments: LibraryDocument[] = [
  {
    id: "q3-vendor-agreement",
    name: "Q3_Vendor_Agreement.pdf",
    meta: "2.4 MB · 18 pages",
    format: "PDF",
  },
  {
    id: "master-services-agreement",
    name: "Master_Services_Agreement.docx",
    meta: "880 KB · 32 pages",
    format: "DOCX",
  },
  {
    id: "fy25-financials",
    name: "FY25_Financials.xlsx",
    meta: "1.1 MB · 6 sheets",
    format: "XLSX",
  },
  {
    id: "board-deck-q2",
    name: "Board_Deck_Q2.pptx",
    meta: "5.6 MB · 24 slides",
    format: "PPTX",
  },
  {
    id: "nda-acme-scanned",
    name: "NDA_Acme_Scanned.pdf",
    meta: "3.2 MB · 4 pages · OCR",
    format: "PDF",
  },
  {
    id: "data-processing-addendum",
    name: "Data_Processing_Addendum.pdf",
    meta: "1.3 MB · 14 pages",
    format: "PDF",
    indexing: true,
  },
  {
    id: "policy-handbook",
    name: "Policy_Handbook.txt",
    meta: "220 KB",
    format: "TXT",
  },
]
