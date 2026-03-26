import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';

const placeholderScene: Scene = {
  update() {},
  render(_ctx: EngineContext, surface: RenderSurface) {
    const { ctx, width, height } = surface;
    ctx.fillStyle = '#f8f9fb';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Coming soon', width / 2, height / 2);
  },
};

const game: GameDefinition = {
  id: 'coming-soon-demo',
  scenes: { main: placeholderScene },
};

export default game;
