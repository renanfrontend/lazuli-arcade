import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './GameStatus.module.css';

interface GameErrorBoundaryProps {
  readonly title: string;
  readonly onExit: () => void;
  readonly children: ReactNode;
}

interface GameErrorBoundaryState {
  readonly failed: boolean;
}

/** A crashed or unreachable game (e.g. its chunk failed to download offline) must not take the lobby down. */
export class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  override state: GameErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): GameErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[arcade] ${this.props.title} failed`, error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className={styles.status}>
        <h1 className={styles.title}>Não foi possível abrir {this.props.title}</h1>
        <p className={styles.text}>Verifique a conexão e tente de novo. Seu progresso continua salvo.</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              window.location.reload();
            }}
          >
            Tentar de novo
          </button>
          <button type="button" className={styles.secondary} onClick={this.props.onExit}>
            Voltar ao arcade
          </button>
        </div>
      </main>
    );
  }
}
