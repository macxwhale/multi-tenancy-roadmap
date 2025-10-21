import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResolveLoginEmailRequest {
  phone_number: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number }: ResolveLoginEmailRequest = await req.json();

    if (!phone_number || !/^0\d{9}$/.test(phone_number)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // 1) Try resolve via profiles -> user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    if (profile?.user_id) {
      const { data: userById, error: userByIdError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      if (userByIdError) {
        console.error('Error fetching user by id:', userByIdError);
      } else if (userById?.user?.email) {
        console.log(`Resolved email via profile: ${userById.user.email}`);
        return new Response(
          JSON.stringify({ email: userById.user.email }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // 2) Fallback: see if phone-based emails exist
    const clientEmail = `${phone_number}@client.internal`;
    const ownerEmail = `${phone_number}@owner.internal`;
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
    } else {
      const match = allUsers.users.find(u => u.email === clientEmail) || allUsers.users.find(u => u.email === ownerEmail);
      if (match?.email) {
        console.log(`Resolved email via fallback: ${match.email}`);
        return new Response(
          JSON.stringify({ email: match.email }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // 3) Nothing found
    return new Response(
      JSON.stringify({ error: "No account found for this phone number" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in resolve-login-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
