import type { FeedbackCue, FeedbackPort } from '../application/ports';

interface AudioGlobals {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

interface ToneOptions {
  readonly freq: number;
  readonly to?: number;
  readonly at?: number;
  readonly duration: number;
  readonly type?: OscillatorType;
  readonly gain: number;
}

interface NoiseOptions {
  readonly at?: number;
  readonly duration: number;
  readonly gain: number;
  readonly filter: BiquadFilterType;
  readonly freq: number;
  readonly to?: number;
}

/** Notes of a major pentatonic run, used for clears and streaks. */
const SPARKLE = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 1975.53];

const HAPTICS: Partial<Record<FeedbackCue, number | number[]>> = {
  drop: 8,
  invalid: 24,
  clear: [16, 40, 26],
  perfect: [30, 40, 30, 40, 60],
  gameOver: [70, 50, 90],
};

/** Synthesized sound effects (no audio files) plus vibration where supported. */
export const createWebAudioFeedback = (): FeedbackPort => {
  let context: AudioContext | null = null;
  let output: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let enabled = true;
  let lastCoinAt = 0;

  const ensureContext = (): AudioContext | null => {
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
    return context;
  };

  const tone = (ctx: AudioContext, destination: AudioNode, options: ToneOptions): void => {
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
    oscillator.connect(amp).connect(destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  };

  const noise = (ctx: AudioContext, destination: AudioNode, options: NoiseOptions): void => {
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
    source.connect(filter).connect(amp).connect(destination);
    source.start(start);
    source.stop(end + 0.02);
  };

  const vibrate = (pattern: number | number[] | undefined): void => {
    if (pattern === undefined || !('vibrate' in navigator)) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Vibration is a nicety; some frames forbid it.
    }
  };

  const play = (ctx: AudioContext, out: AudioNode, cue: FeedbackCue, intensity: number): void => {
    switch (cue) {
      case 'select':
        tone(ctx, out, { freq: 880, duration: 0.05, type: 'triangle', gain: 0.08 });
        break;
      case 'pick':
        tone(ctx, out, { freq: 520, to: 780, duration: 0.07, type: 'triangle', gain: 0.12 });
        break;
      case 'drop':
        tone(ctx, out, { freq: 260, to: 150, duration: 0.1, type: 'triangle', gain: 0.3 });
        noise(ctx, out, { duration: 0.05, gain: 0.12, filter: 'lowpass', freq: 1200 });
        break;
      case 'invalid':
        tone(ctx, out, { freq: 196, to: 130, duration: 0.12, type: 'square', gain: 0.05 });
        break;
      case 'clear': {
        const notes = SPARKLE.slice(0, Math.min(SPARKLE.length, 2 + intensity));
        notes.forEach((freq, index) => {
          tone(ctx, out, { freq, at: index * 0.055, duration: 0.24, type: 'sine', gain: 0.16 });
        });
        noise(ctx, out, { duration: 0.3, gain: 0.05, filter: 'highpass', freq: 5000 });
        break;
      }
      case 'streak': {
        const lift = 1 + Math.min(intensity, 8) * 0.06;
        tone(ctx, out, { freq: 987.77 * lift, at: 0.18, duration: 0.12, type: 'triangle', gain: 0.12 });
        tone(ctx, out, { freq: 1318.51 * lift, at: 0.26, duration: 0.2, type: 'triangle', gain: 0.12 });
        break;
      }
      case 'perfect':
        SPARKLE.concat(SPARKLE.map((freq) => freq * 2)).forEach((freq, index) => {
          tone(ctx, out, { freq, at: index * 0.045, duration: 0.3, type: 'sine', gain: 0.1 });
        });
        break;
      case 'coin': {
        const now = performance.now();
        if (now - lastCoinAt < 45) return;
        lastCoinAt = now;
        tone(ctx, out, { freq: 1760, to: 2349, duration: 0.06, type: 'square', gain: 0.03 });
        tone(ctx, out, { freq: 2637, at: 0.03, duration: 0.09, type: 'sine', gain: 0.04 });
        break;
      }
      case 'reroll':
        noise(ctx, out, { duration: 0.28, gain: 0.14, filter: 'bandpass', freq: 400, to: 2600 });
        tone(ctx, out, { freq: 330, to: 660, duration: 0.2, type: 'triangle', gain: 0.1 });
        break;
      case 'gameOver':
        [523.25, 440, 349.23, 261.63].forEach((freq, index) => {
          tone(ctx, out, { freq, at: index * 0.17, duration: 0.3, type: 'triangle', gain: 0.18 });
        });
        break;
    }
  };

  return {
    cue(cue, intensity = 1) {
      if (!enabled) return;
      if (cue !== 'coin') vibrate(HAPTICS[cue]);
      const ctx = ensureContext();
      if (!ctx || !output) return;
      try {
        play(ctx, output, cue, intensity);
      } catch {
        // Audio must never break the game loop.
      }
    },
    setEnabled(next) {
      enabled = next;
      if (!next && context?.state === 'running') void context.suspend().catch(() => undefined);
    },
    unlock() {
      ensureContext();
    },
  };
};
