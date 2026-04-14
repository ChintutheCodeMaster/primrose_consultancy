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

    const systemPrompt = `אתה עוזר AI חכם עבור מערכת CRM לניהול סטודנטים ולידים (מתעניינים) בתחום הייעוץ ללימודים בחו"ל.

הנה הנתונים במערכת:

## סטודנטים (${students.length} רשומות):
${JSON.stringify(students, null, 0)}

## מתעניינים/לידים (${leads.length} רשומות):
${JSON.stringify(leads, null, 0)}

## יועצים (${advisors.length} רשומות):
${JSON.stringify(advisors, null, 0)}

הנחיות חשובות:
- ענה תמיד בעברית
- כשמבקשים ממך למצוא אנשים, הצג את הפרטים שלהם בצורה מסודרת (שם, טלפון, אימייל, מדינה, תחום, סטטוס וכו')
- אתה יכול לענות על שאלות סטטיסטיות (כמה סטודנטים יש, כמה שילמו, כמה מכל מדינה וכו')
- אם אין תוצאות, אמור זאת בבירור
- היה תמציתי וברור
- השתמש בטבלאות מרקדאון כשזה מתאים

## קישורים לרשומות - חשוב מאוד!
כאשר אתה מזכיר סטודנט או מתעניין בתשובה, הפוך את השם שלו לקישור לחיץ בפורמט מרקדאון:
- לסטודנט פעיל (did_not_continue=false, אין graduation_year): [שם הסטודנט](/students?highlight=ID)
- לסטודנט שסיים (יש graduation_year): [שם הסטודנט](/past-clients/GRADUATION_YEAR?highlight=ID)
- לסטודנט שלא המשיך (did_not_continue=true): [שם הסטודנט](/did-not-continue?highlight=ID)
- למתעניין פעיל (did_not_continue=false): [שם המתעניין](/leads/LEADS_YEAR?highlight=ID)
- למתעניין שלא המשיך (did_not_continue=true): [שם המתעניין](/did-not-continue/LEADS_YEAR?highlight=ID)
- ליועץ פעיל: [שם היועץ](/advisors?highlight=ID)
- ליועץ לא פעיל: [שם היועץ](/past-advisors?highlight=ID)

השתמש ב-ID האמיתי (uuid) של כל רשומה. תמיד הפוך שמות לקישורים כשהם מופיעים בתשובה.`;

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