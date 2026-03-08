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

The logbook has these columns matching standard aviation logbook format:
- date (YYYY-MM-DD)
- aircraftType (e.g. "RH-22", "R44", "Bell 206")
- aircraftReg (registration)
- pilotInCommand (name)
- flightDetails (remarks/exercises)
- Single Engine Day: seDayDual (col 1), seDayPilot (col 2)
- Single Engine Night: seNightDual (col 3), seNightPilot (col 4)
- Multi Engine Day: meDayDual (col 5), meDayPilot (col 6), meDayCoPilot (col 7)
- Multi Engine Night: meNightDual (col 8), meNightPilot (col 9), meNightCoPilot (col 10)
- Instrument Flying: instrumentNavAids (col 11), instrumentPlace (col 12), instrumentTime (col 13)
- Flying as Instructor: instructorDay (col 14), instructorNight (col 15)

All numeric values are decimal hours. If unreadable or blank, use 0.`;

    const entrySchema = {
      type: "object",
      properties: {
        date: { type: "string" },
        aircraftType: { type: "string" },
        aircraftReg: { type: "string" },
        pilotInCommand: { type: "string" },
        flightDetails: { type: "string" },
        seDayDual: { type: "number" },
        seDayPilot: { type: "number" },
        seNightDual: { type: "number" },
        seNightPilot: { type: "number" },
        meDayDual: { type: "number" },
        meDayPilot: { type: "number" },
        meDayCoPilot: { type: "number" },
        meNightDual: { type: "number" },
        meNightPilot: { type: "number" },
        meNightCoPilot: { type: "number" },
        instrumentNavAids: { type: "number" },
        instrumentPlace: { type: "number" },
        instrumentTime: { type: "number" },
        instructorDay: { type: "number" },
        instructorNight: { type: "number" },
      },
      required: ["date", "aircraftType", "aircraftReg"],
    };

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
                { type: "text", text: "Extract all flight entries from this helicopter logbook page." },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_entries",
                description: "Return extracted logbook entries",
                parameters: {
                  type: "object",
                  properties: {
                    entries: { type: "array", items: entrySchema },
                  },
                  required: ["entries"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_entries" } },
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
    if (!toolCall) throw new Error("No structured response from AI");

    const parsed = JSON.parse(toolCall.function.arguments);
    const numFields = [
      'seDayDual', 'seDayPilot', 'seNightDual', 'seNightPilot',
      'meDayDual', 'meDayPilot', 'meDayCoPilot',
      'meNightDual', 'meNightPilot', 'meNightCoPilot',
      'instrumentNavAids', 'instrumentPlace', 'instrumentTime',
      'instructorDay', 'instructorNight',
    ];

    const entries = (parsed.entries || []).map((e: Record<string, unknown>) => {
      const entry: Record<string, unknown> = {
        date: e.date || "",
        aircraftType: e.aircraftType || "",
        aircraftReg: e.aircraftReg || "",
        pilotInCommand: e.pilotInCommand || "",
        flightDetails: e.flightDetails || "",
      };
      for (const f of numFields) {
        entry[f] = Number(e[f]) || 0;
      }
      return entry;
    });

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
