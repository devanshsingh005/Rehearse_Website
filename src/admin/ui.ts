/** Shared UI helpers for the admin dashboard: escaping, formatting, toasts, dialogs, drawers, states. */

// Lucide icon paths (ISC licence), inlined so JS-rendered markup needs no extra requests.
const ICONS: Record<string, string> = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  fileCheck: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
};

export function icon(name: keyof typeof ICONS | string, extra = ''): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[name] ?? ''}</svg>`;
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function $<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

// ---------- Formatting ----------
const nf = new Intl.NumberFormat('en');
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = {
  n: (v: unknown) => (v == null || Number.isNaN(Number(v)) ? '—' : nf.format(Number(v))),
  compact: (v: unknown) => (v == null ? '—' : Number(v) < 10000 ? nf.format(Number(v)) : compact.format(Number(v))),
  pct: (v: number, digits = 0) => `${(v * 100).toFixed(digits)}%`,
  date: (v: unknown) =>
    v ? new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
  dateTime: (v: unknown) =>
    v
      ? new Date(String(v)).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      : '—',
  shortDay: (v: string) => new Date(`${v}T00:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' }),
  ago(v: unknown): string {
    if (!v) return 'Never';
    const diff = Date.now() - new Date(String(v)).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d} d ago`;
    return fmt.date(v);
  },
  duration(seconds: unknown): string {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h} h ${m % 60} min`;
  },
  bytes(v: unknown): string {
    const b = Number(v) || 0;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  },
};

export function initials(text: string | null | undefined): string {
  const parts = String(text ?? '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 250) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ---------- States ----------
export const states = {
  empty: (title: string, body = '', iconName = 'inbox') =>
    `<div class="state">${icon(iconName)}<h4>${esc(title)}</h4>${body ? `<p>${esc(body)}</p>` : ''}</div>`,
  error: (message: string) =>
    `<div class="state state-error">${icon('alert')}<h4>Couldn't load this</h4><p>${esc(message)}</p><button class="btn btn-sm" data-retry>${icon('refresh')}Try again</button></div>`,
  tableSkeleton: (rows = 6, cols = 5) =>
    `<div class="table-wrap"><table class="table"><tbody>${Array.from({ length: rows }, () =>
      `<tr>${Array.from({ length: cols }, (_, i) => `<td><div class="skeleton sk-line" style="width:${i === 0 ? 70 : 40 + ((i * 17) % 40)}%"></div></td>`).join('')}</tr>`,
    ).join('')}</tbody></table></div>`,
};

/** Renders an error state into `el` and wires its retry button. */
export function showError(el: HTMLElement, error: unknown, retry: () => void) {
  el.innerHTML = states.error(error instanceof Error ? error.message : String(error));
  el.querySelector('[data-retry]')?.addEventListener('click', retry, { once: true });
}

// ---------- Toasts ----------
export function toast(message: string, kind: 'success' | 'error' | 'info' = 'success') {
  let host = document.querySelector<HTMLElement>('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = `${icon(kind === 'success' ? 'checkCircle' : kind === 'error' ? 'alert' : 'info')}<div>${esc(message)}</div>`;
  host.append(el);
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  }, kind === 'error' ? 6000 : 3500);
}

// ---------- Dialog ----------
export interface ConfirmOptions {
  title: string;
  body?: string;
  /** Raw HTML placed under the body (already escaped by the caller). */
  html?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Adds a text field; its value is returned. */
  input?: { label: string; placeholder?: string; required?: boolean; multiline?: boolean; value?: string };
  /** Adds a checkbox that must be ticked before confirming. */
  acknowledge?: string;
}

/** Resolves with the input text (or '') when confirmed, null when cancelled. */
export function confirmDialog(opts: ConfirmOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    const field = opts.input
      ? `<div class="field"><label for="dialog-input">${esc(opts.input.label)}</label>${
          opts.input.multiline
            ? `<textarea id="dialog-input" class="textarea" maxlength="2000" placeholder="${esc(opts.input.placeholder ?? '')}">${esc(opts.input.value ?? '')}</textarea>`
            : `<input id="dialog-input" class="input" maxlength="500" placeholder="${esc(opts.input.placeholder ?? '')}" value="${esc(opts.input.value ?? '')}">`
        }</div>`
      : '';
    const ack = opts.acknowledge
      ? `<label class="switch"><input type="checkbox" id="dialog-ack"><span class="track"></span><span>${esc(opts.acknowledge)}</span></label>`
      : '';
    dialog.innerHTML = `
      <div class="dialog-body">
        <h3 id="dialog-title">${esc(opts.title)}</h3>
        ${opts.body ? `<p>${esc(opts.body)}</p>` : ''}
        ${opts.html ?? ''}
        ${field}
        ${ack}
      </div>
      <div class="dialog-foot">
        <button class="btn" data-cancel>Cancel</button>
        <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(opts.confirmLabel ?? 'Confirm')}</button>
      </div>`;
    document.body.append(backdrop, dialog);
    const previous = document.activeElement as HTMLElement | null;
    const ok = dialog.querySelector<HTMLButtonElement>('[data-ok]')!;
    const input = dialog.querySelector<HTMLInputElement | HTMLTextAreaElement>('#dialog-input');
    const ackBox = dialog.querySelector<HTMLInputElement>('#dialog-ack');
    const sync = () => {
      ok.disabled = Boolean((opts.input?.required && !input?.value.trim()) || (ackBox && !ackBox.checked));
    };
    input?.addEventListener('input', sync);
    ackBox?.addEventListener('change', sync);
    sync();
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
      dialog.classList.add('open');
      (input ?? ok).focus();
    });
    const close = (value: string | null) => {
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
      if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement) && !ok.disabled) close(input?.value.trim() ?? '');
    };
    document.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', () => close(null));
    dialog.querySelector('[data-cancel]')!.addEventListener('click', () => close(null));
    ok.addEventListener('click', () => close(input?.value.trim() ?? ''));
  });
}

// ---------- Drawer ----------
export interface Drawer {
  body: HTMLElement;
  foot: HTMLElement;
  setTitle(text: string): void;
  close(): void;
}

let openDrawer: Drawer | null = null;

export function drawer(title: string, onClose?: () => void): Drawer {
  openDrawer?.close();
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  const panel = document.createElement('aside');
  panel.className = 'drawer';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = `
    <div class="drawer-head"><h3></h3><button class="btn btn-ghost btn-icon" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="drawer-body"></div>
    <div class="drawer-foot" hidden></div>`;
  document.body.append(backdrop, panel);
  const h3 = panel.querySelector('h3')!;
  h3.textContent = title;
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    panel.classList.add('open');
    panel.querySelector<HTMLButtonElement>('[data-close]')!.focus();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !document.querySelector('.dialog')) api.close();
  };
  document.addEventListener('keydown', onKey);
  const api: Drawer = {
    body: panel.querySelector('.drawer-body')!,
    foot: panel.querySelector('.drawer-foot')!,
    setTitle: (text) => (h3.textContent = text),
    close() {
      if (openDrawer !== api) return;
      openDrawer = null;
      document.removeEventListener('keydown', onKey);
      backdrop.classList.remove('open');
      panel.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
        panel.remove();
      }, 250);
      onClose?.();
    },
  };
  backdrop.addEventListener('click', () => api.close());
  panel.querySelector('[data-close]')!.addEventListener('click', () => api.close());
  openDrawer = api;
  return api;
}

/** Marks a button busy while `task` runs. */
export async function busy<T>(button: HTMLButtonElement, task: () => Promise<T>): Promise<T> {
  button.setAttribute('aria-busy', 'true');
  button.disabled = true;
  try {
    return await task();
  } finally {
    button.removeAttribute('aria-busy');
    button.disabled = false;
  }
}
