export interface PageSignals {
  url: string;
  title: string;
  wordCount: number;
  tableCount: number;
  imageCount: number;
  pdfLinkCount: number;
  isPdf: boolean;
  looksLikeInvoice: boolean;
  selectionLength: number;
}

export interface ContactInfo {
  emails: string[];
  phones: string[];
  links: string[];
}

export interface TextBody {
  text: string;
  markdown: string;
}

const SKIP = 'script,style,noscript,svg,nav,footer,form';

export function countWords(text: string): number {
  const matches = text.trim().match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g);
  return matches ? matches.length : 0;
}

export function cleanText(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

export function looksLikeInvoice(text: string, title = ''): boolean {
  const blob = `${title}\n${text}`.toLowerCase();
  const keys = ['invoice', 'amount due', 'bill to', 'invoice #', 'invoice number', 'balance due', 'quote no'];
  const hits = keys.filter((key) => blob.includes(key)).length;
  const money = /\$\s?\d/.test(blob);
  return hits >= 2 || (hits >= 1 && money);
}

export function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function extractContacts(text: string, hrefs: string[] = []): ContactInfo {
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
  const phones = unique(text.match(/(?:\+?\d{1,3}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g) || []);
  const links = unique(hrefs.filter((href) => /^https?:\/\//i.test(href)));
  return { emails, phones, links };
}

export function extractTables(root: ParentNode): string[][][] {
  return [...root.querySelectorAll('table')]
    .map((table) =>
      [...table.querySelectorAll('tr')]
        .map((row) =>
          [...row.querySelectorAll('th,td')].map((cell) => cleanText(cell.textContent || '').replace(/\s+/g, ' ')),
        )
        .filter((row) => row.some(Boolean)),
    )
    .filter((table) => table.length > 0);
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === 3) return (node.textContent || '').replace(/\s+/g, ' ');
  if (node.nodeType !== 1) return '';
  const el = node as Element;
  if (/^(script|style|noscript)$/i.test(el.tagName)) return '';
  const inner = [...el.childNodes].map(inlineMarkdown).join('');
  const tag = el.tagName.toLowerCase();
  if (tag === 'strong' || tag === 'b') return `**${inner.trim()}**`;
  if (tag === 'em' || tag === 'i') return `*${inner.trim()}*`;
  if (tag === 'code') return `\`${inner.trim()}\``;
  if (tag === 'br') return '\n';
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    const label = inner.trim() || href;
    return href ? `[${label}](${href})` : label;
  }
  return inner;
}

export function htmlToMarkdown(root: ParentNode): string {
  const blocks: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) blocks.push(text);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (/^(script|style|noscript|svg)$/i.test(el.tagName)) return;
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      blocks.push(`${'#'.repeat(level)} ${cleanText(el.textContent || '')}`);
      return;
    }
    if (tag === 'li') {
      blocks.push(`- ${inlineMarkdown(el).trim()}`);
      return;
    }
    if (tag === 'ul' || tag === 'ol') {
      [...el.children].forEach(walk);
      return;
    }
    if (tag === 'a') {
      const link = inlineMarkdown(el).trim();
      if (link) blocks.push(link);
      return;
    }
    if (tag === 'p' || tag === 'blockquote' || tag === 'pre') {
      const text = tag === 'pre' ? (el.textContent || '').trim() : inlineMarkdown(el).trim();
      if (text) blocks.push(tag === 'blockquote' ? text.split('\n').map((line) => `> ${line}`).join('\n') : text);
      return;
    }
    if (tag === 'table') return;
    if (el.children.length === 0) {
      const text = cleanText(el.textContent || '');
      if (text) blocks.push(text);
      return;
    }
    [...el.childNodes].forEach(walk);
  };
  [...root.childNodes].forEach(walk);
  return cleanText(blocks.join('\n\n'));
}

export function mainElement(doc: Document): Element {
  return doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('[role="main"]') || doc.body;
}

function cloneClean(el: Element): HTMLElement {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(SKIP).forEach((node) => node.remove());
  return clone;
}

export function mainFromDocument(doc: Document): TextBody {
  const clean = cloneClean(mainElement(doc));
  return { text: cleanText(clean.textContent || ''), markdown: htmlToMarkdown(clean) };
}

export function selectionFromDocument(doc: Document): TextBody {
  const view = doc.defaultView;
  const selection = doc.getSelection?.() || view?.getSelection?.();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return { text: '', markdown: '' };
  const text = cleanText(selection.toString());
  if (!text) return { text: '', markdown: '' };
  const box = doc.createElement('div');
  try {
    box.appendChild(selection.getRangeAt(0).cloneContents());
  } catch {
    return { text, markdown: text };
  }
  const markdown = htmlToMarkdown(box);
  return { text, markdown: markdown || text };
}

export function chooseBody(selection: TextBody, main: TextBody): TextBody {
  if (selection.text.trim()) return selection;
  return main;
}

export function signalsFromDocument(doc: Document, url: string, title = doc.title || ''): PageSignals {
  const main = mainFromDocument(doc);
  const selection = selectionFromDocument(doc);
  const hrefs = [...doc.querySelectorAll('a[href]')].map((anchor) => (anchor as HTMLAnchorElement).href || anchor.getAttribute('href') || '');
  const pdfLinkCount = hrefs.filter((href) => /\.pdf($|\?|#)/i.test(href)).length;
  const imageCount = [...doc.querySelectorAll('img')].filter((img) => {
    const width = Number((img as HTMLImageElement).naturalWidth || img.getAttribute('width') || 0);
    return width === 0 || width >= 40;
  }).length;
  return {
    url,
    title,
    wordCount: countWords(main.text),
    tableCount: extractTables(doc).length,
    imageCount,
    pdfLinkCount,
    isPdf: /\.pdf($|\?)/i.test(url),
    looksLikeInvoice: looksLikeInvoice(`${title}\n${main.text}`),
    selectionLength: selection.text.length,
  };
}

export interface InvoiceSeed {
  to?: string;
  notes: string;
  items: { d: string; q: number; p: number }[];
}

export function invoicePrefill(text: string): InvoiceSeed {
  const to = (text.match(/bill to:?\s*([^\n]+)/i) || [])[1]?.trim();
  const items: InvoiceSeed['items'] = [];
  for (const line of text.split('\n')) {
    const match = line.trim().match(/^(.+?)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*$/);
    const label = match?.[1];
    const price = match?.[2];
    if (!label || price == null) continue;
    if (/invoice|bill to|amount due|total|balance/i.test(label)) continue;
    items.push({ d: label.trim().slice(0, 160), q: 1, p: Number(price) });
  }
  if (!items.length) {
    const summary = cleanText(text).replace(/\s+/g, ' ').slice(0, 140);
    items.push({ d: summary || 'Services', q: 1, p: 0 });
  }
  return { to, notes: 'Prefilled from the page by GWB Tools. Check the numbers before you send it.', items };
}
