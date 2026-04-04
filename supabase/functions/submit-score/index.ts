import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiting (resets on cold start, but good enough)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const lastSubmission = rateLimitMap.get(clientIp) || 0;
    if (now - lastSubmission < RATE_LIMIT_WINDOW_MS) {
      return new Response(JSON.stringify({ error: "Too many submissions, wait a moment" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { initials, score, difficulty, mode, user_id } = body;

    // Validate initials
    const cleanInitials = String(initials || "").trim().toUpperCase().slice(0, 5);
    if (!cleanInitials || cleanInitials.length < 1) {
      return new Response(JSON.stringify({ error: "Invalid initials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate score
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 200000) {
      return new Response(JSON.stringify({ error: "Invalid score" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate mode
    const validModes = ["world", "europe", "asia", "americas", "africa"];
    if (!validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const insertData: Record<string, unknown> = {
      initials: cleanInitials,
      score: numScore,
      difficulty,
      mode,
    };
    if (user_id && typeof user_id === "string" && user_id.length > 0) {
      insertData.user_id = user_id;
    }

    const { error } = await supabase.from("leaderboard").insert(insertData);
    if (error) throw error;

    rateLimitMap.set(clientIp, now);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-score error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});