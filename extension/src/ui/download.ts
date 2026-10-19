import { fileName, latin1, tablesToCsv } from '../lib/files';
import type { PageData } from './api';

export function downloadBlob(blob: Blob, filename: string): void {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string, type = 'text/plain;charset=utf-8'): void {
  downloadBlob(new Blob([text], { type }), filename);
}

export function makeQrDataUrl(text: string): string {
  const factory = window.qrcode;
  if (!factory) throw new Error('The QR library did not load.');
  const qr = factory(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createDataURL(6, 8);
}

export function makePdfBlob(title: string, body: string): Blob {
  const JsPDF = window.jspdf?.jsPDF;
  if (!JsPDF) throw new Error('The PDF library did not load.');
  const doc = new JsPDF({ unit: 'pt', format: 'letter', compress: false });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 48;
  doc.setProperties({ title: latin1(title), author: 'GWB: Greater World Business', creator: 'GWB Tools' });
  doc.setFillColor(51, 36, 173);
  doc.rect(0, 0, width, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GWB Tools', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Stays on this device', width - margin, 34, { align: 'right' });
  doc.setTextColor(20, 18, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const heading = doc.splitTextToSize(latin1(title || 'Page'), width - margin * 2);
  doc.text(heading, margin, 92);
  let y = 92 + heading.length * 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const lines = latin1(body).split('\n');
  for (const line of lines) {
    const parts = line.trim() ? doc.splitTextToSize(line, width - margin * 2) : [''];
    for (const part of parts) {
      if (y > height - 56) {
        doc.addPage();
        y = margin;
      }
      doc.text(part, margin, y);
      y += 15;
    }
  }
  return doc.output('blob');
}

export function makeXlsxBlob(rows: string[][]): Blob {
  const XLSX = window.XLSX;
  if (!XLSX) throw new Error('The spreadsheet library did not load.');
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Table');
  const out = XLSX.write(book, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function mergePdfBlob(pdfs: { name: string; base64: string }[]): Promise<Blob> {
  const PDFDocument = window.PDFLib?.PDFDocument;
  if (!PDFDocument) throw new Error('The PDF engine did not load.');
  const merged = await PDFDocument.create();
  for (const file of pdfs) {
    const src = await PDFDocument.load(base64ToBytes(file.base64));
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  const saved = await merged.save();
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);
  return new Blob([copy], { type: 'application/pdf' });
}

export async function cropScreenshot(dataUrl: string, crop: { x: number; y: number; w: number; h: number; dpr: number }): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ratio = image.width / window.innerWidth || crop.dpr || 1;
  canvas.width = Math.max(1, Math.round(crop.w * ratio));
  canvas.height = Math.max(1, Math.round(crop.h * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not crop the screenshot.');
  ctx.drawImage(image, crop.x * ratio, crop.y * ratio, crop.w * ratio, crop.h * ratio, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the screenshot.'));
    image.src = src;
  });
}

export function compressDataUrl(dataUrl: string, maxWidth = 1600, quality = 0.75): Promise<{ url: string; before: number; after: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Could not compress this image.')); return; }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg', quality);
      resolve({ url, before: dataUrl.length, after: url.length });
    };
    image.onerror = () => reject(new Error('Could not read an image from the page.'));
    image.src = dataUrl;
  });
}

export function csvFromTables(tables: string[][][]): string {
  return tablesToCsv(tables);
}

export function datedName(kind: string, ext: string): string {
  return fileName(kind, ext);
}

export function contactsText(data: PageData): string {
  const contacts = data.contacts || { emails: [], phones: [], links: [] };
  const lines = [
    data.title || 'Page',
    data.url || '',
    '',
    'Emails',
    ...(contacts.emails.length ? contacts.emails.map((item) => `- ${item}`) : ['- none found']),
    '',
    'Phones',
    ...(contacts.phones.length ? contacts.phones.map((item) => `- ${item}`) : ['- none found']),
    '',
    'Links',
    ...(contacts.links.length ? contacts.links.map((item) => `- ${item}`) : ['- none found']),
  ];
  return lines.join('\n');
}
