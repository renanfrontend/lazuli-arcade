import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { Dialog } from '@shared/ui/Dialog';
import { SceneFrame } from '@shared/ui/atmosphere/SceneFrame';
import { useSceneCanvas } from '@shared/ui/atmosphere/useSceneCanvas';
import { useSceneImage } from '@shared/ui/atmosphere/useSceneImage';
import { useAtmosphere } from '@shared/ui/atmosphere/useAtmosphere';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { useArcadeSettings } from '@shared/ui/hooks/useArcadeSettings';
import { useGameRecord } from '@shared/ui/mini/useMiniGame';
import styles from '@shared/ui/atmosphere/Scene.module.css';
import forest from '../../../assets/scenes/night-forest.webp';
import { createNight, distance, EXIT, litBeacons, stepNight, type NightInput, type NightMode } from '../domain/game';
import { drawNight, type Camera } from './render';

export default function NightGame({ services, onExit }: GameProps) {
  const game = useRef(createNight('suspense'));
  const input = useRef<NightInput>({x:0, y:0, target:null, sprint:false});
  const camera = useRef<Camera>({scale:1, x:0, y:0});
  const keys = useRef(new Set<string>()), nextHud = useRef(0), soundAt = useRef(0);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'paused' | 'won' | 'lost'>('ready');
  const [hud, setHud] = useState({ lit: 0, panic: 0, breath: 100, mode: 'suspense' as NightMode });
  const [help, setHelp] = useState(false);
  const image = useSceneImage(forest), reduced = useReducedMotion(), visible = useDocumentVisible();
  const [settings] = useArcadeSettings(services.settings);
  const { finish } = useGameRecord(services, 'trilha-noturna:v1');
  useAtmosphere(services, phase === 'playing' && visible && settings.sound, 'night');
  const pause = useCallback(() => { setPhase((v) => v === 'playing' ? 'paused' : v === 'paused' ? 'playing' : v); }, []);
  const canvas = useSceneCanvas((ctx, view, dt, time) => {
    if (phase === 'playing' && visible && !help) {
      const x = Number(keys.current.has('arrowright') || keys.current.has('d')) - Number(keys.current.has('arrowleft') || keys.current.has('a'));
      const y = Number(keys.current.has('arrowdown') || keys.current.has('s')) - Number(keys.current.has('arrowup') || keys.current.has('w'));
      const before = litBeacons(game.current);
      game.current = stepNight(game.current, {...input.current, x, y, sprint: input.current.sprint || keys.current.has(' ')}, dt);
      const lit = litBeacons(game.current);
      if (lit > before) {
        services.audio.tone({freq:523.25,duration:1.1,gain:.08,type:'sine'}); services.audio.tone({freq:783.99,at:.13,duration:1.2,gain:.045,type:'sine'}); services.audio.vibrate(18);
      }
      if (game.current.panic > 55 && time > soundAt.current) { soundAt.current = time + 1.5; services.audio.tone({freq:55,duration:.14,gain:.055,type:'sine'}); }
      if (game.current.status !== 'playing') { finish(lit); setPhase(game.current.status); }
      if (time > nextHud.current) { nextHud.current = time + .16; setHud({lit,panic:Math.round(game.current.panic),breath:Math.round(game.current.breath),mode:game.current.mode}); }
    }
    camera.current = drawNight(ctx, game.current, image.current, view, time, reduced, input.current.target);
  });
  useEffect(() => {
    const pressed = keys.current;
    const down = (event: KeyboardEvent) => {
      if (event.altKey || event.metaKey || event.ctrlKey || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select'))) return;
      if (event.key === 'Escape' && !event.repeat) { pause(); return; }
      const key = event.key.toLowerCase();
      if (phase !== 'playing' || !['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(key)) return;
      if (key === ' ' && event.target instanceof HTMLElement && event.target.closest('button,a')) return;
      pressed.add(key); input.current = {...input.current, target:null}; event.preventDefault();
    };
    const up = (event: KeyboardEvent) => { pressed.delete(event.key.toLowerCase()); };
    const blur = () => { pressed.clear(); input.current = {...input.current, sprint:false}; };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',blur);
    return () => { pressed.clear(); window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); window.removeEventListener('blur',blur); };
  }, [phase,pause]);
  const start = (mode: NightMode) => { game.current = createNight(mode); input.current = {x:0,y:0,target:null,sprint:false}; setHud({lit:0,panic:0,breath:100,mode}); setPhase('playing'); };
  const guide = () => {
    const state = game.current;
    const next = litBeacons(state) === state.beacons.length ? EXIT : [...state.beacons].filter((b) => b.charge < 1).sort((a,b) => distance(state.player,a) - distance(state.player,b))[0];
    if (next) input.current = {...input.current,target:next};
  };
  return <SceneFrame services={services} onExit={onExit} title="Trilha Noturna" eyebrow="Uma luz no desconhecido" paused={phase === 'paused'} onPause={pause}>
    <div className={styles.scene}>
      <canvas ref={canvas} className={styles.canvas} tabIndex={0} role="img" aria-label={`Floresta noturna. ${hud.lit} de 6 luzes despertas. ${hud.mode === 'suspense' ? `Tensão ${hud.panic} por cento.` : 'Modo exploração sem perseguição.'}`}
        onPointerDown={(event) => {
          if (phase !== 'playing' || event.button !== 0) return;
          const rect = event.currentTarget.getBoundingClientRect(), cam = camera.current;
          input.current = {...input.current,target:{x:(event.clientX-rect.left-cam.x)/cam.scale,y:(event.clientY-rect.top-cam.y)/cam.scale}}; event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => { if (phase !== 'playing' || !event.currentTarget.hasPointerCapture(event.pointerId)) return; const rect=event.currentTarget.getBoundingClientRect(),cam=camera.current; input.current={...input.current,target:{x:(event.clientX-rect.left-cam.x)/cam.scale,y:(event.clientY-rect.top-cam.y)/cam.scale}}; }} />
      <div className={styles.topHud}><div className={styles.glass}><span className={styles.hudLabel}>{hud.lit === 6 ? 'Volte ao arco de pedra' : 'Desperte as seis luzes'}</span><div className={styles.progress} aria-label={`${hud.lit} de 6 luzes`}>{Array.from({length:6},(_,i)=><span key={i} className={styles.dot} data-lit={i<hud.lit} />)}</div></div>
        <div className={styles.glass}><span className={styles.hudLabel}>{hud.mode === 'suspense' ? 'Tensão' : 'Exploração'}</span><span className={styles.hudValue}>{hud.mode === 'suspense' ? `${hud.panic}%` : 'Sem pressa'}</span>{hud.mode === 'suspense' && <div className={styles.meter}><span style={{width:`${hud.panic}%`}} /></div>}</div></div>
      <div className={styles.bottomHud}><p className={styles.hint}>{hud.lit === 0 ? 'Toque no chão para caminhar. Aproxime-se da primeira luz.' : hud.lit === 6 ? 'O arco está aberto. Siga o brilho dourado.' : hud.panic > 35 ? 'Vire a lanterna para a sombra ou procure uma luz acesa.' : 'As luzes acesas são refúgios. Continue a travessia.'}</p>
        {phase === 'playing' && <button className={styles.pill} type="button" onClick={guide}>{hud.lit===6 ? 'Seguir até a saída' : 'Seguir próxima luz'} →</button>}</div>
      {phase === 'ready' && <div className={styles.onboarding}><div className={styles.intro}><span className={styles.kicker}>Suspense atmosférico</span><h2>A noite tem<br />seus segredos.</h2><p>Desperte seis luzes e encontre a saída. Sua lanterna afasta o que se esconde na névoa.</p><div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>{start('suspense');}}>Entrar na trilha</button><button className={styles.secondary} type="button" onClick={()=>{start('explore');}}>Explorar sem perseguição</button></div></div></div>}
    </div>
    <div className={styles.footer}><p>Toque para caminhar · Setas / WASD · Espaço para correr · Esc pausa</p><button className={styles.textButton} type="button" onClick={()=>{setHelp(true);}}>Como atravessar</button></div>
    <Dialog open={help || phase==='paused' || phase==='won' || phase==='lost'} labelledBy="night-dialog" onCancel={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}>
      <div className={styles.modal}><h2 id="night-dialog">{help?'Siga as luzes':phase==='paused'?'A noite pode esperar':phase==='won'?'Você atravessou a noite.':'A névoa chegou primeiro.'}</h2><p>{help?'Toque no chão para caminhar ou use “Seguir próxima luz”. Fique perto de cada chama até ela despertar. No suspense, a lanterna afasta sombras à sua frente; refúgios iluminados reduzem a tensão. Depois das seis luzes, siga até o arco. Também há exploração sem perseguição.':phase==='paused'?'A travessia está pausada. Respire antes de continuar.':phase==='won'?'As seis luzes estão acesas. A floresta encontrou um pouco de paz.': 'Procure os refúgios iluminados e use a lanterna. Você pode tentar outra vez ou explorar tranquilamente.'}</p>
      {(help||phase==='paused')?<button className={styles.primary} type="button" onClick={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}>Continuar</button>:<div className={styles.actions}><button className={styles.primary} type="button" onClick={()=>{start('suspense');}}>Nova travessia</button><button className={styles.secondary} type="button" onClick={()=>{start('explore');}}>Exploração tranquila</button></div>}
      <button className={styles.secondary} type="button" onClick={onExit}>Voltar ao arcade</button></div>
    </Dialog>
  </SceneFrame>;
}
