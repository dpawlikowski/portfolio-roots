// Shared, tiny state for the effects. No framework: one object, events for changes.
export const state = {
  /** 0 = fully in Styx's world, 1 = fully in Wkrenta's (driven by the passage). */
  mix: 0,
  /** Passage progress 0..1. */
  passage: 0,
  passageVisible: false,
  lowQuality: false,
};

export const html = document.documentElement;
export const motionAllowed = () => html.classList.contains('fx');
export const saveData = () => html.classList.contains('save-data');
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
