import type { RenderSurface } from '../contracts';

export function createRenderSurface(container: HTMLElement): RenderSurface & { resize(): void; destroy(): void } {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.touchAction = 'none';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize(): void {
    dpr = Math.min(window.devicePixelRatio, 2);
    width = container.clientWidth;
    height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();

  function destroy(): void {
    canvas.remove();
  }

  return {
    canvas,
    ctx,
    get width() { return width; },
    get height() { return height; },
    get dpr() { return dpr; },
    resize,
    destroy,
  };
}

// ── Drawing helpers ──

export function clearSurface(surface: RenderSurface, color?: string): void {
  const { ctx, width, height } = surface;
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  style: string | CanvasGradient,
): void {
  ctx.fillStyle = style;
  ctx.fillRect(x, y, w, h);
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  style: string | CanvasGradient,
): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  options?: {
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  },
): void {
  if (options?.font) ctx.font = options.font;
  if (options?.color) ctx.fillStyle = options.color;
  if (options?.align) ctx.textAlign = options.align;
  if (options?.baseline) ctx.textBaseline = options.baseline;
  ctx.fillText(text, x, y);
}

export function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number, y: number,
  width?: number, height?: number,
): void {
  if (width !== undefined && height !== undefined) {
    ctx.drawImage(image, x, y, width, height);
  } else {
    ctx.drawImage(image, x, y);
  }
}

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  style: string | CanvasGradient,
): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
