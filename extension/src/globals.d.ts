export {};

declare global {
  interface Window {
    jspdf?: { jsPDF: new (opts: { unit: string; format: string; compress?: boolean }) => JsPdfDoc };
    XLSX?: XlsxApi;
    PDFLib?: { PDFDocument: PdfDocumentApi };
    qrcode?: (typeNumber: number, errorCorrection: string) => QrMaker;
    __gwbRead?: (action: string) => Promise<unknown>;
    __gwbListening?: boolean;
  }
}

interface JsPdfDoc {
  setFont: (font: string, style: string) => void;
  setFontSize: (n: number) => void;
  setTextColor: (...args: number[]) => void;
  setFillColor: (...args: number[]) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  text: (text: string | string[], x: number, y: number, opts?: { align?: string }) => void;
  splitTextToSize: (text: string, width: number) => string[];
  addPage: () => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setProperties: (p: { title: string; author: string; creator: string }) => void;
  output: (type: 'blob') => Blob;
  getNumberOfPages: () => number;
  setPage: (n: number) => void;
}

interface XlsxApi {
  utils: {
    aoa_to_sheet: (rows: unknown[][]) => unknown;
    book_new: () => { SheetNames: string[]; Sheets: Record<string, unknown> };
    book_append_sheet: (wb: unknown, ws: unknown, name: string) => void;
  };
  write: (wb: unknown, opts: { bookType: string; type: string }) => ArrayBuffer;
}

interface PdfDocumentApi {
  create: () => Promise<PdfDoc>;
  load: (bytes: Uint8Array) => Promise<PdfDoc>;
}

interface PdfDoc {
  getPageIndices: () => number[];
  copyPages: (src: PdfDoc, indices: number[]) => Promise<unknown[]>;
  addPage: (page: unknown) => void;
  save: () => Promise<Uint8Array>;
}

interface QrMaker {
  addData: (text: string) => void;
  make: () => void;
  createDataURL: (cell: number, margin: number) => string;
}
