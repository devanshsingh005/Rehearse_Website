/**
 * Authenticator ("phone") helpers shared by the login and Security pages.
 * Each phone is its own Supabase TOTP factor, so any one can be removed on its own.
 */
import type { Factor } from '@supabase/supabase-js';
import { supabase } from './client';
import { esc } from './ui';

const LAST_FACTOR_KEY = 'rehearse-admin-last-factor';

/** Remembers which phone was used on this browser, so it's preselected next time. */
export function rememberFactor(id: string) {
  try {
    localStorage.setItem(LAST_FACTOR_KEY, id);
  } catch {
    /* per-browser convenience only */
  }
}

export function lastFactorId(): string | null {
  try {
    return localStorage.getItem(LAST_FACTOR_KEY);
  } catch {
    return null;
  }
}

export async function listPhones(): Promise<{ verified: Factor[]; unverified: Factor[] }> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const totp = data.all.filter((f) => f.factor_type === 'totp');
  return {
    verified: totp.filter((f) => f.status === 'verified').sort((a, b) => a.created_at.localeCompare(b.created_at)),
    unverified: totp.filter((f) => f.status !== 'verified'),
  };
}

export function phoneName(f: Factor): string {
  return f.friendly_name?.trim() || 'Authenticator';
}

/** Order phones with the one last used on this browser first. */
export function preferredFirst(factors: Factor[]): Factor[] {
  const last = lastFactorId();
  return [...factors].sort((a, b) => Number(b.id === last) - Number(a.id === last));
}

export function friendlyMfaError(message: string): string {
  if (/invalid totp|invalid code|code/i.test(message)) return "That code didn't work. Check the phone you picked and try again.";
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  return message;
}

/**
 * Asks for a current code from one of the admin's phones and verifies it.
 * Resolves with the factor id that was verified, or null if cancelled.
 */
export function verifyWithPhone(opts: { title: string; body: string; factors: Factor[]; confirmLabel: string }): Promise<string | null> {
  return new Promise((resolve) => {
    const factors = preferredFirst(opts.factors);
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    const dialog = document.createElement('form');
    dialog.className = 'dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'stepup-title');
    dialog.noValidate = true;
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3 id="stepup-title">${esc(opts.title)}</h3>
        <p>${esc(opts.body)}</p>
        ${
          factors.length > 1
            ? `<div class="field"><label for="stepup-factor">Phone</label><select class="select" id="stepup-factor">${factors
                .map((f) => `<option value="${esc(f.id)}">${esc(phoneName(f))}</option>`)
                .join('')}</select></div>`
            : ''
        }
        <div class="field"><label for="stepup-code">6-digit code${factors.length === 1 ? ` from ${esc(phoneName(factors[0]))}` : ''}</label>
          <input class="input otp" id="stepup-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>
        <p class="error-text" id="stepup-error" role="alert" hidden></p>
      </div>
      <div class="dialog-foot">
        <button type="button" class="btn" data-cancel>Cancel</button>
        <button type="submit" class="btn btn-primary" data-ok>${esc(opts.confirmLabel)}</button>
      </div>`;
    document.body.append(backdrop, dialog);
    const previous = document.activeElement as HTMLElement | null;
    const code = dialog.querySelector<HTMLInputElement>('#stepup-code')!;
    const select = dialog.querySelector<HTMLSelectElement>('#stepup-factor');
    const errorEl = dialog.querySelector<HTMLElement>('#stepup-error')!;
    const ok = dialog.querySelector<HTMLButtonElement>('[data-ok]')!;
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      dialog.classList.add('open');
      code.focus();
    });

    let done = false;
    const close = (value: string | null) => {
      if (done) return;
      done = true;
      backdrop.classList.remove('open');
      dialog.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        backdrop.remove();
        dialog.remove();
        previous?.focus();
      }, 180);
      resolve(value);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', () => close(null));
    dialog.querySelector('[data-cancel]')!.addEventListener('click', () => close(null));

    code.addEventListener('input', () => {
      code.value = code.value.replace(/\D/g, '').slice(0, 6);
      if (code.value.length === 6) dialog.requestSubmit();
    });
    dialog.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!/^\d{6}$/.test(code.value)) {
        errorEl.textContent = 'Enter the 6-digit code.';
        errorEl.hidden = false;
        return;
      }
      const factorId = select?.value ?? factors[0].id;
      ok.setAttribute('aria-busy', 'true');
      ok.disabled = true;
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.value });
      ok.removeAttribute('aria-busy');
      ok.disabled = false;
      if (error) {
        code.value = '';
        errorEl.textContent = friendlyMfaError(error.message);
        errorEl.hidden = false;
        code.focus();
        return;
      }
      rememberFactor(factorId);
      close(factorId);
    });
  });
}
