import type { AudioManager } from '../contracts';

export function createAudioManager(): AudioManager {
  let audioCtx: AudioContext | null = null;
  const activeSources: Set<{ stop(): void }> = new Set();
  let masterVolume = 1;

  function getContext(): AudioContext {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  // Simple cache for decoded audio buffers
  const bufferCache = new Map<string, AudioBuffer>();

  return {
    play(src: string, options?: { volume?: number; loop?: boolean }): { stop(): void } {
      const ctx = getContext();
      const vol = (options?.volume ?? 1) * masterVolume;
      const loop = options?.loop ?? false;

      // Create a no-op handle that gets replaced once the buffer loads
      let source: AudioBufferSourceNode | null = null;
      let stopped = false;

      const handle = {
        stop() {
          stopped = true;
          if (source) {
            try { source.stop(); } catch { /* already stopped */ }
          }
          activeSources.delete(handle);
        },
      };

      activeSources.add(handle);

      // Load and play
      const cached = bufferCache.get(src);
      if (cached) {
        playBuffer(ctx, cached, vol, loop, handle);
      } else {
        fetch(src)
          .then(r => r.arrayBuffer())
          .then(data => ctx.decodeAudioData(data))
          .then(buffer => {
            bufferCache.set(src, buffer);
            if (!stopped) {
              playBuffer(ctx, buffer, vol, loop, handle);
            }
          })
          .catch(() => {
            // Graceful no-op — audio failure should never break gameplay
            activeSources.delete(handle);
          });
      }

      function playBuffer(
        ctx: AudioContext,
        buffer: AudioBuffer,
        vol: number,
        loop: boolean,
        handle: { stop(): void },
      ): void {
        if (stopped) return;
        source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;

        const gain = ctx.createGain();
        gain.gain.value = vol;
        source.connect(gain).connect(ctx.destination);

        source.onended = () => activeSources.delete(handle);
        source.start();
      }

      return handle;
    },

    stopAll(): void {
      for (const handle of [...activeSources]) {
        handle.stop();
      }
    },

    get volume() { return masterVolume; },
    set volume(v: number) { masterVolume = Math.max(0, Math.min(1, v)); },

    dispose(): void {
      for (const handle of [...activeSources]) {
        handle.stop();
      }
      bufferCache.clear();
      if (audioCtx) {
        audioCtx.close().catch(() => {});
        audioCtx = null;
      }
    },
  };
}
