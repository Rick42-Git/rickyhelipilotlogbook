import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image data provided");

    const systemPrompt = `You are a helicopter pilot logbook OCR specialist. Extract ALL flight entries from this logbook page image.

For each row/entry you can identify, return a JSON object with these fields:
- date (string, YYYY-MM-DD format)
- aircraftType (string, e.g. "R22", "R44", "Bell 206")
- aircraftReg (string, registration/tail number)
- from (string, departure airport/helipad ICAO or name)
- to (string, arrival airport/helipad ICAO or name)
- departureTime (string, HH:MM 24hr format, or empty string)
- arrivalTime (string, HH:MM 24hr format, or empty string)
- totalTime (number, decimal hours)
- picTime (number, pilot-in-command hours)
- sicTime (number, second-in-command hours)
- dualTime (number, dual instruction hours)
- nightTime (number, night flying hours)
- ifrTime (number, instrument flight hours)
- crossCountry (number, cross-country hours)
- landings (number, integer)
- remarks (string, any notes/remarks)

If a field is unreadable or not present, use sensible defaults (0 for numbers, empty string for text).
Return ONLY valid entries you can identify.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all flight entries from this helicopter logbook page.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_entries",
                description: "Return extracted logbook entries from the image",
                parameters: {
                  type: "object",
                  properties: {
                    entries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          aircraftType: { type: "string" },
                          aircraftReg: { type: "string" },
                          from: { type: "string" },
                          to: { type: "string" },
                          departureTime: { type: "string" },
                          arrivalTime: { type: "string" },
                          totalTime: { type: "number" },
                          picTime: { type: "number" },
                          sicTime: { type: "number" },
                          dualTime: { type: "number" },
                          nightTime: { type: "number" },
                          ifrTime: { type: "number" },
                          crossCountry: { type: "number" },
                          landings: { type: "number" },
                          remarks: { type: "string" },
                        },
                        required: [
                          "date",
                          "aircraftType",
                          "aircraftReg",
                          "from",
                          "to",
                          "totalTime",
                          "landings",
                        ],
                      },
                    },
                  },
                  required: ["entries"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_entries" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const entries = (parsed.entries || []).map((e: Record<string, unknown>) => ({
      date: e.date || "",
      aircraftType: e.aircraftType || "",
      aircraftReg: e.aircraftReg || "",
      from: e.from || "",
      to: e.to || "",
      departureTime: e.departureTime || "",
      arrivalTime: e.arrivalTime || "",
      totalTime: Number(e.totalTime) || 0,
      picTime: Number(e.picTime) || 0,
      sicTime: Number(e.sicTime) || 0,
      dualTime: Number(e.dualTime) || 0,
      nightTime: Number(e.nightTime) || 0,
      ifrTime: Number(e.ifrTime) || 0,
      crossCountry: Number(e.crossCountry) || 0,
      landings: Number(e.landings) || 0,
      remarks: e.remarks || "",
    }));

    return new Response(JSON.stringify({ entries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-logbook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
