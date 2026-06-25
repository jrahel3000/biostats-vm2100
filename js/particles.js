(function() {
  const c = document.getElementById('particle-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h, particles;
  const maxParticles = 80;
  const maxDist = 140;
  let animId;

  function resize() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.6,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = 1 - dist / maxDist;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => {
    resize();
    for (let p of particles) {
      p.x = Math.min(p.x, w);
      p.y = Math.min(p.y, h);
    }
  });

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    c.style.display = 'none';
    return;
  }

  init();
  draw();
})();
