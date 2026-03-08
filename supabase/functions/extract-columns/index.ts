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
    if (!imageBase64) throw new Error("No image provided");

    const systemPrompt = `You are an aviation logbook format expert. The user has uploaded a photo of their logbook page or header row.

Your task is to identify ALL column headers visible in the image, reading from left to right.

For each column, determine:
1. The exact text of the column header as written (may span multiple rows)
2. Which logbook field it most likely maps to

Available logbook fields to map to:
- date: Flight date
- aircraftType: Aircraft class or type
- aircraftReg: Aircraft registration / tail number
- pilotInCommand: Pilot in command / captain name
- flightDetails: Route, remarks, flight details
- seDayDual: Single Engine Day Dual hours
- seDayPilot: Single Engine Day PIC/Picus hours
- seNightDual: Single Engine Night Dual hours
- seNightPilot: Single Engine Night PIC/Picus hours
- instrumentTime: Instrument flying time
- instructorDay: Instructor time (day)
- instructorNight: Instructor time (night)
- unmapped: Column exists but doesn't map to any field above

Rules:
- Read ALL columns, even if some are unclear
- Multi Engine columns should map to the corresponding Single Engine field
- PICUS columns map to the Pilot (PIC) field
- Co-Pilot columns map to Dual fields
- Include columns you're unsure about with confidence < 50
- Return columns in left-to-right order as they appear`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              { type: "text", text: "Identify all column headers in this logbook image and map them to the appropriate fields." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_columns",
              description: "Return the identified column headers and their mappings",
              parameters: {
                type: "object",
                properties: {
                  columns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sourceHeader: {
                          type: "string",
                          description: "The exact column header text as shown in the image",
                        },
                        mappedField: {
                          type: "string",
                          enum: [
                            "date", "aircraftType", "aircraftReg", "pilotInCommand",
                            "flightDetails", "seDayDual", "seDayPilot", "seNightDual",
                            "seNightPilot", "instrumentTime", "instructorDay",
                            "instructorNight", "unmapped",
                          ],
                        },
                        confidence: {
                          type: "number",
                          description: "Confidence 0-100 of the mapping",
                        },
                      },
                      required: ["sourceHeader", "mappedField", "confidence"],
                    },
                  },
                },
                required: ["columns"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_columns" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ columns: parsed.columns || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-columns error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
