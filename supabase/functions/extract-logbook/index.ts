import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, spreadsheetText, fileName } = await req.json();
    if (!imageBase64 && !spreadsheetText) {
      throw new Error("No image or spreadsheet payload provided");
    }

    const isSpreadsheet = Boolean(spreadsheetText);

    const systemPrompt = `You are an expert aviation data extraction specialist.

Input may be:
1) A photo/screenshot of a flight logbook or aviation document, OR
2) Raw spreadsheet table text (rows/columns converted to text).

Extract as many flight entries as possible and map each row to:
- date (YYYY-MM-DD if possible; if uncertain keep best raw date string)
- aircraftType
- aircraftReg
- pilotInCommand
- flightDetails
- seDayDual
- seDayPilot
- seNightDual
- seNightPilot
- instrumentTime
- instructorDay
- instructorNight
- confidence (0-100)

Rules:
- Prioritize HOURS / numeric flight time columns over perfect date parsing.
- If date is ambiguous, keep best guess but do not drop the row if hours are present.
- Missing numeric fields must be 0.
- Extract partial entries rather than skipping rows.
- If no extractable flights exist, return entries: [].
- Column header synonyms to recognise:
  * seDayDual: "SE Day Dual", "Single Engine Aircraft Day Dual", "Single Engine Aircraft Day Co-Pilot", "Multi Engine Aircraft Day Dual", "Day Dual", "Dual"
  * seDayPilot: "SE Day Pilot", "Single Engine Aircraft Day PIC", "Single Engine Aircraft Day Picus", "Multi Engine Aircraft Day PIC", "Multi Engine Aircraft Day Picus", "Multi Engine Aircraft Day Co-Pilot", "Day PIC", "Day Picus"
  * seNightDual: "SE Night Dual", "Single Engine Aircraft Night Dual", "Single Engine Aircraft Night Co-Pilot", "Multi Engine Aircraft Night Dual", "Night Dual"
  * seNightPilot: "SE Night Pilot", "Single Engine Aircraft Night PIC", "Single Engine Aircraft Night Picus", "Multi Engine Aircraft Night PIC", "Multi Engine Aircraft Night Picus", "Multi Engine Aircraft Night Co-Pilot", "Night PIC", "Night Picus"
  * instrumentTime: "Instrument Time", "Instrument Time Place Co-Pilot", "Instrument Time Actual Time Co-Pilot", "Instrument Time FSTD Time Co-Pilot", "FSTD Actual Time FSTD Time Co-Pilot", "FSTD Time", "IFR Time"
  * instructorDay: "Instructor Day", "Instructor Time SE", "Instructor Time FSTD Time Co-Pilot"
  * instructorNight: "Instructor Night", "Instructor Time ME"
- Map Multi Engine columns to the corresponding Single Engine fields.
- "Remarks FSTD Time Co-Pilot" should be treated as flightDetails/remarks.`;

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
        instrumentTime: { type: "number" },
        instructorDay: { type: "number" },
        instructorNight: { type: "number" },
        confidence: {
          type: "number",
          description:
            "Overall confidence score from 0 to 100. Lower confidence when dates are ambiguous or row alignment is uncertain.",
        },
      },
      required: ["date", "aircraftType", "aircraftReg", "confidence"],
    };

    const userContent = isSpreadsheet
      ? [
          {
            type: "text",
            text:
              `Extract flight entries from this spreadsheet-like table text. File: ${fileName || "unknown"}.\n\n` +
              String(spreadsheetText).slice(0, 180000),
          },
        ]
      : [
          {
            type: "text",
            text: "Extract all flight entries you can find from this aviation-related image.",
          },
          { type: "image_url", image_url: { url: imageBase64 } },
        ];

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
          { role: "user", content: userContent },
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
    const entries = (parsed.entries || []).map((e: Record<string, unknown>) => ({
      date: String(e.date || ""),
      aircraftType: String(e.aircraftType || ""),
      aircraftReg: String(e.aircraftReg || ""),
      pilotInCommand: String(e.pilotInCommand || ""),
      flightDetails: String(e.flightDetails || ""),
      seDayDual: toNumber(e.seDayDual),
      seDayPilot: toNumber(e.seDayPilot),
      seNightDual: toNumber(e.seNightDual),
      seNightPilot: toNumber(e.seNightPilot),
      instrumentTime: toNumber(e.instrumentTime),
      instructorDay: toNumber(e.instructorDay),
      instructorNight: toNumber(e.instructorNight),
      confidence: Math.min(100, Math.max(0, toNumber(e.confidence))),
    }));

    return new Response(JSON.stringify({ entries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-logbook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
