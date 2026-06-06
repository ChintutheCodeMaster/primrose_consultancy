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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסי שוב בעוד רגע" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נגמרו הקרדיטים. יש להוסיף קרדיטים בהגדרות." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "שגיאה בשירות AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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