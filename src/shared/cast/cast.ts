/**
 * The arcade's cast: original animal characters shared by every game.
 * Pure data; the drawings live in `shared/ui/cast`, behavior (difficulty, tricks) in each game.
 */
export const CAST_IDS = ['tata', 'porquinho', 'elefantinho', 'puga', 'rabito', 'raposa', 'lobo', 'coruja'] as const;

export type CastId = (typeof CAST_IDS)[number];

export interface CastMember {
  readonly id: CastId;
  readonly name: string;
  readonly species: string;
  /** One line of personality, in the character's voice. */
  readonly motto: string;
  /** Signature color, used for rings, bars and badges. */
  readonly color: string;
}

export const CAST: readonly CastMember[] = [
  { id: 'tata', name: 'Tata', species: 'Tartaruga', motto: 'Devagar e sempre, sem pressa nenhuma.', color: '#5fb96b' },
  { id: 'porquinho', name: 'Porquinho', species: 'Porquinho', motto: 'Quanto mais pilhas, melhor!', color: '#f08fb0' },
  { id: 'elefantinho', name: 'Elefantinho', species: 'Elefantinho', motto: 'Eu nunca esqueço uma jogada.', color: '#7ea4d9' },
  { id: 'puga', name: 'Puga', species: 'Pug', motto: 'Ronc… ops, é a minha vez?', color: '#d6a45f' },
  { id: 'rabito', name: 'Rabito', species: 'Coelho', motto: 'Rápido demais pra você piscar.', color: '#b79af0' },
  { id: 'raposa', name: 'Raposa', species: 'Raposa', motto: 'Sempre um passo à frente.', color: '#f08a3c' },
  { id: 'lobo', name: 'Lobo', species: 'Lobo', motto: 'Eu farejo a melhor jogada.', color: '#6c7f9e' },
  { id: 'coruja', name: 'Coruja', species: 'Coruja', motto: 'Já calculei esta partida inteira.', color: '#8a6a55' },
] as const;

const BY_ID: ReadonlyMap<string, CastMember> = new Map(CAST.map((member) => [member.id, member]));

export const isCastId = (value: unknown): value is CastId => typeof value === 'string' && BY_ID.has(value);

export const castMember = (id: CastId): CastMember => {
  const member = BY_ID.get(id);
  if (!member) throw new RangeError(`Unknown cast member "${id}"`);
  return member;
};
