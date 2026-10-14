import { jsPDF } from "jspdf";

export type PrintFormat = "a4-9" | "a4-4" | "sticker" | "album";

export interface PrintFormatInfo {
  id: PrintFormat;
  labelCs: string;
  descriptionCs: string;
  cols: number;
  rows: number;
  maxCards: number;
  orientation: "portrait" | "landscape";
  requiresTier: "free" | "premium" | "team";
}

export const PRINT_FORMATS: PrintFormatInfo[] = [
  {
    id: "a4-9",
    labelCs: "A4 — 9 karet",
    descriptionCs: "3×3 standardní velikost (63,5×88,9 mm)",
    cols: 3, rows: 3, maxCards: 9,
    orientation: "portrait",
    requiresTier: "premium",
  },
  {
    id: "a4-4",
    labelCs: "A4 — 4 karty",
    descriptionCs: "2×2 větší formát (85×119 mm)",
    cols: 2, rows: 2, maxCards: 4,
    orientation: "portrait",
    requiresTier: "premium",
  },
  {
    id: "sticker",
    labelCs: "Nálepkový arch",
    descriptionCs: "3×3 s řezacími značkami",
    cols: 3, rows: 3, maxCards: 9,
    orientation: "portrait",
    requiresTier: "team",
  },
  {
    id: "album",
    labelCs: "Album stránka",
    descriptionCs: "3×2 na šířku (A4 landscape)",
    cols: 3, rows: 2, maxCards: 6,
    orientation: "landscape",
    requiresTier: "team",
  },
];

// Standard trading card: 2.5" × 3.5" = 63.5mm × 88.9mm
const CARD_W_STD = 63.5;
const CARD_H_STD = 88.9;

interface LayoutSpec {
  pageW: number;
  pageH: number;
  cardW: number;
  cardH: number;
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
  marginX: number;
  marginY: number;
  cutMarks: boolean;
}

const LAYOUTS: Record<PrintFormat, LayoutSpec> = (() => {
  const a4w = 210, a4h = 297;
  const a4lw = 297, a4lh = 210;

  const spec9: LayoutSpec = {
    pageW: a4w, pageH: a4h,
    cardW: CARD_W_STD, cardH: CARD_H_STD,
    cols: 3, rows: 3, gapX: 2, gapY: 2,
    marginX: (a4w - 3 * CARD_W_STD - 2 * 2) / 2,
    marginY: (a4h - 3 * CARD_H_STD - 2 * 2) / 2,
    cutMarks: false,
  };

  const spec4: LayoutSpec = {
    pageW: a4w, pageH: a4h,
    cardW: 85, cardH: 119,
    cols: 2, rows: 2, gapX: 10, gapY: 10,
    marginX: (a4w - 2 * 85 - 10) / 2,
    marginY: (a4h - 2 * 119 - 10) / 2,
    cutMarks: false,
  };

  const specSticker: LayoutSpec = {
    pageW: a4w, pageH: a4h,
    cardW: CARD_W_STD, cardH: CARD_H_STD,
    cols: 3, rows: 3, gapX: 4, gapY: 4,
    marginX: (a4w - 3 * CARD_W_STD - 2 * 4) / 2,
    marginY: (a4h - 3 * CARD_H_STD - 2 * 4) / 2,
    cutMarks: true,
  };

  const specAlbum: LayoutSpec = {
    pageW: a4lw, pageH: a4lh,
    cardW: CARD_W_STD, cardH: CARD_H_STD,
    cols: 3, rows: 2, gapX: 8, gapY: 8,
    marginX: (a4lw - 3 * CARD_W_STD - 2 * 8) / 2,
    marginY: (a4lh - 2 * CARD_H_STD - 8) / 2,
    cutMarks: false,
  };

  return { "a4-9": spec9, "a4-4": spec4, sticker: specSticker, album: specAlbum };
})();

function drawCutMark(doc: jsPDF, x: number, y: number, size = 3): void {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(x - size, y, x - 0.5, y);
  doc.line(x + 0.5, y, x + size, y);
  doc.line(x, y - size, x, y - 0.5);
  doc.line(x, y + 0.5, x, y + size);
}

// Lays out already-rendered card images (PNG data URLs, see CardPreview + html-to-image)
// so printed cards look exactly like the on-screen ones, template included.
export function exportCardsToPDF(images: string[], format: PrintFormat): void {
  const layout = LAYOUTS[format];

  const doc = new jsPDF({
    orientation: layout.pageW > layout.pageH ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const slots = layout.cols * layout.rows;
  const pages = Math.ceil(images.length / slots);

  for (let page = 0; page < pages; page++) {
    if (page > 0) doc.addPage();

    const pageImages = images.slice(page * slots, (page + 1) * slots);

    pageImages.forEach((dataUrl, i) => {
      const col = i % layout.cols;
      const row = Math.floor(i / layout.cols);
      const x = layout.marginX + col * (layout.cardW + layout.gapX);
      const y = layout.marginY + row * (layout.cardH + layout.gapY);

      doc.addImage(dataUrl, "PNG", x, y, layout.cardW, layout.cardH);

      if (layout.cutMarks) {
        drawCutMark(doc, x, y);
        drawCutMark(doc, x + layout.cardW, y);
        drawCutMark(doc, x, y + layout.cardH);
        drawCutMark(doc, x + layout.cardW, y + layout.cardH);
      }
    });
  }

  doc.save(`karticky-${format}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
