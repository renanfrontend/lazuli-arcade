import type { AudioPort } from '@shared/application/ports';

export type PugaCue = 'jump' | 'spring' | 'bone' | 'powerup' | 'fall' | 'gameover' | 'click';

export interface PugaFeedback {
  readonly cue: (cue: PugaCue) => void;
}

export const createPugaFeedback = (audio: AudioPort): PugaFeedback => ({
  cue(cue) {
    switch (cue) {
      case 'jump':
        audio.vibrate(10);
        audio.tone({ freq: 380, to: 540, duration: 0.1, type: 'triangle', gain: 0.15 });
        break;
      case 'spring':
        audio.vibrate([15, 25, 20]);
        audio.tone({ freq: 440, to: 880, duration: 0.22, type: 'sine', gain: 0.25 });
        break;
      case 'bone':
        audio.vibrate(12);
        audio.tone({ freq: 880, to: 1320, duration: 0.08, type: 'triangle', gain: 0.18 });
        break;
      case 'powerup':
        audio.vibrate([20, 40, 30]);
        [523, 659, 783, 1046].forEach((f, i) => {
          audio.tone({ freq: f, at: i * 0.06, duration: 0.15, type: 'triangle', gain: 0.18 });
        });
        break;
      case 'fall':
        audio.vibrate(50);
        audio.tone({ freq: 350, to: 140, duration: 0.35, type: 'sawtooth', gain: 0.12 });
        break;
      case 'gameover':
        audio.vibrate([60, 40, 60]);
        [440, 392, 349, 293].forEach((f, i) => {
          audio.tone({ freq: f, at: i * 0.12, duration: 0.25, type: 'sine', gain: 0.15 });
        });
        break;
      case 'click':
        audio.tone({ freq: 600, duration: 0.05, type: 'sine', gain: 0.08 });
        break;
    }
  },
});
