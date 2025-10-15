// Create client auth user without affecting current session
// Uses service role to call Admin API safely on the server
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email, password, metadata } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({ userId: data.user?.id, email: data.user?.email }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error');
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});