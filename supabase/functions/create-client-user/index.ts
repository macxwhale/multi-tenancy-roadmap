// Create client auth user without affecting current session
// Uses service role to call Admin API safely on the server
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const createClientSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255, 'Password too long'),
  phoneNumber: z.string().regex(/^0\d{9}$/, 'Phone number must be 10 digits starting with 0'),
  tenantId: z.string().uuid('Invalid tenant ID'),
  metadata: z.record(z.any()).optional(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = createClientSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.issues);
      return new Response(JSON.stringify({ 
        error: "Invalid input data", 
        details: validationResult.error.issues 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { email, password, metadata, tenantId, phoneNumber } = validationResult.data;
    console.log("Creating client user with phone:", phoneNumber);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create auth user
    console.log("Creating auth user...");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata ?? {},
    });

    if (error) {
      console.error("Auth user creation failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Auth user created successfully:", data.user!.id);

    // Create profile for the client user
    console.log("Creating profile...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: data.user!.id,
        tenant_id: tenantId,
        full_name: phoneNumber,
        phone_number: phoneNumber,
      });

    if (profileError) {
      console.error("Profile creation failed:", profileError);
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Profile created successfully");

    // Assign client role
    console.log("Assigning client role...");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: data.user!.id,
        role: 'client',
      });

    if (roleError) {
      console.error("Role assignment failed:", roleError);
      // Rollback: delete profile and auth user
      await supabaseAdmin.from("profiles").delete().eq("user_id", data.user!.id);
      await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
      return new Response(JSON.stringify({ error: roleError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Client role assigned successfully");

    return new Response(
      JSON.stringify({ userId: data.user?.id, email: data.user?.email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Unknown error');
    console.error("Unexpected error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
