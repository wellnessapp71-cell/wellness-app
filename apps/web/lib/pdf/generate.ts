import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
}

export interface PdfTableOptions {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  rows: Record<string, string | number | null | undefined>[];
  footer?: string;
  pageSize?: [number, number];
}

const PAGE_SIZE: [number, number] = [612, 792]; // Letter
const MARGIN_X = 36;
const MARGIN_TOP = 54;
const ROW_HEIGHT = 18;
const HEADER_FILL = rgb(0.09, 0.49, 0.5);
const TEXT = rgb(0.1, 0.14, 0.16);
const MUTED = rgb(0.34, 0.44, 0.48);
const BORDER = rgb(0.88, 0.9, 0.91);

function truncate(str: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(str, size) <= maxWidth) return str;
  const ellipsis = "…";
  let low = 0;
  let high = str.length;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const candidate = str.slice(0, mid) + ellipsis;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) low = mid;
    else high = mid - 1;
  }
  return str.slice(0, low) + ellipsis;
}

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  title: string,
  subtitle: string | undefined,
  pageNo: number,
): number {
  const { height } = page.getSize();
  page.drawText(title, {
    x: MARGIN_X,
    y: height - MARGIN_TOP,
    size: 16,
    font: bold,
    color: TEXT,
  });
  page.drawText(`Page ${pageNo}`, {
    x: page.getWidth() - MARGIN_X - bold.widthOfTextAtSize(`Page ${pageNo}`, 9),
    y: height - MARGIN_TOP + 4,
    size: 9,
    font,
    color: MUTED,
  });
  let cursor = height - MARGIN_TOP - 18;
  if (subtitle) {
    page.drawText(subtitle, { x: MARGIN_X, y: cursor, size: 10, font, color: MUTED });
    cursor -= 14;
  }
  page.drawText(`Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`, {
    x: MARGIN_X,
    y: cursor,
    size: 8,
    font,
    color: MUTED,
  });
  return cursor - 18;
}

function drawTableHeader(
  page: PDFPage,
  bold: PDFFont,
  columns: TableColumn[],
  widths: number[],
  y: number,
): number {
  page.drawRectangle({
    x: MARGIN_X,
    y: y - ROW_HEIGHT + 4,
    width: widths.reduce((a, b) => a + b, 0),
    height: ROW_HEIGHT,
    color: HEADER_FILL,
  });
  let x = MARGIN_X + 6;
  for (let i = 0; i < columns.length; i++) {
    const label = truncate(columns[i].label, bold, 9, widths[i] - 10);
    page.drawText(label, {
      x,
      y: y - ROW_HEIGHT + 9,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
    });
    x += widths[i];
  }
  return y - ROW_HEIGHT;
}

function drawRow(
  page: PDFPage,
  font: PDFFont,
  columns: TableColumn[],
  widths: number[],
  row: Record<string, string | number | null | undefined>,
  y: number,
  zebra: boolean,
): number {
  if (zebra) {
    page.drawRectangle({
      x: MARGIN_X,
      y: y - ROW_HEIGHT + 4,
      width: widths.reduce((a, b) => a + b, 0),
      height: ROW_HEIGHT,
      color: rgb(0.96, 0.97, 0.98),
    });
  }
  let x = MARGIN_X + 6;
  for (let i = 0; i < columns.length; i++) {
    const raw = row[columns[i].key];
    const value = raw === null || raw === undefined ? "—" : String(raw);
    const text = truncate(value, font, 9, widths[i] - 10);
    page.drawText(text, {
      x,
      y: y - ROW_HEIGHT + 9,
      size: 9,
      font,
      color: TEXT,
    });
    x += widths[i];
  }
  page.drawLine({
    start: { x: MARGIN_X, y: y - ROW_HEIGHT + 4 },
    end: { x: MARGIN_X + widths.reduce((a, b) => a + b, 0), y: y - ROW_HEIGHT + 4 },
    thickness: 0.5,
    color: BORDER,
  });
  return y - ROW_HEIGHT;
}

function resolveColumnWidths(columns: TableColumn[], contentWidth: number): number[] {
  const fixed = columns.map((c) => c.width ?? 0);
  const fixedTotal = fixed.reduce((a, b) => a + b, 0);
  const flexCount = columns.filter((c) => !c.width).length;
  const remaining = Math.max(0, contentWidth - fixedTotal);
  const flexW = flexCount > 0 ? remaining / flexCount : 0;
  return columns.map((c) => c.width ?? flexW);
}

export async function renderTablePdf(opts: PdfTableOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const contentWidth = pageSize[0] - MARGIN_X * 2;
  const widths = resolveColumnWidths(opts.columns, contentWidth);

  let pageNo = 1;
  let page = doc.addPage(pageSize);
  let y = drawHeader(page, font, bold, opts.title, opts.subtitle, pageNo);
  y = drawTableHeader(page, bold, opts.columns, widths, y);

  for (let i = 0; i < opts.rows.length; i++) {
    if (y < 60) {
      if (opts.footer) {
        page.drawText(opts.footer, {
          x: MARGIN_X,
          y: 36,
          size: 8,
          font,
          color: MUTED,
        });
      }
      pageNo += 1;
      page = doc.addPage(pageSize);
      y = drawHeader(page, font, bold, opts.title, opts.subtitle, pageNo);
      y = drawTableHeader(page, bold, opts.columns, widths, y);
    }
    y = drawRow(page, font, opts.columns, widths, opts.rows[i], y, i % 2 === 1);
  }

  if (opts.footer) {
    page.drawText(opts.footer, {
      x: MARGIN_X,
      y: 36,
      size: 8,
      font,
      color: MUTED,
    });
  }

  return await doc.save();
}

export function pdfResponseHeaders(filename: string): Headers {
  const h = new Headers();
  h.set("Content-Type", "application/pdf");
  h.set("Content-Disposition", `attachment; filename="${filename}"`);
  return h;
}
