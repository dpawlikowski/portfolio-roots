// Everything that must work with or without motion: story progress, current world, sticky booking,
// lightbox, booking form, map facade, easter egg, artist pre-selection.
import { html, state, clamp } from './state';

export function initProgress() {
  const fill = document.querySelector<HTMLElement>('.progress');
  const passage = document.querySelector<HTMLElement>('.passage');
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    fill?.style.setProperty('--progress', String(clamp(window.scrollY / Math.max(1, max), 0, 1)));
    if (passage && max > 0) {
      const mid = passage.offsetTop + passage.offsetHeight / 2 - window.innerHeight / 2;
      fill?.style.setProperty('--split-at', `${clamp((mid / max) * 100, 0, 100).toFixed(1)}%`);
    }
  };
  window.addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));
}

/** Which world the reader is in (nav colours, sticky button, sound) and which nav link is current. */
export function initWorlds() {
  const sections = [...document.querySelectorAll<HTMLElement>('main [data-theme], footer[data-theme]')];
  const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.nav__links a')].map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        const world = el.dataset.theme ?? 'styx';
        // Only touch <html> when the world really changes: any attribute write there restyles the whole page.
        if (html.dataset.world !== world) html.dataset.world = world;
        links.forEach((a, id) => {
          const cur = String(id === el.id);
          if (a.getAttribute('aria-current') !== cur) a.setAttribute('aria-current', cur);
        });
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  sections.filter((s) => s.id || s.tagName === 'FOOTER').forEach((s) => io.observe(s));
  document.querySelectorAll<HTMLElement>('.hero__world--styx').forEach((s) => io.observe(s));

  // Sticky booking button hides when the form is on screen.
  // Sticky booking button: hidden in the prologue (its own buttons are there) and next to the form.
  const sticky = document.querySelector<HTMLElement>('.sticky-cta');
  const watch = [document.querySelector('.hero__ui'), document.getElementById('kontakt')].filter(Boolean) as Element[];
  if (sticky && watch.length) {
    const seen = new Set<Element>();
    sticky.classList.add('is-hidden');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      sticky.classList.toggle('is-hidden', seen.size > 0);
    });
    watch.forEach((el) => io.observe(el));
  }
}

export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return; // no <dialog>: links open the image
  const img = dialog.querySelector<HTMLImageElement>('.lightbox__img')!;
  const caption = dialog.querySelector<HTMLElement>('.lightbox__caption')!;
  let list: HTMLAnchorElement[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;
  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const a = list[index];
    const thumb = a.querySelector('img');
    img.src = a.dataset.large ?? a.href;
    img.alt = thumb?.alt ?? '';
    caption.textContent = a.dataset.caption ?? '';
  };
  document.querySelectorAll<HTMLAnchorElement>('.work__link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      opener = a;
      list = [...(a.closest('[data-track]')?.querySelectorAll<HTMLAnchorElement>('.work__link') ?? [a])];
      show(list.indexOf(a));
      dialog.showModal();
    });
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => show(index + Number(b.dataset.step))));
  dialog.querySelector('.lightbox__close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
  dialog.addEventListener('close', () => {
    img.style.transform = '';
    opener?.focus();
  });
  // Swipe down to close, sideways to move.
  let sx = 0;
  let sy = 0;
  let dragging = false;
  img.addEventListener('pointerdown', (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    img.setPointerCapture(e.pointerId);
  });
  img.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - sy);
    img.style.transform = `translateY(${dy}px)`;
    img.style.opacity = String(1 - Math.min(dy / 400, 0.6));
  });
  const end = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    img.style.transform = '';
    img.style.opacity = '';
    if (dy > 90) dialog.close();
    else if (Math.abs(dx) > 70) show(index + (dx < 0 ? 1 : -1));
  };
  img.addEventListener('pointerup', end);
  img.addEventListener('pointercancel', end);
}

/** Files for the tattoo idea: keeps a list, validates type/size/count, thumbnails, removal, drag and drop. */
function initFiles(form: HTMLFormElement) {
  const box = form.querySelector<HTMLElement>('[data-files]');
  const input = box?.querySelector<HTMLInputElement>('input[type=file]');
  if (!box || !input) return { reset() {} };
  const list = box.querySelector<HTMLUListElement>('.files__list')!;
  const err = box.querySelector<HTMLElement>('.field__error')!;
  const drop = box.querySelector<HTMLElement>('.files__drop');
  const max = Number(box.dataset.max ?? 3);
  const maxBytes = Number(box.dataset.maxMb ?? 10) * 1024 * 1024;
  const okType = (f: File) => /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(f.type) || /\.(heic|heif)$/i.test(f.name);
  let files: File[] = [];
  let canEdit = true;
  try {
    new DataTransfer();
  } catch {
    canEdit = false; // old browsers: keep the native picker as is
  }
  const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const render = () => {
    list.querySelectorAll('img').forEach((img) => URL.revokeObjectURL(img.src));
    list.replaceChildren(
      ...files.map((f, i) => {
        const li = document.createElement('li');
        li.className = 'files__item';
        const isImg = /^image\/(jpeg|png|webp)$/.test(f.type);
        const thumb = isImg ? Object.assign(document.createElement('img'), { src: URL.createObjectURL(f), alt: '' }) : document.createElement('span');
        thumb.className = 'files__thumb';
        if (!isImg) thumb.textContent = f.name.split('.').pop()?.toUpperCase() ?? 'PLIK';
        const name = document.createElement('span');
        name.className = 'files__name';
        name.textContent = f.name;
        const size = document.createElement('small');
        size.textContent = kb(f.size);
        name.append(size);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'files__remove';
        rm.textContent = box.dataset.remove ?? 'Usuń';
        rm.setAttribute('aria-label', `${rm.textContent}: ${f.name}`);
        rm.addEventListener('click', () => {
          files.splice(i, 1);
          err.textContent = '';
          input.setAttribute('aria-invalid', 'false');
          sync();
          input.focus();
        });
        li.append(thumb, name, rm);
        return li;
      }),
    );
  };
  const sync = () => {
    if (canEdit) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    }
    render();
  };
  const add = (incoming: File[]) => {
    const msgs: string[] = [];
    for (const f of incoming) {
      if (!okType(f)) msgs.push(`${box.dataset.msgType} ${f.name}.`);
      else if (f.size > maxBytes) msgs.push(`${box.dataset.msgBig} ${f.name}.`);
      else if (files.length >= max) {
        msgs.push(box.dataset.msgMany ?? '');
        break;
      } else if (!files.some((x) => x.name === f.name && x.size === f.size)) files.push(f);
    }
    err.textContent = msgs.join(' ');
    input.setAttribute('aria-invalid', String(msgs.length > 0));
    sync();
  };
  input.addEventListener('change', () => {
    const picked = [...(input.files ?? [])];
    if (!canEdit) {
      files = picked;
      render();
      return;
    }
    add(picked.filter((f) => !files.includes(f)));
  });
  if (drop && canEdit) {
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
      add([...(e.dataTransfer?.files ?? [])]);
    });
  }
  return {
    reset() {
      files = [];
      err.textContent = '';
      sync();
    },
  };
}

export function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-booking]');
  if (!form) return;
  const status = form.querySelector<HTMLElement>('.booking__status')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const uploads = initFiles(form);
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=hidden]):not([type=file]):not([name=_gotcha]), textarea')];

  // Real-time validation: a field is judged after you leave it (or after a submit attempt);
  // from then on it re-checks as you type, so an error disappears the moment the value is right.
  const touched = new Set<HTMLElement>();
  let submitted = false;
  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const check = (el: HTMLInputElement | HTMLTextAreaElement) => {
    const err = document.getElementById(`${el.id}-err`);
    if (!err) return true;
    let msg = '';
    const value = 'value' in el ? el.value.trim() : '';
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      if (el.required && !el.checked) msg = err.dataset.msgRequired ?? '';
    } else if (el.required && !value) msg = err.dataset.msgRequired ?? '';
    else if (el.type === 'email' && value && !emailOk(value)) msg = err.dataset.msgType ?? '';
    else if (el.minLength > 0 && value && value.length < el.minLength) msg = err.dataset.msgShort ?? '';
    err.textContent = msg;
    el.setAttribute('aria-invalid', String(Boolean(msg)));
    el.closest('.field')?.classList.toggle('is-valid', !msg && Boolean(el.required) && (value !== '' || (el instanceof HTMLInputElement && el.checked)));
    return !msg;
  };
  const live = (el: HTMLInputElement | HTMLTextAreaElement) => touched.has(el) || submitted;
  fields.forEach((el) => {
    el.addEventListener('blur', () => {
      if (el.value.trim() || (el instanceof HTMLInputElement && el.type === 'checkbox')) touched.add(el);
      if (live(el)) check(el);
    });
    el.addEventListener('input', () => live(el) && check(el));
    el.addEventListener('change', () => {
      touched.add(el);
      check(el);
    });
  });
  // Character counter for the idea.
  const idea = form.querySelector<HTMLTextAreaElement>('#b-idea');
  const counter = form.querySelector<HTMLElement>('#b-idea-count');
  if (idea && counter) {
    const tpl = counter.dataset.template ?? '{n} / {max}';
    const update = () => {
      counter.textContent = tpl.replace('{n}', String(idea.value.length)).replace('{max}', String(idea.maxLength));
      counter.classList.toggle('is-near', idea.value.length > idea.maxLength * 0.9);
    };
    idea.addEventListener('input', update);
    update();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitted = true;
    status.className = 'booking__status';
    const invalid = fields.filter((el) => !check(el));
    if (invalid.length) {
      status.textContent = status.dataset.invalid ?? '';
      status.classList.add('is-error');
      invalid[0].focus();
      return;
    }
    if (form.dataset.demo) {
      status.textContent = status.dataset.demoMsg ?? '';
      return;
    }
    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    submit.firstChild!.textContent = `${submit.dataset.sending} `;
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      uploads.reset();
      status.textContent = status.dataset.success ?? '';
      status.classList.add('is-success');
    } catch {
      status.textContent = status.dataset.error ?? '';
      status.classList.add('is-error');
    } finally {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      submit.firstChild!.textContent = `${submit.dataset.label} `;
    }
  });

  // "Umów się do Styxa / Wkrenty" pre-selects the artist.
  document.querySelectorAll<HTMLAnchorElement>('a[data-artist]').forEach((a) =>
    a.addEventListener('click', () => {
      const name = a.dataset.artist === 'styx' ? 'Styx' : 'Wkrenta';
      const radio = form.querySelector<HTMLInputElement>(`input[name=artist][value="${name}"]`);
      if (radio) radio.checked = true;
    }),
  );
}

export function initMisc() {
  // Map facade: the iframe (and its requests) only after a click.
  const facade = document.querySelector<HTMLButtonElement>('.map__facade');
  if (facade) {
    facade.hidden = false;
    facade.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = facade.dataset.mapSrc!;
      frame.title = facade.dataset.mapTitle ?? 'Mapa';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer';
      facade.replaceWith(frame);
    });
  }
  // Easter egg: the eyes in the footer wink back.
  const egg = document.querySelector<HTMLButtonElement>('.footer__egg');
  const text = document.getElementById('egg');
  egg?.addEventListener('click', () => {
    const open = egg.getAttribute('aria-expanded') !== 'true';
    egg.setAttribute('aria-expanded', String(open));
    if (text) text.hidden = !open;
  });
  void state;
}
