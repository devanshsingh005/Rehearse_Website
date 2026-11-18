/**
 * Access gate for every admin page except the login page.
 * A page is shown only when the session is at aal2 (authenticator verified) AND
 * public.is_admin() agrees. The database enforces the same rule on every call;
 * this check just avoids showing an empty dashboard.
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from './client';

const IDLE_LIMIT_MS = 30 * 60 * 1000; // sign out after 30 minutes without activity
const ACTIVITY_KEY = 'rehearse-admin-last-activity';

export interface AdminSession {
  user: User;
}

/** Leaves for the login page. The returned promise never settles, so nothing after it runs. */
function goToLogin(reason?: string): Promise<never> {
  const params = new URLSearchParams({ next: location.pathname + location.search });
  if (reason) params.set('reason', reason);
  location.replace(`/admin/login/?${params}`);
  return new Promise<never>(() => {});
}

function readActivity(): number {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function touchActivity() {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: idle timeout falls back to the session lifetime */
  }
}

export async function signOut(reason?: string) {
  await supabase.auth.signOut();
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
  const params = reason ? `?reason=${reason}` : '';
  location.replace(`/admin/login/${params}`);
}

function watchIdle() {
  let last = 0;
  const onActivity = () => {
    const now = Date.now();
    if (now - last > 15_000) {
      last = now;
      touchActivity();
    }
  };
  ['pointerdown', 'keydown', 'scroll', 'visibilitychange'].forEach((type) =>
    window.addEventListener(type, onActivity, { passive: true }),
  );
  setInterval(() => {
    const at = readActivity();
    if (at && Date.now() - at > IDLE_LIMIT_MS) void signOut('idle');
  }, 60_000);
}

async function check(): Promise<AdminSession> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return goToLogin();

  const lastActivity = readActivity();
  if (lastActivity && Date.now() - lastActivity > IDLE_LIMIT_MS) {
    await supabase.auth.signOut();
    return goToLogin('idle');
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return goToLogin();

  const { data: isAdmin, error } = await supabase.rpc('is_admin');
  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    return goToLogin('denied');
  }

  touchActivity();
  watchIdle();
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') void goToLogin();
  });
  document.documentElement.dataset.auth = 'ok';
  return { user: data.session.user };
}

let pending: Promise<AdminSession> | null = null;

/** Resolves once the viewer is confirmed as an admin; redirects to login otherwise. */
export function ready(): Promise<AdminSession> {
  pending ??= check();
  return pending;
}
