/**
 * Supabase client for the admin dashboard.
 * Only the project URL and publishable key are here: both are public by design.
 * Every privileged read/write goes through admin_* database functions or Edge
 * Functions that check the caller is an admin with a verified authenticator.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://djqgmowfjxsnjdffdohw.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__FkMcK1683czdRktkt7YsA_vYR4ZsOW';
export const APP_STORE_ID = '6761712673';
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const LIBRARY_BUCKET = 'library';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'rehearse-admin-auth',
  },
});

/** A readable message for errors coming back from Postgres, PostgREST or Edge Functions. */
export function errorMessage(error: unknown): string {
  if (!error) return 'Something went wrong.';
  const e = error as { message?: string; code?: string; details?: string };
  if (e.code === '42501' || e.message === 'not_authorized') return 'Your session no longer has admin access. Sign in again.';
  if (e.message?.startsWith('config_changed')) return 'Someone published a newer config while you were editing. Reload to see it.';
  if (e.message === 'Failed to fetch') return 'Network error. Check your connection and try again.';
  return e.message || String(error);
}

/** Calls an admin_* database function and throws a readable error. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    if (error.code === '42501') handleLostAccess();
    throw new Error(errorMessage(error));
  }
  return data as T;
}

/** Calls an admin Edge Function with the current session. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = await ctx.clone().json();
        if (parsed?.error) message = parsed.error;
        if (ctx.status === 403 || ctx.status === 401) handleLostAccess();
      } catch {
        /* keep the generic message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}

function handleLostAccess() {
  if (location.pathname.startsWith('/admin/login')) return;
  const next = encodeURIComponent(location.pathname + location.search);
  location.replace(`/admin/login/?next=${next}`);
}
