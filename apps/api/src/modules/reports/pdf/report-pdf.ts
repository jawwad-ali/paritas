import PDFDocument from 'pdfkit';
import { PDF_COLORS, PDF_FONTS, PDF_PAGE, PDF_SIZES } from './pdf-theme.js';
import { pdfText } from './pdf-text.js';

export interface PdfColumn {
  header: string;
  /** Share of the content width (all columns should add up to 1). */
  width: number;
  align?: 'left' | 'right';
}

export interface PdfKpi {
  label: string;
  value: string;
}

export interface ReportPdfOptions {
  title: string;
  subtitle: string;
  /** Small print under the title: period, time zone, who generated it. */
  meta: string[];
  landscape?: boolean;
  footer: string;
}

const CELL_PADDING = 4;
const KPI_HEIGHT = 46;
const KPI_GAP = 8;
/** Space a heading needs below it (header row + a few rows) so it never sits alone at a page end. */
const KEEP_WITH_NEXT = 100;
const AFTER_KPIS = 10;

/**
 * A small document builder over PDFKit: title block, section headings, KPI
 * tiles and paginated tables whose header repeats on every page. Text is
 * sanitised for the built-in fonts; pages are numbered "Page n of N".
 */
export class ReportPdf {
  private readonly doc: PDFKit.PDFDocument;

  constructor(private readonly options: ReportPdfOptions) {
    this.doc = new PDFDocument({
      size: PDF_PAGE.size,
      layout: options.landscape ? 'landscape' : 'portrait',
      margin: PDF_PAGE.margin,
      bufferPages: true,
      info: { Title: options.title, Author: 'Paritas', Creator: 'Paritas' },
    });
    this.titleBlock();
  }

  section(title: string): this {
    this.ensureSpace(KEEP_WITH_NEXT);
    this.doc.moveDown(1);
    this.doc
      .font(PDF_FONTS.bold)
      .fontSize(PDF_SIZES.section)
      .fillColor(PDF_COLORS.ink)
      .text(pdfText(title), this.left, this.doc.y);
    this.doc.moveDown(0.4);
    return this;
  }

  note(text: string): this {
    this.doc
      .font(PDF_FONTS.regular)
      .fontSize(PDF_SIZES.body)
      .fillColor(PDF_COLORS.muted)
      .text(pdfText(text), this.left, this.doc.y, { width: this.width });
    return this;
  }

  kpis(items: PdfKpi[]): this {
    this.ensureSpace(KPI_HEIGHT + 10);
    const tileWidth = (this.width - KPI_GAP * (items.length - 1)) / items.length;
    const top = this.doc.y;
    items.forEach((item, index) => {
      const x = this.left + index * (tileWidth + KPI_GAP);
      this.doc
        .roundedRect(x, top, tileWidth, KPI_HEIGHT, 4)
        .lineWidth(0.75)
        .strokeColor(PDF_COLORS.border)
        .stroke();
      this.doc
        .font(PDF_FONTS.regular)
        .fontSize(PDF_SIZES.kpiLabel)
        .fillColor(PDF_COLORS.muted)
        .text(pdfText(item.label.toUpperCase()), x + 8, top + 8, { width: tileWidth - 16 });
      this.doc
        .font(PDF_FONTS.bold)
        .fontSize(PDF_SIZES.kpiValue)
        .fillColor(PDF_COLORS.ink)
        .text(pdfText(item.value), x + 8, top + 21, { width: tileWidth - 16, lineBreak: false });
    });
    this.doc.x = this.left;
    this.doc.y = top + KPI_HEIGHT + AFTER_KPIS;
    return this;
  }

  table(columns: PdfColumn[], rows: string[][]): this {
    const widths = columns.map((column) => column.width * this.width);
    const headers = columns.map((column) => column.header);

    const heightOf = (cells: string[], font: string): number => {
      this.doc.font(font).fontSize(PDF_SIZES.table);
      const heights = cells.map((cell, index) =>
        this.doc.heightOfString(pdfText(cell), { width: (widths[index] ?? 0) - 2 * CELL_PADDING }),
      );
      return Math.max(...heights) + 2 * CELL_PADDING;
    };

    const drawRow = (cells: string[], font: string, fill?: string): void => {
      const height = heightOf(cells, font);
      const top = this.doc.y;
      if (fill) {
        this.doc.rect(this.left, top, this.width, height).fill(fill);
      }
      this.doc.font(font).fontSize(PDF_SIZES.table).fillColor(PDF_COLORS.ink);
      let x = this.left;
      cells.forEach((cell, index) => {
        const width = widths[index] ?? 0;
        this.doc.text(pdfText(cell), x + CELL_PADDING, top + CELL_PADDING, {
          width: width - 2 * CELL_PADDING,
          align: columns[index]?.align ?? 'left',
        });
        x += width;
      });
      this.doc
        .moveTo(this.left, top + height)
        .lineTo(this.left + this.width, top + height)
        .lineWidth(0.5)
        .strokeColor(PDF_COLORS.border)
        .stroke();
      this.doc.y = top + height;
    };

    const drawHeader = (): void => drawRow(headers, PDF_FONTS.bold, PDF_COLORS.headerFill);

    this.ensureSpace(heightOf(headers, PDF_FONTS.bold) * 2 + 10);
    drawHeader();
    rows.forEach((cells, index) => {
      if (this.doc.y + heightOf(cells, PDF_FONTS.regular) > this.bottom) {
        this.doc.addPage();
        drawHeader();
      }
      drawRow(cells, PDF_FONTS.regular, index % 2 === 1 ? PDF_COLORS.zebra : undefined);
    });
    if (rows.length === 0) {
      this.doc.moveDown(0.3);
      this.note('Nothing to show for this period.');
    }
    this.doc.x = this.left;
    return this;
  }

  /** Numbers every page, ends the document and returns it as a readable stream. */
  finish(): PDFKit.PDFDocument {
    const { start, count } = this.doc.bufferedPageRange();
    for (let index = start; index < start + count; index += 1) {
      this.doc.switchToPage(index);
      // Writing inside the bottom margin would otherwise start a new page.
      const bottomMargin = this.doc.page.margins.bottom;
      this.doc.page.margins.bottom = 0;
      const y = this.doc.page.height - bottomMargin + 18;
      this.doc.font(PDF_FONTS.regular).fontSize(PDF_SIZES.footer).fillColor(PDF_COLORS.muted);
      this.doc.text(pdfText(this.options.footer), this.left, y, {
        width: this.width,
        lineBreak: false,
      });
      this.doc.text(`Page ${index - start + 1} of ${count}`, this.left, y, {
        width: this.width,
        align: 'right',
        lineBreak: false,
      });
      this.doc.page.margins.bottom = bottomMargin;
    }
    this.doc.end();
    return this.doc;
  }

  private titleBlock(): void {
    const { title, subtitle, meta } = this.options;
    this.doc
      .font(PDF_FONTS.bold)
      .fontSize(PDF_SIZES.footer)
      .fillColor(PDF_COLORS.accent)
      .text('PARITAS', { characterSpacing: 1.5 });
    this.doc.moveDown(0.3);
    this.doc
      .font(PDF_FONTS.bold)
      .fontSize(PDF_SIZES.title)
      .fillColor(PDF_COLORS.ink)
      .text(pdfText(title));
    this.doc
      .font(PDF_FONTS.regular)
      .fontSize(PDF_SIZES.body + 1)
      .fillColor(PDF_COLORS.ink)
      .text(pdfText(subtitle));
    this.doc.moveDown(0.3);
    this.doc
      .fontSize(PDF_SIZES.body)
      .fillColor(PDF_COLORS.muted)
      .text(pdfText(meta.join('   ·   ')));
    this.doc.moveDown(0.6);
    this.doc
      .moveTo(this.left, this.doc.y)
      .lineTo(this.left + this.width, this.doc.y)
      .lineWidth(1)
      .strokeColor(PDF_COLORS.ink)
      .stroke();
    this.doc.moveDown(0.4);
  }

  private ensureSpace(height: number): void {
    if (this.doc.y + height > this.bottom) {
      this.doc.addPage();
    }
  }

  private get left(): number {
    return this.doc.page.margins.left;
  }

  private get width(): number {
    return this.doc.page.width - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  private get bottom(): number {
    return this.doc.page.height - this.doc.page.margins.bottom;
  }
}
