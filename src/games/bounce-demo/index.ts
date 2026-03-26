import type { GameModule, SharedServices } from '../../types/game';
import './bounce-demo.css';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

let cleanup: (() => void) | null = null;

const game: GameModule = {
  id: 'bounce-demo',
  name: 'Bounce',
  description: 'Bouncing ball demo with click/tap interaction.',

  mount(container: HTMLElement, services: SharedServices) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Bounce demo — click to add balls');
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    let width = services.viewport.width;
    let height = services.viewport.height;
    let animationId: number | null = null;
    let running = true;

    const balls: Ball[] = [];

    function addBall(x: number, y: number): void {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 180;
      balls.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 10 + Math.random() * 18,
        hue: Math.random() * 360,
      });
    }

    addBall(width / 2, height / 3);
    addBall(width / 2, height / 2);
    addBall(width / 3, height / 2);

    function resize(): void {
      width = container.clientWidth;
      height = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    const unsubResize = services.viewport.onResize(() => resize());

    function handlePointer(e: PointerEvent): void {
      const rect = canvas.getBoundingClientRect();
      addBall(e.clientX - rect.left, e.clientY - rect.top);
    }

    canvas.addEventListener('pointerdown', handlePointer);
    canvas.style.touchAction = 'none';

    let lastTime = performance.now();

    function update(dt: number): void {
      for (const ball of balls) {
        ball.vy += 400 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.9;
        } else if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.9;
        }

        if (ball.y + ball.radius > height) {
          ball.y = height - ball.radius;
          ball.vy = -Math.abs(ball.vy) * 0.85;
          ball.vx *= 0.98;
        } else if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy) * 0.9;
        }
      }

      while (balls.length > 60) balls.shift();
    }

    function draw(): void {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#f8f9fb';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = '#e2e4e9';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click or tap to add balls', width / 2, 32);
      ctx.restore();

      for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${ball.hue}, 70%, 58%)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.25, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${ball.hue}, 80%, 80%, 0.6)`;
        ctx.fill();
      }

      ctx.save();
      ctx.fillStyle = '#9198a8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Balls: ${balls.length}`, 12, height - 12);
      ctx.restore();
    }

    function frame(now: number): void {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      update(dt);
      draw();
      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    cleanup = () => {
      running = false;
      if (animationId !== null) cancelAnimationFrame(animationId);
      canvas.removeEventListener('pointerdown', handlePointer);
      unsubResize();
    };
  },

  unmount() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  },

  pause() {
    // rAF naturally pauses on hidden tabs; explicit pause is handled by running flag
  },

  resume() {
    // Resume handled by rAF continuing
  },
};

export default game;
