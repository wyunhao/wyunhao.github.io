(() => {
  const root = document.documentElement;
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const stillQuery = matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     Lattice: a 2D lattice whose points jitter with small "LWE" noise.
     A target t orbits the portrait (or follows the mouse); we solve
     CVP(t) exactly and draw the closest point with its local basis.
     ------------------------------------------------------------------ */
  const lattice = (() => {
    const canvas = document.querySelector('.lattice');
    if (!canvas || !canvas.getContext) return { recolor() {} };
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    const portrait = hero.querySelector('.portrait__frame');

    const S = 34;                       // lattice spacing in px
    const b1 = { x: 1, y: 0.24 };       // basis, in units of S
    const b2 = { x: 0.34, y: -1 };
    const det = b1.x * b2.y - b2.x * b1.y;

    let W = 0, H = 0, O = { x: 0, y: 0 }, orbit = { x: 0, y: 0, rx: 0, ry: 0 };
    let pts = [], col = {}, ptr = null, cur = null;
    let running = false, inView = true, raf = 0;
    const t0 = performance.now();

    const at = (i, j) => ({ x: O.x + S * (i * b1.x + j * b2.x), y: O.y + S * (i * b1.y + j * b2.y) });
    const coords = (x, y) => {
      const dx = (x - O.x) / S, dy = (y - O.y) / S;
      return { i: (dx * b2.y - b2.x * dy) / det, j: (b1.x * dy - dx * b1.y) / det };
    };

    function build() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const p = portrait ? portrait.getBoundingClientRect() : { left: W * .6, top: H * .2, width: W * .3, height: H * .6 };
      const cx = p.left - r.left + p.width / 2, cy = p.top - r.top + p.height / 2;
      O = { x: cx, y: cy };
      orbit = { x: cx, y: cy, rx: p.width / 2 + 46, ry: p.height / 2 + 30 };

      const corners = [[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => coords(x, y));
      const is = corners.map(c => c.i), js = corners.map(c => c.j);
      pts = [];
      for (let j = Math.floor(Math.min(...js)) - 1; j <= Math.ceil(Math.max(...js)) + 1; j++) {
        for (let i = Math.floor(Math.min(...is)) - 1; i <= Math.ceil(Math.max(...is)) + 1; i++) {
          const q = at(i, j);
          if (q.x < -S || q.x > W + S || q.y < -S || q.y > H + S) continue;
          pts.push({ i, j, x: q.x, y: q.y, ph: Math.random() * 6.283, f: 0.5 + Math.random() * 0.7 });
        }
      }
      cur = null;
    }

    function recolor() {
      const cs = getComputedStyle(root);
      col = {
        dot: cs.getPropertyValue('--dot').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        spark: cs.getPropertyValue('--spark').trim(),
        label: cs.getPropertyValue('--fg-3').trim(),
      };
      if (!running) draw(performance.now());
    }

    // Exact CVP in 2D: Babai rounding, then check the neighbouring cells.
    function closest(x, y) {
      const c = coords(x, y);
      let best = null, bd = Infinity;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
        const i = Math.round(c.i) + di, j = Math.round(c.j) + dj;
        const q = at(i, j), d = (q.x - x) ** 2 + (q.y - y) ** 2;
        if (d < bd) { bd = d; best = { i, j, ...q }; }
      }
      return best;
    }

    function arrow(x1, y1, x2, y2, color, label) {
      const a = Math.atan2(y2 - y1, x2 - x1), h = 6;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(a - .42), y2 - h * Math.sin(a - .42));
      ctx.lineTo(x2 - h * Math.cos(a + .42), y2 - h * Math.sin(a + .42));
      ctx.closePath(); ctx.fill();
      ctx.fillText(label, x2 + 6 * Math.cos(a) - 4, y2 + 10 * Math.sin(a) + 4);
    }

    function draw(now) {
      if (!W) return;
      const t = (now - t0) / 1000;
      const still = stillQuery.matches;
      const amp = still ? 0 : 1.5;

      // where the target wants to be: the mouse, or a slow orbit around the portrait
      const a = still ? 2.5 : 2.5 + t * 0.12;
      const want = ptr || { x: orbit.x + orbit.rx * Math.cos(a), y: orbit.y + orbit.ry * Math.sin(a) };
      cur = cur && !still ? { x: cur.x + (want.x - cur.x) * 0.1, y: cur.y + (want.y - cur.y) * 0.1 } : { ...want };

      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        const ex = Math.sin(t * p.f + p.ph) * amp, ey = Math.cos(t * p.f * .87 + p.ph * 1.3) * amp;
        const d = Math.hypot(p.x - cur.x, p.y - cur.y);
        const glow = Math.max(0, 1 - d / 150);
        ctx.fillStyle = `rgba(${col.dot}, ${0.2 + glow * 0.55})`;
        ctx.beginPath(); ctx.arc(p.x + ex, p.y + ey, 1.25 + glow * 0.6, 0, 6.283); ctx.fill();
      }

      const v = closest(cur.x, cur.y);
      ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';

      // local basis at the closest vector
      arrow(v.x, v.y, v.x + S * b1.x, v.y + S * b1.y, col.accent, 'b₁');
      arrow(v.x, v.y, v.x + S * b2.x, v.y + S * b2.y, col.accent, 'b₂');

      // target -> closest vector
      ctx.strokeStyle = col.spark; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cur.x, cur.y); ctx.lineTo(v.x, v.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(v.x, v.y, 6, 0, 6.283); ctx.stroke();
      ctx.fillStyle = col.spark;
      ctx.beginPath(); ctx.arc(cur.x, cur.y, 2.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = col.label;
      ctx.fillText('t', cur.x + 7, cur.y - 6);
      ctx.fillText('CVP(t)', v.x - 50, v.y + 18);
    }

    function loop(now) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function sync() {
      const go = inView && !document.hidden && !stillQuery.matches;
      if (go && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!go && running) { running = false; cancelAnimationFrame(raf); draw(performance.now()); }
    }

    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (!running) draw(performance.now());
    });
    hero.addEventListener('pointerleave', () => { ptr = null; if (!running) draw(performance.now()); });

    if ('ResizeObserver' in window) new ResizeObserver(() => { build(); if (!running) draw(performance.now()); }).observe(hero);
    else addEventListener('resize', () => { build(); draw(performance.now()); });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    stillQuery.addEventListener?.('change', sync);

    build();
    recolor();
    sync();
    // fonts change the hero's height once they arrive
    document.fonts?.ready.then(() => { build(); if (!running) draw(performance.now()); });

    return { recolor };
  })();

  /* ---------------- theme toggle ---------------- */
  const resolved = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = resolved() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    lattice.recolor();
  });
  darkQuery.addEventListener?.('change', () => lattice.recolor());

  /* ---------------- top bar + scroll spy ---------------- */
  const bar = document.querySelector('.topbar');
  const onScroll = () => bar && bar.classList.toggle('is-scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = [...document.querySelectorAll('.nav a')];
  const markCurrent = id => navLinks.forEach(a => a.classList.toggle('is-current', a.hash === '#' + id));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) markCurrent(e.target.id);
    }, { rootMargin: '-40% 0px -55% 0px' });
    navLinks.forEach(a => { const s = document.querySelector(a.hash); if (s) spy.observe(s); });
    // the footer is short, so it may never cross the band above: claim it at the very bottom
    addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) markCurrent('contact');
    }, { passive: true });
  }

  /* ---------------- publication filter ---------------- */
  const chips = [...document.querySelectorAll('.chip')];
  const pubs = [...document.querySelectorAll('.pub')];
  const years = [...document.querySelectorAll('.year')];
  function filter(key) {
    chips.forEach(c => {
      const on = c.dataset.filter === key;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    pubs.forEach(p => { p.hidden = key !== 'all' && !p.dataset.topics.split(' ').includes(key); });
    years.forEach(y => {
      const shown = y.querySelectorAll('.pub:not([hidden])');
      y.hidden = !shown.length;
      y.querySelectorAll('.pub').forEach(p => p.classList.toggle('is-first', p === shown[0]));
    });
  }
  chips.forEach(c => c.addEventListener('click', () => filter(c.dataset.filter)));
  document.querySelectorAll('.theme a[data-filter]').forEach(a => a.addEventListener('click', () => filter(a.dataset.filter)));
  // a link straight to one paper should never land on a filtered-out entry
  document.querySelectorAll('a[href^="#pub-"]').forEach(a => a.addEventListener('click', () => filter('all')));

  /* ---------------- email ---------------- */
  document.querySelectorAll('.js-email').forEach(el => {
    const addr = `${el.dataset.u}@${el.dataset.d}`;
    el.href = `mailto:${addr}`;
    if ('show' in el.dataset) el.textContent = addr;
  });
  document.querySelectorAll('.copy').forEach(btn => btn.addEventListener('click', async () => {
    const addr = `${btn.dataset.u}@${btn.dataset.d}`;
    try {
      await navigator.clipboard.writeText(addr);
      btn.textContent = 'copied';
    } catch (e) {
      btn.textContent = 'copy failed';
    }
    setTimeout(() => { btn.textContent = 'copy'; }, 1600);
  }));
})();
