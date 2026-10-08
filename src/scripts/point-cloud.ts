/**
 * Hero point cloud: the real <h1> is sampled into points, which fly in from the
 * scattered "embedding" and settle into the name. The pointer pushes them away;
 * a spring brings them back. The text stays in the DOM (selectable, accessible)
 * and is only made transparent once the canvas is drawing.
 *
 * Cheap by design: one 2D canvas, fillRect per point, the loop sleeps when
 * everything has settled, and pauses when the hero is off-screen or the tab is hidden.
 */

interface Pt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  accent: boolean;
  delay: number;
}

const REPEL_RADIUS = 90;
const REPEL_FORCE = 9;
const SPRING = 0.075;
const DAMPING = 0.78;
const INTRO_MS = 1400;

export function initPointCloud(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pc-canvas]');
  const title = root.querySelector<HTMLElement>('[data-pc-title]');
  if (!canvas || !title) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let pts: Pt[] = [];
  let dpr = 1;
  let width = 0;
  let height = 0;
  let ink = '#14161a';
  let accent = '#0b7a5e';
  let running = false;
  let visible = true;
  let start = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue('--ink').trim() || ink;
    accent = cs.getPropertyValue('--signal').trim() || accent;
  };

  /** Draw each line of the title into an offscreen canvas and sample filled pixels. */
  const sample = (): Pt[] => {
    const rootRect = root.getBoundingClientRect();
    const lines = Array.from(title.querySelectorAll<HTMLElement>('[data-pc-line]'));
    const off = document.createElement('canvas');
    off.width = Math.ceil(width);
    off.height = Math.ceil(height);
    const o = off.getContext('2d', { willReadFrequently: true });
    if (!o) return [];

    const fontSize = parseFloat(getComputedStyle(title).fontSize);
    // denser sampling on small screens so the name stays legible
    const step = Math.max(2, Math.round(fontSize / 38));
    // small type needs tighter, bigger dots to stay legible
    const small = fontSize < 80;
    const jitter = step * (small ? 0.5 : 1.1);
    const dot = small ? [0.75, 0.45] : [0.45, 0.5];
    const out: Pt[] = [];

    lines.forEach((line, li) => {
      o.clearRect(0, 0, off.width, off.height);
      const cs = getComputedStyle(line);
      o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      o.fillStyle = '#000';
      o.textBaseline = 'alphabetic';
      const r = line.getBoundingClientRect();
      const m = o.measureText(line.textContent ?? '');
      const contentH = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
      const lineH = parseFloat(cs.lineHeight) || r.height;
      const baseline = r.top - rootRect.top + (lineH - contentH) / 2 + m.fontBoundingBoxAscent;
      o.fillText(line.textContent ?? '', r.left - rootRect.left, baseline);

      const data = o.getImageData(0, 0, off.width, off.height).data;
      const isAccent = line.dataset.pcLine === 'accent';
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 140) {
            out.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: 0,
              vy: 0,
              // jitter breaks the grid so the glyphs read as a cloud, not a dot matrix
              tx: x + (Math.random() - 0.5) * jitter,
              ty: y + (Math.random() - 0.5) * jitter,
              size: step * (dot[0] + Math.random() * dot[1]),
              accent: isAccent,
              delay: li * 120 + Math.random() * 380,
            });
          }
        }
      }
    });
    return out;
  };

  const resize = () => {
    const rect = root.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fresh = sample();
    // keep current positions on resize so the name doesn't replay its intro
    if (pts.length && start) {
      fresh.forEach((p, i) => {
        const prev = pts[i % pts.length];
        p.x = prev.x;
        p.y = prev.y;
        p.delay = 0;
      });
    }
    pts = fresh;
    wake();
  };

  const tick = (now: number) => {
    if (!start) start = now;
    const t = now - start;
    ctx.clearRect(0, 0, width, height);
    let moving = t < INTRO_MS + 600;

    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? ink : accent;
      for (const p of pts) {
        if (p.accent !== (pass === 1)) continue;
        if (t > p.delay) {
          p.vx += (p.tx - p.x) * SPRING;
          p.vy += (p.ty - p.y) * SPRING;
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < REPEL_RADIUS * REPEL_RADIUS && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = (1 - d / REPEL_RADIUS) * REPEL_FORCE;
              p.vx += (dx / d) * f;
              p.vy += (dy / d) * f;
            }
          }
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
          if (!moving && (Math.abs(p.vx) > 0.05 || Math.abs(p.vy) > 0.05)) moving = true;
        } else {
          moving = true;
        }
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    if (moving && visible) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };

  function wake() {
    if (running || !visible || document.hidden) return;
    running = true;
    requestAnimationFrame(tick);
  }

  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
    wake();
  };
  const onLeave = () => {
    pointer.active = false;
    wake();
  };

  const boot = async () => {
    // make sure the display font is ready, otherwise we'd sample the fallback
    try {
      await document.fonts.load(`italic 100px "Instrument Serif"`);
      await document.fonts.load(`100px "Instrument Serif"`);
    } catch {
      /* sample whatever is rendered */
    }
    readColors();
    resize();
    if (!pts.length) return;
    root.classList.add('pc-ready');

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    // redraw with the new tokens (the loop draws at least one frame, then sleeps)
    const recolor = () =>
      requestAnimationFrame(() => {
        readColors();
        wake();
      });
    window.addEventListener('themechange', recolor);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);

    let resizeTimer = 0;
    new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }).observe(root);

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    }).observe(root);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) wake();
    });
  };

  boot();
}
