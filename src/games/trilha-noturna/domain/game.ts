export const TILE = 2;
export const FLOORPLAN = Array.from({ length: 21 }, (_, z) => Array.from({ length: 19 }, (_, x) => {
  if (x === 0 || x === 18 || z === 0 || z === 20) return '#';
  if ((x === 7 || x === 11) && ![3, 9, 16].includes(z)) return '#';
  if ([6, 13].includes(z) && (x < 8 || x > 10)) return '#';
  return '.';
}).join(''));
export interface Point { readonly x: number; readonly z: number }
export interface Player extends Point { readonly yaw: number; readonly pitch: number }
export interface Relic extends Point { readonly name: string; readonly room: string }
export const RELICS: readonly Relic[] = [
  { x: 7, z: 33, name: 'Manivela', room: 'Brinquedoteca' },
  { x: 31, z: 19, name: 'Cilindro', room: 'Camarim' },
  { x: 7, z: 7, name: 'Bailarina', room: 'Quarto das bonecas' },
];
export const LOCKERS: readonly Point[] = [{ x: 11.5, z: 34.5 }, { x: 33, z: 22 }, { x: 3.5, z: 9 }, { x: 33, z: 9 }, { x: 3.5, z: 22 }, { x: 33, z: 34.5 }];
export const MUSIC_BOX: Point = { x: 20.7, z: 37.5 };
export const EXIT: Point = { x: 19, z: 39.2 };
export const PATROL: readonly Point[] = [{ x: 19, z: 7 }, { x: 30, z: 6 }, { x: 19, z: 19 }, { x: 7, z: 24 }, { x: 19, z: 33 }, { x: 30, z: 37 }];
export interface Note extends Point { readonly title: string; readonly room: string; readonly text: string }
/** Paper clues. The first three build the safe code, the last two spell the melody. */
export const NOTES: readonly Note[] = [
  { x: 27, z: 4, room: 'Camarote', title: 'Cartaz do palco', text: 'A chavinha dorme onde os covardes se escondem: o armário do camarote, no alto à direita. Primeiro algarismo do cofre: quantos armários existem na casa? O mapa mostra todos.' },
  { x: 5, z: 16.5, room: 'Sala de espera', title: 'Bilhete amassado', text: 'Segundo algarismo do cofre: quantas letras tem o nome da peça que dança, a que mora entre as bonecas?' },
  { x: 27, z: 36, room: 'Depósito', title: 'Página rasgada', text: 'Terceiro algarismo do cofre: o dobro do que falta ao primeiro para chegar a dez. O cofre fica no camarim, onde o espelho nunca mente.' },
  { x: 4, z: 30.5, room: 'Brinquedoteca', title: 'Programa do espetáculo', text: 'Ato final: a caixa só toca na ordem em que o palhaço se veste, de cima para baixo: cabelo, rosto, colete, sapatos.' },
  { x: 12, z: 4.5, room: 'Quarto das bonecas', title: 'Foto de família', text: 'Cabelo de fogo. Rosto de giz. Colete de sol. Sapatos de noite. Quatro cores, quatro teclas.' },
];
export const SAFE: Point = { x: 34.6, z: 16.5 };
/** Hiding in this locker (top-right room) turns up the small key. */
export const KEY_LOCKER = 3;
export const SAFE_CODE: readonly number[] = [LOCKERS.length, (RELICS[2]?.name ?? '').length, 2 * (10 - LOCKERS.length)];
export const MELODY_COLORS = ['vermelho', 'branco', 'amarelo', 'azul'] as const;
export type MelodyColor = (typeof MELODY_COLORS)[number];
export const MELODY: readonly MelodyColor[] = ['vermelho', 'branco', 'amarelo', 'azul'];
/** Wrong answers make noise; the third one sets off the alarm. */
export const MAX_MISTAKES = 3;
export type PuzzleKind = 'safe' | 'melody';
export interface Obstacle extends Point { readonly radius: number }
export const OBSTACLES: readonly Obstacle[] = [...LOCKERS.map(p => ({ x: p.x, z: p.z + .8, radius: .55 })), ...[...RELICS, ...NOTES].map(p => ({ x: p.x, z: p.z + .75, radius: .4 })), { x: SAFE.x, z: SAFE.z, radius: .5 }, { x: 30, z: 33, radius: .5 }, { x: 8, z: 20, radius: .6 }];
export interface Enemy extends Point { readonly awake: boolean; readonly mode: 'sleeping' | 'patrol' | 'investigate' | 'chase'; readonly target: Point; readonly path: readonly Point[]; readonly planAt: number; readonly memory: number; readonly patrol: number }
export type HorrorEvent = 'none' | 'relic' | 'note' | 'key' | 'puzzle' | 'unlock' | 'wrong' | 'locked' | 'wake' | 'chase' | 'hide' | 'emerge' | 'door' | 'caught' | 'won';
export interface MansionState {
  readonly player: Player; readonly enemy: Enemy; readonly collected: readonly boolean[];
  readonly flashlight: boolean; readonly stamina: number; readonly hidden: number; readonly spotted: boolean;
  readonly doorOpen: boolean; readonly notes: readonly boolean[]; readonly hasKey: boolean; readonly safeOpen: boolean; readonly puzzle: PuzzleKind | null; readonly reading: number; readonly mistakes: number; readonly elapsed: number; readonly wakeAt: number; readonly fear: number;
  readonly status: 'playing' | 'caught' | 'won'; readonly caughtFor: number; readonly event: HorrorEvent;
}
export interface MansionInput { readonly forward: number; readonly strafe: number; readonly turn: number; readonly sprint: boolean }
export interface Interaction { readonly kind: 'relic' | 'locker' | 'box' | 'emerge' | 'note' | 'safe' | 'locked'; readonly index: number; readonly label: string }
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.z - b.z);
export const collectedCount = (state: MansionState): number => state.collected.filter(Boolean).length;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
export function isWall(x: number, z: number): boolean { return FLOORPLAN[Math.floor(z / TILE)]?.[Math.floor(x / TILE)] !== '.'; }
export function canStand(x: number, z: number, radius = .24): boolean {
  return ![[x-radius,z-radius],[x+radius,z-radius],[x-radius,z+radius],[x+radius,z+radius]].some(([px,pz])=>isWall(px??x,pz??z)) && !OBSTACLES.some(p=>Math.hypot(p.x-x,p.z-z)<p.radius+radius);
}
export function lineOfSight(a: Point, b: Point): boolean {
  const steps=Math.ceil(distance(a,b)/.22);
  for(let i=1;i<steps;i++)if(isWall(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;
  return true;
}
/** Routes the stalker through doorways rather than through walls. */
export function findPath(start: Point, goal: Point): readonly Point[] {
  const sx=Math.floor(start.x/TILE),sz=Math.floor(start.z/TILE),gx=Math.floor(goal.x/TILE),gz=Math.floor(goal.z/TILE);
  if(FLOORPLAN[gz]?.[gx]!=='.'||FLOORPLAN[sz]?.[sx]!=='.')return [];
  const first=sz*19+sx,last=gz*19+gx,parents=new Map<number,number>([[first,-1]]),queue=[first];
  for(const cell of queue){
    if(cell===last)break;
    for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const x=cell%19+(dx??0),z=Math.floor(cell/19)+(dz??0),next=z*19+x;
      if(FLOORPLAN[z]?.[x]==='.'&&!parents.has(next)){parents.set(next,cell);queue.push(next);}
    }
  }
  if(!parents.has(last))return [];
  const path:Point[]=[];let cell=last;
  while(cell!==first&&cell!==-1){path.unshift({x:(cell%19+.5)*TILE,z:(Math.floor(cell/19)+.5)*TILE});cell=parents.get(cell)??-1;}
  path.push(goal);return path;
}
/** The house wakes by itself if the player dawdles. */
export const WAKE_AT = 150;
export function createMansion(): MansionState {
  return {player:{x:19,z:37,yaw:0,pitch:0},enemy:{x:19,z:19,awake:false,mode:'sleeping',target:PATROL[0]??EXIT,path:[],planAt:0,memory:0,patrol:0},collected:[false,false,false],flashlight:true,stamina:100,hidden:-1,spotted:false,doorOpen:false,notes:NOTES.map(()=>false),hasKey:false,safeOpen:false,puzzle:null,reading:-1,mistakes:0,elapsed:0,wakeAt:WAKE_AT,fear:0,status:'playing',caughtFor:0,event:'none'};
}
export function lookMansion(state:MansionState,yaw:number,pitch:number):MansionState {
  if(state.status!=='playing'||!Number.isFinite(yaw)||!Number.isFinite(pitch))return state;
  return {...state,player:{...state.player,yaw:state.player.yaw+yaw,pitch:clamp(state.player.pitch+pitch,-.75,.75)}};
}
/** Why a relic cannot be taken yet, or null when it is free. */
export function relicLock(state:MansionState,index:number):string|null {
  if(index===1&&!state.safeOpen)return 'Cilindro trancado no cofre do camarim';
  if(index===2&&!state.hasKey)return 'Gaveta trancada · falta uma chavinha';
  return null;
}
/** One line pointing at the next unsolved step. */
export function nextHint(state:MansionState):string {
  const got=collectedCount(state),[c0,c1,c2,c3,c4]=state.notes;
  if(state.doorOpen)return 'A porta abriu. Saia pelo hall.';
  if(state.notes.every(n=>!n))return 'Bilhetes espalhados guardam o código do cofre e a melodia. Leia todos.';
  if(c0&&!state.hasKey)return 'A chavinha dorme num armário: o cartaz diz qual.';
  if(!state.safeOpen&&c0&&c1&&c2)return 'Os três bilhetes dão o código. O cofre fica no camarim.';
  if(got<3)return 'Pegue as peças que faltam. Algumas estão trancadas.';
  if(!(c3&&c4))return 'A melodia está em dois bilhetes: o programa e a foto de família.';
  return 'Toque a melodia na caixa de música, no hall.';
}
export function interaction(state:MansionState):Interaction|null {
  if(state.status!=='playing')return null;
  if(state.hidden>=0)return {kind:'emerge',index:state.hidden,label:'Sair do armário'};
  const candidates:{item:Interaction;point:Point}[]=[];
  RELICS.forEach((p,i)=>{if(state.collected[i])return;const why=relicLock(state,i);candidates.push({point:p,item:why?{kind:'locked',index:i,label:why}:{kind:'relic',index:i,label:`Pegar ${p.name.toLowerCase()}`}});});
  NOTES.forEach((p,i)=>candidates.push({point:p,item:{kind:'note',index:i,label:`${state.notes[i]?'Reler':'Ler'}: ${p.title.toLowerCase()}`}}));
  if(!state.safeOpen)candidates.push({point:SAFE,item:{kind:'safe',index:0,label:'Abrir o cofre · 3 algarismos'}});
  LOCKERS.forEach((p,i)=>candidates.push({point:p,item:{kind:'locker',index:i,label:'Esconder no armário'}}));
  if(!state.doorOpen)candidates.push({point:MUSIC_BOX,item:{kind:'box',index:0,label:collectedCount(state)===3?'Tocar a melodia na caixa de música':`Caixa de música · faltam ${3-collectedCount(state)} peças`}});
  const nearest=candidates.filter(c=>distance(state.player,c.point)<1.65&&lineOfSight(state.player,c.point)).sort((a,b)=>distance(state.player,a.point)-distance(state.player,b.point))[0];
  return nearest?.item??null;
}
function relicNoise(state:MansionState):MansionState {
  return {...state,wakeAt:Math.min(state.wakeAt,state.elapsed+5),enemy:{...state.enemy,target:state.player,planAt:0,mode:state.enemy.awake?'investigate':state.enemy.mode}};
}
export function interactMansion(state:MansionState):MansionState {
  const item=interaction(state);if(!item)return state;
  if(item.kind==='locked')return {...state,event:'locked'};
  if(item.kind==='relic')return {...relicNoise(state),collected:state.collected.map((v,i)=>v||i===item.index),event:'relic'};
  if(item.kind==='note')return {...state,notes:state.notes.map((v,i)=>v||i===item.index),reading:item.index,event:'note'};
  if(item.kind==='safe')return {...state,puzzle:'safe',event:'puzzle'};
  if(item.kind==='locker')return {...state,hidden:item.index,flashlight:false,hasKey:state.hasKey||item.index===KEY_LOCKER,spotted:state.enemy.awake&&distance(state.player,state.enemy)<3&&lineOfSight(state.player,state.enemy),event:item.index===KEY_LOCKER&&!state.hasKey?'key':'hide'};
  if(item.kind==='emerge')return {...state,hidden:-1,flashlight:true,spotted:false,event:'emerge'};
  if(collectedCount(state)===3)return {...state,puzzle:'melody',event:'puzzle'};
  return state;
}
function fail(state:MansionState):MansionState {
  const mistakes=state.mistakes+1,alarm=mistakes>=MAX_MISTAKES,noisy=relicNoise(state);
  const enemy=alarm?{...noisy.enemy,awake:true,mode:'chase' as const,memory:5.5,planAt:0}:noisy.enemy;
  return {...noisy,enemy,mistakes:alarm?0:mistakes,puzzle:alarm?null:state.puzzle,wakeAt:alarm?state.elapsed:noisy.wakeAt,event:'wrong'};
}
/** Checks a safe code; a hit opens the safe, a miss is heard through the house. */
export function submitSafe(state:MansionState,code:readonly number[]):MansionState {
  if(state.status!=='playing'||state.puzzle!=='safe')return state;
  return code.length===SAFE_CODE.length&&code.every((d,i)=>d===SAFE_CODE[i])?{...state,safeOpen:true,puzzle:null,mistakes:0,event:'unlock'}:fail(state);
}
/** Checks the music box melody; the right order opens the front door. */
export function submitMelody(state:MansionState,tune:readonly MelodyColor[]):MansionState {
  if(state.status!=='playing'||state.puzzle!=='melody')return state;
  return tune.length===MELODY.length&&tune.every((c,i)=>c===MELODY[i])?{...state,doorOpen:true,puzzle:null,mistakes:0,event:'door'}:fail(state);
}
export function closePuzzle(state:MansionState):MansionState { return state.puzzle===null&&state.reading<0?state:{...state,puzzle:null,reading:-1}; }
export function toggleFlashlight(state:MansionState):MansionState { return state.hidden<0&&state.status==='playing'?{...state,flashlight:!state.flashlight}:state; }
export function stepMansion(state:MansionState,input:MansionInput,seconds:number):MansionState {
  const dt=Number.isFinite(seconds)?clamp(seconds,0,.08):0;if(dt===0||state.status==='won')return state;
  if(state.status==='caught')return {...state,caughtFor:state.caughtFor+dt,event:'none'};
  const elapsed=state.elapsed+dt;let event:HorrorEvent='none';
  const forward=clamp(input.forward||0,-1,1),strafe=clamp(input.strafe||0,-1,1),length=Math.max(1,Math.hypot(forward,strafe));
  const moving=Math.hypot(forward,strafe)>.01&&state.hidden<0,sprint=input.sprint&&moving&&state.stamina>1,speed=sprint?4.25:2.5;
  let player={...state.player,yaw:state.player.yaw+clamp(input.turn||0,-1,1)*dt*1.8};
  if(moving){const dx=(Math.sin(player.yaw)*forward+Math.cos(player.yaw)*strafe)/length*speed*dt,dz=(-Math.cos(player.yaw)*forward+Math.sin(player.yaw)*strafe)/length*speed*dt;
    if(canStand(player.x+dx,player.z))player={...player,x:player.x+dx};if(canStand(player.x,player.z+dz))player={...player,z:player.z+dz};}
  const stamina=clamp(state.stamina+(sprint?-29:17)*dt,0,100);let enemy={...state.enemy};
  if(!enemy.awake&&elapsed>=state.wakeAt){enemy={...enemy,awake:true,mode:'investigate',planAt:0};event='wake';}
  if(enemy.awake){
    const gap=distance(player,enemy),exposed=state.hidden<0||state.spotted,seen=exposed&&lineOfSight(player,enemy)&&gap<(state.flashlight?14:6.5),heard=moving&&gap<(sprint?15:3.5);
    let target=enemy.target,mode=enemy.mode,memory=Math.max(0,enemy.memory-dt),patrol=enemy.patrol;
    if(seen){target=player;memory=5.5;if(mode!=='chase')event='chase';mode='chase';}else if(heard){target=player;memory=3.5;mode='investigate';}else if(memory===0&&distance(enemy,target)<.55){patrol=(patrol+1)%PATROL.length;target=PATROL[patrol]??EXIT;mode='patrol';}
    let path=enemy.path,planAt=enemy.planAt;if(elapsed>=planAt){path=findPath(enemy,target);planAt=elapsed+.35;}
    const waypoint=path[0];if(waypoint){const d=distance(enemy,waypoint),velocity=(mode==='chase'?(state.doorOpen?2.95:collectedCount(state)===3?2.7:2.05):mode==='investigate'?1.8:1.35)*dt;
      if(d<=velocity+.04){enemy={...enemy,x:waypoint.x,z:waypoint.z};path=path.slice(1);}else{const x=enemy.x+(waypoint.x-enemy.x)/d*velocity,z=enemy.z+(waypoint.z-enemy.z)/d*velocity;if(!isWall(x,z))enemy={...enemy,x,z};}}
    enemy={...enemy,target,mode,memory,patrol,path,planAt};
    if(exposed&&distance(player,enemy)<.8&&lineOfSight(player,enemy))return {...state,player,enemy,stamina,elapsed,status:'caught',caughtFor:0,event:'caught',fear:100};
  }
  const danger=enemy.awake?clamp((10-distance(player,enemy))/9,0,1)*100:0,fear=state.fear+(danger*(state.hidden>=0?.55:1)-state.fear)*Math.min(1,dt*2.5);
  if(state.doorOpen&&distance(player,EXIT)<1.1)return {...state,player,enemy,stamina,elapsed,fear,status:'won',event:'won'};
  return {...state,player,enemy,stamina,elapsed,fear,event};
}
