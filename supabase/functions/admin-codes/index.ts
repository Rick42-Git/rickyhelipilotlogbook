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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, adminId } = body;

    // Verify the caller is an admin
    const { data: adminCheck } = await supabase
      .from("access_codes")
      .select("is_admin")
      .eq("id", adminId)
      .maybeSingle();

    if (!adminCheck?.is_admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { code, display_name, email, is_admin, extraction_limit } = body;
      const { data, error } = await supabase
        .from("access_codes")
        .insert({
          code,
          display_name,
          email: email || "",
          is_admin: is_admin || false,
          extraction_limit: extraction_limit ?? 5,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { id } = body;
      const { error } = await supabase
        .from("access_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "credit_response") {
      const { requestId, userId, approvedAmount, status } = body;

      // Update the credit request status
      const { error: reqError } = await supabase
        .from("credit_requests")
        .update({ status, approved_amount: approvedAmount, updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (reqError) throw reqError;

      // If approved, increase the user's extraction_limit
      if (status === "approved" && approvedAmount > 0) {
        // Get current limit
        const { data: userData } = await supabase
          .from("access_codes")
          .select("extraction_limit")
          .eq("id", userId)
          .maybeSingle();

        const currentLimit = userData?.extraction_limit ?? 5;
        const { error: updateError } = await supabase
          .from("access_codes")
          .update({ extraction_limit: currentLimit + approvedAmount })
          .eq("id", userId);

        if (updateError) throw updateError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
