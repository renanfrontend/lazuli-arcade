export const WIDTH = 360;
export const HEIGHT = 440;
export const PADDLE_Y = 394;
export const PADDLE_WIDTH = 86;
export const RADIUS = 7;
export interface Brick { x: number; y: number; width: number; height: number; hp: number; row: number }
export interface BreakoutState {
  paddle: number; ball: { x: number; y: number; vx: number; vy: number };
  bricks: Brick[]; score: number; lives: number; stage: number;
  status: 'aiming' | 'playing' | 'over' | 'won';
}
export const makeBricks = (stage: number): Brick[] => Array.from({ length: 24 }, (_, i) => ({
  x: 22 + i % 6 * 53, y: 42 + Math.floor(i / 6) * 26, width: 47, height: 18,
  hp: Math.floor(i / 6) === 0 ? stage : 1, row: Math.floor(i / 6),
}));

export const createBreakout = (): BreakoutState => ({
  paddle: WIDTH / 2, ball: { x: WIDTH / 2, y: PADDLE_Y - RADIUS - 1, vx: 0, vy: 0 },
  bricks: makeBricks(1), score: 0, lives: 3, stage: 1, status: 'aiming',
});

export const movePaddle = (state: BreakoutState, x: number): void => {
  state.paddle = Math.max(PADDLE_WIDTH / 2, Math.min(WIDTH - PADDLE_WIDTH / 2, x));
  if (state.status === 'aiming') state.ball.x = state.paddle;
};

export const launchBall = (state: BreakoutState): void => {
  if (state.status !== 'aiming') return;
  state.status = 'playing';
  state.ball.vx = 90;
  state.ball.vy = -(230 + state.stage * 30);
};

const dockBall = (state: BreakoutState): void => {
  state.status = 'aiming';
  state.ball = { x: state.paddle, y: PADDLE_Y - RADIUS - 1, vx: 0, vy: 0 };
};

/** Called at a fixed 120 Hz so fast balls cannot skip a thin brick or paddle. */
export const stepBreakout = (state: BreakoutState, seconds: number): void => {
  if (state.status !== 'playing') return;
  const ball = state.ball;
  const previousY = ball.y;
  ball.x += ball.vx * seconds;
  ball.y += ball.vy * seconds;
  if (ball.x < RADIUS) { ball.x = RADIUS; ball.vx = Math.abs(ball.vx); }
  if (ball.x > WIDTH - RADIUS) { ball.x = WIDTH - RADIUS; ball.vx = -Math.abs(ball.vx); }
  if (ball.y < RADIUS) { ball.y = RADIUS; ball.vy = Math.abs(ball.vy); }
  if (ball.vy > 0 && previousY + RADIUS <= PADDLE_Y && ball.y + RADIUS >= PADDLE_Y &&
      ball.x + RADIUS >= state.paddle - PADDLE_WIDTH / 2 && ball.x - RADIUS <= state.paddle + PADDLE_WIDTH / 2) {
    const offset = Math.max(-1, Math.min(1, (ball.x - state.paddle) / (PADDLE_WIDTH / 2)));
    const speed = 265 + state.stage * 35;
    ball.vx = offset * speed * .85;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
    ball.y = PADDLE_Y - RADIUS;
  }
  for (const brick of state.bricks) {
    if (brick.hp === 0) continue;
    const nearX = Math.max(brick.x, Math.min(brick.x + brick.width, ball.x));
    const nearY = Math.max(brick.y, Math.min(brick.y + brick.height, ball.y));
    if (Math.hypot(ball.x - nearX, ball.y - nearY) > RADIUS) continue;
    brick.hp -= 1;
    state.score += 10;
    if (previousY + RADIUS <= brick.y) { ball.y = brick.y - RADIUS; ball.vy = -Math.abs(ball.vy); }
    else if (previousY - RADIUS >= brick.y + brick.height) { ball.y = brick.y + brick.height + RADIUS; ball.vy = Math.abs(ball.vy); }
    else if (ball.x < brick.x + brick.width / 2) { ball.x = brick.x - RADIUS; ball.vx = -Math.abs(ball.vx); }
    else { ball.x = brick.x + brick.width + RADIUS; ball.vx = Math.abs(ball.vx); }
    if (state.bricks.every((item) => item.hp === 0)) {
      if (state.stage === 3) state.status = 'won';
      else { state.stage += 1; state.bricks = makeBricks(state.stage); dockBall(state); }
    }
    break;
  }
  if (ball.y > HEIGHT + RADIUS && state.status === 'playing') {
    state.lives -= 1;
    if (state.lives === 0) state.status = 'over';
    else dockBall(state);
  }
};
