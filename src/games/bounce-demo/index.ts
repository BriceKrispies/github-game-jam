import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';
import './bounce-demo.css';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

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

const mainScene: Scene = {
  enter(ctx: EngineContext) {
    balls.length = 0;
    const { width, height } = ctx.surface;
    addBall(width / 2, height / 3);
    addBall(width / 2, height / 2);
    addBall(width / 3, height / 2);
  },

  update(ctx: EngineContext, dt: number) {
    const { width, height } = ctx.surface;
    const { input } = ctx;

    // Spawn ball on click/tap
    if (input.pointer.justPressed) {
      addBall(input.pointer.x, input.pointer.y);
    }

    // Physics
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
  },

  render(_ctx: EngineContext, surface: RenderSurface) {
    const { ctx, width, height } = surface;

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
  },
};

const game: GameDefinition = {
  id: 'bounce-demo',
  scenes: { main: mainScene },
};

export default game;
