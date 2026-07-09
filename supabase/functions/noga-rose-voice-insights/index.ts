// ============================================================================
// Rose — Voice conversation insight extractor (Noga)
// ----------------------------------------------------------------------------
// Equivalent of TPR's `extract-voice-insights` but Noga-only, branded for Rose,
// and writes to noga.voice_insights with user_id (not student_id).
//
// Uses Anthropic Claude directly (matches the pattern in ai-daily-brief).
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversationTurn {
  role: "rose" | "student";
  text: string;
}

interface Insight {
  category: string;
  title: string;
  content: string;
}

const SYSTEM_PROMPT = `You are an expert college admissions analyst. Your job is to extract meaningful personal insights about a student from a conversation they had with Rose, an AI admissions strategist at Primrose IEC.

IMPORTANT CONTEXT: You will only receive Rose's side of the conversation. Rose is an active listener who explicitly acknowledges, reflects back, and builds on what the student says before asking her next question. For example, if Rose says "That's incredible that you captained the debate team for two years and made it to nationals — how did that experience shape you?", you can confidently infer the student shared those specific facts. Extract insights from what Rose's responses reveal about the student — not from Rose herself.

You will receive Rose's transcript and must return a structured JSON object.

INSIGHT CATEGORIES to consider:
- Academic Interests
- Leadership & Initiative
- Personal Growth
- Values & Motivations
- Admissions Storytelling Potential
- Career Goals
- Intellectual Curiosity
- Community Impact
- Resilience & Challenges
- Family & Background

QUALITY ASSESSMENT RULES — base this on the richness of what Rose's responses reveal about the student:
- "strong": Rose's responses reflect substantial, personal details the student shared across multiple areas (6+ exchanges with specific acknowledgments)
- "average": Rose's responses reflect genuine personal details across a few areas (3–5 meaningful exchanges)
- "short": Rose's responses are too generic or brief to infer meaningful student details

INSIGHT RULES:
- strong quality → up to 5 insights
- average quality → 2 to 4 insights
- short quality → return an empty array (no insights)
- Only write insights clearly supported by what Rose reflects back — if Rose says "so you've been playing piano since age 6", that's confirmed student content
- Do not invent details Rose did not acknowledge
- Two solid insights are better than five vague ones

Return ONLY valid JSON in this exact shape, no other text:
{
  "quality": "strong" | "average" | "short",
  "insights": [
    {
      "category": "Category Name",
      "title": "Short one-line insight title",
      "content": "2–3 sentences describing what was learned and why it matters for their admissions journey."
    }
  ]
}`;

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY2");
  if (!key) throw new Error("ANTHROPIC_API_KEY2 missing");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = (data.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text)
    .join("")
    .trim();
  return text;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function insightsEmailHtml(
  counselorName: string,
  studentName: string,
  quality: string,
  insights: Insight[],
  appUrl: string,
): string {
  const insightBlocks = insights
    .map(
      (ins) => `
      <div style="background:#fff;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:10px;padding:14px 18px;margin-bottom:12px;">
        <p style="margin:0 0 4px;color:#9f1239;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(ins.category)}</p>
        <p style="margin:0 0 6px;color:#111827;font-size:15px;font-weight:600;">${escapeHtml(ins.title)}</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${escapeHtml(ins.content)}</p>
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rose insights from ${escapeHtml(studentName)}</title>
</head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48,#db2777);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Rose insights</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Fresh reflections from ${escapeHtml(studentName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;">Hi ${escapeHtml(counselorName)},</p>
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                <strong>${escapeHtml(studentName)}</strong> just finished a voice conversation with Rose. Here's what she picked up — a
                <strong>${escapeHtml(quality)}</strong> quality read overall.
              </p>
              ${insightBlocks || `<p style="color:#6b7280;font-size:14px;">No structured insights were extracted from this session.</p>`}
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#e11d48,#db2777);color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:10px;font-size:15px;font-weight:600;">
                  Open ${escapeHtml(studentName)}'s workspace &rarr;
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#fdf2f8;border-top:1px solid #fbcfe8;padding:18px 40px;text-align:center;">
              <p style="margin:0;color:#9f1239;font-size:12px;line-height:1.6;">
                You're receiving this because ${escapeHtml(studentName)} is assigned to you on Primrose.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function emailCounselorInsights(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  insights: Insight[],
  quality: string,
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY missing — skipping counselor email");
    return;
  }

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("id, name, advisor_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (studentErr) {
    console.error("student lookup error:", studentErr);
    return;
  }
  if (!student?.advisor_id) {
    console.log("student has no advisor_id — skipping counselor email");
    return;
  }

  const { data: advisor, error: advisorErr } = await supabase
    .from("advisors")
    .select("name, email")
    .eq("id", student.advisor_id)
    .maybeSingle();
  if (advisorErr || !advisor?.email) {
    console.error("advisor lookup error or missing email:", advisorErr);
    return;
  }

  const appUrl = `https://consultant.primrosecrm.com/students/${student.id}/workspace`;
  const html = insightsEmailHtml(
    advisor.name ?? "Consultant",
    student.name ?? "Your student",
    quality,
    insights,
    appUrl,
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Primrose <team@primrosecrm.com>",
      to: advisor.email,
      subject: `Rose insights from ${student.name ?? "your student"} — Primrose`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
    return;
  }
  console.log(`Rose insights email sent to counselor ${advisor.email}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory } = (await req.json()) as { conversationHistory: ConversationTurn[] };

    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
      throw new Error("conversationHistory is required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve user from JWT
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

    // Build transcript string for Claude
    const transcript = conversationHistory
      .map(turn => `[${turn.role === "rose" ? "Rose" : "Student"}]: ${turn.text}`)
      .join("\n\n");

    const studentTurns = conversationHistory.filter(t => t.role === "student");
    const userPrompt = `Here is the full conversation transcript. The student had ${studentTurns.length} speaking turn(s).\n\nTranscript:\n${transcript}\n\nExtract insights now.`;

    const raw = await callAnthropic(SYSTEM_PROMPT, userPrompt);
    if (!raw) throw new Error("No response from AI");

    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let result: { quality: string; insights: Insight[] };
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const insights: Insight[] = Array.isArray(result.insights) ? result.insights : [];
    const quality = result.quality ?? "short";

    // Store in noga.voice_insights (non-blocking on failure)
    if (userId) {
      const { error } = await supabase
        .schema("noga")
        .from("voice_insights")
        .insert({
          user_id: userId,
          insights,
          quality,
          transcript: conversationHistory,
        });
      if (error) console.error("DB insert error:", error);
    }

    // Email the assigned counselor with the extracted insights (non-blocking)
    if (userId && insights.length > 0) {
      try {
        await emailCounselorInsights(supabase, userId, insights, quality);
      } catch (e) {
        console.error("counselor email error:", e);
      }
    }

    return new Response(JSON.stringify({ insights, quality }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("noga-rose-voice-insights error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
