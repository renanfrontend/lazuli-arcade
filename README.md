# Lazuli Blocks

Block puzzle de gemas para celular e desktop. Arraste as peças até o tabuleiro 11 × 13; cada linha ou coluna completa se desfaz e as gemas viram moedas que voam até o contador.

Roda como PWA instalável (offline) e também como um único arquivo HTML autocontido.

![Três momentos de uma jogada: a prévia do encaixe acende as linhas, as gemas viram moedas e as moedas voam até o contador](docs/preview.png)

## Como jogar

- Arraste uma das três peças da bandeja até o tabuleiro. No toque, a peça flutua acima do dedo e o encaixe é tolerante (procura a casa válida mais próxima).
- Linhas (11 gemas) e colunas (13 gemas) completas são removidas ao mesmo tempo; cruzamentos contam uma vez.
- **Moedas:** cada gema removida vale 1 moeda, com bônus para várias linhas de uma vez, combos (limpar em jogadas seguidas, com até 2 jogadas de folga) e tabuleiro limpo.
- **Pontos:** contam por partida e definem o recorde. As moedas ficam guardadas entre partidas.
- **Trocar peças:** gaste moedas para sortear outra bandeja (30, depois 60, 90… na mesma partida). Também funciona na tela de fim de jogo.
- A partida acaba quando nenhuma peça da bandeja cabe no tabuleiro.

| Entrada | Ação |
| --- | --- |
| Arrastar (mouse, toque, caneta) | Move e solta a peça |
| Tocar na peça, depois no tabuleiro | Posiciona; tocar na sombra confirma |
| `1` `2` `3` ou `Enter` na peça | Seleciona a peça |
| Setas | Movem a peça selecionada |
| `Enter` / `Espaço` | Coloca |
| `Esc` | Cancela |

## Stack

React 19 · TypeScript 6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) · Vite 8 · Vitest · ESLint `strictTypeChecked` · `vite-plugin-pwa`. Sem bibliotecas de estado, animação ou áudio.

## Scripts

```bash
npm install
npm run dev             # servidor local
npm test                # 77 testes de domínio e persistência
npm run lint            # ESLint com regras type-checked
npm run build           # PWA em dist/ (manifest, service worker, ícones)
npm run build:artifact  # um único HTML em dist-artifact/lazuli-blocks.html
```

Node `^20.19` ou `>=22.12`.

## Arquitetura

```
src/
├── domain/           regras puras: zero React, zero DOM, zero I/O
│   ├── grid.ts         grade imutável genérica (Grid<TCell>)
│   ├── board.ts        tabuleiro = Grid<GemKind | null>
│   ├── shapes.ts       catálogo em ASCII ('#.\n##'), rotações/espelhos gerados
│   ├── placement.ts    encaixe, origens válidas, snap tolerante, preview
│   ├── lines.ts        linhas/colunas completas e remoção
│   ├── scoring.ts      pontos, moedas, combos
│   ├── dealer.ts       distribuição justa e adaptativa da bandeja
│   ├── rubble.ts       pilha inicial irregular (nunca com linha completa)
│   ├── rng.ts          PRNG puro com seed (mulberry32)
│   ├── snapshot.ts     serialização versionada + validação de dados não confiáveis
│   └── game.ts         estado, eventos e reducer
├── application/      casos de uso e portas
│   ├── ports.ts        KeyValueStore, FeedbackPort, SeedSource
│   ├── persistence.ts  carregar/salvar jogo, perfil e preferências
│   └── useGame.ts      liga o reducer ao React e mantém o save em dia
├── infrastructure/   adaptadores concretos das portas
│   ├── browserStore.ts       localStorage com fallback em memória (nunca lança)
│   ├── webAudioFeedback.ts   efeitos sintetizados + vibração
│   └── seed.ts               seed via crypto.getRandomValues
├── ui/               componentes, hooks e estilos (CSS Modules)
└── main.tsx          composition root: único ponto que conhece os adaptadores
```

Regra de dependência: `ui → application → domain`. `infrastructure` implementa as portas de `application`, e só o `main.tsx` junta tudo.

### Decisões técnicas

- **Domínio determinístico.** O PRNG recebe e devolve a seed, que mora no estado. A mesma seed reproduz a partida inteira, o que permite testes de propriedade (partidas aleatórias inteiras, verificando invariantes a cada jogada) e restaurar um save sem divergir.
- **Distribuição justa.** Os pesos das peças se adaptam ao preenchimento do tabuleiro e a uma rampa de dificuldade. Se alguma peça do catálogo ainda cabe, a bandeja sempre traz ao menos uma que cabe: o jogo nunca termina logo depois de uma nova bandeja.
- **Drag fora do ciclo do React.** Pointer Events com captura; a peça flutuante se move via `transform` dentro de `requestAnimationFrame`, e o React só re-renderiza quando muda a casa de encaixe (sombra e linhas que vão brilhar).
- **Efeitos imperativos.** Gemas que estouram, estilhaços e moedas em curva de Bézier são nós criados num overlay fixo e animados com Web Animations API; cada nó se remove ao terminar. Contadores animam escrevendo direto no DOM.
- **Save à prova de dados ruins.** O snapshot é validado campo a campo (formas, gemas, dimensões, contadores, tabuleiro sem linha completa). Qualquer inconsistência inicia uma partida nova em vez de quebrar.
- **Layout de uma unidade.** Tudo deriva de `--cell`, calculado com container queries a partir da largura e da altura disponíveis e arredondado para pixels inteiros com `round()`, para manter linhas e bordas nítidas de 320 px a desktop.
- **Acessibilidade.** Modo teclado completo, `aria-live` narrando jogadas, rótulos descritivos das peças, `<dialog>` nativo (foco preso e `Esc`), foco visível com contraste mínimo de 3:1 nos dois temas e `prefers-reduced-motion` respeitado.
- **Temas.** Paleta diurna (céu azul, fiel à referência) e noturna, via tokens CSS e `prefers-color-scheme`.

### Mascote

Capi, uma capivara com uma safira na cabeça, personagem original em SVG com seis humores (tranquila, concentrada, feliz, empolgada, preocupada, triste) que reagem ao estado do tabuleiro.

## Levando para as lojas (Expo / React Native)

`domain/` e `application/` não tocam no DOM, então funcionam sem alteração em React Native. Para portar, basta:

1. Implementar `KeyValueStore` com MMKV ou AsyncStorage e `FeedbackPort` com `expo-audio` e `expo-haptics`.
2. Reescrever `ui/` com `react-native-reanimated` e `react-native-gesture-handler`, mantendo os mesmos eventos de domínio.
