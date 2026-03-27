import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getSubmissionValue(submissions: any[], ...labels: string[]): string | null {
  if (!Array.isArray(submissions)) return null;
  for (const label of labels) {
    const item = submissions.find((s: any) => s.label?.toLowerCase().includes(label.toLowerCase()));
    if (item?.value) return item.value;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received WIX webhook payload:", JSON.stringify(body));

    const wixData = body.data || body;
    const submissions = wixData.submissions;
    const contact = wixData.contact;

    // Extract name from submissions array (WIX format: [{label, value}])
    let name = 'לא ידוע';
    if (submissions) {
      const lastName = getSubmissionValue(submissions, 'שם משפחה', 'last name');
      const firstName = getSubmissionValue(submissions, 'copy of', 'שם פרטי', 'first name');
      if (firstName && lastName) {
        name = `${firstName} ${lastName}`;
      } else if (lastName) {
        name = lastName;
      } else if (firstName) {
        name = firstName;
      }
    }
    // Fallback to contact info
    if (name === 'לא ידוע' && contact?.name) {
      const { first, last } = contact.name;
      if (first && last) name = `${first} ${last}`;
      else if (first) name = first;
      else if (last) name = last;
    }
    // Fallback to flat format
    if (name === 'לא ידוע') {
      name = wixData.name || wixData.fullName || wixData["שם"] || 'לא ידוע';
    }

    // Extract email
    const email = getSubmissionValue(submissions || [], 'דוא"ל', 'אימייל', 'email', 'mail')
      || contact?.email
      || wixData.email || null;

    // Extract phone
    const phone = getSubmissionValue(submissions || [], 'טלפון', 'phone', 'נייד')
      || (contact?.phone && contact.phone !== '' ? contact.phone : null)
      || wixData.phone || null;

    // Extract source field
    const sourceField = getSubmissionValue(submissions || [], 'איך שמעת', 'מקור', 'source');

    // Extract message/notes
    const message = getSubmissionValue(submissions || [], 'הודעה', 'הערות', 'message', 'notes')
      || wixData.message || null;

    // Auto-assign leads_year: if month >= September, use next year
    const now = new Date();
    const month = now.getMonth(); // 0-based
    const year = now.getFullYear();
    const academicYear = month >= 8 ? year + 1 : year;
    const leadsYear = String(academicYear).slice(-2);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: leadData, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        source: sourceField ? `אתר WIX - ${sourceField}` : 'אתר WIX',
        meeting_summary: message,
        degree_type: 'bachelor',
        leads_year: leadsYear,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting lead:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Lead created successfully:", leadData.id, "Name:", name, "Year:", leadsYear);
    return new Response(JSON.stringify({ success: true, lead_id: leadData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error("Webhook processing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
