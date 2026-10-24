import { isPlaceholderBackend } from '../../config';
import { canCharge, charge, normalizeUsage, type Usage } from '../meter';

export type PlusTask = 'chat' | 'extract-structured' | 'draft-email' | 'draft-quote' | 'multi-summary' | 'form-fill';

export interface ProxyDocument {
  name: string;
  text: string;
}

export interface ProxyRequest {
  task: PlusTask;
  /** Only the text the user asked to process. Never browsing history. */
  content: string;
  documents?: ProxyDocument[];
  hint?: string;
  client: 'gwb-tools';
}

export function buildProxyRequest(task: PlusTask, content: string, documents?: ProxyDocument[], hint?: string): ProxyRequest {
  return {
    task,
    content: content.trim(),
    documents: (documents || []).map((doc) => ({ name: doc.name, text: doc.text })),
    hint,
    client: 'gwb-tools',
  };
}

export function mockProxyText(task: PlusTask, content: string): string {
  const snippet = content.trim().replace(/\s+/g, ' ').slice(0, 80);
  switch (task) {
    case 'chat':
      return `Mock chat reply: ${snippet || 'the page'}`;
    case 'extract-structured':
      return JSON.stringify({ rows: [['Field', 'Value'], ['Sample', snippet || 'page']] });
    case 'draft-email':
      return `Subject: Following up\n\nHello,\n\nMock email draft based on: ${snippet}`;
    case 'draft-quote':
      return `Quote draft\n\n${snippet}\n\nTotal: to be confirmed.`;
    case 'multi-summary':
      return `Mock multi-document summary: ${snippet}`;
    case 'form-fill':
      return 'Name: Example Owner\nEmail: owner@example.com\nPhone: (555) 010-2000';
    default:
      return `Mock reply for ${task}`;
  }
}

export interface ProxyCall {
  url: string;
  task: PlusTask;
  content: string;
  documents?: ProxyDocument[];
  hint?: string;
  usage: Usage | null;
  limit: number;
  now: Date;
  installId: string;
  userToken?: string;
  allowMock: boolean;
  fetchImpl?: typeof fetch;
}

export type ProxyResult =
  | { ok: true; text: string; mock: boolean; usage: Usage; remaining: number | null }
  | { ok: false; error: string; usage: Usage };

function headerBag(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => { out[key.toLowerCase()] = value; });
    return out;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key.toLowerCase()] = value;
    return out;
  }
  for (const [key, value] of Object.entries(headers)) out[key.toLowerCase()] = String(value);
  return out;
}

export function assertNoApiKey(headers: HeadersInit | undefined, body: string): void {
  const bag = headerBag(headers);
  for (const key of Object.keys(bag)) {
    const value = bag[key] || '';
    if (/api[-_]?key|x-api-key|authorization/.test(key) && /sk-|api_key/i.test(value)) {
      throw new Error('Refusing to send a model API key from the extension.');
    }
    if (/api[-_]?key|x-api-key/.test(key)) throw new Error('Refusing to send a model API key from the extension.');
  }
  if (/"apiKey"\s*:|sk-[a-z0-9]/i.test(body)) throw new Error('Refusing to send a model API key from the extension.');
}

export async function callAiProxy(opts: ProxyCall): Promise<ProxyResult> {
  const gate = canCharge(opts.usage, opts.limit, opts.now);
  const normalized = normalizeUsage(opts.usage, opts.now);
  if (!gate.allowed) {
    return { ok: false, error: `This install has used ${gate.used} of ${gate.limit} Pro Plus requests this month.`, usage: normalized };
  }
  const request = buildProxyRequest(opts.task, opts.content, opts.documents, opts.hint);
  if (!request.content && !(request.documents && request.documents.length)) {
    return { ok: false, error: 'Choose some text or add a document first. Nothing was sent.', usage: normalized };
  }
  if (isPlaceholderBackend(opts.url)) {
    if (!opts.allowMock) {
      return { ok: false, error: 'Pro Plus needs the owner’s server. The proxy URL in the extension config is still a placeholder.', usage: normalized };
    }
    const next = charge(normalized, opts.now);
    return { ok: true, text: mockProxyText(opts.task, request.content), mock: true, usage: next, remaining: Math.max(0, opts.limit - next.count) };
  }
  const fetchImpl = opts.fetchImpl || fetch;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-gwb-install': opts.installId,
  };
  if (opts.userToken) headers.authorization = `Bearer ${opts.userToken}`;
  const body = JSON.stringify(request);
  assertNoApiKey(headers, body);
  let response: Response;
  try {
    response = await fetchImpl(opts.url, { method: 'POST', headers, body });
  } catch {
    return { ok: false, error: 'Could not reach the Pro Plus server. Check the address and your connection. Your text was not saved by GWB.', usage: normalized };
  }
  if (!response.ok) {
    return { ok: false, error: `The Pro Plus server returned ${response.status}. Nothing else was sent.`, usage: normalized };
  }
  const payload = await response.json().catch(() => null) as { text?: string; remaining?: number } | null;
  if (!payload || typeof payload.text !== 'string') {
    return { ok: false, error: 'The Pro Plus server replied in an unexpected shape.', usage: normalized };
  }
  const next = charge(normalized, opts.now);
  return { ok: true, text: payload.text, mock: false, usage: next, remaining: typeof payload.remaining === 'number' ? payload.remaining : Math.max(0, opts.limit - next.count) };
}
