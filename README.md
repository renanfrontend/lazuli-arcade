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

Duelo de pilhas contra um oponente que joga o próprio tabuleiro ao mesmo tempo que você.

- Arraste uma pilha da bandeja até uma casa vazia do tabuleiro (losango 5 × 5).
- Pilhas vizinhas com o mesmo símbolo no topo se juntam: as peças pulam, uma a uma, para a pilha que tiver mais daquele símbolo.
- Dez iguais no topo somem e viram pontos. Limpezas em sequência na mesma jogada valem em dobro, em triplo…
- A casa com cadeado abre quando você chega a 90 pontos.
- Quem chegar a 370 primeiro vence; se o seu tabuleiro encher, você perde. A cada vitória o nível sobe e o oponente fica mais rápido e mais esperto.

### Controles

| Entrada | Lazuli Blocks | Empilha |
| --- | --- | --- |
| Arrastar (mouse, toque, caneta) | Move e solta a peça | Move e solta a pilha |
| Tocar na bandeja, depois no tabuleiro | Posiciona; tocar na sombra confirma | Coloca na casa tocada (as livres acendem) |
| `1` `2` `3` | Seleciona a peça | Seleciona a pilha |
| Setas · `Enter` | Movem e colocam | Movem o cursor e colocam |
| `Esc` | Cancela | Cancela ou pausa |

## Stack

React 19 · TypeScript 6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) · Vite 8 · Vitest · ESLint `strictTypeChecked` · `vite-plugin-pwa`. Sem bibliotecas de estado, animação, roteamento ou áudio.

## Scripts

```bash
npm install
npm run dev             # servidor local
npm test                # 125 testes de domínio, aplicação e shell
npm run lint            # ESLint com regras type-checked
npm run typecheck       # tsc -b
npm run build           # PWA em dist/ (BASE_PATH=/lazuli-arcade/ para subpasta)
npm run build:artifact  # um único HTML em dist-artifact/lazuli-arcade.html
```

Node `^20.19` ou `>=22.12`. Cada push na `main` passa por typecheck, lint e testes e publica no GitHub Pages (`.github/workflows/deploy.yml`).

## Arquitetura

```
src/
├── main.tsx              composition root: cria os adaptadores e entrega ArcadeServices ao app
├── app/                  shell: lobby, registro de jogos, rotas por hash, error boundary
├── shared/               núcleo compartilhado entre os jogos
│   ├── domain/             grade imutável genérica, PRNG puro com seed
│   ├── application/        portas (KeyValueStore, AudioPort, FeedbackPort) e configurações do arcade
│   ├── infrastructure/     localStorage resiliente, sintetizador Web Audio, seed via crypto
│   └── ui/                 Dialog nativo, drag genérico por Pointer Events, hooks, tokens de tema
└── games/
    ├── lazuli-blocks/      domain · application · infrastructure · ui
    └── empilha/            domain · application · infrastructure · ui
```

Regra de dependência: `ui → application → domain`, em cada jogo e no núcleo. `infrastructure` implementa as portas de `application`, os jogos dependem só de `shared/` e nunca um do outro, e só o `main.tsx` conhece os adaptadores concretos.

### Adicionando um jogo

1. Crie `src/games/<id>/` com as camadas de que o jogo precisar.
2. Exporte um `GameDefinition` em `src/games/<id>/index.ts`: `id` (também a rota `#<id>`), título, chamada, cor do navegador, uma miniatura leve para o card e a tela em `lazy(() => import('./ui/<Jogo>'))`. Opcionalmente, `highlights` lê o save do jogo para mostrar recordes no lobby.
3. Inclua o jogo em `GAMES`, em `src/app/registry.ts`.

Cada jogo vira um chunk separado, salva dados no próprio namespace (`<id>:v1:*`) e recebe do shell só `services` e `onExit`. Um erro dentro de um jogo cai no error boundary do shell, sem derrubar o arcade.

### Decisões técnicas

- **Domínios determinísticos.** O PRNG recebe e devolve a seed, que mora no estado. A mesma seed reproduz a partida inteira, o que permite testes de propriedade e restaurar um save sem divergir.
- **Saves à prova de dados ruins.** Snapshots versionados e validados campo a campo; qualquer inconsistência inicia uma partida nova em vez de quebrar.
- **Drag fora do ciclo do React.** Um hook genérico (`usePointerDrag`) move a peça via `transform` dentro de `requestAnimationFrame`; o React só re-renderiza quando muda o alvo do encaixe. Serve aos dois jogos.
- **Efeitos imperativos.** Gemas, moedas, peças que pulam e faíscas são nós num overlay fixo animados com Web Animations API, que se removem ao terminar.
- **Empilha: resolução em passos.** Cada fusão e limpeza vira um passo com o tabuleiro resultante, e a UI reproduz os passos em sequência, peça por peça. Invariante testado: depois de uma jogada, nenhum par de vizinhos tem o mesmo topo.
- **Empilha: oponente real.** O oponente joga um tabuleiro próprio com as mesmas regras, escolhendo jogadas por heurística; o nível ajusta tempo de reação e precisão. Ele pausa junto com o menu e quando a aba fica oculta. O equilíbrio (meta, casa bloqueada, receita das pilhas) foi calibrado por simulação.
- **Isometria só com CSS.** Grade quadrada girada 45°, peças como quadrados arredondados achatados, com a lateral desenhada por `box-shadow`; todas as medidas derivam de `--hw`, calculado com container queries.
- **Acessibilidade.** Teclado completo nos dois jogos, `aria-live` narrando jogadas, rótulos descritivos, `<dialog>` nativo, foco visível com contraste nos dois temas e `prefers-reduced-motion` respeitado.
- **Temas.** Paletas claras e escuras por tokens CSS e `prefers-color-scheme`; a cor da barra do navegador acompanha o jogo aberto.

### Mascote

Capi, a capivara com uma gema azul na cabeça do Lazuli Blocks, é uma personagem original em SVG, com seis humores que reagem ao estado do tabuleiro.

## Direitos autorais

© 2026 Renan Augusto dos Santos. Todos os direitos reservados. Código, jogos, personagens e artes não podem ser copiados, modificados ou distribuídos sem autorização; veja [LICENSE](LICENSE).

Conheça mais em [renanaugusto.com.br](https://renanaugusto.com.br).
