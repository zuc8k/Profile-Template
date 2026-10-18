/* ===== Accordion ===== */
document.querySelectorAll('[data-acc]').forEach(acc => {
  acc.querySelector('.acc-head').addEventListener('click', () => {
    const isOpen = acc.classList.contains('open');
    document.querySelectorAll('[data-acc]').forEach(a => a.classList.remove('open'));
    if (!isOpen) acc.classList.add('open');
  });
});

/* ===== Card expand ===== */
document.querySelectorAll('[data-expand]').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('open'));
});

/* ===== Scroll reveal ===== */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('show');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section, .card, .acc').forEach(el => {
  el.classList.add('reveal');
  io.observe(el);
});

/* ===== Point Cloud Animation ===== */
const canvas = document.getElementById('points');
const ctx = canvas.getContext('2d');
let w, h, points = [];

function init() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  points = [];
  const count = Math.min(120, Math.floor(w * h / 12000));
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.5
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, w, h);

  // draw points
  points.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(167,139,250,0.6)';
    ctx.fill();
  });

  // draw connections
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.strokeStyle = `rgba(109,40,217,${0.25 * (1 - dist / 130)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

window.addEventListener('resize', init);
init();
draw();

/* ===== Parallax on scroll for hero ===== */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const hero = document.querySelector('.hero .container');
  if (hero && y < window.innerHeight) {
    hero.style.transform = `translateY(${y * 0.3}px)`;
    hero.style.opacity = 1 - y / (window.innerHeight * 0.9);
  }
});