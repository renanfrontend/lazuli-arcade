import { useCallback, useEffect, useEffectEvent, useRef, useState, type PointerEvent } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { Dialog } from '@shared/ui/Dialog';
import { SceneFrame } from '@shared/ui/atmosphere/SceneFrame';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { useGameRecord } from '@shared/ui/mini/useMiniGame';
import cover from '../../../assets/scenes/haunted-mansion.webp';
import clown from '../../../assets/scenes/mansion-clown.webp';
import { collectedCount, createMansion, distance, FLOORPLAN, interactMansion, interaction, lookMansion, RELICS, stepMansion, toggleFlashlight, type HorrorEvent } from '../domain/game';
import { createMansionRenderer } from './render';
import scene from '@shared/ui/atmosphere/Scene.module.css';
import styles from './Night.module.css';

interface Hud { readonly pieces:number;readonly collected:readonly boolean[];readonly stamina:number;readonly hidden:boolean;readonly chasing:boolean;readonly flashlight:boolean;readonly action:string|null;readonly x:number;readonly z:number;readonly yaw:number;readonly door:boolean;readonly fear:number;readonly notice:string;readonly spotted:boolean }
type Phase='ready'|'playing'|'paused'|'caught'|'lost'|'won';
const MOVEMENT=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','forward','back','left','right','turnleft','turnright'];
const initialHud:Hud={pieces:0,collected:[false,false,false],stamina:100,hidden:false,chasing:false,flashlight:true,action:null,x:19,z:37,yaw:0,door:false,fear:0,notice:'',spotted:false};

export default function NightGame({services,onExit}:GameProps){
  const canvas=useRef<HTMLCanvasElement>(null),game=useRef(createMansion());
  const keys=useRef(new Set<string>()),keyStarts=useRef(new Map<string,number>()),pulses=useRef(new Map<string,number>());
  const drag=useRef<{id:number;x:number;y:number}|null>(null),timers=useRef({hud:0,ambient:0,step:0,enemy:0,heart:0,haunt:15});
  const notice=useRef({text:'',until:0});
  const [phase,setPhase]=useState<Phase>('ready'),[hud,setHud]=useState<Hud>(initialHud),[help,setHelp]=useState(false),[map,setMap]=useState(false);
  const [controls,setControls]=useState(()=>window.matchMedia('(pointer:coarse)').matches),[run,setRun]=useState(false),[graphicsError,setGraphicsError]=useState<string|null>(null);
  const visible=useDocumentVisible(),reduced=useReducedMotion();const {finish}=useGameRecord(services,'ultimo-espetaculo:v1');
  const pause=useCallback(()=>{setPhase(v=>v==='playing'?'paused':v==='paused'?'playing':v);},[]);
  const cue=(event:HorrorEvent)=>{
    const now=performance.now()/1000;
    if(event==='relic'){
      notice.current={text:collectedCount(game.current)===1?'A música acordou alguém.':collectedCount(game.current)===3?'Todas as peças. Volte ao hall e monte a caixa de música.':'Mais uma peça. Ele ouviu.',until:now+5};
      for(const [i,freq] of [659.25,622.25,493.88,440].entries())services.audio.tone({freq,at:i*.17,duration:.4,gain:.07,type:'sine'});
    }else if(event==='wake'){notice.current={text:'Um riso veio do corredor.',until:now+3};for(let i=0;i<4;i++)services.audio.tone({freq:110+i*21,to:80,at:i*.22,duration:.16,gain:.055,type:'sawtooth'});services.audio.noise({duration:1.2,gain:.07,filter:'lowpass',freq:150});}
    else if(event==='chase'){services.audio.tone({freq:58,to:190,duration:.8,gain:.12,type:'sawtooth'});services.audio.noise({duration:.6,gain:.14,filter:'bandpass',freq:740});}
    else if(event==='caught'){services.audio.noise({duration:1,gain:.3,filter:'highpass',freq:660});services.audio.tone({freq:85,to:700,duration:.7,gain:.16,type:'sawtooth'});services.audio.tone({freq:587,to:74,duration:1.1,gain:.12,type:'triangle'});services.audio.vibrate([100,40,130]);}
    else if(event==='door'){notice.current={text:'A porta abriu. Saia agora.',until:now+6};services.audio.noise({duration:1.1,gain:.1,filter:'lowpass',freq:720,to:80});services.audio.tone({freq:392,duration:1.3,gain:.08});}
    else if(event==='hide'||event==='emerge')services.audio.noise({duration:.35,gain:.08,filter:'lowpass',freq:320});
  };
  const act=()=>{if(phase!=='playing'||help)return;game.current=interactMansion(game.current);cue(game.current.event);};
  const keyAction=useEffectEvent(act),keyTorch=useEffectEvent(()=>{if(phase==='playing')game.current=toggleFlashlight(game.current);});
  const frame=useEffectEvent((dt:number,time:number)=>{
    const active=phase==='playing'&&!help&&visible;
    if(active){
      const pressed=(...names:string[])=>names.some(name=>keys.current.has(name)||(pulses.current.get(name)??0)>0);
      const input={forward:Number(pressed('w','arrowup','forward'))-Number(pressed('s','arrowdown','back')),strafe:Number(pressed('d','right'))-Number(pressed('a','left')),turn:Number(pressed('arrowright','turnright'))-Number(pressed('arrowleft','turnleft')),sprint:run||pressed('shift')};
      game.current=stepMansion(game.current,input,dt);pulses.current.forEach((v,k)=>{if(v>dt)pulses.current.set(k,v-dt);else pulses.current.delete(k);});cue(game.current.event);
      const clocks=timers.current,s=game.current,gap=distance(s.player,s.enemy),moving=(input.forward!==0||input.strafe!==0)&&s.hidden<0;
      if(time>clocks.ambient){clocks.ambient=time+6;services.audio.tone({freq:41.2,duration:5,gain:.025});services.audio.tone({freq:43.7,duration:4.8,gain:.013});services.audio.noise({duration:1.8,gain:.022,filter:'lowpass',freq:125});}
      if(moving&&time>clocks.step){clocks.step=time+(input.sprint&&s.stamina>1?.27:.48);services.audio.noise({duration:.13,gain:.06,filter:'lowpass',freq:520});services.audio.tone({freq:74,to:43,duration:.09,gain:.035,type:'triangle'});}
      if(s.enemy.awake&&gap<14&&time>clocks.enemy){clocks.enemy=time+(s.enemy.mode==='chase'?.4:.7);services.audio.noise({duration:.19,gain:.09*Math.max(0,1-gap/14),filter:'lowpass',freq:850});}
      if(s.fear>25&&time>clocks.heart){clocks.heart=time+1.25-s.fear*.006;services.audio.tone({freq:52,duration:.14,gain:.065});services.audio.tone({freq:43,at:.19,duration:.11,gain:.045});}
      if(s.enemy.awake&&time>clocks.haunt){clocks.haunt=time+18;services.audio.noise({duration:.5,gain:.09,filter:'bandpass',freq:1300,to:250});services.audio.tone({freq:1046,to:523,duration:.6,gain:.035});}
      if(s.status==='caught')setPhase('caught');else if(s.status==='won'){finish(Math.max(1,10000-Math.floor(s.elapsed)));setPhase('won');}
    }else if(phase==='caught'&&visible){game.current=stepMansion(game.current,{forward:0,strafe:0,turn:0,sprint:false},dt);if(game.current.caughtFor>1.35)setPhase('lost');}
    if(time>timers.current.hud){timers.current.hud=time+.12;const s=game.current;setHud({pieces:collectedCount(s),collected:s.collected,stamina:Math.round(s.stamina),hidden:s.hidden>=0,chasing:s.enemy.mode==='chase',flashlight:s.flashlight,action:interaction(s)?.label??null,x:s.player.x,z:s.player.z,yaw:s.player.yaw,door:s.doorOpen,fear:s.fear,notice:time<notice.current.until?notice.current.text:'',spotted:s.spotted});}
  });
  useEffect(()=>{
    const element=canvas.current;if(!element)return undefined;
    let renderer:ReturnType<typeof createMansionRenderer>;
    try{renderer=createMansionRenderer(element,clown);}catch(error){const message=error instanceof Error?error.message:'Não foi possível abrir os gráficos 3D.';queueMicrotask(()=>{setGraphicsError(message);});return undefined;}
    let raf=0,previous=performance.now();
    const draw=(now:number)=>{const dt=Math.min((now-previous)/1000,.05);previous=now;if(document.visibilityState==='visible'){frame(dt,now/1000);renderer.draw(game.current,now/1000,reduced);}raf=requestAnimationFrame(draw);};
    const lost=(event:Event)=>{event.preventDefault();setGraphicsError('Os gráficos 3D foram interrompidos. Recarregue para tentar novamente.');setPhase('paused');};
    element.addEventListener('webglcontextlost',lost);raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);renderer.dispose();element.removeEventListener('webglcontextlost',lost);};
  },[reduced]);
  useEffect(()=>{
    const held=keys.current,starts=keyStarts.current,queued=pulses.current;
    const down=(event:KeyboardEvent)=>{
      if(event.altKey||event.metaKey||event.ctrlKey||(event.target instanceof HTMLElement&&event.target.closest('input,textarea,select')))return;
      const key=event.key.toLowerCase();
      if(key==='escape'&&!event.repeat){if(help)setHelp(false);else pause();event.preventDefault();return;}
      if(phase!=='playing'||help)return;
      if(MOVEMENT.includes(key)){if(!held.has(key))starts.set(key,performance.now());held.add(key);event.preventDefault();}
      else if(!event.repeat&&key==='e'){keyAction();event.preventDefault();}else if(!event.repeat&&key==='f'){keyTorch();event.preventDefault();}else if(!event.repeat&&key==='m'){setMap(v=>!v);event.preventDefault();}
    };
    const up=(event:KeyboardEvent)=>{const key=event.key.toLowerCase(),start=starts.get(key);if(start!==undefined&&performance.now()-start<120&&key!=='shift')queued.set(key,Math.min(2,(queued.get(key)??0)+.24));held.delete(key);starts.delete(key);};
    const clear=()=>{held.clear();starts.clear();queued.clear();drag.current=null;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    return()=>{clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
  },[phase,help,pause]);
  const start=()=>{game.current=createMansion();setHud(initialHud);notice.current={text:'Procure a manivela na brinquedoteca à esquerda.',until:performance.now()/1000+12};timers.current={hud:0,ambient:0,step:0,enemy:0,heart:0,haunt:performance.now()/1000+20};setRun(false);setMap(false);setHelp(false);setPhase('playing');};
  const touchDown=(key:string,event:PointerEvent<HTMLButtonElement>)=>{if(phase!=='playing')return;event.currentTarget.setPointerCapture(event.pointerId);keys.current.add(key);keyStarts.current.set(key,performance.now());};
  const touchUp=(key:string)=>{const time=keyStarts.current.get(key);if(time!==undefined&&performance.now()-time<120)pulses.current.set(key,Math.min(2,(pulses.current.get(key)??0)+.24));keys.current.delete(key);keyStarts.current.delete(key);};
  const control=(key:string,label:string,symbol:string)=><MovementButton key={key} code={key} label={label} symbol={symbol} begin={touchDown} end={touchUp} cancel={code=>{keys.current.delete(code);keyStarts.current.delete(code);}} tap={code=>{pulses.current.set(code,.24);}}/>;
  const objective=hud.door?'Atravesse a porta do hall':hud.pieces===3?'Monte a caixa de música no hall':`Encontre as peças · ${hud.pieces}/3`;
  return <div className={styles.horror}><SceneFrame services={services} onExit={onExit} title="Último Espetáculo" eyebrow="Terror em primeira pessoa" paused={phase==='paused'} onPause={pause}>
    <div className={styles.stage} data-hidden={hud.hidden} data-reduced={reduced}>
      <canvas ref={canvas} className={styles.canvas} tabIndex={0} role="img" aria-label={`Mansão em primeira pessoa. ${hud.pieces} de 3 peças. ${hud.hidden?'Escondido no armário.':hud.chasing?'O palhaço está perseguindo você.':'Explore os quartos.'}`}
        onPointerDown={event=>{if(phase!=='playing'||event.button!==0)return;drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
        onPointerMove={event=>{const p=drag.current;if(p?.id!==event.pointerId||phase!=='playing')return;game.current=lookMansion(game.current,(event.clientX-p.x)*.006,-(event.clientY-p.y)*.0035);drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} />
      <div className={styles.vignette}/><div className={styles.danger} style={{opacity:hud.fear/180}}/><span className={styles.reticle} aria-hidden="true">+</span>
      {phase!=='ready'&&<><div className={styles.hud}><div><span className={styles.caption}>{hud.door?'A saída abriu':'A porta está trancada'}</span><strong>{objective}</strong><div className={styles.relics}>{RELICS.map((p,i)=><span key={p.name} data-found={hud.collected[i]}>{hud.collected[i]?'✦':'◇'} {p.name}</span>)}</div></div><div className={styles.breath}><span>Fôlego</span><meter aria-label="Fôlego para correr" value={hud.stamina} min={0} max={100}/></div></div>
      <div className={styles.status} role="status">{hud.hidden?'Dentro do armário. Espere os passos se afastarem.':hud.notice|| (hud.chasing?'Ele viu você. Corra e quebre a linha de visão.':'')}</div>
      {hud.hidden&&<div className={styles.slats} aria-hidden="true"/>}
      {phase==='playing'&&<div className={styles.interact}>{hud.action?<button type="button" onClick={act}><kbd>E</kbd>{hud.action}</button>:<span>{hud.pieces===0?'Procure objetos com brilho dourado.':'Ouça os passos. Armários são esconderijos.'}</span>}</div>}
      <div className={styles.tools}><button type="button" onClick={()=>{game.current=toggleFlashlight(game.current);}} aria-label={hud.flashlight?'Desligar lanterna':'Ligar lanterna'} aria-pressed={hud.flashlight}>◉ <span>Lanterna · F</span></button><button type="button" aria-pressed={map} onClick={()=>{setMap(v=>!v);}}>⌑ <span>Mapa · M</span></button></div>
      {map&&<div className={styles.map}><strong>Planta da mansão</strong><svg viewBox="0 0 38 42" role="img" aria-label="Mapa da mansão. Branco: você. Ouro: peças. Verde: saída.">{FLOORPLAN.map((row,z)=>Array.from({length:row.length},(_,x)=>row[x]).map((cell,x)=><rect key={`${x}:${z}`} x={x*2} y={z*2} width="2" height="2" fill={cell==='#'?'#0d0b0b':'#6d6259'} />))}{RELICS.map((p,i)=>!hud.collected[i]&&<circle key={p.name} cx={p.x} cy={p.z} r=".8" fill="#e8bc73" />)}<rect x="18" y="39" width="2" height="1" fill="#a8cbad"/><circle data-map-marker="player" cx={hud.x} cy={hud.z} r=".75" fill="white"/><path d="M0,-2 L-.6,-.8 L.6,-.8Z" fill="white" transform={`translate(${hud.x} ${hud.z}) rotate(${hud.yaw*180/Math.PI})`}/></svg><span>Você: branco · Peças: ouro</span><span>Brinquedoteca: inferior esquerda<br/>Camarim: meio à direita<br/>Bonecas: superior esquerda</span></div>}
      {controls&&phase==='playing'&&<div className={styles.touch}><div className={styles.pad}>{control('forward','Avançar','↑')}{control('left','Andar para a esquerda','←')}{control('back','Recuar','↓')}{control('right','Andar para a direita','→')}</div><div className={styles.look}>{control('turnleft','Olhar à esquerda','↶')}{control('turnright','Olhar à direita','↷')}<button type="button" className={styles.control} aria-pressed={run} onClick={()=>{setRun(v=>!v);}}>Correr</button></div></div>}
      </>}
      {phase==='ready'&&<div className={styles.welcome} style={{backgroundImage:`linear-gradient(90deg,#050405f0,#05040540),url(${cover})`}}><div><span className={styles.caption}>Mansão abandonada · Brinquedos assombrados</span><h2>O espetáculo<br/>ainda não<br/><em>acabou.</em></h2><p>A porta fechou quando a música parou. Encontre três peças da caixa de música para escapar. O dono da casa não quer perder sua última plateia.</p><button type="button" className={styles.start} disabled={graphicsError!==null} onClick={start}>Entrar na mansão <span>→</span></button><p className={styles.quick}>WASD: andar · Arraste: olhar · E: interagir<br/>Shift: correr · F: lanterna · M: mapa</p></div></div>}
      {phase==='caught'&&<div className={styles.scare}><img src={clown} alt="O palhaço alcançou você."/></div>}
      {graphicsError&&<div className={styles.failure} role="alert"><p>{graphicsError}</p><button type="button" className={styles.start} onClick={()=>{window.location.reload();}}>Recarregar o jogo</button></div>}
    </div>
    <div className={styles.footer}><p>WASD para andar · Arraste para olhar · E interage · Shift corre</p><div><button type="button" aria-pressed={controls} onClick={()=>{setControls(v=>!v);}}>Controles na tela</button><button type="button" onClick={()=>{setHelp(true);}}>Como escapar</button></div></div>
    <Dialog open={help||phase==='paused'||phase==='lost'||phase==='won'} labelledBy="mansion-dialog" onCancel={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}><div className={scene.modal}><h2 id="mansion-dialog">{help?'Saia antes do último ato':phase==='paused'?'Respire. A casa pode esperar.':phase==='won'?'Você saiu. Ele ficou.':'A última plateia é você.'}</h2><p>{help?'Encontre a manivela na brinquedoteca, o cilindro no camarim e a bailarina no quarto das bonecas. Objetos úteis têm um brilho dourado: aproxime-se e use E ou o botão de interação. Volte à caixa de música no hall para destrancar a porta. Arraste a tela para olhar; WASD anda e Shift corre. O palhaço ouve corridas e vê a lanterna. Quebre a linha de visão e entre num armário antes que ele veja você se esconder. Use M para consultar o mapa. No celular, ative os controles na tela.':phase==='paused'?'A partida está pausada. Nenhum passo se aproxima enquanto você respira.':phase==='won'?'A música destrancou a porta. Os passos pararam do outro lado. Por enquanto.':hud.spotted?'Ele viu você entrar no armário. Despiste o palhaço antes de se esconder.':'Os passos ficaram perto demais. Use os quartos para despistar o palhaço; correr ajuda, mas também faz barulho.'}</p>{help||phase==='paused'?<button type="button" className={styles.start} onClick={()=>{setHelp(false);if(phase==='paused')setPhase('playing');}}>Continuar</button>:<button type="button" className={styles.start} onClick={start}>Tentar escapar de novo</button>}<button type="button" className={scene.secondary} onClick={onExit}>Voltar ao arcade</button></div></Dialog>
  </SceneFrame></div>;
}

interface MovementButtonProps { readonly code:string;readonly label:string;readonly symbol:string;readonly begin:(code:string,event:PointerEvent<HTMLButtonElement>)=>void;readonly end:(code:string)=>void;readonly cancel:(code:string)=>void;readonly tap:(code:string)=>void }
function MovementButton({code,label,symbol,begin,end,cancel,tap}:MovementButtonProps){return <button type="button" className={styles.control} aria-label={label} onPointerDown={event=>{begin(code,event);}} onPointerUp={()=>{end(code);}} onPointerCancel={()=>{cancel(code);}} onClick={event=>{if(event.detail===0)tap(code);}}>{symbol}</button>;}
