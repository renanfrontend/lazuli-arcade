import {describe,expect,it} from 'vitest';
import {canStand,closePuzzle,collectedCount,createMansion,distance,EXIT,findPath,interactMansion,interaction,isWall,KEY_LOCKER,lineOfSight,LOCKERS,lookMansion,MAX_MISTAKES,MELODY,MUSIC_BOX,nextHint,NOTES,PATROL,RELICS,SAFE,SAFE_CODE,stepMansion,submitMelody,submitSafe,toggleFlashlight,WAKE_AT,type MansionState} from './game';
const idle={forward:0,strafe:0,turn:0,sprint:false};
const at=(state:MansionState,point:{x:number;z:number}):MansionState=>({...state,player:{...state.player,...point}});
describe('Mansão do último espetáculo',()=>{
  it('gives every room, relic, locker and exit a connected route',()=>{const start=createMansion().player;for(const destination of [...RELICS,...NOTES,...LOCKERS,...PATROL,MUSIC_BOX,EXIT,{x:SAFE.x-1.3,z:SAFE.z}]){expect(canStand(destination.x,destination.z)).toBe(true);const route=findPath(start,destination);expect(route.length).toBeGreaterThan(0);expect(route.every(p=>!isWall(p.x,p.z))).toBe(true);expect(route.at(-1)).toEqual(destination);}});
  it('moves in first-person coordinates and normalizes diagonal speed',()=>{const s=createMansion(),straight=stepMansion(s,{...idle,forward:1},.08),diagonal=stepMansion(s,{...idle,forward:1,strafe:1},.08);expect(straight.player.z).toBeLessThan(s.player.z);expect(straight.player.x).toBe(s.player.x);expect(distance(s.player,straight.player)).toBeCloseTo(distance(s.player,diagonal.player));});
  it('blocks walls and furniture',()=>{let s=at(createMansion(),{x:16.3,z:29});for(let i=0;i<60;i++)s=stepMansion(s,{...idle,strafe:-1},.08);expect(s.player.x).toBeGreaterThan(16.2);expect(canStand(s.player.x,s.player.z)).toBe(true);});
  it('collects pieces once and wakes the stalker after a grace period',()=>{let s=at(createMansion(),RELICS[0]??EXIT);expect(interaction(s)?.kind).toBe('relic');s=interactMansion(s);expect(collectedCount(s)).toBe(1);expect(s.enemy.awake).toBe(false);expect(collectedCount(interactMansion(s))).toBe(1);for(let i=0;i<70;i++)s=stepMansion(s,idle,.08);expect(s.enemy.awake).toBe(true);});
  it('requires three pieces, then the melody, before the door opens',()=>{
    let s:MansionState={...at(createMansion(),MUSIC_BOX),hasKey:true,safeOpen:true};expect(interactMansion(s).puzzle).toBeNull();
    for(const relic of RELICS)s=interactMansion(at(s,relic));expect(collectedCount(s)).toBe(3);
    expect(stepMansion(at(s,EXIT),idle,.05).status).toBe('playing');
    s=interactMansion(at(s,MUSIC_BOX));expect(s.puzzle).toBe('melody');expect(s.doorOpen).toBe(false);
    s=submitMelody(s,MELODY);expect(s.doorOpen).toBe(true);expect(s.puzzle).toBeNull();expect(stepMansion(at(s,EXIT),idle,.05).status).toBe('won');
  });
  it('derives the safe code from the house itself',()=>{expect(SAFE_CODE).toEqual([LOCKERS.length,RELICS[2]?.name.length,2*(10-LOCKERS.length)]);expect(SAFE_CODE.every(d=>Number.isInteger(d)&&d>=0&&d<=9)).toBe(true);});
  it('lets the player reach every note and the safe',()=>{
    NOTES.forEach((n,i)=>{const s=at(createMansion(),{x:n.x,z:n.z-.9});expect(canStand(s.player.x,s.player.z)).toBe(true);expect(interaction(s)).toMatchObject({kind:'note',index:i});});
    const s=at(createMansion(),{x:SAFE.x-1.3,z:SAFE.z});expect(canStand(s.player.x,s.player.z)).toBe(true);expect(interaction(s)?.kind).toBe('safe');
  });
  it('marks notes as read and keeps them rereadable',()=>{let s=at(createMansion(),{x:NOTES[1]?.x??0,z:(NOTES[1]?.z??0)-.9});s=interactMansion(s);expect(s.notes[1]).toBe(true);expect(s.reading).toBe(1);expect(interaction(closePuzzle(s))?.label.startsWith('Reler')).toBe(true);expect(closePuzzle(s).reading).toBe(-1);});
  it('locks the doll drawer until the key is found and the cylinder until the safe opens',()=>{
    const doll=RELICS[2]??EXIT,cylinder=RELICS[1]??EXIT;
    let s=at(createMansion(),doll);expect(interaction(s)?.kind).toBe('locked');s=interactMansion(s);expect(collectedCount(s)).toBe(0);expect(s.event).toBe('locked');
    expect(collectedCount(interactMansion({...at(s,doll),hasKey:true}))).toBe(1);
    s=at(createMansion(),cylinder);expect(interaction(s)?.kind).toBe('locked');expect(collectedCount(interactMansion({...s,safeOpen:true}))).toBe(1);
  });
  it('hands over the key only in the right locker',()=>{
    const wrong=interactMansion(at(createMansion(),LOCKERS[0]??EXIT));expect(wrong.hasKey).toBe(false);
    const right=interactMansion(at(createMansion(),LOCKERS[KEY_LOCKER]??EXIT));expect(right.hasKey).toBe(true);expect(right.event).toBe('key');
  });
  it('opens the safe with the right code and punishes wrong ones with noise and, finally, an alarm',()=>{
    const open=interactMansion(at(createMansion(),{x:SAFE.x-1.3,z:SAFE.z}));expect(open.puzzle).toBe('safe');
    expect(submitSafe(open,SAFE_CODE).safeOpen).toBe(true);
    let s=submitSafe(open,[0,0,0]);expect(s.mistakes).toBe(1);expect(s.puzzle).toBe('safe');expect(s.wakeAt).toBeLessThan(WAKE_AT);expect(s.enemy.awake).toBe(false);
    for(let i=1;i<MAX_MISTAKES;i++)s=submitSafe(s,[1,2]);
    expect(s.puzzle).toBeNull();expect(s.enemy.awake).toBe(true);expect(s.enemy.mode).toBe('chase');expect(s.safeOpen).toBe(false);
    expect(submitSafe(createMansion(),SAFE_CODE).safeOpen).toBe(false);
  });
  it('rejects a wrong melody and the right colors in the wrong order',()=>{
    const base:MansionState={...createMansion(),collected:[true,true,true],puzzle:'melody'};
    expect(submitMelody(base,[...MELODY].reverse()).doorOpen).toBe(false);expect(submitMelody(base,MELODY.slice(0,3)).doorOpen).toBe(false);expect(submitMelody(base,MELODY).doorOpen).toBe(true);
  });
  it('guides the next step and wakes the house on its own',()=>{
    let s=createMansion();expect(nextHint(s)).toMatch(/bilhetes/i);
    s=interactMansion(at(s,{x:NOTES[0]?.x??0,z:(NOTES[0]?.z??0)-.9}));expect(nextHint(s)).toMatch(/chavinha/i);
    s={...s,hasKey:true,notes:[true,true,true,false,false]};expect(nextHint(s)).toMatch(/cofre/i);
    expect(nextHint({...s,safeOpen:true,collected:[true,true,true]})).toMatch(/melodia/i);
    let idle0=createMansion();while(idle0.elapsed<WAKE_AT+1)idle0=stepMansion(idle0,idle,.08);expect(idle0.enemy.awake).toBe(true);
  });
  it('lets an unseen player hide and restores the light on exit',()=>{let s=at(createMansion(),LOCKERS[0]??EXIT);s=interactMansion(s);expect(s.hidden).toBe(0);expect(s.flashlight).toBe(false);expect(stepMansion(s,{...idle,forward:1},.08).player).toEqual(s.player);s=interactMansion(s);expect(s.hidden).toBe(-1);expect(s.flashlight).toBe(true);});
  it('catches a player whose hiding was witnessed',()=>{let s=at(createMansion(),LOCKERS[0]??EXIT);s={...s,enemy:{...s.enemy,awake:true,x:s.player.x+.3,z:s.player.z,mode:'chase'}};s=interactMansion(s);expect(s.spotted).toBe(true);expect(stepMansion(s,idle,.05).status).toBe('caught');});
  it('stops sight at walls and routes through doorways',()=>{const a={x:19,z:29},b={x:7,z:29};expect(lineOfSight(a,b)).toBe(false);expect(findPath(a,b).some(p=>p.z===33)).toBe(true);});
  it('uses stamina for sprinting and recovers at rest',()=>{const s=createMansion(),run=stepMansion(s,{...idle,forward:1,sprint:true},.08);expect(run.stamina).toBeLessThan(100);expect(stepMansion(run,idle,.08).stamina).toBeGreaterThan(run.stamina);});
  it('navigates from the corridor into a room and catches a stationary player',()=>{let s=interactMansion(at(createMansion(),RELICS[0]??EXIT));for(let i=0;i<900&&s.status==='playing';i++)s=stepMansion(s,idle,.08);expect(s.status).toBe('caught');expect(distance(s.enemy,s.player)).toBeLessThan(.8);});
  it('searches without catching a player hidden before it woke',()=>{let s=interactMansion(at(createMansion(),RELICS[0]??EXIT));s=interactMansion(at(s,LOCKERS[0]??EXIT));for(let i=0;i<900;i++)s=stepMansion(s,idle,.08);expect(s.enemy.awake).toBe(true);expect(s.status).toBe('playing');expect(s.hidden).toBe(0);});
  it('caps frame gaps, rejects invalid time and freezes completion',()=>{const s=createMansion();expect(stepMansion(s,idle,NaN)).toBe(s);expect(stepMansion(s,{...idle,forward:1},20).elapsed).toBe(.08);const won={...s,status:'won' as const};expect(stepMansion(won,idle,.08)).toBe(won);expect(lookMansion(s,NaN,1)).toBe(s);expect(lookMansion(s,1,50).player.pitch).toBe(.75);expect(toggleFlashlight(s).flashlight).toBe(false);});
});
