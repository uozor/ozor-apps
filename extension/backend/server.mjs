/**
 * Stub for the owner-run Pro Plus proxy.
 *
 * Do not put this on the public internet until you have reviewed it.
 * The model API key belongs in the environment on the server only.
 * The extension build must never contain that key.
 *
 *   GWB_AI_API_KEY    secret for the model provider (never printed)
 *   GWB_AI_BASE_URL   OpenAI-compatible chat-completions URL
 *   GWB_AI_MODEL      model name (default: gpt-4o-mini)
 *   PORT              listen port (default: 8788)
 *   GWB_MONTHLY_LIMIT successful requests per install per UTC month (default: 200)
 *
 * POST /v1/ai
 *   headers:
 *     content-type: application/json
 *     x-gwb-install: anonymous install id from the extension
 *   body:
 *     { "task": "chat", "content": "text the user chose", "documents": [], "hint": "", "client": "gwb-tools" }
 *   response:
 *     { "text": "model reply", "remaining": 199 }
 *
 * `content` and `documents` are the only page text this server accepts.
 * It does not accept a URL list, a history, or tabs. It does not log that text.
 */
import http from 'node:http';

const PORT = Number(process.env.PORT || 8788);
const LIMIT = Number(process.env.GWB_MONTHLY_LIMIT || 200);
const API_KEY = process.env.GWB_AI_API_KEY || '';
const BASE_URL = process.env.GWB_AI_BASE_URL || '';
const MODEL = process.env.GWB_AI_MODEL || 'gpt-4o-mini';

const usage = new Map();

function period(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function meter(installId) {
  const key = `${installId}:${period()}`;
  const count = usage.get(key) || 0;
  return { key, count, remaining: Math.max(0, LIMIT - count) };
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-gwb-install, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
  });
  res.end(body);
}

function taskInstruction(task) {
  switch (task) {
    case 'extract-structured':
      return 'Return JSON only, shaped as {"rows":[["Field","Value"], ...]}. Use only the supplied text.';
    case 'draft-email':
      return 'Draft a short professional email from the supplied text. Do not invent facts.';
    case 'draft-quote':
      return 'Draft a short price quote from the supplied text. Leave unknown prices as "to be confirmed".';
    case 'multi-summary':
      return 'Summarize every supplied document in a few bullets. Keep the documents separate.';
    case 'form-fill':
      return 'Suggest form-field values found in the supplied text, one "Label: value" line each. Skip anything not in the text.';
    default:
      return 'Answer using only the supplied text. If it does not say, say so.';
  }
}

async function complete(task, content, documents, hint) {
  const extras = (documents || []).map((doc) => `Document ${doc.name || 'Untitled'}:\n${doc.text || ''}`).join('\n\n');
  const user = [content, extras, hint ? `Hint: ${hint}` : ''].filter(Boolean).join('\n\n');
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: taskInstruction(task) },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!response.ok) {
    const err = new Error(`upstream ${response.status}`);
    err.status = 502;
    throw err;
  }
  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    const err = new Error('empty upstream reply');
    err.status = 502;
    throw err;
  }
  return text.trim();
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }
  if (req.method !== 'POST' || (req.url || '').split('?')[0] !== '/v1/ai') {
    send(res, 404, { error: 'Not found. POST /v1/ai.' });
    return;
  }
  const installId = String(req.headers['x-gwb-install'] || '').slice(0, 80);
  if (!installId) {
    send(res, 400, { error: 'Missing x-gwb-install header.' });
    return;
  }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    send(res, 400, { error: 'Body must be JSON.' });
    return;
  }
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const documents = Array.isArray(body.documents) ? body.documents : [];
  if (!content && documents.length === 0) {
    send(res, 400, { error: 'Send the text the user chose. An empty body is refused.' });
    return;
  }
  const slot = meter(installId);
  if (slot.count >= LIMIT) {
    send(res, 429, { error: `Monthly limit of ${LIMIT} reached.`, remaining: 0 });
    return;
  }
  const task = typeof body.task === 'string' ? body.task : 'chat';
  try {
    let text;
    if (!API_KEY || !BASE_URL) {
      text = `Stub reply for ${task}. Set GWB_AI_API_KEY and GWB_AI_BASE_URL on the server to call a real model.`;
    } else {
      text = await complete(task, content, documents, typeof body.hint === 'string' ? body.hint : '');
    }
    usage.set(slot.key, slot.count + 1);
    const remaining = Math.max(0, LIMIT - (slot.count + 1));
    console.log(`ai task=${task} status=200 remaining=${remaining}`);
    send(res, 200, { text, remaining });
  } catch (error) {
    const status = error && error.status ? error.status : 500;
    console.log(`ai task=${task} status=${status}`);
    send(res, status, { error: 'The model call failed. The text was not stored.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GWB Pro Plus stub listening on http://127.0.0.1:${PORT}/v1/ai`);
  console.log(API_KEY ? 'Model key: present (not printed).' : 'Model key: missing, replies are stubs.');
});
