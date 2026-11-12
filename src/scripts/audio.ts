// Sound, synthesised (no files, no licences). Styx: a low drone with a slow pulse.
// Wkrenta: a soft music-box arpeggio. The mix follows the story (state.mix). Silent when the tab is hidden.
import { state } from './state';

export function createAudio() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // ---- Styx: drone ----
  const droneGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  filter.Q.value = 6;
  filter.connect(droneGain);
  droneGain.connect(master);
  for (const [f, type] of [[55, 'sawtooth'], [55.4, 'sawtooth'], [27.5, 'sine']] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = type === 'sine' ? 0.5 : 0.18;
    o.connect(g).connect(filter);
    o.start();
  }
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // ---- Wkrenta: music box ----
  const boxGain = ctx.createGain();
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.28;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  delay.connect(fb).connect(delay);
  boxGain.connect(master);
  delay.connect(boxGain);
  const notes = [72, 76, 79, 81, 84, 81, 79, 76, 74, 77, 81, 84];
  let step = 0;
  let nextAt = ctx.currentTime + 0.1;
  const pluck = (midi: number, when: number) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.22, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.1);
    o.connect(g);
    g.connect(boxGain);
    g.connect(delay);
    o.start(when);
    o.stop(when + 1.2);
  };
  const scheduler = window.setInterval(() => {
    while (nextAt < ctx.currentTime + 0.25) {
      if (state.mix > 0.05) pluck(notes[step % notes.length], nextAt);
      step++;
      nextAt += 0.32;
    }
  }, 80);

  const mix = () => {
    const m = state.mix;
    const t = ctx.currentTime;
    droneGain.gain.setTargetAtTime((1 - m) * 0.5, t, 0.4);
    boxGain.gain.setTargetAtTime(m * 0.5, t, 0.4);
  };
  window.addEventListener('mix', mix);
  mix();

  let on = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void ctx.suspend();
    else if (on) void ctx.resume();
  });

  return {
    setOn(next: boolean) {
      on = next;
      const t = ctx.currentTime;
      if (next) {
        void ctx.resume();
        master.gain.setTargetAtTime(0.35, t, 0.6);
      } else {
        master.gain.setTargetAtTime(0, t, 0.25);
        window.setTimeout(() => !on && ctx.suspend(), 900);
      }
    },
    destroy() {
      clearInterval(scheduler);
      void ctx.close();
    },
  };
}
