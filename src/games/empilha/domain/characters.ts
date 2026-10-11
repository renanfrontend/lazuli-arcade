import { castMember, type CastId, type CastMember } from '@shared/cast/cast';

/** How a rival plays: how fast, how well, and what it cares about. */
export interface BotProfile {
  /** Average pause before each of its placements. */
  readonly thinkMs: number;
  /** Random spread added to each pause (±). */
  readonly jitterMs: number;
  /** 0..1: how often it takes its best move instead of a decent one. */
  readonly skill: number;
  /** Multipliers on what its move evaluation cares about; 1 is balanced. */
  readonly style: { readonly points: number; readonly room: number; readonly potential: number };
}

/** A cast member sitting on the other side of the board. */
export interface Rival {
  readonly id: CastId;
  /** 1 (easiest) to 8: also widens the tile palette. */
  readonly tier: number;
  readonly bot: BotProfile;
  /** What the rival says before the first move and after the result. */
  readonly lines: { readonly start: string; readonly win: string; readonly lose: string };
}

const style = (points = 1, room = 1, potential = 1) => ({ points, room, potential });

export const RIVALS: readonly Rival[] = [
  {
    id: 'tata',
    tier: 1,
    bot: { thinkMs: 2900, jitterMs: 900, skill: 0.3, style: style(0.8, 1.6, 0.6) },
    lines: { start: 'Sem pressa, tá? Eu chego lá.', win: 'Eu disse: devagar e sempre!', lose: 'Uau… você foi mais rápido que eu.' },
  },
  {
    id: 'porquinho',
    tier: 2,
    bot: { thinkMs: 2100, jitterMs: 700, skill: 0.42, style: style(1.5, 0.7, 0.8) },
    lines: { start: 'Vou empilhar tudo que eu puder!', win: 'Oinc! Peguei todos os pontos!', lose: 'Oinc… eu queria mais uma pilha.' },
  },
  {
    id: 'elefantinho',
    tier: 3,
    bot: { thinkMs: 1900, jitterMs: 600, skill: 0.54, style: style(1, 1.2, 1.4) },
    lines: { start: 'Eu lembro de cada pilha. Vamos?', win: 'Memória de elefante, lembra?', lose: 'Dessa eu vou lembrar pra sempre.' },
  },
  {
    id: 'puga',
    tier: 4,
    bot: { thinkMs: 2300, jitterMs: 1300, skill: 0.62, style: style(1.2, 1, 1) },
    lines: { start: 'Ronc… ah, é a minha vez?', win: 'Ganhei e nem acordei direito.', lose: 'Mereço uma soneca depois dessa.' },
  },
  {
    id: 'rabito',
    tier: 5,
    bot: { thinkMs: 800, jitterMs: 300, skill: 0.62, style: style(1.1, 0.8, 0.9) },
    lines: { start: 'Piscou? Perdeu uma jogada!', win: 'Rápido demais, né?', lose: 'Ué… eu fui rápido demais?' },
  },
  {
    id: 'raposa',
    tier: 6,
    bot: { thinkMs: 1500, jitterMs: 500, skill: 0.78, style: style(1.1, 1, 1.5) },
    lines: { start: 'Já planejei três jogadas à frente.', win: 'Eu avisei: um passo à frente.', lose: 'Hmm… um truque que eu não previ.' },
  },
  {
    id: 'lobo',
    tier: 7,
    bot: { thinkMs: 1350, jitterMs: 400, skill: 0.88, style: style(1.3, 1.1, 1.1) },
    lines: { start: 'Estou farejando a sua derrota.', win: 'Auuu! A matilha agradece.', lose: 'Respeito. Você sabe jogar.' },
  },
  {
    id: 'coruja',
    tier: 8,
    bot: { thinkMs: 1700, jitterMs: 300, skill: 0.97, style: style(1.2, 1.2, 1.2) },
    lines: { start: 'Calculei esta partida inteira.', win: 'Exatamente como calculei.', lose: 'Isso… não estava nos meus cálculos.' },
  },
];

const BY_ID: ReadonlyMap<CastId, Rival> = new Map(RIVALS.map((rival) => [rival.id, rival]));

export const findRival = (id: CastId): Rival => {
  const rival = BY_ID.get(id);
  if (!rival) throw new RangeError(`No rival for "${id}"`);
  return rival;
};

export const rivalMember = (id: CastId): CastMember => castMember(id);
