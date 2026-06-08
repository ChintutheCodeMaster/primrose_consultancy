import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { city, country, university, lifestyle, months = 9 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
    if (!city || !lifestyle) {
      return new Response(JSON.stringify({ error: 'city and lifestyle required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sys = `You are a study-abroad cost analyst for an admissions consulting firm.
Given a city (and optional university + country) and a lifestyle tier, estimate the monthly LIVING cost a student should budget for in USD.
Lifestyle tiers:
- "frugal" = shared room, public transport, cooking at home, almost no eating out
- "moderate" = own room in shared apartment, occasional eating out, gym, weekend activities
- "comfortable" = studio or 1BR, regular eating out, gym, travel, hobbies
Return ONLY valid JSON, no prose, with this exact shape:
{
  "currency": "USD",
  "monthly_total": number,
  "categories": [
    {"label":"Housing","amount":number,"note":"..."},
    {"label":"Food & groceries","amount":number,"note":"..."},
    {"label":"Transport","amount":number,"note":"..."},
    {"label":"Utilities & internet","amount":number,"note":"..."},
    {"label":"Health insurance","amount":number,"note":"..."},
    {"label":"Personal & misc","amount":number,"note":"..."}
  ],
  "assumptions": "1-2 sentences",
  "confidence": "low|medium|high"
}
Be realistic for the city. Do NOT include tuition. Round figures to the nearest 25 USD.`;

    const user = `City: ${city}
Country: ${country || 'unspecified'}
University: ${university || 'unspecified'}
Lifestyle: ${lifestyle}
Months to budget: ${months}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
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
    if (parsed.monthly_total) parsed.annual_total = Math.round(parsed.monthly_total * months);
    parsed.months = months;
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
