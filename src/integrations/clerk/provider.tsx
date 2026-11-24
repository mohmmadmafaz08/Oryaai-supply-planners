import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserButton,
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useClerk,
} from '@clerk/react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  email: string | null;
}

export interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: UserProfile | null;
  signOut: () => Promise<void>;
  isClerkConfigured: boolean;
  clerkPublishableKey: string | null;
  setClerkPublishableKey: (key: string) => void;
  // Fallback demo login helper
  signInDemo: (email?: string, name?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_CLERK_PUB = 'oryva_clerk_pub_key';
const STORAGE_KEY_DEMO_USER = 'oryva_demo_user_auth';

function getInitialClerkKey(): string {
  const envKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim();
  if (envKey && (envKey.startsWith('pk_test_') || envKey.startsWith('pk_live_'))) {
    return envKey;
  }
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CLERK_PUB)?.trim() : null;
  if (stored && (stored.startsWith('pk_test_') || stored.startsWith('pk_live_'))) {
    return stored;
  }
  return '';
}

/**
 * Inner component active when real Clerk is mounted with a valid publishable key.
 */
function ClerkBridgeConsumer({
  children,
  publishableKey,
  onSetKey,
}: {
  children: React.ReactNode;
  publishableKey: string;
  onSetKey: (k: string) => void;
}) {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();
  const clerk = useClerk();

  const userProfile: UserProfile | null = useMemo(() => {
    if (!clerkUser.user) return null;
    const u = clerkUser.user;
    const email = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress || null;
    return {
      id: u.id,
      fullName: u.fullName || u.username || (email ? email.split('@')[0] : 'Planner'),
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl || null,
      email,
    };
  }, [clerkUser.user]);

  // Sync profile to Supabase profiles table when authenticated
  useEffect(() => {
    if (userProfile?.id) {
      try {
        localStorage.setItem('oryva_clerk_user_id', userProfile.id);
      } catch { }
      supabase
        .from('profiles')
        .upsert({
          id: userProfile.id,
          display_name: userProfile.fullName || 'Planner',
        })
        .then(() => { })
        .catch((err) => {
          console.warn('[clerk] Supabase profile sync deferred:', err);
        });
    }
  }, [userProfile?.id, userProfile?.fullName]);

  const isLoaded = Boolean(clerkAuth.isLoaded && clerkUser.isLoaded);
  const isSignedIn = Boolean(clerkAuth.isSignedIn);
  const userId = clerkAuth.userId ?? null;

  const value: AuthContextValue = useMemo(() => ({
    isLoaded,
    isSignedIn,
    userId,
    user: userProfile,
    signOut: async () => {
      try {
        localStorage.removeItem('oryva_clerk_user_id');
      } catch { }
      await clerk.signOut();
    },
    isClerkConfigured: true,
    clerkPublishableKey: publishableKey,
    setClerkPublishableKey: onSetKey,
    signInDemo: () => { },
  }), [isLoaded, isSignedIn, userId, userProfile, clerk, publishableKey, onSetKey]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * High-fidelity fallback provider when Clerk publishable key is not yet set in .env.
 * Ensures the workbench is immediately usable and allows live key entry.
 * Note: demoUser is null by default so new users are not auto-logged in.
 */
function FallbackAuthProvider({
  children,
  onSetKey,
}: {
  children: React.ReactNode;
  onSetKey: (k: string) => void;
}) {
  const [demoUser, setDemoUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEMO_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Return null by default - do not auto-login new visitors!
    return null;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const signInDemo = (email = 'planner@oryva.ai', name = 'Lead Planner') => {
    const parts = name.split(' ');
    const u: UserProfile = {
      id: `usr_demo_${Date.now()}`,
      fullName: name,
      firstName: parts[0] || 'Planner',
      lastName: parts.slice(1).join(' ') || null,
      imageUrl: null,
      email,
    };
    setDemoUser(u);
    try {
      localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(u));
      localStorage.setItem('oryva_clerk_user_id', u.id);
    } catch { }
  };

  const signOut = async () => {
    setDemoUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      localStorage.removeItem('oryva_clerk_user_id');
    } catch { }
  };

  const isDemoSignedIn = Boolean(demoUser);
  const demoUserId = demoUser?.id ?? null;

  const value: AuthContextValue = useMemo(() => ({
    isLoaded,
    isSignedIn: isDemoSignedIn,
    userId: demoUserId,
    user: demoUser,
    signOut,
    isClerkConfigured: false,
    clerkPublishableKey: null,
    setClerkPublishableKey: onSetKey,
    signInDemo,
  }), [isLoaded, isDemoSignedIn, demoUserId, demoUser, onSetKey]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Universal Clerk Auth Provider for Oryva.
 * Automatically wraps with ClerkProvider if a valid key is detected,
 * configuring standard redirects so OAuth callback returns to /dashboard.
 */
export function OryvaClerkProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [clerkKey, setClerkKey] = useState<string>(() => getInitialClerkKey());

  const handleSetKey = (key: string) => {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_CLERK_PUB, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_CLERK_PUB);
    }
    setClerkKey(clean);
  };

  const hasValidClerkKey = Boolean(
    clerkKey && (clerkKey.startsWith('pk_test_') || clerkKey.startsWith('pk_live_')),
  );

  if (hasValidClerkKey) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
      >
        <ClerkBridgeConsumer publishableKey={clerkKey} onSetKey={handleSetKey}>
          {children}
        </ClerkBridgeConsumer>
      </ClerkProvider>
    );
  }

  return (
    <FallbackAuthProvider onSetKey={handleSetKey}>
      {children}
    </FallbackAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within OryvaClerkProvider');
  }
  return ctx;
}

export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
}

export function SignedIn({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }): React.ReactElement | null {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}

// Re-export standard Clerk primitives for components that need them
export { SignIn, SignUp, UserButton };
