/** Visual constants for generated PDFs: quiet, print-friendly, finance-appropriate. */
export const PDF_COLORS = {
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  zebra: '#f8fafc',
  headerFill: '#f1f5f9',
  accent: '#1e3a8a',
} as const;

export const PDF_FONTS = { regular: 'Helvetica', bold: 'Helvetica-Bold' } as const;

export const PDF_SIZES = {
  title: 18,
  section: 11,
  body: 9,
  table: 8,
  footer: 7.5,
  kpiValue: 16,
  kpiLabel: 7.5,
} as const;

/** US Letter, the default paper size for US finance teams; 0.75in margins. */
export const PDF_PAGE = { size: 'LETTER', margin: 54 } as const;
export const PDF_CONTENT_TYPE = 'application/pdf';
