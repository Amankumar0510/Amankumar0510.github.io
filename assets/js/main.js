/* Portfolio interactions. No libraries. Motion runs only when <html> has the "motion" class. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const motion = () => root.classList.contains('motion');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Boot screen ---------- */
  const boot = $('#boot');
  const endBoot = () => boot.classList.add('done');
  if (motion()) {
    const lines = ['> power on ........ OK', '> init MCU ........ OK', '> calibrate IMU ... OK', '> link up: welcome'];
    lines.forEach((line, i) => setTimeout(() => { $('#boot-log').textContent += line + '\n'; }, 120 + i * 250));
    setTimeout(endBoot, 1350);
    boot.addEventListener('click', endBoot);
    addEventListener('keydown', endBoot, { once: true });
  }

  /* ---------- Navigation, scroll progress, timeline ---------- */
  const nav = $('#nav'), bar = $('#progress-bar'), toTop = $('#to-top'), timeline = $('#timeline');
  const links = $$('#menu a');
  const sections = links.map(a => $(a.getAttribute('href')));
  function onScroll() {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    nav.classList.toggle('scrolled', scrollY > 30);
    toTop.classList.toggle('show', scrollY > 700);
    let current = -1;
    sections.forEach((section, i) => { if (section.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === current && !a.classList.contains('nav-cta')));
    const box = timeline.getBoundingClientRect();
    const drawn = motion() ? Math.max(0, Math.min(1, (innerHeight * 0.75 - box.top) / box.height)) : 1;
    timeline.style.setProperty('--line-progress', drawn);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: motion() ? 'smooth' : 'auto' }));

  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Reveal on scroll and number counters ---------- */
  function countUp(el) {
    const target = Number(el.dataset.count), decimals = Number(el.dataset.decimals || 0);
    if (!motion()) return;
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / 1400);
      el.textContent = (target * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const reveals = $$('.reveal');
  reveals.forEach(el => {
    const index = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--delay', `${Math.min(index, 5) * 0.08}s`);
  });
  const show = el => {
    el.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { show(entry.target); observer.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(show);
  }

  /* Run a canvas loop only while the canvas is on screen and the tab is visible. */
  function loopWhenVisible(canvas, frame) {
    let visible = false, running = false, last = 0;
    const tick = now => {
      if (!visible || document.hidden) { running = false; return; }
      frame(Math.min(0.05, (now - last) / 1000 || 0.016), now / 1000);
      last = now;
      requestAnimationFrame(tick);
    };
    const start = () => { if (!running && visible && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(tick); } };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
  }

  function fitCanvas(canvas) {
    const ratio = Math.min(2, devicePixelRatio || 1);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width, height };
  }

  /* ---------- Hero: signal network ---------- */
  const net = $('#net');
  let view, nodes = [];
  const pointer = { x: -999, y: -999 };
  const colours = ['#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#34d399'];
  function buildNet() {
    view = fitCanvas(net);
    const count = Math.round(Math.min(95, (view.width * view.height) / 15000));
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * view.width, y: Math.random() * view.height,
      vx: (Math.random() - 0.5) * 26, vy: (Math.random() - 0.5) * 26,
      r: 1 + Math.random() * 1.8, c: colours[i % colours.length]
    }));
    drawNet(0, 0);
  }
  function drawNet(dt, time) {
    const { ctx, width, height } = view;
    ctx.clearRect(0, 0, width, height);
    nodes.forEach(n => {
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 125) continue;
        ctx.globalAlpha = (1 - d / 125) * 0.34;
        ctx.strokeStyle = a.c; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if ((i + j) % 11 === 0) {                       // a data packet travelling along the link
          const t = (time * 0.5 + i * 0.13) % 1;
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff';
          ctx.fillRect(a.x + (b.x - a.x) * t - 1.2, a.y + (b.y - a.y) * t - 1.2, 2.4, 2.4);
        }
      }
      const near = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (near < 170) {
        ctx.globalAlpha = (1 - near / 170) * 0.75; ctx.strokeStyle = '#e0e7ff';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
      ctx.globalAlpha = 0.85; ctx.fillStyle = a.c;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  buildNet();
  loopWhenVisible(net, (dt, t) => { if (motion()) drawNet(dt, t); });
  $('.hero').addEventListener('pointermove', e => {
    const box = net.getBoundingClientRect();
    pointer.x = e.clientX - box.left; pointer.y = e.clientY - box.top;
  });
  $('.hero').addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; });

  /* ---------- Decorative oscilloscope ---------- */
  const scope = $('#scope');
  let screen = fitCanvas(scope);
  function drawScope(time) {
    const { ctx, width, height } = screen;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(94,234,212,.1)'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    const trace = (colour, fn) => {
      ctx.strokeStyle = colour; ctx.lineWidth = 2; ctx.shadowColor = colour; ctx.shadowBlur = 9;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 3) ctx[x ? 'lineTo' : 'moveTo'](x, fn(x));
      ctx.stroke(); ctx.shadowBlur = 0;
    };
    trace('#22d3ee', x => height * 0.34 + Math.sin(x * 0.035 - time * 4) * 24 * Math.sin(x * 0.006 - time * 0.7));
    trace('#f472b6', x => height * 0.74 + (Math.sin(x * 0.028 - time * 3.2) > 0 ? -17 : 17));
  }
  drawScope(0);
  loopWhenVisible(scope, (_, t) => { if (motion()) drawScope(t); });

  let resizeTimer, lastWidth = innerWidth;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (innerWidth === lastWidth) return;             // ignore the mobile address bar changing the height
      lastWidth = innerWidth;
      buildNet(); screen = fitCanvas(scope); drawScope(0);
    }, 200);
  });

  /* ---------- Typed role line ---------- */
  const typed = $('#typed');
  const words = typed.dataset.words.split('|');
  let word = 0, chars = words[0].length, deleting = true;
  (function type() {
    let wait = 70;
    if (motion()) {
      chars += deleting ? -1 : 1;
      typed.textContent = words[word].slice(0, chars);
      wait = deleting ? 38 : 75;
      if (!deleting && chars === words[word].length) { deleting = true; wait = 1700; }
      if (deleting && chars === 0) { deleting = false; word = (word + 1) % words.length; wait = 260; }
    }
    setTimeout(type, wait);
  })();

  /* ---------- Marquee: duplicate the items once for a seamless loop ---------- */
  const track = $('#marquee-track');
  [...track.children].forEach(item => track.append(item.cloneNode(true)));

  /* ---------- Pointer effects ---------- */
  if (finePointer) {
    const glow = $('#glow');
    addEventListener('pointermove', e => {
      if (!motion()) { glow.style.opacity = 0; return; }
      glow.style.opacity = 1;
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        if (!motion()) return;
        const box = card.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height;
        const strength = card.classList.contains('featured') ? 2.5 : 6;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.setProperty('--rx', `${(0.5 - y) * strength}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * strength}deg`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
    $$('.magnetic').forEach(button => {
      button.addEventListener('pointermove', e => {
        if (!motion()) return;
        const box = button.getBoundingClientRect();
        button.style.transform = `translate(${(e.clientX - box.left - box.width / 2) * 0.18}px, ${(e.clientY - box.top - box.height / 2) * 0.3}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  /* ---------- Project filters ---------- */
  $$('.filters button').forEach(button => button.addEventListener('click', () => {
    $$('.filters button').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    $$('.project').forEach(project => {
      const match = button.dataset.filter === 'all' || project.dataset.tags.split(' ').includes(button.dataset.filter);
      project.classList.toggle('hide', !match);
      if (match) project.classList.add('in');
    });
    onScroll();
  }));

  /* ---------- PID simulator: inverted pendulum on a moving base ---------- */
  const pidCanvas = $('#pid'), pctx = pidCanvas.getContext('2d');
  const status = $('#pid-status');
  const gains = { kp: 35, ki: 5, kd: 6 };
  const G = 9.81, LENGTH = 0.35, MAX_ACCEL = 30, FALL = 1.2;
  let sim;
  const reset = (angle = 0.16) => { sim = { angle, rate: 0, integral: 0, x: 0, speed: 0, history: [], fallen: false }; };
  function simulate(dt) {
    if (sim.fallen) return;
    const step = 1 / 480;
    for (let left = dt; left > 0; left -= step) {
      const h = Math.min(step, left);
      sim.integral = Math.max(-1, Math.min(1, sim.integral + sim.angle * h));
      const wanted = gains.kp * sim.angle + gains.ki * sim.integral + gains.kd * sim.rate;
      const accel = Math.max(-MAX_ACCEL, Math.min(MAX_ACCEL, wanted));   // motors have a limit
      sim.rate += ((G * Math.sin(sim.angle) - accel * Math.cos(sim.angle)) / LENGTH - 0.25 * sim.rate) * h;
      sim.angle += sim.rate * h;
      sim.speed = (sim.speed + accel * h) * (1 - 0.35 * h);
      sim.x += sim.speed * h;
      if (Math.abs(sim.angle) > FALL) { sim.angle = Math.sign(sim.angle) * 1.45; sim.fallen = true; break; }
    }
    sim.history.push(sim.angle);
    if (sim.history.length > 240) sim.history.shift();
  }
  function drawSim() {
    const W = 760, H = 420, ground = 280, cx = W / 2;
    pctx.clearRect(0, 0, W, H);
    const offset = ((sim.x * 150) % 46 + 46) % 46;      // the camera follows the robot, so the floor moves
    pctx.strokeStyle = 'rgba(129,140,248,.18)'; pctx.lineWidth = 1;
    for (let x = -offset; x < W; x += 46) { pctx.beginPath(); pctx.moveTo(x, ground); pctx.lineTo(x - 34, ground + 22); pctx.stroke(); }
    pctx.strokeStyle = '#818cf8'; pctx.lineWidth = 3;
    pctx.beginPath(); pctx.moveTo(0, ground); pctx.lineTo(W, ground); pctx.stroke();
    pctx.setLineDash([6, 8]); pctx.strokeStyle = 'rgba(255,255,255,.18)'; pctx.lineWidth = 1.5;
    pctx.beginPath(); pctx.moveTo(cx, 34); pctx.lineTo(cx, ground - 34); pctx.stroke(); pctx.setLineDash([]);

    pctx.save();
    pctx.translate(cx, ground - 32);
    pctx.rotate(sim.angle);
    pctx.shadowColor = sim.fallen ? '#fb7185' : '#22d3ee'; pctx.shadowBlur = 18;
    pctx.strokeStyle = pctx.shadowColor; pctx.lineWidth = 4; pctx.fillStyle = '#11183a';
    const block = (y, w, h) => { pctx.beginPath(); pctx.roundRect ? pctx.roundRect(-w / 2, y, w, h, 10) : pctx.rect(-w / 2, y, w, h); pctx.fill(); pctx.stroke(); };
    pctx.beginPath(); pctx.moveTo(0, 0); pctx.lineTo(0, -150); pctx.stroke();
    block(-84, 82, 42); block(-132, 96, 40); block(-196, 78, 56);
    pctx.fillStyle = '#fbbf24'; pctx.beginPath(); pctx.arc(0, -168, 12, 0, Math.PI * 2); pctx.fill();
    pctx.restore();

    pctx.save();
    pctx.translate(cx, ground - 32);
    pctx.rotate(sim.x / 0.045);
    pctx.fillStyle = '#0b1025'; pctx.strokeStyle = '#f472b6'; pctx.lineWidth = 6;
    pctx.beginPath(); pctx.arc(0, 0, 29, 0, Math.PI * 2); pctx.fill(); pctx.stroke();
    pctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) { pctx.rotate(Math.PI / 3); pctx.beginPath(); pctx.moveTo(-27, 0); pctx.lineTo(27, 0); pctx.stroke(); }
    pctx.restore();

    const mid = 362;
    pctx.strokeStyle = 'rgba(255,255,255,.14)'; pctx.lineWidth = 1;
    pctx.beginPath(); pctx.moveTo(20, mid); pctx.lineTo(W - 20, mid); pctx.stroke();
    pctx.strokeStyle = '#34d399'; pctx.lineWidth = 2.4;
    pctx.beginPath();
    sim.history.forEach((a, i) => {
      const x = 20 + (i / 239) * (W - 40), y = mid - Math.max(-46, Math.min(46, a * 150));
      pctx[i ? 'lineTo' : 'moveTo'](x, y);
    });
    pctx.stroke();
    pctx.fillStyle = '#9aa3c7'; pctx.font = '13px Consolas, monospace';
    pctx.fillText('tilt over time', 22, 322);
    pctx.textAlign = 'right';
    pctx.fillText(`tilt ${(sim.angle * 180 / Math.PI).toFixed(1)}°`, W - 22, 30);
    pctx.textAlign = 'left';
  }
  function updateStatus() {
    const text = sim.fallen ? 'Fallen: raise the gains and press Reset' : Math.abs(sim.angle) > 0.12 ? 'Recovering…' : 'Balancing';
    if (status.textContent !== text) status.textContent = text;
    status.classList.toggle('down', sim.fallen);
  }
  const refresh = () => { updateStatus(); drawSim(); };
  /* With animations paused the lab still works: it advances after each user action, then stops. */
  const settle = () => { if (!motion()) { for (let i = 0; i < 90; i++) simulate(1 / 60); refresh(); } };
  ['kp', 'ki', 'kd'].forEach(id => $('#' + id).addEventListener('input', e => {
    gains[id] = Number(e.target.value);
    $(`#${id}-out`).textContent = e.target.value;
    settle();
  }));
  const push = direction => { if (sim.fallen) reset(0); sim.rate += direction * 1.9; settle(); };
  $('#push-left').addEventListener('click', () => push(-1));
  $('#push-right').addEventListener('click', () => push(1));
  $('#pid-reset').addEventListener('click', () => { reset(); settle(); refresh(); });
  reset();
  if (!motion()) { for (let i = 0; i < 90; i++) simulate(1 / 60); }
  refresh();
  loopWhenVisible(pidCanvas, dt => { if (motion()) { simulate(dt); refresh(); } });

  /* ---------- Copy email ---------- */
  const copy = $('#copy-email');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.email);
      copy.textContent = 'Copied ✓';
    } catch (error) {
      copy.textContent = copy.dataset.email;
    }
    setTimeout(() => { copy.textContent = 'Copy email'; }, 2500);
  });

  /* ---------- Pop-ups: email options and photo viewer ---------- */
  const mailDialog = $('#mail-dialog'), lightbox = $('#lightbox');
  const canDialog = typeof mailDialog.showModal === 'function';
  $$('dialog').forEach(dialog => {
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });   // click outside to close
  });
  /* A plain mailto: link does nothing when the computer has no email app, so offer webmail and copy as well. */
  $$('a[href^="mailto:"]').filter(a => !a.dataset.direct).forEach(a => a.addEventListener('click', e => {
    if (!canDialog) return;
    e.preventDefault();
    mailDialog.showModal();
  }));
  const mailCopy = $('#mail-copy');
  mailCopy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(mailCopy.dataset.email); mailCopy.textContent = 'Copied ✓'; }
    catch (error) { mailCopy.textContent = 'Select the address above'; }
    setTimeout(() => { mailCopy.textContent = 'Copy address'; }, 2500);
  });
  $$('.shot button').forEach(button => button.addEventListener('click', () => {
    if (!canDialog) return;
    const picture = $('img', button), large = $('img', lightbox);
    large.src = picture.src;
    large.alt = picture.alt;
    $('p', lightbox).textContent = picture.alt;
    lightbox.showModal();
  }));

})();
