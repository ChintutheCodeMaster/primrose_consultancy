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

    // Extract name from submissions array
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
    if (name === 'לא ידוע' && contact?.name) {
      const { first, last } = contact.name;
      if (first && last) name = `${first} ${last}`;
      else if (first) name = first;
      else if (last) name = last;
    }
    if (name === 'לא ידוע') {
      name = wixData.name || wixData.fullName || wixData["שם"] || 'לא ידוע';
    }

    // Extract email
    const email = getSubmissionValue(submissions || [], 'דוא"ל', 'אימייל', 'email', 'mail')
      || contact?.email
      || wixData.email || null;

    // Extract phone - try submissions first, then contact, then field keys
    let phone = getSubmissionValue(submissions || [], 'טלפון', 'phone', 'נייד');
    if (!phone && contact?.phone && contact.phone !== '') {
      phone = contact.phone;
    }
    // Try field:comp-* keys that might contain phone
    if (!phone && wixData) {
      for (const [key, value] of Object.entries(wixData)) {
        if (key.startsWith('field:') && typeof value === 'string' && /^0\d{8,9}$/.test(value.replace(/[-\s]/g, ''))) {
          phone = value;
          break;
        }
      }
    }

    // Extract source - just the raw value, no "אתר WIX" prefix
    const sourceField = getSubmissionValue(submissions || [], 'איך שמעת', 'מקור', 'source');

    // Extract message/inquiry content
    const inquiry = getSubmissionValue(submissions || [], 'הודעה', 'הערות', 'message', 'notes', 'פנייה')
      || wixData.message || null;

    // leads_year = always current year + 1 (last 2 digits)
    const now = new Date();
    const leadsYear = String(now.getFullYear() + 1).slice(-2);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: leadData, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone: phone || null,
        source: sourceField || null,
        website_inquiry: inquiry,
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
