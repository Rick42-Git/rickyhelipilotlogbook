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

    const systemPrompt = `You are an expert aviation data extraction specialist. Analyse the uploaded image — it could be ANYTHING related to flying: a logbook page, tech log, flight plan, training record, receipt, certificate, screenshot of a digital logbook, whiteboard notes, or any other document.

Extract as many flight entries as you can identify. For each flight, populate these fields:
- date (YYYY-MM-DD format — infer year from context if only day/month visible)
- aircraftType (e.g. "R22", "R44", "Bell 206", "AS350")
- aircraftReg (registration e.g. "ZS-HBR")
- pilotInCommand (name of PIC)
- flightDetails (route, remarks, exercise numbers, any notes)
- Single Engine Day: seDayDual (dual instruction received), seDayPilot (solo/PIC)
- Single Engine Night: seNightDual, seNightPilot
- Instrument Flying: instrumentTime (col 13)
- Flying as Instructor: instructorDay (col 14), instructorNight (col 15)

All numeric values are decimal hours (e.g. 1.3 = 1 hour 18 min). If a value is unreadable, missing, or not applicable, use 0.
If the image is not aviation-related or contains no extractable flight data, return an empty entries array.
Be thorough — extract partial data rather than skipping a row. Even a date and aircraft type alone is useful.`;

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
        instrumentTime: { type: "number" },
        instructorDay: { type: "number" },
        instructorNight: { type: "number" },
        confidence: { type: "number", description: "Overall confidence score from 0 to 100 for this entry. Consider handwriting legibility, smudges, ambiguous characters (e.g. 1 vs 7, 0 vs O), and date format clarity. Be strict — if any field required guesswork, lower the score." },
      },
      required: ["date", "aircraftType", "aircraftReg", "confidence"],
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
                { type: "text", text: "Extract all flight entries you can find from this image. It could be a logbook page, tech log, flight record, training sheet, or any aviation document." },
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
        confidence: Math.min(100, Math.max(0, Number(e.confidence) || 0)),
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
