# Lazuli Arcade

Arcade de jogos casuais para celular e desktop, em React e TypeScript. Um lobby leve, jogos independentes que só baixam quando são abertos e progresso salvo no próprio aparelho. Roda como PWA instalável (offline) e também como um único arquivo HTML autocontido.

**Jogar:** [renanfrontend.github.io/lazuli-arcade](https://renanfrontend.github.io/lazuli-arcade/)

![Lobby do arcade, uma jogada do Lazuli Blocks virando moedas e um duelo do Empilha limpando dez peças](docs/preview.png)

## Jogos

### Lazuli Blocks

Block puzzle de gemas num tabuleiro 11 × 13. Linhas e colunas completas se desfazem e as gemas viram moedas que voam até o contador.

- Arraste uma das três peças da bandeja até o tabuleiro. No toque, a peça flutua acima do dedo e o encaixe é tolerante (procura a casa válida mais próxima).
- Linhas (11 gemas) e colunas (13 gemas) completas saem ao mesmo tempo; cruzamentos contam uma vez.
- **Moedas:** cada gema removida vale 1, com bônus para várias linhas de uma vez, combos e tabuleiro limpo. Ficam guardadas entre partidas.
- **Trocar peças:** gaste moedas para sortear outra bandeja (30, depois 60, 90… na mesma partida).
- A partida acaba quando nenhuma peça da bandeja cabe.

### Empilha

Duelo de pilhas contra um oponente visível em tempo real que joga o próprio tabuleiro ao mesmo tempo que você!

- **Física e Rotação 3D:** ao saltar de pilha em pilha, as peças giram no ar com rotação 3D acrobática em arco parabólico.
- **Oponente à Vista:** visualize o avatar do oponente, falas e reações em tempo real, sua bandeja animada e o mini-tabuleiro ao vivo com opção de espiar o tabuleiro completo.
- **Turma de Personagens:** desafie uma turma com personalidades e estilos de IA únicos:
  - **Tatá (Tartaruga):** paciente e extremamente precisa.
  - **Rabito (Coelho):** veloz e impulsivo em busca de combos.
  - **Lobo:** astuto, caçador de pilhas gigantes.
  - **Porquinha:** organizadora cuidadosa de cores no cofrinho.
  - **Puga (Pug):** brincalhão, farejador de boas jogadas.
  - **Elefantinho:** memória de ferro com pisões pesados de pontuação.
- **Modo Torneio com Chaveamento:** dispute a Copa dos Bichos no sistema mata-mata (Quartas, Semifinais e Grande Final) com chaveamento visual e conquiste o Troféu Ouro!
- Arraste uma pilha da bandeja até uma casa vazia do tabuleiro (losango 5 × 5).
- Pilhas vizinhas com o mesmo símbolo no topo se juntam. Dez iguais somam pontos e limpam a pilha.
- A casa com cadeado abre quando você chega a 90 pontos.
- Quem chegar a 370 primeiro vence.

### Puga Salta

Jogo de ação e pulo vertical nas alturas estrelando o mascote Puga!

- Toque no lado esquerdo ou direito da tela (ou use as setas do teclado) para controlar o pulo do Puga de plataforma em plataforma.
- Plataformas especiais: móveis, molas de super pulo e plataformas quebradiças.
- Colete ossinhos dourados e estrelas de bônus pelo caminho.
- Power-ups da turma: Casco protetor da Tatá salva de quedas!
- Recorde de altura em metros salvo no aparelho.

### Controles

| Entrada | Lazuli Blocks | Empilha | Puga Salta |
| --- | --- | --- | --- |
| Arrastar (mouse, toque, caneta) | Move e solta a peça | Move e solta a pilha | - |
| Toque na tela | Posiciona / confirma | Coloca na casa livre | Lado esquerdo / direito para guiar o pulo |
| `1` `2` `3` | Seleciona a peça | Seleciona a pilha | - |
| Setas · `A`/`D` | Movem e colocam | Movem o cursor e colocam | Movem o Puga para a esquerda e direita |
| `Esc` | Cancela | Cancela ou pausa | Pausa |

## Stack

React 19 · TypeScript 6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) · Vite 8 · Vitest · ESLint `strictTypeChecked` · `vite-plugin-pwa`. Sem bibliotecas externas de animação ou áudio.

## Scripts

```bash
npm install
npm run dev             # servidor local
npm test                # testes de domínio, aplicação e shell
npm run lint            # ESLint com regras type-checked
npm run typecheck       # tsc -b
npm run build           # PWA em dist/ (BASE_PATH=/lazuli-arcade/ para subpasta)
npm run build:artifact  # um único HTML em dist-artifact/lazuli-arcade.html
```

## Arquitetura

```
src/
├── main.tsx              composition root: cria os adaptadores e entrega ArcadeServices ao app
├── app/                  shell: lobby, registro de jogos, rotas por hash, error boundary
├── shared/               núcleo compartilhado entre os jogos
└── games/
    ├── lazuli-blocks/      domain · application · infrastructure · ui
    ├── empilha/            domain · application · infrastructure · ui (personagens, torneio, 3d fx)
    └── puga-salta/         application · infrastructure · ui (canvas game loop, plataformas)
```

## Direitos autorais

© 2026 Renan Augusto dos Santos. Todos os direitos reservados. Código, jogos, personagens e artes originais. Veja [LICENSE](LICENSE).

Conheça mais em [renanaugusto.com.br](https://renanaugusto.com.br).
