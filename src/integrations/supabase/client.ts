import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Fallback credentials to prevent runtime crashes if env vars are temporarily omitted
const FALLBACK_URL = 'https://prwvauiebihaugutsnlh.supabase.co';
const FALLBACK_ANON_KEY = 'sb_publishable_oJXsFSw9xD5cwqMPFjAlAw_Vt8Dd5b0';

function getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url =
    (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
    (typeof process !== 'undefined' ? process.env?.['SUPABASE_URL'] : undefined) ||
    FALLBACK_URL;

  const key =
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (typeof process !== 'undefined'
      ? process.env?.['SUPABASE_PUBLISHABLE_KEY'] || process.env?.['SUPABASE_ANON_KEY']
      : undefined) ||
    FALLBACK_ANON_KEY;

  const isConfigured = Boolean(url && key && url !== 'https://your-project.supabase.co');

  return { url, key, isConfigured };
}

const config = getSupabaseConfig();

export const isSupabaseConfigured = (): boolean => config.isConfigured;

/**
 * Standard Supabase client instance with client-side localStorage session persistence.
 */
export const supabase = createClient<Database>(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
