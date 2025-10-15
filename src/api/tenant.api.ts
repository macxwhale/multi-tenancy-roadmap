import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current authenticated user's tenant ID
 * @throws Error if user is not authenticated or profile not found
 */
export const getCurrentTenantId = async (): Promise<string> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  return profile.tenant_id;
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user;
};
