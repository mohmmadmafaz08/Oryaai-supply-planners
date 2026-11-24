import * as React from 'react';
import { useAuth as useClerkAuthBridge, useUser as useClerkUserBridge, type UserProfile } from '@/integrations/clerk';

export interface AppSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export function useSession(): {
  session: AppSession | null;
  user: UserProfile | null;
  loading: boolean;
  isSignedIn: boolean;
} {
  const { isLoaded, isSignedIn, user } = useClerkAuthBridge();

  const session = React.useMemo<AppSession | null>(() => {
    if (!isSignedIn || !user) return null;
    return {
      user: {
        id: user.id,
        email: user.email || 'planner@oryva.ai',
        user_metadata: {
          full_name: user.fullName || 'Planner',
          avatar_url: user.imageUrl || undefined,
        },
      },
    };
  }, [isSignedIn, user]);

  return {
    session,
    user,
    loading: !isLoaded,
    isSignedIn,
  };
}

export { useClerkAuthBridge as useAuth, useClerkUserBridge as useUser };
