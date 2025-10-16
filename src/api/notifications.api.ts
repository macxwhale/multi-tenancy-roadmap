import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Notification = Tables<'notifications'>;
type NotificationInsert = TablesInsert<'notifications'>;
type NotificationUpdate = TablesUpdate<'notifications'>;

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  if (error) throw error;
  return count || 0;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  if (error) throw error;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Create a notification
 */
export const createNotification = async (
  notification: Omit<NotificationInsert, 'tenant_id' | 'user_id'>
): Promise<Notification> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      tenant_id: profile.tenant_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};
