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
export const PATROL: readonly Point[] = [{ x: 19, z: 7 }, { x: 19, z: 19 }, { x: 19, z: 33 }];
export interface Obstacle extends Point { readonly radius: number }
export const OBSTACLES: readonly Obstacle[] = [...LOCKERS.map(p => ({ x: p.x, z: p.z + .8, radius: .55 })), ...RELICS.map(p => ({ x: p.x, z: p.z + .75, radius: .4 })), { x: 30, z: 33, radius: .5 }, { x: 8, z: 20, radius: .6 }];
export interface Enemy extends Point { readonly awake: boolean; readonly mode: 'sleeping' | 'patrol' | 'investigate' | 'chase'; readonly target: Point; readonly path: readonly Point[]; readonly planAt: number; readonly memory: number; readonly patrol: number }
export type HorrorEvent = 'none' | 'relic' | 'wake' | 'chase' | 'hide' | 'emerge' | 'door' | 'caught' | 'won';
export interface MansionState {
  readonly player: Player; readonly enemy: Enemy; readonly collected: readonly boolean[];
  readonly flashlight: boolean; readonly stamina: number; readonly hidden: number; readonly spotted: boolean;
  readonly doorOpen: boolean; readonly elapsed: number; readonly wakeAt: number; readonly fear: number;
  readonly status: 'playing' | 'caught' | 'won'; readonly caughtFor: number; readonly event: HorrorEvent;
}
export interface MansionInput { readonly forward: number; readonly strafe: number; readonly turn: number; readonly sprint: boolean }
export interface Interaction { readonly kind: 'relic' | 'locker' | 'box' | 'emerge'; readonly index: number; readonly label: string }
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
export function createMansion(): MansionState {
  return {player:{x:19,z:37,yaw:0,pitch:0},enemy:{x:19,z:19,awake:false,mode:'sleeping',target:PATROL[0]??EXIT,path:[],planAt:0,memory:0,patrol:0},collected:[false,false,false],flashlight:true,stamina:100,hidden:-1,spotted:false,doorOpen:false,elapsed:0,wakeAt:Infinity,fear:0,status:'playing',caughtFor:0,event:'none'};
}
export function lookMansion(state:MansionState,yaw:number,pitch:number):MansionState {
  if(state.status!=='playing'||!Number.isFinite(yaw)||!Number.isFinite(pitch))return state;
  return {...state,player:{...state.player,yaw:state.player.yaw+yaw,pitch:clamp(state.player.pitch+pitch,-.75,.75)}};
}
export function interaction(state:MansionState):Interaction|null {
  if(state.status!=='playing')return null;
  if(state.hidden>=0)return {kind:'emerge',index:state.hidden,label:'Sair do armário'};
  const candidates:{item:Interaction;point:Point}[]=[];
  RELICS.forEach((p,i)=>{if(!state.collected[i])candidates.push({point:p,item:{kind:'relic',index:i,label:`Pegar ${p.name.toLowerCase()}`}});});
  LOCKERS.forEach((p,i)=>candidates.push({point:p,item:{kind:'locker',index:i,label:'Esconder no armário'}}));
  if(!state.doorOpen)candidates.push({point:MUSIC_BOX,item:{kind:'box',index:0,label:collectedCount(state)===3?'Montar a caixa de música':`Caixa de música · faltam ${3-collectedCount(state)} peças`}});
  const nearest=candidates.filter(c=>distance(state.player,c.point)<1.65&&lineOfSight(state.player,c.point)).sort((a,b)=>distance(state.player,a.point)-distance(state.player,b.point))[0];
  return nearest?.item??null;
}
export function interactMansion(state:MansionState):MansionState {
  const item=interaction(state);if(!item)return state;
  if(item.kind==='relic')return {...state,collected:state.collected.map((v,i)=>v||i===item.index),event:'relic',wakeAt:Math.min(state.wakeAt,state.elapsed+5),enemy:{...state.enemy,target:state.player,planAt:0,mode:state.enemy.awake?'investigate':state.enemy.mode}};
  if(item.kind==='locker')return {...state,hidden:item.index,flashlight:false,spotted:state.enemy.awake&&distance(state.player,state.enemy)<3&&lineOfSight(state.player,state.enemy),event:'hide'};
  if(item.kind==='emerge')return {...state,hidden:-1,flashlight:true,spotted:false,event:'emerge'};
  if(collectedCount(state)===3)return {...state,doorOpen:true,event:'door'};
  return state;
}
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
    const waypoint=path[0];if(waypoint){const d=distance(enemy,waypoint),velocity=(mode==='chase'?(collectedCount(state)===3?2.7:2.05):mode==='investigate'?1.8:1.35)*dt;
      if(d<=velocity+.04){enemy={...enemy,x:waypoint.x,z:waypoint.z};path=path.slice(1);}else{const x=enemy.x+(waypoint.x-enemy.x)/d*velocity,z=enemy.z+(waypoint.z-enemy.z)/d*velocity;if(!isWall(x,z))enemy={...enemy,x,z};}}
    enemy={...enemy,target,mode,memory,patrol,path,planAt};
    if(exposed&&distance(player,enemy)<.8&&lineOfSight(player,enemy))return {...state,player,enemy,stamina,elapsed,status:'caught',caughtFor:0,event:'caught',fear:100};
  }
  const danger=enemy.awake?clamp((10-distance(player,enemy))/9,0,1)*100:0,fear=state.fear+(danger*(state.hidden>=0?.55:1)-state.fear)*Math.min(1,dt*2.5);
  if(state.doorOpen&&distance(player,EXIT)<1.1)return {...state,player,enemy,stamina,elapsed,fear,status:'won',event:'won'};
  return {...state,player,enemy,stamina,elapsed,fear,event};
}
