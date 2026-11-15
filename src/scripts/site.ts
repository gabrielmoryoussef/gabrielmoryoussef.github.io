/**
 * Site-wide behaviour. Everything here is progressive enhancement:
 * the site is fully readable and navigable without it.
 */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ theme */
type Mode = 'system' | 'light' | 'dark';
const ORDER: Mode[] = ['system', 'light', 'dark'];

function currentMode(): Mode {
  const t = root.getAttribute('data-theme');
  return t === 'light' || t === 'dark' ? t : 'system';
}

function setMode(mode: Mode) {
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  try {
    if (mode === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', mode);
  } catch {
    /* storage unavailable — the choice lasts for this page view */
  }
  syncThemeButtons();
  window.dispatchEvent(new CustomEvent('themechange'));
}

function syncThemeButtons() {
  const mode = currentMode();
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', `Color theme: ${mode}. Switch to ${next}.`);
    b.title = `Theme: ${mode}`;
  });
}

function cycleTheme() {
  const mode = currentMode();
  setMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]);
}

document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', cycleTheme));
syncThemeButtons();

/* ---------------------------------------------------- nav condense on scroll */
const nav = document.querySelector<HTMLElement>('[data-nav]');
const sentinel = document.querySelector('.nav-sentinel');
if (nav && sentinel) {
  new IntersectionObserver(([e]) => nav.classList.toggle('is-condensed', !e.isIntersecting)).observe(sentinel);
}

/* -------------------------------------------- scroll progress (fallback only) */
if (!CSS.supports('animation-timeline: scroll()')) {
  const bar = document.querySelector<HTMLElement>('.scroll-progress');
  let ticking = false;
  const update = () => {
    const max = root.scrollHeight - innerHeight;
    bar?.style.setProperty('--progress', String(max > 0 ? scrollY / max : 0));
    ticking = false;
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/* ------------------------------------------------------- reveal on scroll */
const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduceMotion.matches || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  revealables.forEach((el) => io.observe(el));
}

/* --------------------------------------------------- email de-obfuscation */
document.querySelectorAll<HTMLAnchorElement>('[data-email]').forEach((a) => {
  const u = a.dataset.u;
  const d = a.dataset.d;
  if (!u || !d) return;
  const addr = `${u}@${d}`;
  a.href = `mailto:${addr}`;
  const label = a.querySelector('[data-email-text]');
  if (label) label.textContent = addr;
});

/* ------------------------------------------------------------------ toast */
let toastTimer: number | undefined;
export function toast(msg: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('is-on'), 2200);
}

/* --------------------------------------------- publication row behaviours */
document.addEventListener('click', async (ev) => {
  const target = ev.target as HTMLElement;

  const copyBtn = target.closest<HTMLButtonElement>('[data-copy-bibtex]');
  if (copyBtn) {
    const src = document.getElementById(copyBtn.dataset.copyBibtex!);
    const text = src?.textContent?.trim() ?? '';
    try {
      await navigator.clipboard.writeText(text);
      toast('BibTeX copied to clipboard');
    } catch {
      // Clipboard blocked: select the text so it can be copied manually.
      if (src) {
        src.hidden = false;
        const range = document.createRange();
        range.selectNodeContents(src);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      toast('Press ⌘C to copy');
    }
    return;
  }

  const absBtn = target.closest<HTMLButtonElement>('[data-abstract-toggle]');
  if (absBtn) {
    const region = document.getElementById(absBtn.getAttribute('aria-controls')!);
    if (!region) return;
    const open = absBtn.getAttribute('aria-expanded') !== 'true';
    absBtn.setAttribute('aria-expanded', String(open));
    region.classList.toggle('is-open', open);
    region.toggleAttribute('inert', !open);
  }
});

// Soft spotlight that follows the cursor across a publication row.
document.addEventListener(
  'pointermove',
  (ev) => {
    if (ev.pointerType !== 'mouse') return;
    const row = (ev.target as HTMLElement).closest<HTMLElement>('[data-spotlight]');
    if (!row) return;
    const r = row.getBoundingClientRect();
    row.style.setProperty('--mx', `${ev.clientX - r.left}px`);
    row.style.setProperty('--my', `${ev.clientY - r.top}px`);
  },
  { passive: true },
);

/* ------------------------------------------------------- command palette */
const dlg = document.getElementById('cmdk') as HTMLDialogElement | null;
if (dlg) {
  const input = dlg.querySelector<HTMLInputElement>('[data-cmdk-input]')!;
  const list = dlg.querySelector<HTMLUListElement>('[data-cmdk-list]')!;
  const empty = dlg.querySelector<HTMLElement>('[data-cmdk-empty]')!;
  const options = Array.from(list.querySelectorAll<HTMLLIElement>('[role="option"]'));
  let active = 0;
  let lastFocus: Element | null = null;

  const visible = () => options.filter((o) => !o.hidden);

  const setActive = (i: number) => {
    const vis = visible();
    if (!vis.length) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    active = (i + vis.length) % vis.length;
    vis.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', vis[active].id);
    vis[active].scrollIntoView({ block: 'nearest' });
  };

  const filter = () => {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    options.forEach((o) => {
      const text = o.dataset.text ?? '';
      o.hidden = !terms.every((t) => text.includes(t));
      o.setAttribute('aria-selected', 'false');
    });
    empty.hidden = visible().length > 0;
    setActive(0);
  };

  const open = () => {
    if (dlg.open) return;
    lastFocus = document.activeElement;
    input.value = '';
    filter();
    dlg.showModal();
    input.focus();
  };

  const close = () => {
    dlg.close();
  };

  dlg.addEventListener('close', () => {
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  });

  const choose = (o: HTMLLIElement | undefined) => {
    if (!o) return;
    if (o.dataset.action === 'theme') {
      cycleTheme();
      close();
      return;
    }
    const href = o.dataset.href;
    if (!href) return;
    close();
    if ('external' in o.dataset) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.hash) {
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (el) {
        history.pushState(null, '', url.hash);
        el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        el.focus?.({ preventScroll: true });
        el.dispatchEvent(new CustomEvent('cmdk:target', { bubbles: true }));
        return;
      }
    }
    location.href = url.href;
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(visible()[active]);
    }
  });

  list.addEventListener('click', (e) => {
    const o = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (o) choose(o);
  });
  list.addEventListener('pointermove', (e) => {
    const o = (e.target as HTMLElement).closest<HTMLLIElement>('[role="option"]');
    if (!o) return;
    const i = visible().indexOf(o);
    if (i >= 0 && i !== active) setActive(i);
  });

  // Click on the backdrop closes.
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });

  document.querySelectorAll('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dlg.open ? close() : open();
    } else if (e.key === '/' && !dlg.open && !(e.target as HTMLElement).closest('input, textarea, [contenteditable]')) {
      e.preventDefault();
      open();
    }
  });
}
