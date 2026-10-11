import type { ComponentType } from 'react';
import type { ArcadeServices } from '../application/arcade';

export interface GameProps {
  readonly services: ArcadeServices;
  /** Leaves the game and returns to the lobby. */
  readonly onExit: () => void;
}

export interface ThemeColor {
  readonly light: string;
  readonly dark: string;
}

/**
 * The contract between the lobby and a game. Adding a game means creating
 * `src/games/<id>/index.ts` that exports one of these and listing it in
 * `src/app/registry.ts`.
 */
export interface GameDefinition {
  /** Unique slug, also the URL hash: lowercase letters, digits and dashes. */
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly featured?: boolean;
  /** Browser chrome color while the game is open (the status bar on phones). */
  readonly themeColor: ThemeColor;
  /** Lightweight artwork for the lobby card; it must not import the game screen. */
  readonly Thumbnail: ComponentType;
  /**
   * The game screen, created with `lazy(() => import('./ui/...'))` at module scope so its
   * code downloads only when the game is opened.
   */
  readonly Screen: ComponentType<GameProps>;
  /** Short facts for the lobby card, read from the game's own save data. */
  readonly highlights?: (services: ArcadeServices) => readonly string[];
}
