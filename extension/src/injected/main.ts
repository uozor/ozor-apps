import {
  chooseBody,
  extractContacts,
  extractTables,
  mainFromDocument,
  selectionFromDocument,
  signalsFromDocument,
} from '../lib/extract';

interface ChromeLike {
  runtime: {
    onMessage: {
      addListener: (fn: (msg: { type?: string; action?: string }, sender: unknown, sendResponse: (value: unknown) => void) => boolean | void) => void;
    };
  };
}

const chromeApi = (globalThis as { chrome?: ChromeLike }).chrome;

async function toDataUrl(img: HTMLImageElement): Promise<string | null> {
  const width = img.naturalWidth || 0;
  const height = img.naturalHeight || 0;
  if (width < 40 || height < 40) return null;
  const max = 1600;
  const scale = Math.min(1, max / width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    if (!/png|webp/i.test(img.currentSrc || img.src)) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  }
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

async function readImages() {
  const imgs = [...document.images].slice(0, 12);
  const images: { alt: string; dataUrl: string }[] = [];
  for (const img of imgs) {
    if (images.length >= 6) break;
    if (!img.complete) {
      await new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); });
    }
    const dataUrl = await toDataUrl(img);
    if (!dataUrl || dataUrl.length > 1_500_000) continue;
    images.push({ alt: img.alt || 'Image from the page', dataUrl });
  }
  return images;
}

async function readPdfs() {
  const hrefs = [...document.querySelectorAll('a[href]')]
    .map((anchor) => (anchor as HTMLAnchorElement).href)
    .filter((href) => /\.pdf($|\?)/i.test(href));
  const unique = [...new Set(hrefs)].slice(0, 3);
  const pdfs: { name: string; base64: string }[] = [];
  for (const href of unique) {
    try {
      const response = await fetch(href);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength < 32 || buffer.byteLength > 8_000_000) continue;
      const name = decodeURIComponent((href.split('/').pop() || 'document.pdf').split('?')[0] || 'document.pdf');
      pdfs.push({ name, base64: bytesToBase64(buffer) });
    } catch {
      /* cross-origin PDFs stay on the page */
    }
  }
  return pdfs;
}

function selectArea(): Promise<{ x: number; y: number; w: number; h: number; dpr: number } | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.setAttribute('data-gwb-overlay', '1');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;cursor:crosshair;background:rgba(20,18,43,.25)';
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;border:2px solid #fff;background:rgba(255,162,76,.25);display:none';
    const note = document.createElement('p');
    note.textContent = 'Drag to choose an area. Press Escape to cancel.';
    note.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#15123a;color:#fff;padding:8px 14px;border-radius:999px;font:600 14px system-ui,sans-serif;margin:0';
    overlay.append(box, note);
    document.documentElement.append(overlay);
    let startX = 0;
    let startY = 0;
    let dragging = false;
    const cleanup = (value: { x: number; y: number; w: number; h: number; dpr: number } | null) => {
      overlay.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cleanup(null);
    };
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('mousedown', (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      box.style.display = 'block';
      box.style.left = `${startX}px`;
      box.style.top = `${startY}px`;
      box.style.width = '0px';
      box.style.height = '0px';
    });
    overlay.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const x = Math.min(startX, event.clientX);
      const y = Math.min(startY, event.clientY);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${Math.abs(event.clientX - startX)}px`;
      box.style.height = `${Math.abs(event.clientY - startY)}px`;
    });
    overlay.addEventListener('mouseup', (event) => {
      if (!dragging) return;
      const x = Math.min(startX, event.clientX);
      const y = Math.min(startY, event.clientY);
      const w = Math.abs(event.clientX - startX);
      const h = Math.abs(event.clientY - startY);
      cleanup(w < 8 || h < 8 ? null : { x, y, w, h, dpr: window.devicePixelRatio || 1 });
    });
  });
}

async function read(action: string) {
  const url = location.href;
  const title = document.title || '';
  const base = { url, title };
  if (action === 'signals') return { ...base, signals: signalsFromDocument(document, url, title) };
  if (action === 'text' || action === 'markdown' || action === 'pdf' || action === 'notes' || action === 'invoice' || action === 'ai') {
    const chosen = chooseBody(selectionFromDocument(document), mainFromDocument(document));
    return { ...base, text: chosen.text, markdown: chosen.markdown };
  }
  if (action === 'tables') return { ...base, tables: extractTables(document) };
  if (action === 'contacts') {
    const hrefs = [...document.querySelectorAll('a[href]')].map((anchor) => (anchor as HTMLAnchorElement).href || '');
    return { ...base, contacts: extractContacts(document.body?.innerText || '', hrefs) };
  }
  if (action === 'images') return { ...base, images: await readImages() };
  if (action === 'pdfs') return { ...base, pdfs: await readPdfs() };
  if (action === 'area') {
    const crop = await selectArea();
    if (!crop) return { ...base, cancelled: true };
    return { ...base, crop };
  }
  return { ...base, error: 'Unknown action.' };
}

const gwb = window as Window & { __gwbRead?: (action: string) => Promise<unknown>; __gwbListening?: boolean };
gwb.__gwbRead = read;

if (chromeApi?.runtime?.onMessage && !gwb.__gwbListening) {
  gwb.__gwbListening = true;
  chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'gwb-read') return;
    Promise.resolve(read(message.action || 'signals'))
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return true;
  });
}
