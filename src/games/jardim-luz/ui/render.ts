import { BUDS, type GardenPoint, type GardenState } from '../domain/game';
import { cover, glow, vignette } from '@shared/ui/atmosphere/paint';
import type { Viewport } from '@shared/ui/atmosphere/useSceneCanvas';
export interface Spark { x: number; y: number; vx: number; vy: number; life: number; total: number; size: number }
export interface Ripple { readonly x: number; readonly y: number; age: number }
export interface GardenEffects { readonly sparks: Spark[]; readonly ripples: Ripple[]; spawn: number }
export const PALETTES = [{name:'Aurora',light:'#a6ffe1',petal:'#d2efe8',deep:'#437e9e'}, {name:'Violeta',light:'#d6b5ff',petal:'#f0d3fa',deep:'#7165b2'}, {name:'Âmbar',light:'#ffdaa0',petal:'#f7e4be',deep:'#9d7a51'}] as const;
export function addRipple(effects: GardenEffects, point: GardenPoint): void {
  effects.ripples.push({...point,age:0}); if(effects.ripples.length>12)effects.ripples.shift();
}
function blossom(ctx: CanvasRenderingContext2D,x:number,y:number,growth:number,time:number,palette:typeof PALETTES[number]):void {
  const bloom=growth>=1;
  glow(ctx,x,y,bloom?76:30,palette.light,bloom?.55:.27);
  ctx.save();ctx.translate(x,y);ctx.scale(1,.68);
  ctx.strokeStyle=`${palette.light}35`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,5,34+growth*12,24+growth*8,0,0,Math.PI*2);ctx.stroke();
  const radius=7+growth*31;
  for(let ring=0;ring<2;ring++)for(let petal=0;petal<7;petal++) {
    ctx.save();ctx.rotate(petal*Math.PI*2/7+ring*.44+Math.sin(time*.3)*.015);
    const length=radius*(ring===0?1:.73);
    const grad=ctx.createLinearGradient(0,0,0,-length);grad.addColorStop(0,palette.deep);grad.addColorStop(.56,palette.petal);grad.addColorStop(1,'#ffffff');
    ctx.fillStyle=grad;ctx.globalAlpha=.84;ctx.beginPath();ctx.moveTo(0,4);ctx.bezierCurveTo(-length*.55,-length*.35,-length*.32,-length*.85,0,-length);ctx.bezierCurveTo(length*.32,-length*.85,length*.55,-length*.35,0,4);ctx.fill();ctx.restore();
  }
  ctx.fillStyle=bloom?'#ffe6ad':palette.light;ctx.shadowColor=palette.light;ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(0,0,4+growth*4,3+growth*3,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(!bloom&&growth>0){ctx.strokeStyle=palette.light;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,26,-Math.PI/2,-Math.PI/2+growth*Math.PI*2);ctx.stroke();}
  ctx.restore();
}
export function drawGarden(ctx:CanvasRenderingContext2D,state:GardenState,image:HTMLImageElement|null,view:Viewport,effects:GardenEffects,pointer:GardenPoint|null,dt:number,time:number,paletteIndex:number,reduced:boolean):void {
  const palette=PALETTES[paletteIndex]??PALETTES[0];cover(ctx,image,view);
  const t=reduced?0:time;
  ctx.fillStyle='#0918361c';ctx.fillRect(0,0,view.width,view.height);
  // Water highlights breathe slowly instead of shaking the whole scene.
  for(let i=0;i<12;i++){
    const yy=view.height*(.49+i*.036);ctx.strokeStyle=`rgba(175,193,230,${.018+.012*Math.sin(t*.4+i)})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(view.width*.15+Math.sin(t*.2+i)*12,yy);ctx.bezierCurveTo(view.width*.3,yy-2,view.width*.65,yy+2,view.width*.9,yy);ctx.stroke();
  }
  for(let i=0;i<34;i++){
    const x=view.width*((i*.137)%1)+Math.sin(t*.22+i)*15;
    const y=view.height*(.32+((i*.079)%1)*.62)+Math.cos(t*.31+i*2)*10;
    const alpha=.13+.25*Math.sin(t*.55+i)**2;glow(ctx,x,y,8,palette.light,alpha);ctx.fillStyle=`${palette.light}a0`;ctx.fillRect(x,y,1.3,1.3);
  }
  if(pointer&&!reduced){
    effects.spawn+=dt;
    while(effects.spawn>.025){effects.spawn-=.025;const angle=time*7+effects.sparks.length*2.4;
      effects.sparks.push({x:pointer.x*view.width,y:pointer.y*view.height,vx:Math.cos(angle)*24,vy:Math.sin(angle)*20-12,life:2.7,total:2.7,size:1.2+(effects.sparks.length%3)*.5});
    }
  }else effects.spawn=0;
  if(effects.sparks.length>180)effects.sparks.splice(0,effects.sparks.length-180);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineWidth=1;
  for(let i=effects.sparks.length-1;i>=0;i--){
    const p=effects.sparks[i];if(!p)continue;p.life-=dt;if(p.life<=0){effects.sparks.splice(i,1);continue;}
    const ox=p.x,oy=p.y;p.vx+=Math.sin(p.y*.015+t*.7)*dt*17;p.vy+=Math.cos(p.x*.012+t*.55)*dt*17;p.x+=p.vx*dt;p.y+=p.vy*dt;
    ctx.globalAlpha=Math.min(1,p.life*.8)*.65;ctx.strokeStyle=palette.light;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle=palette.light;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    if(i%7===0)glow(ctx,p.x,p.y,14,palette.light,.5);
  }
  ctx.restore();
  for(let i=effects.ripples.length-1;i>=0;i--){const r=effects.ripples[i];if(!r)continue;r.age+=dt;if(r.age>3.6){effects.ripples.splice(i,1);continue;}
    for(let ring=0;ring<3;ring++){const age=r.age-ring*.21;if(age<=0)continue;ctx.strokeStyle=palette.light;ctx.globalAlpha=Math.max(0,(1-age/3.6)*.24);ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x*view.width,r.y*view.height,age*42,age*13,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  }
  BUDS.forEach((bud,index)=>{blossom(ctx,bud.x*view.width,bud.y*view.height,state.growth[index]??0,t+index,palette);});
  if(pointer){glow(ctx,pointer.x*view.width,pointer.y*view.height,42,palette.light,.45);ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(pointer.x*view.width,pointer.y*view.height,2.3,0,Math.PI*2);ctx.fill();}
  vignette(ctx,view,.52);
}
