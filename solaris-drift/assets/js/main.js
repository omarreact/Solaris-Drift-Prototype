/* Solaris Drift V2 — scroll-reactive cosmic field with bounded, adaptive rendering. */
(() => {
  'use strict';
  const body = document.body;
  const cosmos = document.querySelector('.cosmos');
  const canvas = document.getElementById('starfield');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  const motionToggle = document.querySelector('.motion-toggle');
  const motionLabel = document.querySelector('.motion-toggle__label');
  const motionIcon = document.querySelector('.motion-toggle__icon');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 680px)');
  const finePointer = window.matchMedia('(pointer: fine)');

  // Accessible compact mobile navigation.
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') !== 'true';
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    }));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    }, { passive: true });
  }

  // Reveal content when it enters the viewport. Motion preferences fail open.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  let userPaused = false;
  const syncMotion = () => {
    const paused = userPaused || reduceMotion.matches || document.hidden;
    body.classList.toggle('motion-paused', paused);
    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(userPaused));
      motionToggle.setAttribute('title', userPaused ? 'Resume background motion' : 'Pause background motion');
      if (motionLabel) motionLabel.textContent = userPaused ? 'Resume motion' : 'Pause motion';
      if (motionIcon) motionIcon.textContent = userPaused ? '▶' : 'Ⅱ';
    }
  };
  if (motionToggle) motionToggle.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
  reduceMotion.addEventListener?.('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  syncMotion();

  // Keep the entire fixed universe responsive to scroll without adding scroll handlers per section.
  let scrollY = window.scrollY || 0;
  let scrollRaf = 0;
  const updateCamera = () => {
    scrollRaf = 0;
    if (!cosmos || reduceMotion.matches || body.classList.contains('motion-paused')) return;
    const s = scrollY;
    const mobile = mobileQuery.matches;
    const scale = mobile ? 0.6 : 1;
    const waveA = Math.sin(s * 0.00068), waveB = Math.cos(s * 0.00053), waveC = Math.sin(s * 0.00031 + 1.6);
    const set = (name, value) => cosmos.style.setProperty(name, value);
    set('--wash-one-x', `${waveA * 46 * scale}px`);
    set('--wash-one-y', `${waveB * 34 * scale}px`);
    set('--wash-two-x', `${waveB * 58 * scale}px`);
    set('--wash-two-y', `${waveC * 42 * scale}px`);
    set('--wash-three-x', `${waveC * 34 * scale}px`);
    set('--wash-three-y', `${waveA * 48 * scale}px`);
    set('--halo-x', `${waveB * 24 * scale}px`);
    set('--halo-y', `${waveA * 20 * scale}px`);
    set('--vortex-x', `${waveC * 42 * scale}px`);
    set('--vortex-y', `${waveB * 56 * scale}px`);
    set('--orbit-two-x', `${waveA * 30 * scale}px`);
    set('--orbit-two-y', `${waveC * 43 * scale}px`);
    set('--orbit-three-x', `${waveB * 26 * scale}px`);
    set('--orbit-three-y', `${waveA * 33 * scale}px`);
    set('--planet-ember-x', `${waveA * (mobile ? 13 : 30)}px`);
    set('--planet-ember-y', `${waveB * (mobile ? 24 : 48)}px`);
    set('--planet-violet-x', `${waveC * (mobile ? 9 : 21)}px`);
    set('--planet-violet-y', `${waveA * (mobile ? 16 : 34)}px`);
    set('--plasma-one-x', `${waveA * 45 * scale}px`);
    set('--plasma-one-y', `${waveB * 22 * scale}px`);
    set('--plasma-two-x', `${waveC * 38 * scale}px`);
    set('--plasma-two-y', `${waveA * 31 * scale}px`);
  };
  const requestCamera = () => {
    scrollY = window.scrollY || 0;
    if (!scrollRaf) scrollRaf = requestAnimationFrame(updateCamera);
  };
  window.addEventListener('scroll', requestCamera, { passive: true });
  window.addEventListener('resize', requestCamera, { passive: true });
  requestCamera();

  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  let width = 0, height = 0, dpr = 1, stars = [], dust = [], comets = [], raf = 0, lastFrame = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  const maxDpr = 1.35;
  const isReduced = () => reduceMotion.matches;
  const isMobile = () => mobileQuery.matches;
  const isLowPower = () => (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  const frameInterval = () => isLowPower() ? 42 : isMobile() ? 38 : 32; // ~24–31fps, avoids an expensive 60fps loop.

  const makeParticles = () => {
    const mobile = isMobile();
    const lowPower = isLowPower();
    const starCount = Math.max(48, Math.min(mobile ? 92 : lowPower ? 120 : 185, Math.round(width * height * (mobile ? 0.00012 : 0.00016))));
    const dustCount = mobile ? 28 : lowPower ? 44 : 68;
    stars = Array.from({ length: starCount }, () => {
      const depth = Math.random();
      const hueRoll = Math.random();
      return {
        x: Math.random() * width, y: Math.random() * height, z: 0.16 + depth * 0.84,
        r: 0.42 + depth * (mobile ? 0.72 : 1.2),
        alpha: 0.24 + Math.random() * 0.58,
        twinkle: 0.22 + Math.random() * 0.92, phase: Math.random() * Math.PI * 2,
        dx: (Math.random() - 0.5) * (mobile ? 0.08 : 0.13),
        dy: (0.06 + Math.random() * 0.23) * (Math.random() > 0.5 ? 1 : -1),
        hue: hueRoll < 0.12 ? 'amber' : hueRoll < 0.25 ? 'violet' : hueRoll < 0.31 ? 'cyan' : 'white'
      };
    });
    dust = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: 0.35 + Math.random() * (mobile ? 0.45 : 0.8),
      alpha: 0.08 + Math.random() * 0.19,
      z: 0.3 + Math.random() * 0.7,
      hue: Math.random() < 0.5 ? 'violet' : 'amber',
      phase: Math.random() * Math.PI * 2
    }));
    // Two occasional meteors add energy without a constant screen-wide streak effect.
    comets = Array.from({ length: mobile ? 1 : 2 }, (_, index) => ({
      active: false, born: 0, duration: 740 + Math.random() * 580,
      nextAt: performance.now() + 1300 + Math.random() * 4200 + index * 2200,
      x: 0, y: 0, vx: 0, vy: 0, length: 55 + Math.random() * 65,
      color: Math.random() < 0.5 ? '255,190,137' : '191,164,255'
    }));
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width || window.innerWidth));
    height = Math.max(1, Math.floor(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr, isMobile() ? 1.15 : 1.35);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
    drawStatic();
  };

  const colorFor = (hue, alpha) => {
    if (hue === 'amber') return `rgba(255,177,119,${alpha})`;
    if (hue === 'violet') return `rgba(190,165,255,${alpha})`;
    if (hue === 'cyan') return `rgba(121,207,244,${alpha})`;
    return `rgba(231,236,255,${alpha})`;
  };
  const wrapped = (value, span) => ((value % span) + span) % span;
  const drawStar = (star, time, staticMode = false) => {
    const twinkle = staticMode || isReduced() ? 0 : (Math.sin(time * 0.0011 * star.twinkle + star.phase) + 1) * 0.2;
    const alpha = Math.min(0.96, star.alpha + twinkle) * (0.52 + star.z * 0.48);
    // Starfield flows at a depth-dependent rate as the user scrolls through the page.
    const x = star.x + (staticMode ? 0 : pointerX * 22 * star.z);
    const scrollTravel = staticMode ? scrollY * (0.09 + star.z * 0.24) : scrollY * (0.09 + star.z * 0.24);
    const y = wrapped(star.y + scrollTravel + (staticMode ? 0 : pointerY * 15 * star.z), height);
    ctx.fillStyle = colorFor(star.hue, alpha);
    ctx.beginPath(); ctx.arc(x, y, star.r * (0.9 + twinkle), 0, Math.PI * 2); ctx.fill();
    // Only a small subset of distant bright stars receive a cross flare.
    if (star.r > 1.25 && alpha > 0.68 && !isMobile() && !isReduced()) {
      ctx.strokeStyle = colorFor(star.hue === 'white' ? 'amber' : star.hue, alpha * 0.3);
      ctx.lineWidth = 0.55; ctx.beginPath();
      ctx.moveTo(x - star.r * 2.8, y); ctx.lineTo(x + star.r * 2.8, y);
      ctx.moveTo(x, y - star.r * 2.8); ctx.lineTo(x, y + star.r * 2.8); ctx.stroke();
    }
  };
  const drawDust = (particle, time, staticMode = false) => {
    const alpha = particle.alpha * (staticMode ? 1 : 0.75 + (Math.sin(time * 0.00035 + particle.phase) + 1) * 0.17);
    const x = wrapped(particle.x + (staticMode ? 0 : pointerX * 10 * particle.z), width);
    const y = wrapped(particle.y + scrollY * (0.18 + particle.z * 0.24) + (staticMode ? 0 : pointerY * 7 * particle.z), height);
    ctx.fillStyle = colorFor(particle.hue, alpha);
    ctx.beginPath(); ctx.arc(x, y, particle.r, 0, Math.PI * 2); ctx.fill();
  };
  const startComet = (comet, time) => {
    comet.active = true; comet.born = time; comet.duration = 740 + Math.random() * 630;
    const fromLeft = Math.random() < 0.68;
    comet.x = fromLeft ? Math.random() * width * 0.7 : width * (0.3 + Math.random() * 0.7);
    comet.y = Math.random() * height * 0.7;
    const angle = Math.PI * (0.12 + Math.random() * 0.13);
    const speed = (isMobile() ? 0.32 : 0.5) + Math.random() * 0.25;
    comet.vx = (fromLeft ? 1 : -1) * Math.cos(angle) * speed;
    comet.vy = Math.sin(angle) * speed;
    comet.length = 48 + Math.random() * (isMobile() ? 30 : 80);
    comet.color = Math.random() < 0.55 ? '255,190,137' : '191,164,255';
  };
  const drawComets = (time, staticMode = false) => {
    if (staticMode || isMobile() && isLowPower() || isReduced()) return;
    comets.forEach(comet => {
      if (!comet.active && time > comet.nextAt) startComet(comet, time);
      if (!comet.active) return;
      const p = Math.min(1, (time - comet.born) / comet.duration);
      if (p >= 1) {
        comet.active = false;
        comet.nextAt = time + 3500 + Math.random() * 6500;
        return;
      }
      const x = comet.x + comet.vx * (time - comet.born);
      const y = wrapped(comet.y + comet.vy * (time - comet.born) + scrollY * 0.12, height);
      const gradient = ctx.createLinearGradient(x - comet.vx * comet.length, y - comet.vy * comet.length, x, y);
      gradient.addColorStop(0, `rgba(${comet.color},0)`);
      gradient.addColorStop(0.72, `rgba(${comet.color},0.32)`);
      gradient.addColorStop(1, `rgba(255,246,224,0.92)`);
      ctx.strokeStyle = gradient; ctx.lineWidth = isMobile() ? 1 : 1.35;
      ctx.beginPath(); ctx.moveTo(x - comet.vx * comet.length, y - comet.vy * comet.length); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = `rgba(255,241,222,${0.58 * (1-p*0.3)})`;
      ctx.beginPath(); ctx.arc(x, y, 1.05, 0, Math.PI * 2); ctx.fill();
    });
  };
  const drawStatic = () => {
    ctx.clearRect(0, 0, width, height);
    dust.forEach(p => drawDust(p, 0, true));
    stars.forEach(s => drawStar(s, 0, true));
  };
  const render = time => {
    raf = 0;
    if (document.hidden || body.classList.contains('motion-paused') || isReduced()) { drawStatic(); return; }
    if (time - lastFrame < frameInterval()) { raf = requestAnimationFrame(render); return; }
    lastFrame = time;
    ctx.clearRect(0, 0, width, height);
    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;
    dust.forEach(p => drawDust(p, time));
    stars.forEach(star => {
      star.x += star.dx * star.z;
      star.y += star.dy * star.z;
      if (star.x < -3) star.x = width + 3; else if (star.x > width + 3) star.x = -3;
      if (star.y < -3) star.y = height + 3; else if (star.y > height + 3) star.y = -3;
      drawStar(star, time);
    });
    drawComets(time);
    raf = requestAnimationFrame(render);
  };
  const start = () => {
    if (raf || isReduced() || document.hidden || body.classList.contains('motion-paused')) { drawStatic(); return; }
    raf = requestAnimationFrame(render);
  };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; drawStatic(); };
  if (finePointer.matches) {
    window.addEventListener('pointermove', event => {
      targetX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }, { passive: true });
  }
  window.addEventListener('resize', () => { resize(); requestCamera(); start(); }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduceMotion.addEventListener?.('change', () => { resize(); requestCamera(); reduceMotion.matches ? stop() : start(); });
  const bodyObserver = new MutationObserver(() => {
    if (body.classList.contains('motion-paused')) stop();
    else { requestCamera(); start(); }
  });
  bodyObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
  resize();
  if (!isReduced()) start();
})();
