import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'owner' | 'client' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    if (!user?.email) {
      setRole(null);
      return;
    }

    if (user.email.endsWith('@owner.internal') || !user.email.endsWith('@client.internal')) {
      // If email doesn't end with @client.internal, assume owner
      setRole('owner');
    } else if (user.email.endsWith('@client.internal')) {
      setRole('client');
    } else {
      setRole(null);
    }
  }, [user]);

  return { role, isOwner: role === 'owner', isClient: role === 'client' };
};
