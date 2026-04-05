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
    const { room_id, secret, action, payload } = body;

    if (!room_id || !secret || !action) {
      return new Response(JSON.stringify({ error: "Missing room_id, secret, or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the room to validate the secret
    const { data: room, error: fetchErr } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", room_id)
      .single();

    if (fetchErr || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine if caller is host or guest based on secret
    const isHost = room.host_secret === secret;
    const isGuest = room.guest_secret === secret;
    const isJoinRequest = action === "join" && secret === "__join__";

    if (!isHost && !isGuest && !isJoinRequest) {
      return new Response(JSON.stringify({ error: "Invalid secret" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "join": {
        // Only allow joining if room is waiting and no guest yet (no secret required for join)
        if (room.status !== "waiting" || room.guest_name) {
          return new Response(JSON.stringify({ error: "Room not available" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const guestName = String(payload?.guest_name || "").trim().slice(0, 20);
        if (!guestName) {
          return new Response(JSON.stringify({ error: "guest_name required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const guestSecret = crypto.randomUUID();
        updateData = { guest_name: guestName, guest_secret: guestSecret };
        // Return the guest secret to the joining player
        const { error: joinErr } = await supabase
          .from("game_rooms")
          .update(updateData)
          .eq("id", room_id);
        if (joinErr) throw joinErr;
        return new Response(JSON.stringify({ success: true, guest_secret: guestSecret }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_ready": {
        updateData = isHost ? { host_ready: true } : { guest_ready: true };
        break;
      }

      case "update_status": {
        if (!isHost) {
          return new Response(JSON.stringify({ error: "Only host can change status" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const validStatuses = ["waiting", "playing", "finished"];
        const status = String(payload?.status || "");
        if (!validStatuses.includes(status)) {
          return new Response(JSON.stringify({ error: "Invalid status" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData = { status };
        break;
      }

      case "update_score": {
        const score = Number(payload?.score);
        const round = Number(payload?.round);
        if (isNaN(score) || score < 0 || score > 200000 || isNaN(round) || round < 0 || round > 100) {
          return new Response(JSON.stringify({ error: "Invalid score or round" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const scoreField = isHost ? "host_score" : "guest_score";
        updateData = { [scoreField]: score, current_round: round };

        // Try to set finished flag if the column exists (migration may not be applied)
        const finishedField = isHost ? "host_finished" : "guest_finished";
        const { error: finishedErr } = await supabase
          .from("game_rooms")
          .update({ [finishedField]: true })
          .eq("id", room_id);
        // Ignore error — column may not exist yet
        if (finishedErr) {
          console.warn("Could not set finished flag (column may not exist):", finishedErr.message);
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { error: updateErr } = await supabase
      .from("game_rooms")
      .update(updateData)
      .eq("id", room_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("update-game-room error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});