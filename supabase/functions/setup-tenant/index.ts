import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { business_name, full_name, phone_number } = await req.json();

    console.log('Setting up tenant for user:', user.id);

    // Check if tenant already exists for this phone number
    const { data: existingTenant } = await supabaseClient
      .from('tenants')
      .select('id')
      .eq('phone_number', phone_number)
      .maybeSingle();

    let tenantId: string;

    if (existingTenant) {
      tenantId = existingTenant.id;
      console.log('Using existing tenant:', tenantId);
    } else {
      // Create tenant
      const { data: tenant, error: tenantError } = await supabaseClient
        .from('tenants')
        .insert({
          business_name,
          phone_number,
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        throw tenantError;
      }

      tenantId = tenant.id;
      console.log('Created new tenant:', tenantId);
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: user.id,
          tenant_id: tenantId,
          full_name,
          phone_number,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Created profile for user:', user.id);

      // Assign 'admin' role to the first user of a tenant
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        throw roleError;
      }

      console.log('Assigned admin role to user:', user.id);
    }

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenantId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in setup-tenant:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
