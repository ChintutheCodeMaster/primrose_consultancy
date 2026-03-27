import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received WIX webhook payload:", JSON.stringify(body));

    // WIX forms can send data in different structures
    // Support both flat and nested formats
    const formData = body.data || body.formData || body;
    
    // Extract fields - try common WIX form field names
    const name = formData.name || formData.fullName || formData.full_name || 
                 formData["שם"] || formData["שם מלא"] ||
                 `${formData.firstName || formData.first_name || ''} ${formData.lastName || formData.last_name || ''}`.trim() ||
                 'לא ידוע';
    
    const email = formData.email || formData.Email || formData["אימייל"] || formData["דוא\"ל"] || null;
    const phone = formData.phone || formData.Phone || formData.phoneNumber || formData["טלפון"] || null;
    const source = formData.source || "אתר WIX";
    const interestedField = formData.field || formData.interest || formData["תחום עניין"] || null;
    const interestedCountry = formData.country || formData["מדינה"] || null;
    const meetingSummary = formData.message || formData.notes || formData["הודעה"] || formData["הערות"] || null;
    const degreeType = formData.degreeType || formData.degree || "bachelor";
    const leadsYear = formData.leadsYear || formData.leads_year || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        source,
        interested_field: interestedField,
        interested_country: interestedCountry,
        meeting_summary: meetingSummary,
        degree_type: degreeType,
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

    console.log("Lead created successfully:", data.id);
    return new Response(JSON.stringify({ success: true, lead_id: data.id }), {
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
