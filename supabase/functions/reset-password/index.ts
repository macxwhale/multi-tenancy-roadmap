import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  phone_number: string;
}

const generatePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number }: ResetPasswordRequest = await req.json();

    if (!phone_number || !/^0\d{9}$/.test(phone_number)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const newPin = generatePin();

    let userId: string | null = null;

    // First, check profiles table for the phone number to get user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('phone_number', phone_number)
      .single();

    if (profile && !profileError) {
      userId = profile.user_id;
      console.log(`Found user via profile: ${userId}`);
    } else {
      // Fallback: Try to find user with either client or owner email format
      const clientEmail = `${phone_number}@client.internal`;
      const ownerEmail = `${phone_number}@owner.internal`;
      
      const { data: clientUsers } = await supabaseAdmin.auth.admin.listUsers();
      
      const clientUser = clientUsers.users.find(u => u.email === clientEmail);
      const ownerUser = clientUsers.users.find(u => u.email === ownerEmail);
      
      if (clientUser) {
        userId = clientUser.id;
        console.log(`Found client user: ${userId}`);
      } else if (ownerUser) {
        userId = ownerUser.id;
        console.log(`Found owner user: ${userId}`);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "No account found with this phone number" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update the user's password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPin,
    });

    if (error) {
      console.error("Error updating password:", error);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ pin: newPin }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
