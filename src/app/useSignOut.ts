import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { useAuth } from '@/integrations/clerk';
import { supabase } from '@/integrations/supabase/client';

/** Leave the protected area first, then end the session and drop cached private data. */
export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return React.useCallback(async () => {
    await queryClient.cancelQueries();
    await navigate({ to: '/auth', replace: true });
    try {
      await signOut();
      await supabase.auth?.signOut?.();
    } catch {
      // ignore
    }
    queryClient.clear();
  }, [queryClient, navigate, signOut]);
}
