import { useEffect, useState } from 'react';
import type { Position } from '@shared/domain/grid';
import { samePosition } from '@shared/domain/grid';
import type { Character, MatchEvent, Side } from '../../domain';
import { stackAt, topColorAt } from '../../domain/board';
import { StackView } from './StackView';
import { CharacterAvatar } from './CharacterAvatar';
import styles from './OpponentLiveView.module.css';

interface OpponentLiveViewProps {
  readonly character: Character;
  readonly opponent: Side;
  readonly lastEvent: MatchEvent | null;
  readonly isLive: boolean;
}

export function OpponentLiveView({ character, opponent, lastEvent, isLive }: OpponentLiveViewProps) {
  const [reaction, setReaction] = useState<{
    event: MatchEvent | null;
    speech: string;
    at: Position | null;
    move: { seq: number; slot: number } | null;
  }>({ event: null, speech: character.dialogues.onStart, at: null, move: null });
  const [expiredMove, setExpiredMove] = useState<number | null>(null);
  const [showFullBoard, setShowFullBoard] = useState(false);

  // Keep event-derived UI together without an extra render from an effect.
  if (lastEvent !== reaction.event) {
    if (lastEvent?.type === 'started') {
      setReaction({ event: lastEvent, speech: character.dialogues.onStart, at: null, move: null });
    } else if (lastEvent?.type === 'opponentPlaced') {
      setReaction({
        event: lastEvent,
        speech: lastEvent.clears > 0 ? character.dialogues.onScore : character.dialogues.onPlace,
        at: lastEvent.at,
        move: { seq: lastEvent.seq, slot: lastEvent.slot },
      });
    } else {
      setReaction({
        ...reaction,
        event: lastEvent,
        speech: lastEvent?.type === 'playerPlaced' && lastEvent.outcome.resolution.clears > 0
          ? character.dialogues.onPlayerScore : reaction.speech,
      });
    }
  }

  const { speech, at: lastPlacedCell, move } = reaction;
  const justMovedSlot = move && move.seq !== expiredMove ? move.slot : null;
  const moveSeq = move?.seq ?? null;
  useEffect(() => {
    if (moveSeq === null) return undefined;
    const timer = window.setTimeout(() => { setExpiredMove(moveSeq); }, 700);
    return () => { window.clearTimeout(timer); };
  }, [moveSeq]);

  const board = opponent.board;
  const cols = board.cols;
  const rows = board.rows;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.profile}>
          <CharacterAvatar characterId={character.id} size={42} animated={isLive} />
          <div className={styles.nameBlock}>
            <div className={styles.nameTag}>
              <strong className={styles.name}>{character.name}</strong>
              <span className={styles.badge} style={{ borderColor: character.primaryColor, color: character.primaryColor }}>
                {character.title}
              </span>
            </div>
            <div className={styles.speechBubble}>
              <span>{speech}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.boardToggleBtn}
          onClick={() => {
            setShowFullBoard(!showFullBoard);
          }}
          aria-label={showFullBoard ? 'Recolher visão do oponente' : 'Ver tabuleiro do oponente'}
        >
          {showFullBoard ? 'Minimizar' : 'Espiar Tabuleiro'}
        </button>
      </div>

      <div className={styles.liveBar}>
        <div className={styles.miniBoardWrap}>
          <span className={styles.liveTag}>Ao Vivo</span>
          <div
            className={styles.miniGrid}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const pos: Position = { row: r, col: c };
                const stack = stackAt(board, pos);
                const color = topColorAt(board, pos);
                const isRecent = lastPlacedCell ? samePosition(lastPlacedCell, pos) : false;

                if (stack === null) {
                  return <div key={`${r}-${c}`} className={`${styles.miniCell} ${styles.miniVoid}`} />;
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.miniCell} ${isRecent ? styles.cellRecent : ''}`}
                    data-color={color ?? undefined}
                  >
                    {stack.length > 0 && (
                      <span className={styles.miniCount}>{stack.length}</span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        <div className={styles.trayWrap}>
          <span className={styles.trayLabel}>Bandeja do Rival</span>
          <div className={styles.traySlots}>
            {opponent.tray.map((stack, slot) => (
              <div
                key={slot}
                className={`${styles.traySlot} ${justMovedSlot === slot ? styles.slotMoved : ''}`}
              >
                {stack ? (
                  <div className={styles.miniStack}>
                    <StackView tiles={stack.tiles} faded={false} />
                  </div>
                ) : (
                  <span className={styles.emptySlot} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showFullBoard && (
        <div className={styles.fullBoardOverlay} onClick={() => { setShowFullBoard(false); }}>
          <div className={styles.fullBoardCard} onClick={(e) => { e.stopPropagation(); }}>
            <div className={styles.fullBoardHeader}>
              <div className={styles.fullBoardTitle}>
                <CharacterAvatar characterId={character.id} size={36} />
                <div>
                  <strong>Tabuleiro de {character.name}</strong>
                  <p>{character.bio}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => { setShowFullBoard(false); }}
              >
                ✕
              </button>
            </div>

            <div className={styles.fullGridWrap}>
              <div
                className={styles.fullGrid}
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const pos: Position = { row: r, col: c };
                    const stack = stackAt(board, pos);
                    const color = topColorAt(board, pos);
                    const isRecent = lastPlacedCell ? samePosition(lastPlacedCell, pos) : false;

                    if (stack === null) {
                      return <div key={`f-${r}-${c}`} className={`${styles.fullCell} ${styles.fullVoid}`} />;
                    }

                    return (
                      <div
                        key={`f-${r}-${c}`}
                        className={`${styles.fullCell} ${isRecent ? styles.fullCellRecent : ''}`}
                        data-color={color ?? undefined}
                      >
                        {stack.length > 0 ? (
                          <div className={styles.fullStackContent}>
                            <StackView tiles={stack} />
                            <span className={styles.fullStackNumber}>{stack.length}</span>
                          </div>
                        ) : (
                          <span className={styles.fullEmptyDot} />
                        )}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
            <p className={styles.fullBoardFooter}>Toque fora para voltar ao seu jogo</p>
          </div>
        </div>
      )}
    </div>
  );
}
