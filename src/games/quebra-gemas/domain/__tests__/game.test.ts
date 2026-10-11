import { describe, expect, it } from 'vitest';
import { createBreakout, HEIGHT, launchBall, movePaddle, PADDLE_WIDTH, PADDLE_Y, RADIUS, stepBreakout, WIDTH } from '../game';

describe('Quebra-Gemas', () => {
  it('starts docked and clamps the paddle inside the court', () => {
    const game = createBreakout();
    movePaddle(game, -200);
    expect(game.paddle).toBe(PADDLE_WIDTH / 2);
    expect(game.ball.x).toBe(game.paddle);
    movePaddle(game, 2000);
    expect(game.paddle).toBe(WIDTH - PADDLE_WIDTH / 2);
    expect(game.lives).toBe(3);
  });
  it('only launches a docked ball', () => {
    const game = createBreakout(); launchBall(game);
    expect(game.status).toBe('playing'); expect(game.ball.vy).toBeLessThan(0);
    game.ball.vx = 15; launchBall(game); expect(game.ball.vx).toBe(15);
  });
  it('reflects at walls', () => {
    const game = createBreakout(); launchBall(game);
    game.ball = { x: RADIUS, y: 250, vx: -90, vy: -100 };
    stepBreakout(game, 1 / 120);
    expect(game.ball.vx).toBe(90); expect(game.ball.x).toBe(RADIUS);
  });
  it('rebounds off the paddle with an angle determined by impact position', () => {
    const game = createBreakout(); launchBall(game);
    game.ball = { x: game.paddle + 25, y: PADDLE_Y - RADIUS - 1, vx: 0, vy: 260 };
    stepBreakout(game, 1 / 120);
    expect(game.ball.vy).toBeLessThan(0); expect(game.ball.vx).toBeGreaterThan(0);
    expect(game.ball.y).toBe(PADDLE_Y - RADIUS);
  });
  it('scores a brick hit and reflects the ball below it', () => {
    const game = createBreakout(); launchBall(game);
    const brick = game.bricks[18]; if (!brick) throw new Error('fixture brick missing');
    game.ball = { x: brick.x + brick.width / 2, y: brick.y + brick.height + RADIUS + 1, vx: 0, vy: -260 };
    stepBreakout(game, 1 / 120);
    expect(brick.hp).toBe(0); expect(game.score).toBe(10); expect(game.ball.vy).toBeGreaterThan(0);
  });
  it('loses one life per fall and waits for the next launch', () => {
    const game = createBreakout(); launchBall(game);
    game.ball.y = HEIGHT + 20; game.ball.vy = 100;
    stepBreakout(game, 1 / 120);
    expect(game.lives).toBe(2); expect(game.status).toBe('aiming');
    stepBreakout(game, 1 / 120); expect(game.lives).toBe(2);
    game.lives = 1; launchBall(game); game.ball.y = HEIGHT + 20;
    stepBreakout(game, 1 / 120); expect(game.status).toBe('over');
  });
  it.each([1, 2, 3])('clearing stage %i advances or wins without losing lives', (stage) => {
    const game = createBreakout(); game.stage = stage;
    game.bricks = [{ x: 40, y: 100, width: 47, height: 18, hp: 1, row: 0 }];
    launchBall(game); game.ball = { x: 60, y: 100 + 18 + RADIUS + 1, vx: 0, vy: -260 };
    stepBreakout(game, 1 / 120);
    expect(game.lives).toBe(3);
    expect(game.status).toBe(stage === 3 ? 'won' : 'aiming');
    expect(game.stage).toBe(stage === 3 ? 3 : stage + 1);
  });
});
