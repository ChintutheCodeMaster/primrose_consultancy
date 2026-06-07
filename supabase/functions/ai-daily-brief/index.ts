import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { stats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const sys = `You are Rose, an AI strategist embedded in Primrose IEC — a CRM for Independent Educational Consultants.
Write a warm, executive "Daily Brief" for the consultant. Tone: trusted colleague, calm, specific, never generic.
Return EXACTLY 3 bullets, each ≤ 22 words, beginning with an action verb or a fact.
No headings, no preamble. Plain text, one bullet per line, each starting with "• ".
Reference the real numbers you're given. If a number is zero, frame it as an opportunity, not a failure.`;

    const user = `Today's snapshot of the practice:
${JSON.stringify(stats, null, 2)}

Write the 3-bullet brief.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('gateway err', resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: 'Add credits' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'AI error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const brief = data.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ brief }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
