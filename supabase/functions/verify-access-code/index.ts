import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("access_codes")
      .select("id, display_name, email, activated")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid access code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as activated
    if (!data.activated) {
      await supabase
        .from("access_codes")
        .update({ activated: true })
        .eq("id", data.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.id,
          displayName: data.display_name,
          email: data.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
