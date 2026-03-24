// ══════════════════════════════════════════════════════════════
// MindShift — Celebration System
// Confetti particles + Haptic feedback (BJ Fogg "Shine")
// ══════════════════════════════════════════════════════════════

export function haptic(style) {
  if (!navigator.vibrate) return;
  switch (style) {
    case 'light': navigator.vibrate(10); break;
    case 'medium': navigator.vibrate([15, 30, 15]); break;
    case 'success': navigator.vibrate([10, 50, 10, 50, 30]); break;
    case 'celebration': navigator.vibrate([30, 50, 30, 50, 60, 50, 100]); break;
    default: navigator.vibrate(10);
  }
}

const CONFETTI_COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#4F46E5', '#E0E7FF', '#F59E0B', '#10B981', '#E11D48'];

class Particle {
  constructor(canvas) {
    this.x = canvas.width * Math.random();
    this.y = -10;
    this.size = Math.random() * 8 + 4;
    this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = Math.random() * 4 + 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 12;
    this.opacity = 1;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }

  update() {
    this.x += this.vx;
    this.vy += 0.1;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.opacity -= 0.005;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function launchConfetti(duration) {
  const ms = duration || 2000;
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const particles = [];
  const startTime = Date.now();
  let raf;

  function spawn() {
    for (let i = 0; i < 4; i++) {
      particles.push(new Particle(canvas));
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    if (elapsed < ms) spawn();

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].opacity <= 0 || particles[i].y > canvas.height + 20) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0 || elapsed < ms) {
      raf = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      cancelAnimationFrame(raf);
    }
  }

  animate();
}
