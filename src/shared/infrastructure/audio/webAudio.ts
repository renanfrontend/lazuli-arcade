import type { AudioPort, NoiseOptions, ToneOptions } from '../../application/ports';

interface AudioGlobals {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/** Web Audio synthesizer (no audio files) plus the Vibration API. Never throws. */
export const createWebAudio = (): AudioPort => {
  let context: AudioContext | null = null;
  let output: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let enabled = true;

  const ensureContext = (): { ctx: AudioContext; out: GainNode } | null => {
    if (!enabled) return null;
    if (!context) {
      const globals = window as unknown as AudioGlobals;
      const Ctor = globals.AudioContext ?? globals.webkitAudioContext;
      if (!Ctor) return null;
      try {
        context = new Ctor();
      } catch {
        return null;
      }
      output = context.createGain();
      output.gain.value = 0.5;
      output.connect(context.destination);
    }
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    return output ? { ctx: context, out: output } : null;
  };

  const safely = (draw: (ctx: AudioContext, out: GainNode) => void): void => {
    const audio = ensureContext();
    if (!audio) return;
    try {
      draw(audio.ctx, audio.out);
    } catch {
      // Sound must never break a game loop.
    }
  };

  return {
    tone(options: ToneOptions) {
      safely((ctx, out) => {
        const start = ctx.currentTime + (options.at ?? 0);
        const end = start + options.duration;
        const oscillator = ctx.createOscillator();
        const amp = ctx.createGain();
        oscillator.type = options.type ?? 'sine';
        oscillator.frequency.setValueAtTime(options.freq, start);
        if (options.to) oscillator.frequency.exponentialRampToValueAtTime(options.to, end);
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime(options.gain, start + 0.01);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(amp).connect(out);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
      });
    },
    noise(options: NoiseOptions) {
      safely((ctx, out) => {
        if (!noiseBuffer) {
          noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
        }
        const start = ctx.currentTime + (options.at ?? 0);
        const end = start + options.duration;
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        source.buffer = noiseBuffer;
        filter.type = options.filter;
        filter.frequency.setValueAtTime(options.freq, start);
        if (options.to) filter.frequency.exponentialRampToValueAtTime(options.to, end);
        amp.gain.setValueAtTime(options.gain, start);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);
        source.connect(filter).connect(amp).connect(out);
        source.start(start);
        source.stop(end + 0.02);
      });
    },
    vibrate(pattern) {
      if (!enabled || !('vibrate' in navigator)) return;
      try {
        navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
      } catch {
        // Vibration is a nicety; some frames forbid it.
      }
    },
    unlock() {
      ensureContext();
    },
    setEnabled(next) {
      enabled = next;
      if (!next && context?.state === 'running') void context.suspend().catch(() => undefined);
    },
  };
};
