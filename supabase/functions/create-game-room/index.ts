import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { code, host_name, difficulty, mode, seed } = body;

    // Validate inputs
    if (!code || typeof code !== "string" || code.length < 4 || code.length > 6) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!host_name || typeof host_name !== "string" || host_name.trim().length === 0 || host_name.length > 20) {
      return new Response(JSON.stringify({ error: "Invalid host_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validDifficulties = ["basic", "easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return new Response(JSON.stringify({ error: "Invalid difficulty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validModes = ["world", "europe", "americas", "asia", "africa"];
    if (!validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof seed !== "number" || seed < 0 || seed > 1_000_000) {
      return new Response(JSON.stringify({ error: "Invalid seed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generamos el host_secret aquí (no dependemos del DEFAULT ni del REVOKE de la
    // columna) y lo devolvemos GARANTIZADO, para que el anfitrión pueda autenticar
    // sus acciones (marcar "listo", etc.). Simétrico con el guest_secret del join.
    const hostSecret = crypto.randomUUID();
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({
        code: code.toUpperCase(),
        host_name: host_name.trim().slice(0, 20),
        difficulty,
        mode,
        seed,
        status: "waiting",
        host_secret: hostSecret,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
      return new Response(JSON.stringify({ error: "Failed to create room" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Devolvemos el host_secret explícito, garantizado, junto con la fila de la sala.
    return new Response(JSON.stringify({ ...data, host_secret: hostSecret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-game-room error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
