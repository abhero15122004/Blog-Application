// netlify/functions/qa.js
//
// Proxies question-answering through Groq. Given a question and the blog
// content as context, returns a focused 1–2 sentence answer.
//
// Required env var:  GROQ_API_KEY
// Optional env var:  GROQ_MODEL (default "llama-3.1-8b-instant")
//
// Response shape mirrors the previous Hugging Face response
//   { "answer": "..." }
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

const MAX_CONTEXT_CHARS = 12000;
const MAX_QUESTION_CHARS = 500;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const UPSTREAM_TIMEOUT_MS = 8500;

const SYSTEM_PROMPT =
  'You answer questions strictly using the supplied CONTEXT. If the CONTEXT ' +
  'does not contain the answer, reply "Not stated in the post." Keep answers ' +
  'to 1 to 2 sentences in plain prose. No preamble, no meta commentary, no ' +
  'lists, no quotation marks around the answer. Return ONLY the answer.';

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

  const { question, context } = body;
  if (
    !question ||
    typeof question !== 'string' ||
    !context ||
    typeof context !== 'string'
  ) {
    return jsonResponse(headers, 400, {
      error: 'question and context (strings) are required',
    });
  }

  const trimmedQuestion = question.slice(0, MAX_QUESTION_CHARS).trim();
  const trimmedContext = context.slice(0, MAX_CONTEXT_CHARS).trim();
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const payload = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          `CONTEXT:\n${trimmedContext}\n\n` +
          `QUESTION: ${trimmedQuestion}\n\nAnswer:`,
      },
    ],
    max_tokens: 180,
    temperature: 0.2,
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
    console.error('[qa] upstream fetch failed:', err);
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

  let answer = '';
  try {
    const j = JSON.parse(text);
    answer = j?.choices?.[0]?.message?.content?.trim() || '';
  } catch {
    /* fall through */
  }

  if (!answer) {
    return jsonResponse(headers, 502, {
      error: 'Empty answer from upstream',
    });
  }

  // Strip wrapping quotes the LLM sometimes adds despite instructions
  answer = answer.replace(/^["']|["']$/g, '').trim();

  // Match the historical HF QA shape so the React side stays stable
  return jsonResponse(headers, 200, { answer });
};

function jsonResponse(corsHdrs, statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHdrs, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
