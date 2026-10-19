export const BUILTIN_UNAVAILABLE =
  'On-device AI is not available in this browser yet. Chrome on desktop can run these with Gemini Nano (the built-in Summarizer, Prompt, Writer, Rewriter, Translator, and Language Detector). Nothing is uploaded either way.';

export type BuiltinTask = 'summarize' | 'rewrite' | 'translate' | 'invoice-line' | 'title' | 'explain';

export type CapabilityStatus = 'readily' | 'after-download' | 'available' | 'downloadable' | 'downloading' | 'unknown';

export interface Capability {
  id: 'summarizer' | 'prompt' | 'writer' | 'rewriter' | 'translator' | 'detector';
  status: string;
}

type Session = Record<string, (...args: never[]) => Promise<string> | string> & { ready?: Promise<unknown> };

interface AiCtor {
  availability?: () => Promise<string> | string;
  create?: (opts?: Record<string, unknown>) => Promise<Session> | Session;
}

export interface BuiltinEnv {
  Summarizer?: AiCtor;
  LanguageModel?: AiCtor;
  Writer?: AiCtor;
  Rewriter?: AiCtor;
  Translator?: AiCtor;
  LanguageDetector?: AiCtor;
  ai?: {
    summarizer?: AiCtor;
    languageModel?: AiCtor;
    writer?: AiCtor;
    rewriter?: AiCtor;
    translator?: AiCtor;
    languageDetector?: AiCtor;
  };
}

const UNUSABLE = new Set(['no', 'unavailable', 'unsupported']);

function ctor(env: BuiltinEnv, key: keyof BuiltinEnv, legacy?: string): AiCtor | undefined {
  const direct = env[key];
  if (direct && typeof direct === 'object' && 'create' in (direct as AiCtor)) return direct as AiCtor;
  const bag = env.ai as Record<string, AiCtor | undefined> | undefined;
  if (legacy && bag?.[legacy]) return bag[legacy];
  return undefined;
}

export function apis(env: BuiltinEnv) {
  return {
    summarizer: ctor(env, 'Summarizer', 'summarizer'),
    prompt: ctor(env, 'LanguageModel', 'languageModel'),
    writer: ctor(env, 'Writer', 'writer'),
    rewriter: ctor(env, 'Rewriter', 'rewriter'),
    translator: ctor(env, 'Translator', 'translator'),
    detector: ctor(env, 'LanguageDetector', 'languageDetector'),
  };
}

async function statusOf(api: AiCtor | undefined): Promise<string | null> {
  if (!api?.create) return null;
  try {
    const value = api.availability ? await api.availability() : 'available';
    if (UNUSABLE.has(String(value))) return null;
    return String(value);
  } catch {
    return 'unknown';
  }
}

export async function detectBuiltin(env: BuiltinEnv): Promise<Capability[]> {
  const found = apis(env);
  const caps: Capability[] = [];
  for (const id of ['summarizer', 'prompt', 'writer', 'rewriter', 'translator', 'detector'] as const) {
    const status = await statusOf(found[id]);
    if (status) caps.push({ id, status });
  }
  return caps;
}

async function open(api: AiCtor | undefined, opts?: Record<string, unknown>): Promise<Session | null> {
  if (!api?.create) return null;
  if ((await statusOf(api)) == null) return null;
  try {
    const session = await api.create(opts);
    if (session.ready) await session.ready;
    return session;
  } catch {
    return null;
  }
}

function clip(text: string, max = 12000): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n\n[truncated]`;
}

async function prompt(env: BuiltinEnv, instruction: string): Promise<{ text: string; engine: 'prompt' } | null> {
  const session = await open(apis(env).prompt, { temperature: 0.2 });
  if (!session?.prompt) return null;
  const text = String(await session.prompt(instruction as never));
  if (!text.trim()) return null;
  return { text: text.trim(), engine: 'prompt' };
}

export async function runBuiltin(
  env: BuiltinEnv,
  task: BuiltinTask,
  text: string,
  extra?: { language?: string },
): Promise<{ ok: true; text: string; engine: string } | { ok: false; reason: string }> {
  const source = clip(text);
  if (!source) return { ok: false, reason: 'There is no text to work with yet. Select some text or open a page with a main article.' };
  const found = apis(env);

  if (task === 'summarize') {
    const session = await open(found.summarizer, { type: 'key-points', format: 'plain-text', length: 'medium' });
    if (session?.summarize) {
      try {
        const textOut = String(await session.summarize(source as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'summarizer' };
      } catch { /* try the prompt API */ }
    }
    const via = await prompt(env, `Summarize this for a small-business owner in a few short bullets:\n\n${source}`);
    if (via) return { ok: true, ...via };
  }

  if (task === 'rewrite') {
    const session = await open(found.rewriter, { tone: 'more-formal', length: 'as-is', format: 'plain-text' });
    if (session?.rewrite) {
      try {
        const textOut = String(await session.rewrite(source as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'rewriter' };
      } catch { /* fall through */ }
    }
    const via = await prompt(env, `Rewrite this so it is clear and professional. Keep the meaning. Do not add facts.\n\n${source}`);
    if (via) return { ok: true, ...via };
  }

  if (task === 'translate') {
    const language = extra?.language || 'es';
    const session = await open(found.translator, { sourceLanguage: 'en', targetLanguage: language });
    if (session?.translate) {
      try {
        const textOut = String(await session.translate(source as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'translator' };
      } catch { /* fall through */ }
    }
    const via = await prompt(env, `Translate this into the language with code "${language}". Return only the translation.\n\n${source}`);
    if (via) return { ok: true, ...via };
  }

  if (task === 'invoice-line') {
    const session = await open(found.writer, { tone: 'neutral', length: 'short', format: 'plain-text' });
    if (session?.write) {
      try {
        const textOut = String(await session.write(`Write one invoice line-item description, under 12 words, for: ${source}` as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'writer' };
      } catch { /* fall through */ }
    }
    const via = await prompt(env, `Write one invoice line-item description, under 12 words, for:\n${source}`);
    if (via) return { ok: true, ...via };
  }

  if (task === 'title') {
    const via = await prompt(env, `Suggest a short file name (no extension) and a one-line title for this text. Reply as "filename: ...\\ntitle: ..."\n\n${source}`);
    if (via) return { ok: true, ...via };
    const session = await open(found.writer, { tone: 'neutral', length: 'short' });
    if (session?.write) {
      try {
        const textOut = String(await session.write(`Suggest a short title for: ${source.slice(0, 500)}` as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'writer' };
      } catch { /* fall through */ }
    }
  }

  if (task === 'explain') {
    const via = await prompt(env, `Explain this in plain words for a busy small-business owner. Use short sentences.\n\n${source}`);
    if (via) return { ok: true, ...via };
    const session = await open(found.summarizer, { type: 'tl;dr', format: 'plain-text', length: 'short' });
    if (session?.summarize) {
      try {
        const textOut = String(await session.summarize(source as never)).trim();
        if (textOut) return { ok: true, text: textOut, engine: 'summarizer' };
      } catch { /* fall through */ }
    }
  }

  return { ok: false, reason: BUILTIN_UNAVAILABLE };
}
