// netlify/functions/summarize.js
//
// Proxies blog summarisation through Groq. Groq runs Llama-3.1 / Llama-3.3
// on LPUs — sub-second responses, zero cold starts, generous free tier
// (14,400 req/day on the default 8B model).
//
// Required env var:  GROQ_API_KEY
// Optional env var:  GROQ_MODEL (default "llama-3.1-8b-instant")
//
// Response is shaped like the previous Hugging Face response
//   [{ "summary_text": "..." }]
// so BlogDetail.jsx doesn't need to change.

// Comma-separated list of allowed origins (set in .env / Netlify env vars).
// Falls back to a safe localhost-only list if the env var isn't set.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:5174,http://localhost:8888'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsHeaders = (origin) => {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
};

const MAX_INPUT_CHARS = 12000;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const UPSTREAM_TIMEOUT_MS = 8500;

const SYSTEM_PROMPT =
  'You are a concise technical summariser. Given a blog post, return a clear ' +
  '2 to 4 sentence summary that captures the core idea, who it is for, and the ' +
  'main takeaway. Plain prose, no bullet points, no preamble like "This blog ' +
  'post explains…". Return ONLY the summary text, nothing else.';

export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const headers = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(headers, 405, { error: 'Method not allowed' });
  }
  if (!process.env.GROQ_API_KEY) {
    return jsonResponse(headers, 500, {
      error: 'Server is missing GROQ_API_KEY env var',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(headers, 400, { error: 'Invalid JSON body' });
  }

  const { inputs } = body;
  if (!inputs || typeof inputs !== 'string') {
    return jsonResponse(headers, 400, {
      error: 'inputs (string) is required',
    });
  }

  const trimmed = inputs.slice(0, MAX_INPUT_CHARS);
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Summarise this blog post:\n\n${trimmed}` },
    ],
    max_tokens: 300,
    temperature: 0.3,
  };

  const controller = new AbortController();
  const abortTimer = setTimeout(
    () => controller.abort(),
    UPSTREAM_TIMEOUT_MS
  );

  let resp;
  try {
    resp = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(abortTimer);
    // Surface to the dev terminal so it's easy to see what really happened
    console.error('[summarize] upstream fetch failed:', err);
    if (err?.name === 'AbortError') {
      return jsonResponse(headers, 504, {
        error: 'Upstream timeout',
        detail: 'Groq did not respond within the function timeout.',
      });
    }
    const cause = err?.cause?.code || err?.code;
    return jsonResponse(headers, 502, {
      error: 'Upstream network error',
      detail: `${err?.message || err}${cause ? ` (${cause})` : ''}`,
    });
  }
  clearTimeout(abortTimer);

  const text = await resp.text();

  if (!resp.ok) {
    // Surface rate-limit explicitly so the client can show a friendly message
    let detail = '';
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.error || '';
    } catch {
      /* ignore */
    }
    return jsonResponse(headers, resp.status, {
      error: resp.status === 429 ? 'rate_limited' : 'upstream_error',
      detail: detail || text,
    });
  }

  let summary = '';
  try {
    const j = JSON.parse(text);
    summary = j?.choices?.[0]?.message?.content?.trim() || '';
  } catch {
    /* fall through */
  }

  if (!summary) {
    return jsonResponse(headers, 502, {
      error: 'Empty summary from upstream',
    });
  }

  // Match the historical HF shape so the React side stays stable
  return jsonResponse(headers, 200, [{ summary_text: summary }]);
};

function jsonResponse(corsHdrs, statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHdrs, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
