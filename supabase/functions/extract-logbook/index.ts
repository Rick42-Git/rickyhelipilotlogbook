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

    const { imageBase64, spreadsheetText, fileName, userId } = await req.json();

    if (!imageBase64 && !spreadsheetText) {
      throw new Error("No image or spreadsheet payload provided");
    }

    // Enforce per-user extraction limit
    if (userId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Get user's extraction limit from access_codes
      const { data: userCode } = await sb
        .from("access_codes")
        .select("extraction_limit, is_admin")
        .eq("id", userId)
        .maybeSingle();

      // Admins bypass the limit
      if (!userCode?.is_admin) {
        const limit = userCode?.extraction_limit ?? 5;

        // Count how many extractions this user has already used
        const { count } = await sb
          .from("ai_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        const used = count ?? 0;
        if (used >= limit) {
          return new Response(
            JSON.stringify({
              error: `Extraction limit reached (${used}/${limit}). Contact your admin for more extractions.`,
              limitReached: true,
              used,
              limit,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    const isSpreadsheet = Boolean(spreadsheetText);

    const systemPrompt = `You are an expert aviation data extraction specialist.

Input may be:
1) A photo/screenshot of a flight logbook or aviation document, OR
2) A Flight Folio / Tech Log / Flight & Defect Report (e.g. NAC format), OR
3) Raw spreadsheet table text (rows/columns converted to text).

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

FLIGHT FOLIO / TECH LOG EXTRACTION:
When the image is a Flight Folio, Tech Log, or Flight & Defect Report:
- "Registration" field → aircraftReg (e.g. "ZS-RUE")
- "Aircraft Type" field → aircraftType (e.g. "B407", "R44", "BK117")
- "Captain" or "Captains Acceptance" field → pilotInCommand (e.g. "R. Anderson")
- "Date" field at top of folio → date
- "Route" section → flightDetails (combine all route legs, e.g. "PNW - Recaps - Deployments - PNW, PNW - PNP, PNP - Tangvieta x2 - PNP")
- The folio typically has a table with multiple flight legs. Each row has Route, HOBBS Start/End, HOBBS Time, Flight Time Start Up/Shut Down, Flight Time (hours). 
- SUM all "Flight Time" values from ALL rows in the table to get the total flight hours for seDayPilot (if PIC) or seDayDual (if dual/student).
- If the folio shows a "TOTALS" row, use that total flight time value.
- If there are multiple legs, you may produce ONE combined entry with total hours, or separate entries per leg — prefer one combined entry with total hours.
- "Total Time" or "Total Flight Time" at the bottom → use this as the authoritative flight time.
- Flight times are often in decimal hours (e.g. 3.1, 0.6, 1.2 summing to 4.9).

Rules:
- CRITICAL: Scan the ENTIRE width of the image, especially the FAR RIGHT columns. Logbooks often have "Instructor" or "Flying as Instructor" columns on the rightmost edge of the page. Do NOT ignore or miss these columns.
- Prioritize HOURS / numeric flight time columns over perfect date parsing.
- If date is ambiguous, keep best guess but do not drop the row if hours are present.
- Missing numeric fields must be 0.
- Extract partial entries rather than skipping rows.
- If no extractable flights exist, return entries: [].
- Column header synonyms to recognise:
  * seDayDual: "SE Day Dual", "Single Engine Aircraft Day Dual", "Single Engine Aircraft Day Co-Pilot", "Multi Engine Aircraft Day Dual", "Day Dual", "Dual"
  * seDayPilot: "SE Day Pilot", "Single Engine Aircraft Day PIC", "Single Engine Aircraft Day Picus", "Multi Engine Aircraft Day PIC", "Multi Engine Aircraft Day Picus", "Multi Engine Aircraft Day Co-Pilot", "Day PIC", "Day Picus", "Flight Time", "Total Time"
  * seNightDual: "SE Night Dual", "Single Engine Aircraft Night Dual", "Single Engine Aircraft Night Co-Pilot", "Multi Engine Aircraft Night Dual", "Night Dual"
  * seNightPilot: "SE Night Pilot", "Single Engine Aircraft Night PIC", "Single Engine Aircraft Night Picus", "Multi Engine Aircraft Night PIC", "Multi Engine Aircraft Night Picus", "Multi Engine Aircraft Night Co-Pilot", "Night PIC", "Night Picus"
  * instrumentTime: "Instrument Time", "Instrument Time Place Co-Pilot", "Instrument Time Actual Time Co-Pilot", "Instrument Time FSTD Time Co-Pilot", "FSTD Actual Time FSTD Time Co-Pilot", "FSTD Time", "IFR Time"
  * instructorDay: "Instructor Day", "Instructor Time SE", "Instructor Time FSTD Time Co-Pilot", "Flying as Instructor Day", "As Instructor Day", "Instr Day", "Instructor SE Day", "Flying as Instr Day", "Col 14", "Column 14"
  * instructorNight: "Instructor Night", "Instructor Time ME", "Flying as Instructor Night", "As Instructor Night", "Instr Night", "Instructor SE Night", "Flying as Instr Night", "Col 15", "Column 15"
- IMPORTANT: If a column header says "Instructor", "As Instructor", "Flying as Instructor", or similar — these are INSTRUCTOR hours, not instrument hours. Do NOT confuse "Instructor" with "Instrument".
- If a single "Instructor" column exists without Day/Night split, assign all instructor hours to instructorDay.
- If the pilot is listed as an instructor or the flight is a training/dual flight where the PIC is instructing, the PIC's hours should go to instructorDay (or instructorNight for night flights) IN ADDITION to seDayPilot/seNightPilot.
- SACAA logbook format: The rightmost columns (columns 14 and 15) are "Flying as Instructor" Day and Night. These often contain decimal hours like 1.0, 0.5, etc. Always check for values in these far-right columns.
- Map Multi Engine columns to the corresponding Single Engine fields.
- "Remarks FSTD Time Co-Pilot" should be treated as flightDetails/remarks.
- When the Captain is listed as PIC and there is no "Other/Student", assign flight time to seDayPilot (PIC hours).`;

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
      : (() => {
          // Detect if base64 is a PDF
          const isPdf = imageBase64.startsWith("data:application/pdf");
          return [
            {
              type: "text",
              text: isPdf
                ? "Extract all flight entries you can find from this PDF document containing logbook pages."
                : "Extract all flight entries you can find from this aviation-related image.",
            },
            { type: "image_url", image_url: { url: imageBase64 } },
          ];
        })();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isSpreadsheet ? "google/gemini-2.5-flash" : "google/gemini-2.5-pro",
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

    // Record usage
    if (userId && entries.length > 0) {
      try {
        const SUPABASE_URL2 = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY2 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient: createClient2 } = await import("https://esm.sh/@supabase/supabase-js@2");
        const sb2 = createClient2(SUPABASE_URL2, SUPABASE_SERVICE_ROLE_KEY2);
        await sb2.from("ai_usage").insert({ user_id: userId });
      } catch (_) { /* don't fail extraction over usage tracking */ }
    }

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
