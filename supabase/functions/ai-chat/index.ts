import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY2");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY2 is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch CRM data to provide as context
    const [studentsRes, leadsRes, advisorsRes] = await Promise.all([
      supabase.from("students").select("id, name, email, phone, status, degree_type, interested_country, interested_field, source, advisor_name, target_university, target_country, program, graduation_year, package_cost, is_paid, payment_type, did_not_continue").limit(1000),
      supabase.from("leads").select("id, name, email, phone, status, degree_type, interested_country, interested_field, source, advisor_name, did_not_continue, leads_year").limit(1000),
      supabase.from("advisors").select("id, name, email, phone, is_active, residence").limit(200),
    ]);

    const students = studentsRes.data || [];
    const leads = leadsRes.data || [];
    const advisors = advisorsRes.data || [];

    const systemPrompt = `You are a smart AI assistant for Primrose IEC — a CRM for Independent Educational Consultants advising students applying to colleges and universities abroad.

Here is the data in the system:

## Students (${students.length} records):
${JSON.stringify(students, null, 0)}

## Inquiries / Leads (${leads.length} records):
${JSON.stringify(leads, null, 0)}

## Consultants (${advisors.length} records):
${JSON.stringify(advisors, null, 0)}

Important guidelines:
- ALWAYS respond in English. Never use Hebrew, even if the underlying data contains Hebrew names or notes.
- Be concise, clear, and professional. Lead with the answer, then supporting detail.
- When asked to find people, present details cleanly (name, phone, email, country, field of interest, status, etc.).
- You can answer statistical questions (how many students, how much paid, breakdowns by country, etc.).
- If there are no results, say so plainly.
- Use markdown tables, bullet lists, and bold sparingly where they aid clarity.
- Use US conventions: USD ($) for currency, MM/DD/YYYY for dates.
- Refer to the entities by their English names: Students, Inquiries (leads), Consultants (advisors), Alumni (past clients), Closed/Lost (did not continue).

## Record links — important!
Whenever you mention a student, inquiry, or consultant by name, turn the name into a clickable markdown link:
- Active student (did_not_continue=false, no graduation_year): [Student Name](/students?highlight=ID)
- Alumni / graduated student (has graduation_year): [Student Name](/past-clients/GRADUATION_YEAR?highlight=ID)
- Closed/lost student (did_not_continue=true): [Student Name](/did-not-continue?highlight=ID)
- Active inquiry (did_not_continue=false): [Inquiry Name](/leads/LEADS_YEAR?highlight=ID)
- Closed/lost inquiry (did_not_continue=true): [Inquiry Name](/did-not-continue/LEADS_YEAR?highlight=ID)
- Active consultant: [Consultant Name](/advisors?highlight=ID)
- Inactive consultant: [Consultant Name](/past-advisors?highlight=ID)

Use the real record ID (uuid) for each link. Always link names when they appear in your answer.`;

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!anthropicResp.ok) {
      if (anthropicResp.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await anthropicResp.text();
      console.error("Anthropic error:", anthropicResp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: anthropicResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!anthropicResp.body) {
      return new Response(JSON.stringify({ error: "No response body from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translate Anthropic SSE → OpenAI-shaped SSE so the existing frontend parser
    // (which reads choices[0].delta.content + [DONE]) continues to work.
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = anthropicResp.body.getReader();

    const translated = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const emitDelta = (text: string) => {
          const chunk = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let nlIdx: number;
            while ((nlIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, nlIdx);
              buffer = buffer.slice(nlIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;

              const payload = line.slice(6).trim();
              if (!payload) continue;
              try {
                const evt = JSON.parse(payload);
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "text_delta" &&
                  typeof evt.delta.text === "string"
                ) {
                  emitDelta(evt.delta.text);
                } else if (evt.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
          controller.close();
        } catch (e) {
          console.error("stream translation error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(translated, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
