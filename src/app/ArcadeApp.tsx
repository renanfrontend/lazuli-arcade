import { Suspense } from 'react';
import type { ArcadeServices } from '@shared/application/arcade';
import type { ThemeColor } from '@shared/ui/arcade';
import { GameErrorBoundary } from './GameErrorBoundary';
import { GameLoading } from './GameLoading';
import { Hub } from './Hub';
import { exitToLobby, useRoute } from './navigation';
import { ARCADE_NAME } from './owner';
import { findGame, GAMES } from './registry';
import { useDocumentChrome } from './useDocumentChrome';

const LOBBY_COLOR: ThemeColor = { light: '#dce8f9', dark: '#0a1430' };

interface ArcadeAppProps {
  readonly services: ArcadeServices;
}

export function ArcadeApp({ services }: ArcadeAppProps) {
  const game = findGame(useRoute());
  useDocumentChrome(game ? `${game.title} · ${ARCADE_NAME}` : ARCADE_NAME, game?.themeColor ?? LOBBY_COLOR);

  if (!game) return <Hub games={GAMES} services={services} />;

  return (
    <GameErrorBoundary key={game.id} title={game.title} onExit={exitToLobby}>
      <Suspense fallback={<GameLoading title={game.title} />}>
        <game.Screen services={services} onExit={exitToLobby} />
      </Suspense>
    </GameErrorBoundary>
  );
}
