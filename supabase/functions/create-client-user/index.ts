// Create client auth user without affecting current session
// Uses service role to call Admin API safely on the server
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email, password, metadata, tenantId, phoneNumber } = await req.json();
    if (!email || !password || !tenantId || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create auth user
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

    // Create profile for the client user
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: data.user!.id,
        tenant_id: tenantId,
        full_name: phoneNumber,
        phone_number: phoneNumber,
      });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
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