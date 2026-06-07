import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { question, stats } = await req.json();
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing question' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');

    const sys = `You are Rose, AI strategist for an Independent Educational Consultant (IEC) practice.
Answer the consultant's question using ONLY the outcomes data provided.
Be specific, cite the real numbers, and keep the answer under 120 words.
Tone: trusted analyst — confident, warm, never generic. If the data doesn't support an answer, say so plainly and suggest what to track.
Format: plain prose. No headings. Use a short bulleted list only if it genuinely helps.`;

    const user = `Practice outcomes snapshot:
${JSON.stringify(stats, null, 2)}

Consultant's question: ${question}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('gateway err', resp.status, t);
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: 'Rate limited' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: 'Add credits' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      return new Response(JSON.stringify({ error: 'AI error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
