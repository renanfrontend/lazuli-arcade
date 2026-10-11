import type { AudioPort, FeedbackPort } from '../../application/ports';

export type SimpleCue = 'tap' | 'move' | 'good' | 'bad' | 'merge' | 'win' | 'lose';

export type SimpleFeedback = FeedbackPort<SimpleCue>;

const HAPTICS: Partial<Record<SimpleCue, number | readonly number[]>> = {
  good: 12,
  bad: 26,
  merge: 10,
  win: [30, 50, 30, 50, 80],
  lose: [80, 60, 80],
};

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

/** One small sound palette for the lightweight games; intensity climbs the pentatonic scale. */
export const createSimpleFeedback = (audio: AudioPort): SimpleFeedback => ({
  cue(cue, intensity = 0) {
    const haptic = HAPTICS[cue];
    if (haptic !== undefined) audio.vibrate(haptic);
    const note = SCALE[Math.max(0, Math.min(SCALE.length - 1, Math.round(intensity)))] ?? SCALE[0] ?? 523.25;
    switch (cue) {
      case 'tap':
        audio.tone({ freq: 700, duration: 0.05, type: 'triangle', gain: 0.08 });
        break;
      case 'move':
        audio.tone({ freq: 300, to: 380, duration: 0.07, type: 'triangle', gain: 0.1 });
        break;
      case 'good':
        audio.tone({ freq: note, duration: 0.14, type: 'sine', gain: 0.16 });
        audio.tone({ freq: note * 1.5, at: 0.07, duration: 0.18, type: 'sine', gain: 0.12 });
        break;
      case 'bad':
        audio.tone({ freq: 190, to: 130, duration: 0.14, type: 'square', gain: 0.05 });
        break;
      case 'merge':
        audio.tone({ freq: note, to: note * 1.25, duration: 0.12, type: 'triangle', gain: 0.14 });
        break;
      case 'win':
        [0, 2, 4, 5, 7].forEach((step, index) => {
          audio.tone({ freq: SCALE[step] ?? 523.25, at: index * 0.08, duration: 0.3, type: 'sine', gain: 0.15 });
        });
        break;
      case 'lose':
        audio.tone({ freq: 330, to: 180, duration: 0.5, type: 'triangle', gain: 0.14 });
        break;
    }
  },
});
