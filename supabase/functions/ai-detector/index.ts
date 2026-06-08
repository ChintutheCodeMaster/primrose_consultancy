import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
    if (!text || typeof text !== 'string' || text.trim().length < 80) {
      return new Response(JSON.stringify({ error: 'Provide at least 80 characters of text.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const clipped = text.slice(0, 12000);

    const sys = `You are a writing forensics expert helping an admissions consultant evaluate whether a student's essay was likely written by AI.
Analyze the SAMPLE. Look at: perplexity/burstiness, sentence rhythm variety, lexical diversity, idiosyncratic voice, concrete personal detail, idiom and error patterns, transition style, "ChatGPT-shaped" phrasing (e.g. "In conclusion,", "delve into", "tapestry", "navigate the complexities"), and structural symmetry.
Return ONLY valid JSON, no prose:
{
  "ai_likelihood": 0-100,
  "verdict": "Likely human | Mixed | Likely AI-assisted | Likely AI-generated",
  "signals": [{"label":"...", "weight":"low|medium|high", "evidence":"short quote or pattern"}],
  "human_voice_strengths": ["..."],
  "ai_tells": ["..."],
  "recommendation": "1-2 sentences for the consultant"
}
Be calibrated, not alarmist. A polished essay can still be human.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `SAMPLE:\n"""${clipped}"""` },
        ],
        response_format: { type: 'json_object' },
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
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { error: 'parse_failed', raw }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
