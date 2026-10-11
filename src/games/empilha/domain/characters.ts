import type { BotProfile } from './rules';

export type CharacterId = 'tata' | 'rabito' | 'lobo' | 'porquinha' | 'puga' | 'elefantinho';

export interface CharacterDialogue {
  readonly onStart: string;
  readonly onThinking: string;
  readonly onPlace: string;
  readonly onScore: string;
  readonly onPlayerScore: string;
  readonly onWin: string;
  readonly onLose: string;
}

export interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly title: string;
  readonly animal: string;
  readonly bio: string;
  readonly catchphrase: string;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly bot: BotProfile;
  readonly dialogues: CharacterDialogue;
}

export const CHARACTERS: readonly Character[] = [
  {
    id: 'tata',
    name: 'Tatá',
    title: 'A Tartaruga Paciente',
    animal: 'Tartaruga',
    bio: 'Joga devagar, mas com extrema precisão e planejamento de longo prazo.',
    catchphrase: 'Devagar e sempre! Cada peça no seu devido lugar.',
    primaryColor: '#2b8a3e',
    accentColor: '#8ce99a',
    bot: {
      thinkMs: 2700,
      jitterMs: 400,
      skill: 0.88,
    },
    dialogues: {
      onStart: 'Oi! Vamos jogar com calma e sem pressa!',
      onThinking: 'Pensando na melhor jogada com meu casco...',
      onPlace: 'Encaixe firme e seguro!',
      onScore: 'Paciência traz grandes recompensas!',
      onPlayerScore: 'Bela jogada! Mas ainda tenho muito fôlego.',
      onWin: 'A tartaruga cruzou a linha de chegada primeiro!',
      onLose: 'Parabéns! Sua estratégia foi admirável.',
    },
  },
  {
    id: 'rabito',
    name: 'Rabito',
    title: 'O Coelho Acelerado',
    animal: 'Coelho',
    bio: 'Veloz como um relâmpago! Mal espera a vez e joga por impulso em busca de combos.',
    catchphrase: 'Pula, corre e empilha! Nem pisca que eu já joguei!',
    primaryColor: '#e8590c',
    accentColor: '#ffd8a8',
    bot: {
      thinkMs: 1350,
      jitterMs: 250,
      skill: 0.68,
    },
    dialogues: {
      onStart: 'Bora que o cronômetro não para!',
      onThinking: 'Rápido, rápido, achei!',
      onPlace: 'Pula e encaixa!',
      onScore: 'Combo relâmpago! Pegou o ritmo?',
      onPlayerScore: 'Uou! Essa foi rápida, gostei!',
      onWin: 'Velocidade total! Nem me viu passar!',
      onLose: 'Puxa, tropecei nas minhas próprias orelhas!',
    },
  },
  {
    id: 'lobo',
    name: 'Lobo',
    title: 'O Lobo Astuto',
    animal: 'Lobo',
    bio: 'Observador e perspicaz. Foca em acumular pilhas grandes para limpezas devastadoras.',
    catchphrase: 'A alcateia nunca erra o cálculo.',
    primaryColor: '#364fc7',
    accentColor: '#bac8ff',
    bot: {
      thinkMs: 2200,
      jitterMs: 400,
      skill: 0.85,
    },
    dialogues: {
      onStart: 'Que vença o estrategista mais afiado.',
      onThinking: 'Farejando o ponto fraco do tabuleiro...',
      onPlace: 'O cerco está armado.',
      onScore: 'Auuuu! Uma limpeza espetacular!',
      onPlayerScore: 'Você tem garras, admito.',
      onWin: 'O Lobo mantém o domínio do topo!',
      onLose: 'Você me surpreendeu. Honra ao vencedor.',
    },
  },
  {
    id: 'porquinha',
    name: 'Porquinha',
    title: 'A Porquinha Poupadeira',
    animal: 'Porquinha',
    bio: 'Adora colecionar cores iguais e encher o cofrinho de pontos.',
    catchphrase: 'Oinc! Cada pontinho bem guardadinho!',
    primaryColor: '#d6336c',
    accentColor: '#fcc2d7',
    bot: {
      thinkMs: 1900,
      jitterMs: 350,
      skill: 0.74,
    },
    dialogues: {
      onStart: 'Oinc! Que dia lindo para empilhar!',
      onThinking: 'Hummm, onde coloco essa pecinha rosa?',
      onPlace: 'Guardadinha no meu cantinho!',
      onScore: 'Oinc oinc! Cofre cheio de pontos!',
      onPlayerScore: 'Uau, que pilha charmosa!',
      onWin: 'Vitória fofinha! O cofrinho transbordou!',
      onLose: 'Foi por pouco! Vou comer um lanchinho e volto!',
    },
  },
  {
    id: 'puga',
    name: 'Puga',
    title: 'O Pug Curioso',
    animal: 'Pug',
    bio: 'Super simpático e curioso. Joga com entusiasmo contagiante e fareja combinações.',
    catchphrase: 'Au au! Brincar de empilhar é bom demais!',
    primaryColor: '#d97706',
    accentColor: '#fef08a',
    bot: {
      thinkMs: 1700,
      jitterMs: 450,
      skill: 0.76,
    },
    dialogues: {
      onStart: 'Au au! Abanando o rabinho pra começar!',
      onThinking: 'Farejei... tá quase!',
      onPlace: 'Patada certeira na pilha!',
      onScore: 'Au au au! Ponto pro cachorrinho!',
      onPlayerScore: 'Latido de parabéns! Grande jogada!',
      onWin: 'Mereço um petisco! Ganhei!',
      onLose: 'Você joga muito! Vamos ser amigos?',
    },
  },
  {
    id: 'elefantinho',
    name: 'Elefantinho',
    title: 'O Elefante Memória de Ferro',
    animal: 'Elefante',
    bio: 'Tem memória fotográfica das peças e faz jogadas com impacto estrondoso.',
    catchphrase: 'Um elefante nunca esquece uma boa combinação!',
    primaryColor: '#087f5b',
    accentColor: '#96f2d7',
    bot: {
      thinkMs: 2500,
      jitterMs: 300,
      skill: 0.92,
    },
    dialogues: {
      onStart: 'Preparado? Minha tromba já decorou o tabuleiro!',
      onThinking: 'Acessando meus registros de memória...',
      onPlace: 'Pisão firme no tabuleiro!',
      onScore: 'Tromba de pontos! Uma enxurrada!',
      onPlayerScore: 'Boa jogada, registrei na memória!',
      onWin: 'A marcha triunfal do Elefante!',
      onLose: 'Foi um duelo memorável! Parabéns!',
    },
  },
];

export const getCharacter = (id: CharacterId): Character =>
  CHARACTERS.find((char) => char.id === id) ?? CHARACTERS[0]!;

export const getCharacterByLevel = (level: number): Character => {
  const index = Math.max(0, Math.floor(level) - 1) % CHARACTERS.length;
  return CHARACTERS[index] ?? CHARACTERS[0]!;
};
