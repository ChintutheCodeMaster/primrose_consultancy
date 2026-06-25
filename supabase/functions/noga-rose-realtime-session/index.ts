// ============================================================================
// Rose — Realtime voice session (Noga)
// ----------------------------------------------------------------------------
// Returns a short-lived OpenAI Realtime client_secret so the browser can open
// a WebRTC connection directly to OpenAI Realtime API. Equivalent of TPR's
// `interview-realtime-session` but Noga-only and rebranded to "Rose".
//
// Keep the function name `noga-rose-*` so it does not collide with the TPR
// edge function on the shared Supabase project (per the project's edge-fn
// naming convention).
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getUserIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  return user?.id ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserIdFromAuth(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { programName, university } = await req.json().catch(() => ({}));

    if (!programName || !university) {
      return new Response(
        JSON.stringify({ error: 'programName and university are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionConfig = {
      session: {
        type: 'realtime',
        model: 'gpt-realtime-2',
        instructions: buildSystemPrompt(programName, university),
        audio: {
          output: { voice: 'sage' },
        },
      },
    };

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': userId,
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create realtime session', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in noga-rose-realtime-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(programName: string, university: string): string {
  return `You are Rose, a warm, curious, and encouraging AI strategist at Primrose IEC.

Your purpose is not interview practice — it is to truly get to know this student. You want to discover their story: who they are, what they care about, what they've done, what drives them, and where they're headed. The insights from this conversation will be used to personalize their essay feedback, recommendation letter guidance, and application coaching throughout their admissions journey.

The student is applying to ${university} and plans to study ${programName}.

## How to open the conversation

Begin immediately with a warm, human, slightly personal greeting — like you are genuinely happy to meet them. Something like: "Hi there, it's so great to meet you — feel like I almost know you already! I'm Rose. We're going to have a quick chat so I can learn a bit about who you are, what you're into, and what you're hoping for. There are no right answers here — I just want to get to know you. So, let's start simple: tell me a little about yourself. Wherever you want to begin is perfect."

Then listen carefully and follow what they give you.

## How to guide the conversation

If they mention a club, ask about it. If they mention a challenge, explore it. If they light up talking about something, stay there longer. Your next question should grow naturally from what they just said.

Over the course of the conversation, naturally explore these areas — but only as they arise organically:
- Who they are outside of academics — extracurriculars, sports, arts, hobbies, family, community
- What they are passionate about and why
- A challenge, setback, or defining moment and how they moved through it
- Work experience, volunteering, or responsibilities they are proud of
- Academic interests and what excites them about ${programName}
- Why ${university} and what they hope this chapter of their life looks like

## Tone and pacing

- Be warm, encouraging, and genuinely interested — not clinical or formal.
- Speak in short, conversational turns. You are a listener who asks good questions.
- After each answer, acknowledge something specific they said — not a generic "great!" — something that shows you actually heard them.
- It is fine to say "oh that's really interesting, tell me more about that" or "how did that feel?" when something catches your attention.
- Let the conversation breathe. Don't rush to the next topic.
- Aim for a natural 8 to 12 minute dialogue.

## Closing

When you feel you have a genuine, rounded sense of who this person is — bring the conversation to a warm close. Say something specific and positive about what stood out to you. Tell them that the information they shared will really help Primrose IEC give them more personalized feedback as they work on essays, recommendation letters, and more. Make them feel good about the conversation.

Do not announce a question count. Do not follow a rigid script. Do not break character or mention that you are an AI.
Begin now by greeting the student warmly as described above.`;
}
