// Entry. Content works without this file; it only enhances.
// Kept small on purpose: the scroll engine (GSAP, ScrollTrigger, Lenis) loads on the first interaction,
// so nothing heavy runs while the page is first painted.
import { html, motionAllowed, saveData, emit } from './state';
import { initProgress, initWorlds, initLightbox, initForm, initMisc } from './ui';

initProgress();
initWorlds();
initLightbox();
initForm();
initMisc();

// ---------- scroll engine, on demand ----------
let teardown: (() => void) | null = null;
let loading: Promise<void> | null = null;
function loadMotion(): Promise<void> {
  if (!motionAllowed()) return Promise.resolve();
  if (!loading) {
    loading = import('./motion').then((m) => {
      if (!motionAllowed() || teardown) return;
      teardown = m.initMotion();
      m.startQualityGuard();
      startLazy();
    });
  }
  return loading;
}
const triggers = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
const kick = () => {
  triggers.forEach((t) => window.removeEventListener(t, kick));
  void loadMotion();
};
triggers.forEach((t) => window.addEventListener(t, kick, { passive: true, once: true }));
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelector('.hero')?.addEventListener('pointermove', kick, { once: true, passive: true });
}
// A deep link (#styx, #kontakt…) or a restored scroll position: start right away.
// Browsers restore the position after load, so check again then.
window.addEventListener('load', () => window.scrollY > 0 && void loadMotion(), { once: true });
if (location.hash || window.scrollY > 0) void loadMotion();

// ---------- motion on/off (prefers-reduced-motion by default, remembered toggle) ----------
const motionBtn = document.querySelector<HTMLButtonElement>('.toggle--motion');
if (motionBtn) {
  motionBtn.hidden = false;
  motionBtn.setAttribute('aria-pressed', String(!motionAllowed()));
  motionBtn.addEventListener('click', async () => {
    const reduce = motionAllowed();
    const anchor = [...document.querySelectorAll<HTMLElement>('main > section')].find((s) => s.getBoundingClientRect().bottom > window.innerHeight / 2);
    try {
      localStorage.setItem('motion', reduce ? 'reduced' : 'full');
    } catch {
      /* storage blocked: still switch for this visit */
    }
    html.classList.toggle('reduce-motion', reduce);
    html.classList.toggle('fx', !reduce);
    motionBtn.setAttribute('aria-pressed', String(reduce));
    if (reduce) {
      teardown?.();
      teardown = null;
      loading = null;
      emit('quality:low');
    } else {
      await loadMotion();
      startLazy();
    }
    anchor?.scrollIntoView();
  });
}

// ---------- sound: opt-in, remembered, starts only on a deliberate gesture ----------
const soundBtn = document.querySelector<HTMLButtonElement>('.toggle--sound');
if (soundBtn && 'AudioContext' in window) {
  soundBtn.hidden = false;
  let audio: { setOn(on: boolean): void } | null = null;
  let wanted = false;
  try {
    wanted = localStorage.getItem('sound') === 'on';
  } catch {
    wanted = false;
  }
  const set = async (on: boolean) => {
    soundBtn.setAttribute('aria-pressed', String(on));
    try {
      localStorage.setItem('sound', on ? 'on' : 'off');
    } catch {
      /* ignore */
    }
    if (on && !audio) audio = (await import('./audio')).createAudio();
    audio?.setOn(on);
  };
  soundBtn.setAttribute('aria-pressed', String(wanted));
  soundBtn.addEventListener('click', () => set(soundBtn.getAttribute('aria-pressed') !== 'true'));
  if (wanted) {
    // remembered "on": wait for the first click or key, never for scroll
    const start = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('.toggle--sound')) return;
      void set(true);
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
  }
}

// ---------- optional effects: shader near the transition, pointer trail on desktop ----------
let lazyStarted = false;
function startLazy() {
  if (lazyStarted || !motionAllowed() || saveData()) return;
  lazyStarted = true;
  const passage = document.querySelector('.passage');
  if (passage) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        import('./shader').then((m) => m.initShader());
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(passage);
  }
  const wk = document.querySelector('.act--wkrenta');
  if (wk && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      import('./trail').then((m) => m.initTrail());
    });
    io.observe(wk);
  }
}
