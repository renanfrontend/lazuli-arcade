import type { AudioPort } from '@shared/application/ports';
import type { EmpilhaCue, EmpilhaFeedback } from '../application/ports';

/** C major pentatonic, two octaves: bright and impossible to make sound wrong. */
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

const HAPTICS: Partial<Record<EmpilhaCue, number | readonly number[]>> = {
  drop: 10,
  invalid: 24,
  clear: [14, 30, 22],
  unlock: [20, 40, 20],
  win: [30, 50, 30, 50, 80],
  lose: [80, 60, 80],
};

/** Empilha sound design on top of the arcade synthesizer. */
export const createEmpilhaFeedback = (audio: AudioPort): EmpilhaFeedback => {
  let lastHopAt = 0;

  return {
    cue(cue, intensity = 1) {
      const haptic = HAPTICS[cue];
      if (haptic !== undefined) audio.vibrate(haptic);

      switch (cue) {
        case 'select':
          audio.tone({ freq: 760, duration: 0.05, type: 'triangle', gain: 0.08 });
          break;
        case 'pick':
          audio.tone({ freq: 440, to: 660, duration: 0.08, type: 'triangle', gain: 0.12 });
          break;
        case 'drop':
          audio.tone({ freq: 210, to: 130, duration: 0.12, type: 'triangle', gain: 0.32 });
          audio.noise({ duration: 0.06, gain: 0.1, filter: 'lowpass', freq: 900 });
          break;
        case 'invalid':
          audio.tone({ freq: 180, to: 120, duration: 0.14, type: 'square', gain: 0.05 });
          break;
        case 'hop': {
          // Each tile that lands climbs the scale, so a long merge sounds like a run up the keys.
          const now = performance.now();
          if (now - lastHopAt < 24) return;
          lastHopAt = now;
          const note = PENTATONIC[Math.min(PENTATONIC.length - 1, Math.max(0, intensity))] ?? 523.25;
          audio.tone({ freq: note, duration: 0.07, type: 'triangle', gain: 0.1 });
          break;
        }
        case 'clear': {
          const lift = 1 + Math.min(intensity - 1, 4) * 0.12;
          [0, 2, 4, 5, 7].forEach((step, index) => {
            const freq = (PENTATONIC[step] ?? 523.25) * lift;
            audio.tone({ freq, at: index * 0.05, duration: 0.26, type: 'sine', gain: 0.15 });
          });
          audio.noise({ at: 0.04, duration: 0.32, gain: 0.05, filter: 'highpass', freq: 5200 });
          break;
        }
        case 'unlock':
          audio.noise({ duration: 0.12, gain: 0.16, filter: 'bandpass', freq: 1800 });
          audio.tone({ freq: 1046.5, at: 0.08, duration: 0.25, type: 'sine', gain: 0.12 });
          audio.tone({ freq: 1567.98, at: 0.16, duration: 0.3, type: 'sine', gain: 0.1 });
          break;
        case 'tick':
          audio.tone({ freq: 660, duration: 0.09, type: 'sine', gain: 0.16 });
          break;
        case 'go':
          audio.tone({ freq: 990, duration: 0.22, type: 'triangle', gain: 0.18 });
          audio.tone({ freq: 1320, at: 0.06, duration: 0.24, type: 'sine', gain: 0.1 });
          break;
        case 'win':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
            audio.tone({ freq, at: index * 0.12, duration: index === 3 ? 0.5 : 0.18, type: 'triangle', gain: 0.18 });
          });
          break;
        case 'lose':
          [440, 392, 349.23, 293.66].forEach((freq, index) => {
            audio.tone({ freq, at: index * 0.16, duration: 0.3, type: 'triangle', gain: 0.16 });
          });
          break;
        case 'rivalScore':
          audio.tone({ freq: 330, to: 290, duration: 0.12, type: 'sine', gain: 0.07 });
          break;
      }
    },
  };
};
