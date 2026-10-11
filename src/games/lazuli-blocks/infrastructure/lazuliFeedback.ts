import type { AudioPort } from '@shared/application/ports';
import type { FeedbackCue, LazuliFeedback } from '../application/ports';

/** Notes of a major pentatonic run, used for clears and streaks. */
const SPARKLE = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 1975.53];

const HAPTICS: Partial<Record<FeedbackCue, number | readonly number[]>> = {
  drop: 8,
  invalid: 24,
  clear: [16, 40, 26],
  perfect: [30, 40, 30, 40, 60],
  gameOver: [70, 50, 90],
};

/** Lazuli Blocks sound design on top of the arcade synthesizer. */
export const createLazuliFeedback = (audio: AudioPort): LazuliFeedback => {
  let lastCoinAt = 0;

  return {
    cue(cue, intensity = 1) {
      const haptic = HAPTICS[cue];
      if (haptic !== undefined) audio.vibrate(haptic);

      switch (cue) {
        case 'select':
          audio.tone({ freq: 880, duration: 0.05, type: 'triangle', gain: 0.08 });
          break;
        case 'pick':
          audio.tone({ freq: 520, to: 780, duration: 0.07, type: 'triangle', gain: 0.12 });
          break;
        case 'drop':
          audio.tone({ freq: 260, to: 150, duration: 0.1, type: 'triangle', gain: 0.3 });
          audio.noise({ duration: 0.05, gain: 0.12, filter: 'lowpass', freq: 1200 });
          break;
        case 'invalid':
          audio.tone({ freq: 196, to: 130, duration: 0.12, type: 'square', gain: 0.05 });
          break;
        case 'clear': {
          const notes = SPARKLE.slice(0, Math.min(SPARKLE.length, 2 + intensity));
          notes.forEach((freq, index) => {
            audio.tone({ freq, at: index * 0.055, duration: 0.24, type: 'sine', gain: 0.16 });
          });
          audio.noise({ duration: 0.3, gain: 0.05, filter: 'highpass', freq: 5000 });
          break;
        }
        case 'streak': {
          const lift = 1 + Math.min(intensity, 8) * 0.06;
          audio.tone({ freq: 987.77 * lift, at: 0.18, duration: 0.12, type: 'triangle', gain: 0.12 });
          audio.tone({ freq: 1318.51 * lift, at: 0.26, duration: 0.2, type: 'triangle', gain: 0.12 });
          break;
        }
        case 'perfect':
          SPARKLE.concat(SPARKLE.map((freq) => freq * 2)).forEach((freq, index) => {
            audio.tone({ freq, at: index * 0.045, duration: 0.3, type: 'sine', gain: 0.1 });
          });
          break;
        case 'coin': {
          const now = performance.now();
          if (now - lastCoinAt < 45) return;
          lastCoinAt = now;
          audio.tone({ freq: 1760, to: 2349, duration: 0.06, type: 'square', gain: 0.03 });
          audio.tone({ freq: 2637, at: 0.03, duration: 0.09, type: 'sine', gain: 0.04 });
          break;
        }
        case 'reroll':
          audio.noise({ duration: 0.28, gain: 0.14, filter: 'bandpass', freq: 400, to: 2600 });
          audio.tone({ freq: 330, to: 660, duration: 0.2, type: 'triangle', gain: 0.1 });
          break;
        case 'gameOver':
          [523.25, 440, 349.23, 261.63].forEach((freq, index) => {
            audio.tone({ freq, at: index * 0.17, duration: 0.3, type: 'triangle', gain: 0.18 });
          });
          break;
      }
    },
  };
};
