/**
 * /api/assistant — Edge function that proxies chat requests to an Ollama server.
 *
 * The deployed frontend never talks to Ollama directly; it calls this
 * same-origin endpoint, which forwards to the Ollama instance named by the
 * `OLLAMA_URL` environment variable (for example a private Render service).
 *
 * Routes:
 *   GET  /api/assistant?health=1  -> 200 if OLLAMA_URL is configured & reachable
 *   POST /api/assistant           -> streams an Ollama /api/chat response back
 *
 * If `OLLAMA_URL` is not set, health checks return 503 so the client can fall
 * back to a direct local connection.
 */

export const config = { runtime: 'edge' };

const OLLAMA_URL = (globalThis as { process?: { env?: Record<string, string> } }).process?.env
  ?.OLLAMA_URL;
const DEFAULT_MODEL =
  (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.OLLAMA_MODEL ??
  'gemma3:4b';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // ── Health check ──────────────────────────────────────────
  if (req.method === 'GET') {
    if (!OLLAMA_URL) return json({ ok: false, reason: 'OLLAMA_URL not configured' }, 503);
    try {
      const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
      return json({ ok: res.ok, model: DEFAULT_MODEL }, res.ok ? 200 : 503);
    } catch (err) {
      return json({ ok: false, reason: (err as Error).message }, 503);
    }
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!OLLAMA_URL) return json({ error: 'OLLAMA_URL not configured' }, 503);

  // ── Chat proxy ────────────────────────────────────────────
  let payload: { model?: string; messages?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: payload.model || DEFAULT_MODEL,
      messages: payload.messages ?? [],
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return json({ error: `Upstream Ollama error (${upstream.status})` }, 502);
  }

  // Stream the newline-delimited JSON straight through to the client.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
  void url;
}
