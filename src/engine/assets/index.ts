import type { AssetManager } from '../contracts';

export function createAssetManager(): AssetManager {
  const cache = new Map<string, HTMLImageElement>();

  return {
    async loadImage(key: string, src: string): Promise<HTMLImageElement> {
      const existing = cache.get(key);
      if (existing) return existing;

      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          cache.set(key, img);
          resolve(img);
        };
        img.onerror = () => reject(new Error(`[engine] Failed to load image: ${src}`));
        img.src = src;
      });
    },

    getImage(key: string): HTMLImageElement | undefined {
      return cache.get(key);
    },

    hasImage(key: string): boolean {
      return cache.has(key);
    },

    unload(key: string): void {
      cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },
  };
}
