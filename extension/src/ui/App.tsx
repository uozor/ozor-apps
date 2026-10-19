import { useEffect, useState } from 'preact/hooks';
import { CONFIG, formatUsd } from '../config';
import { categories, tools, type Tool } from '../lib/catalog';
import { isFavorite, toggleFavorite } from '../lib/favorites';
import { detectTips, tipTeaser, visibleTips, type Tip } from '../lib/tips';
import { lockMessage, requiredTier, tierAllows, type FeatureId, type Tier } from '../lib/paywall';
import { searchTools } from '../lib/search';
import { readFavorites, readLocal, readTier, readUsage, writeDevTier, writeFavorites, writeLocal, KEYS } from '../lib/storage';
import { currentBillingEnv, providerIdFor } from '../lib/billing';
import { aiCapabilities, ensurePlusConsent, openInvoiceFromText, openLargerView, openTool, openWebsite, readPending, runPageAction, type PageData } from './api';
import { compressDataUrl, contactsText, cropScreenshot, csvFromTables, datedName, downloadBlob, downloadText, makePdfBlob, makeQrDataUrl, makeXlsxBlob, mergePdfBlob } from './download';

type View = 'favorites' | 'all' | 'page';

const PAGE_ACTIONS: { id: string; feature: FeatureId; action: string; label: string }[] = [
  { id: 'act-md', feature: 'page-markdown', action: 'markdown', label: 'Copy as Markdown' },
  { id: 'act-text', feature: 'page-text', action: 'text', label: 'Copy as clean text' },
  { id: 'act-pdf', feature: 'page-pdf', action: 'pdf', label: 'Save as PDF' },
  { id: 'act-notes', feature: 'page-notes', action: 'notes', label: 'Save as a note' },
  { id: 'act-qr', feature: 'page-qr', action: 'qr', label: 'QR code for this page' },
  { id: 'act-table', feature: 'table-csv', action: 'tables', label: 'Extract tables to CSV' },
  { id: 'act-xlsx', feature: 'table-xlsx', action: 'tables', label: 'Extract tables to Excel' },
  { id: 'act-contacts', feature: 'contacts', action: 'contacts', label: 'Extract emails, phones, and links' },
  { id: 'act-shot', feature: 'screenshot', action: 'screenshot', label: 'Screenshot this page' },
  { id: 'act-area', feature: 'screenshot', action: 'area', label: 'Screenshot a selected area' },
  { id: 'act-images', feature: 'send-images', action: 'images', label: 'Send images to the compressor' },
  { id: 'act-pdfs', feature: 'send-pdfs', action: 'pdfs', label: 'Send PDFs to the merge tool' },
  { id: 'act-invoice', feature: 'prefill-invoice', action: 'invoice', label: 'Start an invoice from this page' },
];

const BASIC_AI: { id: string; feature: FeatureId; action: string; label: string }[] = [
  { id: 'ai-summarize', feature: 'ai-summarize', action: 'summarize', label: 'Summarize' },
  { id: 'ai-rewrite', feature: 'ai-rewrite', action: 'rewrite', label: 'Rewrite the selection' },
  { id: 'ai-translate', feature: 'ai-translate', action: 'translate', label: 'Translate' },
  { id: 'ai-line', feature: 'ai-invoice-line', action: 'invoice-line', label: 'Invoice line from selection' },
  { id: 'ai-title', feature: 'ai-title', action: 'title', label: 'Suggest a title' },
  { id: 'ai-explain', feature: 'ai-explain', action: 'explain', label: 'Explain in plain words' },
];

const PLUS_AI: { id: string; feature: FeatureId; action: string; label: string }[] = [
  { id: 'plus-chat', feature: 'ai-chat', action: 'chat', label: 'Chat with this page' },
  { id: 'plus-extract', feature: 'ai-extract-structured', action: 'extract-structured', label: 'Extract structured data to Excel' },
  { id: 'plus-email', feature: 'ai-draft-email', action: 'draft-email', label: 'Draft an email' },
  { id: 'plus-quote', feature: 'ai-draft-quote', action: 'draft-quote', label: 'Draft a quote' },
  { id: 'plus-multi', feature: 'ai-multi-summary', action: 'multi-summary', label: 'Summarize several documents' },
  { id: 'plus-form', feature: 'ai-form-fill', action: 'form-fill', label: 'Suggest form fields' },
];

function billingBrowser(): string {
  return import.meta.env.BROWSER || 'chrome';
}

function catKind(category: string): string {
  if (category.startsWith('Image')) return 'image';
  if (category.startsWith('PDF')) return 'docs';
  if (category.startsWith('Audio')) return 'media';
  if (category.startsWith('Writing')) return 'writing';
  if (category.startsWith('Security')) return 'security';
  return 'business';
}

function ToolIcon({ category }: { category: string }) {
  const kind = catKind(category);
  return (
    <span class={`ico cat-${kind}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {kind === 'docs' && <><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5M9 14h6M12 11v6" /></>}
        {kind === 'image' && <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>}
        {kind === 'media' && <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />}
        {kind === 'writing' && <><path d="M4 20h4L18 10l-4-4L4 16z" /><path d="M13 7l4 4" /></>}
        {kind === 'security' && <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z" />}
        {kind === 'business' && <><path d="M4 19V9l8-5 8 5v10" /><path d="M9 19v-6h6v6" /></>}
      </svg>
    </span>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 3.4l2.35 5.05 5.55.62-4.15 3.72 1.2 5.48L12 15.9l-4.95 2.37 1.2-5.48L4.1 9.07l5.55-.62z" />
    </svg>
  );
}

function LockBadge({ label }: { label: string }) {
  return (
    <span class="lock">
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      {label}
    </span>
  );
}

export function App({ surface }: { surface: 'popup' | 'sidepanel' | 'panel' }) {
  const devMode = providerIdFor(currentBillingEnv(billingBrowser())) === 'dev';
  const [view, setView] = useState<View>('favorites');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tier, setTier] = useState<Tier>('free');
  const [status, setStatus] = useState('Ready.');
  const [output, setOutput] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [shotSrc, setShotSrc] = useState('');
  const [thumbs, setThumbs] = useState<{ alt: string; url: string }[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [tipsDisabled, setTipsDisabled] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [language, setLanguage] = useState('es');
  const [extraDocs, setExtraDocs] = useState('');
  const [usageText, setUsageText] = useState('');
  const [caps, setCaps] = useState<string>('Checking on-device AI…');

  async function refreshUsage() {
    const usage = await readUsage();
    setUsageText(`${usage.count} of ${CONFIG.plusMonthlyRequestLimit} Pro Plus requests used this month.`);
  }

  useEffect(() => {
    document.body.className = `surface-${surface}`;
    void (async () => {
      setFavorites(await readFavorites());
      setTier(await readTier(currentBillingEnv(billingBrowser())));
      setTipsDisabled(await readLocal(KEYS.tipsDisabled, false));
      setDismissed(await readLocal<string[]>(KEYS.tipsDismissed, []));
      await refreshUsage();
      if (location.hash === '#result') {
        const pending = await readPending();
        if (pending) {
          setView('page');
          await showResult(pending.action, pending.data);
        }
      }
      if (location.hash === '#upgrade') setView('page');
    })();
  }, [surface]);

  function locked(feature: FeatureId): boolean {
    return !tierAllows(tier, feature);
  }

  async function changeTier(next: Tier) {
    await writeDevTier(next);
    setTier(next);
    setStatus(next === 'free' ? 'Test mode: Free.' : next === 'pro' ? 'Test mode: Pro is on. No charge.' : 'Test mode: Pro Plus is on. No charge.');
  }

  async function star(id: string) {
    const next = toggleFavorite(favorites, id);
    setFavorites(next);
    await writeFavorites(next);
    const tool = tools.find((item) => item.id === id);
    setStatus(next.includes(id) ? `Starred ${tool?.name || id}.` : `Removed ${tool?.name || id} from favorites.`);
  }

  async function scanTips() {
    if (tipsDisabled) {
      setTips([]);
      return;
    }
    try {
      const data = await runPageAction('signals');
      const found = data.signals ? detectTips(data.signals) : [];
      setTips(found);
      if (tier === 'free') setStatus(tipTeaser(visibleTips(found, { dismissed })) || 'No page tips for this site.');
      else setStatus(found.length ? 'Page tips are below.' : 'No extra tips for this page.');
    } catch (error) {
      setTips([]);
      setStatus(error instanceof Error ? error.message : 'Could not look at this page.');
    }
  }

  async function showResult(action: string, data: PageData) {
    if (data.error && !data.text && !data.markdown && !data.tables) {
      setStatus(data.error);
      return;
    }
    if (action === 'qr' && data.url) {
      setPageUrl(data.url);
      setQrSrc(makeQrDataUrl(data.url));
      setOutput(data.url);
      setStatus('QR code ready. It encodes only this page address.');
      return;
    }
    if (action === 'pdf' || action === 'notes') {
      const body = data.markdown || data.text || '';
      const title = data.title || 'Page';
      if (action === 'pdf') downloadBlob(makePdfBlob(title, body), datedName('page', 'pdf'));
      else downloadText(body, datedName('note', 'txt'));
      setOutput(body);
      setStatus(action === 'pdf' ? `Saved ${datedName('page', 'pdf')}.` : `Saved ${datedName('note', 'txt')}.`);
      return;
    }
    if (action === 'markdown' || action === 'text' || action === 'summarize' || action === 'rewrite' || action === 'translate' || action === 'invoice-line' || action === 'title' || action === 'explain' || action === 'chat' || action === 'draft-email' || action === 'draft-quote' || action === 'multi-summary' || action === 'form-fill') {
      const body = action === 'text' ? (data.text || '') : (data.markdown || data.text || '');
      setOutput(body);
      setStatus(data.error || 'Done. The result is in the box below.');
      await refreshUsage();
      return;
    }
    if (action === 'tables') {
      const csv = csvFromTables(data.tables || []);
      setOutput(csv);
      downloadText(csv, datedName('table', 'csv'), 'text/csv;charset=utf-8');
      setStatus((data.tables || []).length ? `Saved ${datedName('table', 'csv')}.` : 'No tables found on this page.');
      return;
    }
    if (action === 'xlsx') {
      const tables = data.tables || [];
      const rows = tables.flat();
      if (!rows.length) { setStatus('No tables found on this page.'); return; }
      downloadBlob(makeXlsxBlob(rows), datedName('table', 'xlsx'));
      setOutput(csvFromTables(tables));
      setStatus(`Saved ${datedName('table', 'xlsx')}.`);
      return;
    }
    if (action === 'extract-structured') {
      const raw = data.text || '';
      setOutput(raw);
      try {
        const parsed = JSON.parse(raw) as { rows?: string[][] };
        if (parsed.rows?.length) downloadBlob(makeXlsxBlob(parsed.rows), datedName('structured', 'xlsx'));
      } catch { /* show the text either way */ }
      setStatus('Structured result is ready.');
      await refreshUsage();
      return;
    }
    if (action === 'contacts') {
      const text = contactsText(data);
      setOutput(text);
      downloadText(text, datedName('contacts', 'txt'));
      setStatus(`Saved ${datedName('contacts', 'txt')}.`);
      return;
    }
    if ((action === 'screenshot' || action === 'area') && data.screenshot) {
      let src = data.screenshot;
      if (action === 'area' && data.crop) src = await cropScreenshot(data.screenshot, data.crop);
      setShotSrc(src);
      const blob = await (await fetch(src)).blob();
      downloadBlob(blob, datedName('screenshot', 'png'));
      setStatus(`Saved ${datedName('screenshot', 'png')}.`);
      return;
    }
    if (action === 'images') {
      const images = data.images || [];
      if (!images.length) { setStatus('No usable images found on this page.'); return; }
      const next: { alt: string; url: string }[] = [];
      for (const image of images) {
        const compressed = await compressDataUrl(image.dataUrl);
        next.push({ alt: image.alt, url: compressed.url });
        const blob = await (await fetch(compressed.url)).blob();
        downloadBlob(blob, datedName('image', 'jpg'));
      }
      setThumbs(next);
      setStatus(`Compressed ${next.length} image${next.length === 1 ? '' : 's'}. You can also open the full compressor.`);
      return;
    }
    if (action === 'pdfs') {
      const pdfs = data.pdfs || [];
      if (!pdfs.length) { setStatus('No PDF links on this page could be read. Open the full PDF tool to pick files yourself.'); return; }
      downloadBlob(await mergePdfBlob(pdfs), datedName('merged', 'pdf'));
      setStatus(`Merged ${pdfs.length} PDF${pdfs.length === 1 ? '' : 's'}.`);
      return;
    }
    if (action === 'invoice') {
      openInvoiceFromText(data.text || data.markdown || '');
      setStatus('Opened the invoice tool with text from this page.');
      return;
    }
    if (data.error) setStatus(data.error);
  }

  async function perform(feature: FeatureId, action: string) {
    if (!tierAllows(tier, feature)) {
      setStatus(lockMessage(feature));
      setView('page');
      document.getElementById('upgrade')?.focus();
      return;
    }
    if (requiredTier(feature) === 'plus') {
      const blocked = await ensurePlusConsent();
      if (blocked) {
        setStatus(blocked);
        return;
      }
    }
    setStatus('Working on this page…');
    try {
      const extraDocsList = extraDocs.trim() ? [{ name: 'Added document', text: extraDocs }] : undefined;
      const data = await runPageAction(action, { language, documents: extraDocsList });
      if (action === 'tables' && feature === 'table-xlsx') await showResult('xlsx', data);
      else await showResult(action, data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Your page was not uploaded.');
    }
  }

  function openPlans() {
    setView('page');
    window.setTimeout(() => document.getElementById('upgrade')?.scrollIntoView({ block: 'start' }), 0);
  }

  const shownTips = visibleTips(tips, { disabled: tipsDisabled, dismissed });
  const results = searchTools(query, category);
  const favoriteTools = favorites.map((id) => tools.find((tool) => tool.id === id)).filter((tool): tool is Tool => !!tool);

  return (
    <div class="shell">
      <a class="skip" href="#main">Skip to content</a>
      <header class="head">
        <div class="brand">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <linearGradient id="gwbg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffa24c" />
                <stop offset=".55" stop-color="#e8366b" />
                <stop offset="1" stop-color="#7c5cff" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="12" fill="url(#gwbg)" />
            <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" stroke-width="2.4" />
            <ellipse cx="20" cy="20" rx="4.8" ry="11" fill="none" stroke="#fff" stroke-width="2" />
            <path d="M9.5 16h21M9.5 24h21" stroke="#fff" stroke-width="1.8" />
            <circle cx="31" cy="9" r="3.2" fill="#fff" />
          </svg>
          <span>
            <b>GWB Tools</b>
            <small>Greater World Business</small>
          </span>
        </div>
        <div class="tier-row">
          <span class={`badge ${tier}`} id="tier-badge">{tier === 'plus' ? 'Pro Plus' : tier === 'pro' ? 'Pro' : 'Free'}</span>
          <button type="button" class="linkish" id="plans-link" onClick={() => openPlans()}>Plans</button>
        </div>
      </header>
      <nav class="views" aria-label="Views">
        <button type="button" id="view-favorites" aria-pressed={view === 'favorites'} onClick={() => setView('favorites')}>Favorites</button>
        <button type="button" id="view-all" aria-pressed={view === 'all'} onClick={() => setView('all')}>All tools</button>
        <button type="button" id="view-page" aria-pressed={view === 'page'} onClick={() => { setView('page'); void scanTips(); void aiCapabilities().then((list) => setCaps(list.length ? `On-device AI: ${list.map((item) => item.id).join(', ')}.` : 'On-device AI is not available in this browser. Page text still stays on this device.')); }}>This page</button>
      </nav>
      <main id="main">
        <p id="status" class="status" role="status" aria-live="polite">{status}</p>
        {view === 'favorites' && (
          <section class="card" aria-labelledby="fav-heading">
            <h1 id="fav-heading">Favorites</h1>
            <p class="muted">Star the tools you use. The list is saved in this browser{devMode ? '' : ''} and can sync with your browser account.</p>
            {favoriteTools.length === 0 ? <p>No favorites yet. Star a tool in All tools.</p> : (
              <ul class="list" id="fav-list">
                {favoriteTools.map((tool) => (
                  <ToolRow key={tool.id} tool={tool} starred onStar={star} />
                ))}
              </ul>
            )}
          </section>
        )}
        {view === 'all' && (
          <section class="card" aria-labelledby="all-heading">
            <h1 id="all-heading">All tools</h1>
            <label class="search-label" for="tool-search">Search tools</label>
            <div class="searchbox">
              <svg class="search-ico" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M16 16l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <input id="tool-search" type="search" placeholder="Search, for example invoice, PDF, tax" value={query} onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)} />
            </div>
            <div class="chips" role="group" aria-label="Filter by category">
              <button type="button" class="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All</button>
              {categories.map((cat) => (
                <button type="button" class="chip" key={cat} aria-pressed={category === cat} onClick={() => setCategory(cat)}>{cat}</button>
              ))}
            </div>
            <p class="muted" id="result-count">{results.length ? `${results.length} tool${results.length === 1 ? '' : 's'}` : 'No tools match. Try another word or category.'}</p>
            <ul class="list" id="all-list">
              {results.map((tool) => (
                <ToolRow key={tool.id} tool={tool} starred={isFavorite(favorites, tool.id)} onStar={star} />
              ))}
            </ul>
          </section>
        )}
        {view === 'page' && (
          <>
            <section class="card" aria-labelledby="tips-heading">
              <h1 id="tips-heading">This page</h1>
              <p class="muted">Page tools run when you click them. Free tools never upload your files. Pro reads only this tab, on your device.</p>
              <div id="tips">
                {tipsDisabled && <p>Page tips are off.</p>}
                {!tipsDisabled && tier === 'free' && <p id="tip-teaser">{tipTeaser(shownTips) || 'Open a web page and GWB Tools will suggest a relevant tool here.'}</p>}
                {!tipsDisabled && tier !== 'free' && shownTips.map((tip) => (
                  <article class="tip" key={tip.id}>
                    <h3>{tip.title}</h3>
                    <p>{tip.detail}</p>
                    <div class="row-actions">
                      {tip.action && <button type="button" class="tiny" id={`tip-open-${tip.id}`} onClick={() => perform(tip.feature, tip.action || 'signals')}>Use this</button>}
                      {tip.toolId && <button type="button" class="tiny alt" onClick={() => openTool(tip.toolId || '')}>Open tool</button>}
                      <button type="button" class="tiny alt" id={`tip-dismiss-${tip.id}`} onClick={() => {
                        const next = [...dismissed, tip.id];
                        setDismissed(next);
                        void writeLocal({ [KEYS.tipsDismissed]: next });
                      }}>Dismiss</button>
                    </div>
                  </article>
                ))}
                {!tipsDisabled && tier !== 'free' && !shownTips.length && <p>No tips yet. Use Check this page after you switch tabs.</p>}
              </div>
              <div class="row-actions">
                <button type="button" id="scan-page" onClick={() => void scanTips()}>Check this page</button>
                <label class="check"><input id="tips-enabled" type="checkbox" checked={!tipsDisabled} onChange={(event) => {
                  const enabled = (event.currentTarget as HTMLInputElement).checked;
                  setTipsDisabled(!enabled);
                  void writeLocal({ [KEYS.tipsDisabled]: !enabled });
                }} /> Show page tips</label>
              </div>
            </section>
            <section class="card" aria-labelledby="page-actions-heading">
              <h2 id="page-actions-heading">Page tools</h2>
              <div class="actions">
                {PAGE_ACTIONS.map((item) => (
                  <button type="button" class="action" id={item.id} key={item.id} data-locked={locked(item.feature) ? 'true' : 'false'} onClick={() => perform(item.feature, item.action)}>
                    <span>{item.label}</span>
                    {locked(item.feature) && <LockBadge label="Pro" />}
                  </button>
                ))}
              </div>
            </section>
            <section class="card ai-card" aria-labelledby="ai-heading">
              <h2 id="ai-heading">On-device AI</h2>
              <p class="muted" id="ai-caps">{caps}</p>
              <p class="muted">Included with Pro. Uses Chrome’s built-in model when this browser has it. If it does not, you get a plain message and nothing is sent to a server.</p>
              <label for="ai-lang">Translate to</label>
              <select id="ai-lang" value={language} onChange={(event) => setLanguage((event.currentTarget as HTMLSelectElement).value)}>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
              <div class="actions">
                {BASIC_AI.map((item) => (
                  <button type="button" class="action ai" id={item.id} key={item.id} data-locked={locked(item.feature) ? 'true' : 'false'} onClick={() => perform(item.feature, item.action)}>
                    <span>{item.label}</span>
                    {locked(item.feature) && <LockBadge label="Pro" />}
                  </button>
                ))}
              </div>
            </section>
            <section class="card plus-card" aria-labelledby="plus-heading">
              <h2 id="plus-heading">Pro Plus cloud AI</h2>
              <p class="muted" id="plus-usage">{usageText}</p>
              <p class="muted">A subscription. Only the text you choose is sent to the owner’s server, which calls the model. The extension does not contain an API key. Browsing history is not sent.</p>
              <label for="extra-docs">Extra documents you want included</label>
              <textarea id="extra-docs" value={extraDocs} onInput={(event) => setExtraDocs((event.currentTarget as HTMLTextAreaElement).value)} placeholder="Paste another document here if you want a multi-document summary." />
              <div class="actions">
                {PLUS_AI.map((item) => (
                  <button type="button" class="action ai plus" id={item.id} key={item.id} data-locked={locked(item.feature) ? 'true' : 'false'} onClick={() => perform(item.feature, item.action)}>
                    <span>{item.label}</span>
                    {locked(item.feature) && <LockBadge label="Plus" />}
                  </button>
                ))}
              </div>
            </section>
            <section class="card" aria-labelledby="result-heading">
              <h2 id="result-heading">Result</h2>
              <label class="vh" for="md-out">Result text</label>
              <textarea id="md-out" readOnly value={output} />
              <p id="page-url">{pageUrl}</p>
              {qrSrc && <img id="page-qr" class="preview" alt={`QR code for ${pageUrl}`} src={qrSrc} />}
              {shotSrc && <img id="page-shot" class="preview" alt="Screenshot of the page" src={shotSrc} />}
              {!!thumbs.length && (
                <div class="shot-row">
                  {thumbs.map((thumb) => <img key={thumb.url.slice(0, 40)} alt={thumb.alt} src={thumb.url} />)}
                </div>
              )}
              <div class="row-actions">
                <button type="button" id="copy-out" onClick={() => { void navigator.clipboard?.writeText(output).then(() => setStatus('Copied.')).catch(() => setStatus('Select the result and copy it with the keyboard.')); }}>Copy result</button>
                <button type="button" class="alt" onClick={() => openTool('image-compress')}>Open full compressor</button>
                <button type="button" class="alt" onClick={() => openTool('pdf-tools')}>Open full PDF tool</button>
              </div>
            </section>
            <section class="card plans" id="upgrade" tabindex={-1} aria-labelledby="upgrade-title">
              <p class="eyebrow">Upgrade</p>
              <h2 id="upgrade-title">Plans</h2>
              <p class="muted">Free keeps every business tool on this device. Pro adds page tools and on-device AI. Pro Plus adds cloud AI for the text you choose.</p>
              <ul class="plan-list">
                <li class="plan">
                  <div>
                    <h3>Free</h3>
                    <p>Every business tool, favorites, and search. No account.</p>
                  </div>
                  <p class="price">{formatUsd(0)}</p>
                </li>
                <li class="plan feat">
                  <div>
                    <h3>Pro</h3>
                    <p>One-time unlock for page tools and on-device AI.</p>
                  </div>
                  <p class="price">{formatUsd(CONFIG.prices.proLifetimeUsd)}</p>
                  <button type="button" id="buy-pro" onClick={() => { if (devMode) void changeTier('pro'); else setStatus('Connect ExtensionPay in the extension config, then rebuild.'); }}>Unlock Pro</button>
                </li>
                <li class="plan">
                  <div>
                    <h3>Pro Plus</h3>
                    <p>Cloud AI for chat, drafts, and structured Excel. Cancel any time with the provider.</p>
                  </div>
                  <p class="price">{formatUsd(CONFIG.prices.plusMonthlyUsd)}<span class="per">/month</span></p>
                  <button type="button" id="buy-plus" onClick={() => { if (devMode) void changeTier('plus'); else setStatus('Connect ExtensionPay in the extension config, then rebuild.'); }}>Subscribe to Pro Plus</button>
                </li>
              </ul>
              {devMode && (
                <fieldset>
                  <legend>Test mode</legend>
                  <p class="muted">No payment is taken. This switch is hidden after you set the ExtensionPay id and live mode.</p>
                  <label class="check"><input type="radio" name="dev-tier" id="tier-free" checked={tier === 'free'} onChange={() => void changeTier('free')} /> Free</label>
                  <label class="check"><input type="radio" name="dev-tier" id="tier-pro" checked={tier === 'pro'} onChange={() => void changeTier('pro')} /> Pro</label>
                  <label class="check"><input type="radio" name="dev-tier" id="tier-plus" checked={tier === 'plus'} onChange={() => void changeTier('plus')} /> Pro Plus</label>
                </fieldset>
              )}
            </section>
          </>
        )}
      </main>
      <footer class="foot">
        <a href="https://greaterworldmedia.tech/" onClick={(event) => { event.preventDefault(); openWebsite(); }}>Full website</a>
        {surface === 'popup' && <button type="button" class="tiny" id="open-workspace" onClick={() => void openLargerView()}>Larger view</button>}
      </footer>
    </div>
  );
}

function ToolRow({ tool, starred, onStar }: { tool: Tool; starred: boolean; onStar: (id: string) => void }) {
  return (
    <li class="row" data-tool={tool.id}>
      <button type="button" class="star" data-star={tool.id} aria-pressed={starred} aria-label={starred ? `Unstar ${tool.name}` : `Star ${tool.name}`} onClick={() => onStar(tool.id)}>
        <StarIcon />
      </button>
      <ToolIcon category={tool.category} />
      <div>
        <div class="name-line">
          <p class="tool-name">{tool.name}</p>
          <button type="button" class="icon-link" aria-label={`Website version of ${tool.name}`} onClick={() => openWebsite(tool.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 5h5v5" />
              <path d="M19 5l-9 9" />
              <path d="M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5" />
            </svg>
          </button>
        </div>
        <p>{tool.summary}</p>
      </div>
      <button type="button" class="open" data-open={tool.id} onClick={() => openTool(tool.id)}>Open</button>
    </li>
  );
}
