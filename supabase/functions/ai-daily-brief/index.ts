import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// ============================================================================
// Rose — Today's Brief
// ============================================================================
// System prompt for an IEC consultant CRM. Returns 3 bullets of practice-level
// strategic guidance, grounded in the snapshot of numbers we hand it.
//
// Primary: Anthropic Claude Sonnet 4.6 (ANTHROPIC_API_KEY2)
// Fallback: OpenAI gpt-4.1-mini (OPENAI_API_KEY)
//
// Both providers use raw fetch — no SDK imports, lighter cold-start.
// ============================================================================

const SYS = `You are Rose, an AI strategist embedded in Primrose IEC — a CRM for Independent Educational Consultants.
Write a warm, executive "Daily Brief" for the consultant. Tone: trusted colleague, calm, specific, never generic.
Return EXACTLY 3 bullets, each ≤ 22 words, beginning with an action verb or a fact.
No headings, no preamble. Plain text, one bullet per line, each starting with "• ".
Reference the real numbers you're given. If a number is zero, frame it as an opportunity, not a failure.`;

const buildUserPrompt = (stats: unknown): string => `Today's snapshot of the practice:
${JSON.stringify(stats, null, 2)}

Write the 3-bullet brief.`;

// ---------------------------------------------------------------------------
// Anthropic — Claude Sonnet 4.6
// ---------------------------------------------------------------------------
async function callAnthropic(stats: unknown): Promise<string> {
  const key = Deno.env.get('ANTHROPIC_API_KEY2');
  if (!key) throw new Error('ANTHROPIC_API_KEY2 missing');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYS,
      messages: [{ role: 'user', content: buildUserPrompt(stats) }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  // Response shape: { content: [{ type: 'text', text: '...' }, ...] }
  const text = (data.content ?? [])
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .trim();

  if (!text) throw new Error('Anthropic returned empty text');
  return text;
}

// ---------------------------------------------------------------------------
// OpenAI — gpt-4.1-mini fallback
// ---------------------------------------------------------------------------
async function callOpenAI(stats: unknown): Promise<string> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY missing');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      max_tokens: 512,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: buildUserPrompt(stats) },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = (data.choices?.[0]?.message?.content ?? '').trim();
  if (!text) throw new Error('OpenAI returned empty text');
  return text;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { stats } = await req.json();

    let brief = '';
    let primaryErr: unknown = null;
    let fallbackErr: unknown = null;

    // Try Anthropic first
    try {
      brief = await callAnthropic(stats);
    } catch (e) {
      primaryErr = e;
      console.warn('[ai-daily-brief] Anthropic failed, trying OpenAI:', e instanceof Error ? e.message : e);
    }

    // Fall back to OpenAI if needed
    if (!brief) {
      try {
        brief = await callOpenAI(stats);
      } catch (e) {
        fallbackErr = e;
        console.error('[ai-daily-brief] OpenAI also failed:', e instanceof Error ? e.message : e);
      }
    }

    if (!brief) {
      return new Response(
        JSON.stringify({
          error: 'Both providers failed',
          anthropic: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
          openai: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[ai-daily-brief] unexpected error', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
