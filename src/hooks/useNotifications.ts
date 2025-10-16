import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import * as notificationsApi from '@/api/notifications.api';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

const QUERY_KEY = ['notifications'];
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'];

/**
 * Get all notifications
 */
export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: notificationsApi.getNotifications,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

/**
 * Get unread notifications count
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: notificationsApi.getUnreadCount,
  });
};

/**
 * Mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
      toast.success('All notifications marked as read');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });
};

/**
 * Delete a notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete notification: ${error.message}`);
    },
  });
};

/**
 * Create a notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notification: Omit<TablesInsert<'notifications'>, 'tenant_id' | 'user_id'>) =>
      notificationsApi.createNotification(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
    onError: (error: Error) => {
      console.error('Create notification error:', error);
    },
  });
};
