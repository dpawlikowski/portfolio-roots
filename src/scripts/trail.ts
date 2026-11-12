// Wkrenta's chapter: a few pink ink drops follow the pointer and fade. Pooled, capped, paused off-screen.
import gsap from 'gsap';
import { state } from './state';

type Drop = { x: number; y: number; r: number; life: number; vy: number; alive: boolean };

export function initTrail() {
  const act = document.querySelector<HTMLElement>('.act--wkrenta');
  const canvas = act?.querySelector<HTMLCanvasElement>('.act__trail');
  const ctx2d = canvas?.getContext('2d');
  if (!act || !canvas || !ctx2d) return;
  let max = state.lowQuality ? 12 : 40;
  const pool: Drop[] = Array.from({ length: 40 }, () => ({ x: 0, y: 0, r: 0, life: 0, vy: 0, alive: false }));
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  let lastX = 0;
  let lastY = 0;
  act.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const speed = Math.hypot(x - lastX, y - lastY);
    lastX = x;
    lastY = y;
    if (speed < 6) return;
    const d = pool.slice(0, max).find((p) => !p.alive);
    if (!d) return;
    Object.assign(d, { x, y, r: 2 + Math.random() * 3.5, life: 1, vy: 0.2 + Math.random() * 0.6, alive: true });
  });

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(act);
  const draw = () => {
    if (!visible) return;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pool) {
      if (!p.alive) continue;
      p.life -= 0.022;
      p.y += p.vy;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      ctx2d.globalAlpha = p.life * 0.85;
      ctx2d.fillStyle = '#ff2e93';
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, p.r * (0.6 + p.life * 0.4), 0, Math.PI * 2);
      ctx2d.fill();
    }
    ctx2d.globalAlpha = 1;
  };
  gsap.ticker.add(draw);
  window.addEventListener('quality:low', () => (max = 12));
}
