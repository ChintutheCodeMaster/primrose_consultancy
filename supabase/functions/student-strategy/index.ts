// supabase/functions/student-strategy/index.ts
// AI Application Strategist — runs server-side via Lovable AI Gateway.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are an expert US college admissions strategist advising an Independent Educational Consultant (IEC).
Given a student's academic profile and their current college list, produce a JSON object with:
- "verdict": one short sentence summarizing the list's balance (reach/target/likely mix).
- "buckets": object with counts {reach, target, likely, wildcard}.
- "colleges": array of {name, bucket, reason} for each college on the list. Use admit rate vs the student's profile to bucket. If admit rate unknown, say so in the reason.
- "gaps": array of short strings flagging issues (e.g. "No financial-aid safety", "Top-heavy: only 1 likely", "No test-optional options given low scores", "No rolling-admission backup", "All in one geographic region").
- "suggestions": array of 3-5 {name, bucket, rationale} for additional schools that would balance the list. Use well-known US colleges only.

Be concise. Be honest about uncertainty. Never invent admit rates — if the reference data doesn't include a college, say "limited data".`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { studentId, mode = "fast" } = await req.json();
    if (!studentId) {
      return new Response(JSON.stringify({ error: "studentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: student }, { data: profile }, { data: colleges }, { data: refs }] =
      await Promise.all([
        supabase.from("students").select("id, name, target_country, interested_field").eq("id", studentId).maybeSingle(),
        supabase.from("student_profile_extras").select("*").eq("student_id", studentId).maybeSingle(),
        supabase.from("student_colleges").select("college_name, list_bucket, application_plan").eq("student_id", studentId),
        supabase.from("college_reference").select("name, acceptance_rate, median_sat, is_test_optional, ranking_tier").limit(600),
      ]);

    if (!student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refMap: Record<string, any> = {};
    for (const r of refs || []) refMap[r.name.toLowerCase()] = r;

    const enrichedList = (colleges || []).map((c) => {
      const ref = refMap[c.college_name.toLowerCase()];
      return {
        name: c.college_name,
        current_bucket: c.list_bucket,
        application_plan: c.application_plan,
        admit_rate: ref?.acceptance_rate ?? null,
        median_sat: ref?.median_sat ?? null,
        test_optional: ref?.is_test_optional ?? null,
      };
    });

    const userPayload = {
      student: {
        name: student.name,
        target_country: student.target_country,
        intended_field: student.interested_field,
        gpa: profile?.gpa ?? null,
        sat: profile?.sat_total ?? null,
        act: profile?.act_composite ?? null,
        rigor: profile?.course_rigor ?? null,
        extracurriculars: profile?.extracurriculars ?? null,
      },
      current_list: enrichedList,
    };

    const model = mode === "deep" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content:
              "Analyze this student's college list and return ONLY a valid JSON object matching the schema described in the system prompt. No prose, no markdown fences.\n\n" +
              JSON.stringify(userPayload),
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiRes.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "AI error", detail: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let output: any;
    try {
      output = JSON.parse(cleaned);
    } catch {
      output = { verdict: "Could not parse AI response.", raw: cleaned };
    }

    await supabase.from("student_strategy_reviews").insert({
      student_id: studentId,
      mode,
      input_snapshot: userPayload,
      output_json: output,
    });

    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("student-strategy error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
