import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { Dialog } from '@shared/ui/Dialog';
import { SceneFrame } from '@shared/ui/atmosphere/SceneFrame';
import { useSceneCanvas } from '@shared/ui/atmosphere/useSceneCanvas';
import { useSceneImage } from '@shared/ui/atmosphere/useSceneImage';
import { useAtmosphere } from '@shared/ui/atmosphere/useAtmosphere';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import { useArcadeSettings } from '@shared/ui/hooks/useArcadeSettings';
import { useGameKeys, useGameRecord } from '@shared/ui/mini/useMiniGame';
import styles from '@shared/ui/atmosphere/Scene.module.css';
import lake from '../../../assets/scenes/moon-garden.webp';
import { awakenFlower, BUDS, createGarden, flowersAwake, nurtureGarden, restoreGarden, type GardenPoint, type GardenState } from '../domain/game';
import { addRipple, drawGarden, PALETTES, type GardenEffects } from './render';

export default function GardenGame({services,onExit}:GameProps){
  const store=useMemo(()=>services.openStore('jardim-luz:v1'),[services]);
  const [initial]=useState(()=>restoreGarden(store.read('garden')));
  const garden=useRef(initial);
  const input=useRef<{point:GardenPoint|null;held:boolean;until:number}>({point:null,held:false,until:0});
  const effects=useRef<GardenEffects>({sparks:[],ripples:[],spawn:0});
  const savedAt=useRef(0),soundAt=useRef(0),hudAt=useRef(0);
  const [phase,setPhase]=useState<'ready'|'playing'|'paused'>(flowersAwake(initial)>0?'playing':'ready');
  const [count,setCount]=useState(()=>flowersAwake(initial));
  const [growth,setGrowth]=useState(initial.growth);
  const [palette,setPalette]=useState(0),[help,setHelp]=useState(false);
  const image=useSceneImage(lake),reduced=useReducedMotion(),visible=useDocumentVisible();
  const [settings]=useArcadeSettings(services.settings);const {finish}=useGameRecord(services,'jardim-luz:v1');
  useAtmosphere(services,phase==='playing'&&visible&&settings.sound,'garden');
  const commit=(next:GardenState)=>{
    const before=flowersAwake(garden.current),after=flowersAwake(next);garden.current=next;
    if(after>before){services.audio.tone({freq:349.23+(after%3)*87.3,duration:1.3,gain:.055,type:'sine'});services.audio.tone({freq:698.46,at:.2,duration:1.4,gain:.025,type:'sine'});if(after===6)finish(6);}
    if(after>before){setCount(after);store.write('garden',next);}
  };
  const canvas=useSceneCanvas((ctx,view,dt,time)=>{
    const active=phase==='playing'&&visible&&!help;
    const pointer=active&&(input.current.held||input.current.until>time)?input.current.point:null;
    if(active){
      const next=nurtureGarden(garden.current,pointer,dt);if(next!==garden.current)commit(next);
      if(time>savedAt.current){savedAt.current=time+1;store.write('garden',garden.current);}
      if(time>hudAt.current){hudAt.current=time+.2;setGrowth([...garden.current.growth]);}
      if(pointer&&time>soundAt.current){soundAt.current=time+1.1;const notes=[261.63,293.66,349.23,392,440];const note=notes[Math.floor(pointer.x*5)%5]??349.23;services.audio.tone({freq:note,duration:1.6,gain:.032,type:'sine'});}
    }
    drawGarden(ctx,garden.current,image.current,view,effects.current,pointer,active?dt:0,time,palette,reduced);
  });
  const pause=()=>{setPhase(v=>v==='playing'?'paused':v==='paused'?'playing':v);};
  useGameKeys(key=>{if(key==='Escape'){pause();return true;}return false;});
  const fresh=()=>{garden.current=createGarden();store.write('garden',garden.current);setGrowth(garden.current.growth);setCount(0);effects.current={sparks:[],ripples:[],spawn:0};setPhase('playing');};
  const care=(index:number)=>{if(phase!=='playing')return;const next=awakenFlower(garden.current,index);commit(next);setGrowth(next.growth);const bud=BUDS[index];if(bud)addRipple(effects.current,bud);};
  return <SceneFrame services={services} onExit={onExit} title="Jardim de Luz" eyebrow="Um lugar para desacelerar" paused={phase==='paused'} onPause={pause}>
    <div className={styles.scene}>
      <canvas ref={canvas} className={styles.canvas} tabIndex={0} role="img" aria-label={`Lago luminoso. ${count} de 6 flores despertas. Toque e deslize perto das flores.`}
        onPointerDown={event=>{if(phase!=='playing'||event.button!==0)return;const rect=event.currentTarget.getBoundingClientRect();const point={x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};input.current={point,held:true,until:performance.now()/1000+1.7};addRipple(effects.current,point);event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>{if(phase!=='playing'||!event.currentTarget.hasPointerCapture(event.pointerId))return;const rect=event.currentTarget.getBoundingClientRect();input.current={point:{x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height},held:true,until:performance.now()/1000+1.7};}}
        onPointerUp={()=>{input.current={...input.current,held:false};}} onPointerCancel={()=>{input.current={point:null,held:false,until:0};}} onBlur={()=>{input.current={...input.current,held:false};}} />
      <div className={styles.topHud}><div className={styles.glass}><span className={styles.hudLabel}>{count===6?'Jardim desperto':'Flores despertas'}</span><span className={styles.hudValue}>{count} <span style={{fontSize:12,color:'#b8c8db'}}>/ 6</span></span></div><div className={styles.glass}><span className={styles.hudLabel}>No seu ritmo</span><span style={{fontSize:12,color:'#d2deee'}}>Sem relógio. Sem perder.</span></div></div>
      <div className={styles.bottomHud}><p className={styles.hint}>{count===6?'Todas as flores acordaram. Fique e desenhe na água quanto quiser.':'Deslize perto de uma flor. A luz das suas mãos a desperta.'}</p><div className={styles.palette} aria-label="Cor das luzes">{PALETTES.map((p,i)=><button key={p.name} className={styles.swatch} type="button" aria-label={`Luzes ${p.name}`} aria-pressed={palette===i} style={{'--swatch':p.light}} onClick={()=>{setPalette(i);}}><span /></button>)}</div></div>
      {phase==='ready'&&<div className={styles.onboarding}><div className={styles.intro}><span className={styles.kicker}>Um pequeno ritual de calma</span><h2>Deixe a luz<br />encontrar seu ritmo.</h2><p>Toque e deslize pela água. Desperte as seis flores e crie caminhos luminosos, sem pressa.</p><button className={styles.primary} type="button" onClick={()=>{setPhase('playing');}}>Entrar no jardim</button></div></div>}
    </div>
    <div className={styles.footer}><p>Toque e deslize · Luzes, ondas e harmônicos suaves · Esc pausa</p><div className={styles.actions}><button className={styles.textButton} type="button" onClick={()=>{setHelp(true);}}>Como florescer</button><button className={styles.textButton} type="button" onClick={fresh}>Novo jardim</button></div></div>
    <div className={styles.flowerKeys} aria-label="Cultivar flores pelo teclado">{BUDS.map((_,i)=><button key={i} type="button" className={styles.flowerKey} disabled={phase!=='playing'} aria-label={`Despertar flor ${i+1}`} aria-pressed={(growth[i]??0)>=1} onClick={()=>{care(i);}}>{(growth[i]??0)>=1?'✧':'·'}</button>)}</div>
    <Dialog open={help||phase==='paused'} labelledBy="garden-dialog" onCancel={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}><div className={styles.modal}><h2 id="garden-dialog">{help?'Um gesto de cada vez':'O jardim espera por você.'}</h2><p>{help?'Toque ou deslize perto dos pequenos botões de flor sobre a água. Deixe a luz ficar por um instante: os pétalos se abrem. Você também pode usar os seis botões abaixo do cenário com Tab e Enter. Mude a cor das luzes, desenhe e fique o tempo que quiser. As flores ficam salvas neste aparelho.':'As flores estão salvas. Continue quando quiser.'}</p><button className={styles.primary} type="button" onClick={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}>Continuar</button><button className={styles.secondary} type="button" onClick={onExit}>Voltar ao arcade</button></div></Dialog>
  </SceneFrame>;
}
