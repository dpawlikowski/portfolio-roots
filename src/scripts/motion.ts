// Scroll engine and the always-loaded effects: pinned horizontal chapters, hero seam, lantern, card sheen.
// Everything here is created inside init() and fully reverted by the returned teardown.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { state, html, finePointer, clamp, lerp, emit } from './state';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export let lenis: Lenis | null = null;

export function scrollToTarget(target: Element | number) {
  if (lenis) lenis.scrollTo(target as HTMLElement | number, { duration: 1.2 });
  else if (typeof target === 'number') window.scrollTo({ top: target });
  else target.scrollIntoView();
}

export function initMotion(): () => void {
  const cleanups: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions) => {
    t.addEventListener(type, fn, opts);
    cleanups.push(() => t.removeEventListener(type, fn, opts));
  };
  const ctx = gsap.context(() => {});
  const fine = finePointer();
  const touch = !fine;

  // ---------- smooth wheel only (touch stays native) ----------
  if (fine) {
    lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => {
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
    });
  }
  html.classList.add('fx-ready');
  cleanups.push(() => html.classList.remove('fx-ready'));

  // ---------- chapters: vertical scroll → horizontal travel ----------
  const canPin = () => window.innerHeight >= 500;
  type ActState = { el: HTMLElement; track: HTMLElement; cards: HTMLElement[]; offsets: Array<[number, number]>; st: ScrollTrigger | null; active: number; skew: number; skewOut: string; px: string[] };
  const acts: ActState[] = [];

  ctx.add(() => {
    document.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
      if (!canPin()) return;
      const track = el.querySelector<HTMLElement>('[data-track]')!;
      const cards = [...track.querySelectorAll<HTMLElement>('.work')];
      el.dataset.pinned = '';
      const a: ActState = { el, track, cards, offsets: [], st: null, active: -1, skew: 0, skewOut: '', px: [] };
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const pinLen = () => Math.min(dist(), window.innerHeight * (touch ? 1.8 : 2.0));
      const measure = () => {
        a.offsets = cards.map((c) => [c.offsetLeft, c.offsetWidth]);
      };
      const snapPoints = () => {
        const d = dist() || 1;
        return [0, ...a.offsets.map(([l, w]) => clamp((l + w / 2 - window.innerWidth / 2) / d, 0, 1)), 1];
      };
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${pinLen()}`,
          pin: true,
          scrub: touch ? 0.35 : true,
          invalidateOnRefresh: true,
          onRefresh: measure,
          snap: touch
            ? { snapTo: (v: number) => snapPoints().reduce((p, c) => (Math.abs(c - v) < Math.abs(p - v) ? c : p)), duration: { min: 0.15, max: 0.45 }, ease: 'power2.out', delay: 0.04 }
            : undefined,
        },
      });
      a.st = tween.scrollTrigger ?? null;
      measure();
      acts.push(a);

      // Keyboard: arrows move between cards; focus brings the card into view in pinned mode.
      on(track, 'keydown', ((e: KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const items = [...track.querySelectorAll<HTMLElement>('.cta, .work__link, .link')];
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (i < 0) return;
        const next = items[clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, items.length - 1)];
        e.preventDefault();
        next.focus();
      }) as EventListener);
      on(track, 'focusin', ((e: FocusEvent) => {
        const st = a.st;
        const target = (e.target as HTMLElement).closest<HTMLElement>('.work, .panel');
        if (!st || !target) return;
        const d = dist() || 1;
        const p = clamp((target.offsetLeft + target.offsetWidth / 2 - window.innerWidth / 2) / d, 0, 1);
        const y = st.start + p * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
      }) as EventListener);
    });
  });

  // Per-frame: parallax inside cards, velocity skew, counter, look-ahead loading.
  const tick = () => {
    const vw = window.innerWidth;
    for (const a of acts) {
      const st = a.st;
      if (!st || !st.isActive) continue;
      const x = Number(gsap.getProperty(a.track, 'x')) || 0;
      let best = 0;
      let bestD = Infinity;
      a.offsets.forEach(([l, w], i) => {
        const center = l + w / 2 + x;
        const rel = (center - vw / 2) / vw;
        if (Math.abs(rel) < 1.6) {
          const px = (-rel * 8).toFixed(1);
          if (a.px[i] !== px) {
            a.px[i] = px;
            a.cards[i].style.setProperty('--px', `${px}%`);
          }
        }
        const d = Math.abs(center - vw / 2);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      const v = st.getVelocity();
      a.skew = lerp(a.skew, clamp(v / -400, -6, 6), 0.12);
      const skew = Math.abs(a.skew) < 0.05 ? '0' : a.skew.toFixed(1);
      if (skew !== a.skewOut) {
        a.skewOut = skew;
        a.track.style.setProperty('--skew', skew);
      }
      if (best !== a.active) {
        a.active = best;
        const count = a.el.querySelector('[data-count]');
        const current = a.el.querySelector<HTMLElement>('[data-current]');
        if (count) count.textContent = String(best + 1).padStart(2, '0');
        if (current) {
          current.textContent = a.cards[best]?.dataset.title ?? '';
          if (a.el.dataset.act === 'styx') {
            current.classList.remove('is-glitch');
            void current.offsetWidth;
            current.classList.add('is-glitch');
          }
        }
        for (const k of [best + 1, best + 2]) a.cards[k]?.querySelector('img')?.setAttribute('loading', 'eager');
      }
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => gsap.ticker.remove(tick));

  // ---------- passage progress (drives CSS fallback, shader, sound) ----------
  const passage = document.querySelector<HTMLElement>('.passage');
  if (passage) {
    ctx.add(() => {
      ScrollTrigger.create({
        trigger: passage,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          state.passage = self.progress;
          passage.style.setProperty('--p', self.progress.toFixed(3));
          emit('passage', self.progress);
        },
        onToggle: (self) => {
          state.passageVisible = self.isActive;
        },
      });
      // mix: 0 before the passage, 1 after it
      ScrollTrigger.create({
        trigger: passage,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          state.mix = self.progress;
          emit('mix', self.progress);
        },
      });
    });
  }

  // ---------- hero: the seam follows the pointer (desktop) or tilt / slow drift (touch) ----------
  const hero = document.querySelector<HTMLElement>('.hero');
  if (hero) {
    let target = 0.5;
    let current = 0.5;
    let visible = true;
    let tilt: number | null = null;
    const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(hero);
    cleanups.push(() => io.disconnect());
    if (fine) {
      on(hero, 'pointermove', ((e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        target = clamp((e.clientX - r.left) / r.width, 0.08, 0.92);
      }) as EventListener);
      on(hero, 'click', ((e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        const r = hero.getBoundingClientRect();
        const side = (e.clientX - r.left) / r.width < current ? '#styx' : '#wkrenta';
        const el = document.querySelector(side);
        if (el) scrollToTarget(el);
      }) as EventListener);
    } else {
      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.gamma == null) return;
        tilt = clamp(0.5 + e.gamma / 60, 0.1, 0.9);
      };
      on(hero, 'click', (async (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button') || tilt !== null) return;
        type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
        const D = window.DeviceOrientationEvent as DOE | undefined;
        try {
          if (D?.requestPermission && (await D.requestPermission()) !== 'granted') return;
          on(window, 'deviceorientation', onOrient as EventListener);
        } catch {
          /* permission refused: keep the slow drift */
        }
      }) as unknown as EventListener);
    }
    // Only repaint while the seam is actually moving: no idle per-frame work (keeps TBT near zero).
    const seam = () => {
      if (!visible) return;
      if (!fine && tilt !== null) target = tilt;
      if (Math.abs(target - current) < 0.0015) return;
      current = lerp(current, target, 0.1);
      const k = 0.11;
      hero.style.setProperty('--st', `${((current + k) * 100).toFixed(2)}%`);
      hero.style.setProperty('--sb', `${((current - k) * 100).toFixed(2)}%`);
    };
    void t0;
    gsap.ticker.add(seam);
    cleanups.push(() => {
      gsap.ticker.remove(seam);
      hero.style.removeProperty('--st');
      hero.style.removeProperty('--sb');
    });
  }

  // ---------- Styx: the lantern reveals the eyes hidden in the dark ----------
  const styx = document.querySelector<HTMLElement>('.act--styx');
  const bg = styx?.querySelector<HTMLElement>('.act__bg');
  if (styx && bg) {
    const L = { x: 0, y: 0, r: 0, tx: 0, ty: 0, tr: 0 };
    const pos = (e: PointerEvent) => {
      const rect = bg.getBoundingClientRect();
      L.tx = e.clientX - rect.left;
      L.ty = e.clientY - rect.top;
    };
    if (fine) {
      on(styx, 'pointermove', ((e: PointerEvent) => {
        pos(e);
        L.tr = Math.min(window.innerWidth, window.innerHeight) * 0.32;
        if (L.r < 1) {
          L.x = L.tx;
          L.y = L.ty;
        }
      }) as EventListener);
      on(styx, 'pointerleave', () => (L.tr = 0));
    } else {
      let timer = 0;
      let startX = 0;
      let startY = 0;
      on(styx, 'pointerdown', ((e: PointerEvent) => {
        startX = e.clientX;
        startY = e.clientY;
        pos(e);
        L.x = L.tx;
        L.y = L.ty;
        timer = window.setTimeout(() => (L.tr = Math.min(window.innerWidth, window.innerHeight) * 0.42), 450);
      }) as EventListener);
      on(styx, 'pointermove', ((e: PointerEvent) => {
        if (L.tr === 0 && Math.hypot(e.clientX - startX, e.clientY - startY) > 10) clearTimeout(timer);
        pos(e);
      }) as EventListener);
      const end = () => {
        clearTimeout(timer);
        window.setTimeout(() => (L.tr = 0), 600);
      };
      on(styx, 'pointerup', end);
      on(styx, 'pointercancel', end);
    }
    const lantern = () => {
      if (L.tr === 0 && L.r < 0.5) return;
      L.x = lerp(L.x, L.tx, 0.14);
      L.y = lerp(L.y, L.ty, 0.14);
      L.r = lerp(L.r, L.tr, 0.08);
      bg.style.setProperty('--lx', `${L.x.toFixed(1)}px`);
      bg.style.setProperty('--ly', `${L.y.toFixed(1)}px`);
      bg.style.setProperty('--lr', `${L.r.toFixed(1)}px`);
    };
    gsap.ticker.add(lantern);
    cleanups.push(() => gsap.ticker.remove(lantern));
  }

  // ---------- Wkrenta: a pink glare follows the pointer over her cards ----------
  if (fine) {
    document.querySelectorAll<HTMLElement>('.work--wkrenta .work__link').forEach((link) => {
      const frame = link.querySelector<HTMLElement>('.work__frame');
      on(link, 'pointermove', ((e: PointerEvent) => {
        const r = link.getBoundingClientRect();
        frame?.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
        frame?.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      }) as EventListener);
    });
  }

  // Anchor links go through Lenis so the smooth scroll and the pins stay in sync.
  if (lenis) {
    on(document, 'click', ((e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      const el = document.querySelector(a.getAttribute('href')!);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el);
      history.replaceState(null, '', a.getAttribute('href'));
    }) as EventListener);
  }

  // ScrollTrigger refreshes on load by itself; refresh again only if webfonts are still swapping in.
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => {
    cleanups.reverse().forEach((fn) => fn());
    ctx.revert();
    for (const a of acts) {
      delete a.el.dataset.pinned;
      a.track.style.removeProperty('--skew');
      a.cards.forEach((c) => c.style.removeProperty('--px'));
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());
    ScrollTrigger.refresh();
  };
}

/** Quality guard: below 45 fps for 2 s → drop the shader and thin out the trail. */
export function startQualityGuard() {
  let frames = 0;
  let last = performance.now();
  let slow = 0;
  const watch = () => {
    frames++;
    const now = performance.now();
    if (now - last < 500) return;
    const fps = (frames * 1000) / (now - last);
    frames = 0;
    last = now;
    if (document.visibilityState !== 'visible') return;
    slow = fps < 45 ? slow + 0.5 : 0;
    if (slow >= 2 && !state.lowQuality) {
      state.lowQuality = true;
      emit('quality:low');
      gsap.ticker.remove(watch);
    }
  };
  gsap.ticker.add(watch);
}
