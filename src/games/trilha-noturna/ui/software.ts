import { EXIT, FLOORPLAN, LOCKERS, MUSIC_BOX, RELICS, TILE, type MansionState } from '../domain/game';
interface Renderer { readonly draw:(state:MansionState,time:number,reduced:boolean)=>void;readonly dispose:()=>void }
type TextureFactory=(kind:'wall'|'wood'|'ceiling'|'cloth'|'plain')=>HTMLCanvasElement;
interface Sprite { readonly x:number;readonly z:number;readonly y:number;readonly width:number;readonly height:number;readonly image:HTMLCanvasElement|HTMLImageElement;readonly glow:boolean }
/** Software perspective renderer keeps the same game playable without WebGL. */
export function createSoftwareRenderer(canvas:HTMLCanvasElement,clownUrl:string,texture:TextureFactory):Renderer {
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Não foi possível abrir o cenário neste navegador.');
  const wall=texture('wall'),wood=texture('wood'),ceiling=texture('ceiling');
  const floorPixels=wood.getContext('2d')?.getImageData(0,0,512,512).data,ceilingPixels=ceiling.getContext('2d')?.getImageData(0,0,512,512).data;
  const clown=new Image();clown.src=clownUrl;let disposed=false,frame:ImageData|null=null,depths=new Float32Array(1);
  const makeProp=(kind:'wardrobe'|'dresser'|'doll'|'key'|'horse'|'box'):HTMLCanvasElement=>{
    const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');if(!g)return c;
    g.shadowColor='#000';g.shadowBlur=10;
    if(kind==='wardrobe'||kind==='dresser'){
      const top=kind==='wardrobe'?15:160,bottom=490,gradient=g.createLinearGradient(20,0,240,0);gradient.addColorStop(0,'#17130f');gradient.addColorStop(.25,'#645341');gradient.addColorStop(.7,'#3e3022');gradient.addColorStop(1,'#100d09');g.fillStyle=gradient;g.fillRect(19,top,218,bottom-top);g.drawImage(wood,0,0,512,512,22,top+10,212,bottom-top-20);g.fillStyle='#1c151ba0';g.fillRect(22,top+10,212,bottom-top-20);g.strokeStyle='#af916544';g.lineWidth=4;g.strokeRect(33,top+28,190,bottom-top-48);
      if(kind==='wardrobe'){g.fillStyle='#17120c';g.fillRect(126,top+12,4,bottom-top-25);for(const x of [114,139]){g.fillStyle='#ab8851';g.fillRect(x,290,5,25);}g.fillStyle='#3e3124';g.fillRect(12,top,232,13);g.fillRect(10,top-8,236,10);}
      else{for(const y of [230,320,410]){g.strokeStyle='#18130d';g.lineWidth=8;g.beginPath();g.moveTo(29,y);g.lineTo(228,y);g.stroke();g.fillStyle='#b69350';g.fillRect(112,y-37,30,7);}}
      for(let i=0;i<25;i++){g.strokeStyle='#09070650';g.lineWidth=1;g.beginPath();g.moveTo(30+i*8,top+20+(i%5)*18);g.lineTo(36+i*8,bottom-(i%3)*27);g.stroke();}
    }else if(kind==='doll'){
      const skin=g.createRadialGradient(109,122,7,130,152,74);skin.addColorStop(0,'#d6c9ae');skin.addColorStop(.7,'#8b8171');skin.addColorStop(1,'#322a23');g.fillStyle='#242019';g.beginPath();g.ellipse(128,160,85,110,0,0,Math.PI*2);g.fill();g.fillStyle=skin;g.beginPath();g.ellipse(128,160,70,83,0,0,Math.PI*2);g.fill();g.shadowBlur=0;
      for(const x of [100,157]){g.fillStyle='#0c0b0b';g.beginPath();g.ellipse(x,151,15,19,0,0,Math.PI*2);g.fill();g.fillStyle='#ceccb033';g.fillRect(x-3,144,4,5);}g.strokeStyle='#241717';g.lineWidth=3;g.beginPath();g.moveTo(104,202);g.quadraticCurveTo(129,191,151,204);g.stroke();g.strokeStyle='#463c3055';g.beginPath();g.moveTo(161,90);g.lineTo(145,119);g.lineTo(156,131);g.lineTo(146,166);g.stroke();
      const dress=g.createLinearGradient(50,250,195,410);dress.addColorStop(0,'#55483b');dress.addColorStop(1,'#292423');g.fillStyle=dress;g.beginPath();g.moveTo(90,239);g.lineTo(162,239);g.lineTo(218,412);g.lineTo(38,412);g.closePath();g.fill();g.fillStyle='#aca18c';g.beginPath();g.ellipse(65,310,14,55,.2,0,Math.PI*2);g.ellipse(186,310,14,55,-.2,0,Math.PI*2);g.fill();g.fillStyle='#25201a';g.fillRect(70,400,36,88);g.fillRect(150,400,36,88);
    }else if(kind==='key'){
      const halo=g.createRadialGradient(128,245,5,128,245,115);halo.addColorStop(0,'#ffe7a8a0');halo.addColorStop(1,'#ffc97800');g.fillStyle=halo;g.fillRect(0,100,256,300);g.shadowColor='#d3a745';g.shadowBlur=25;g.strokeStyle='#d2a856';g.lineWidth=15;g.beginPath();g.arc(109,224,34,0,Math.PI*2);g.moveTo(130,250);g.lineTo(192,310);g.lineTo(211,291);g.stroke();g.shadowBlur=0;g.strokeStyle='#fff0b6';g.lineWidth=3;g.beginPath();g.arc(105,220,33,Math.PI,Math.PI*1.75);g.stroke();
    }else if(kind==='box'){
      g.fillStyle='#5e4224';g.fillRect(34,290,188,158);g.strokeStyle='#bf9356';g.lineWidth=5;g.strokeRect(37,294,182,152);g.fillStyle='#916c39';g.fillRect(28,274,200,23);g.fillStyle='#25170f';g.fillRect(112,350,33,29);g.fillStyle='#d5b96a';g.fillRect(123,357,10,16);
    }else{
      g.fillStyle='#6d5438';g.fillRect(58,257,132,66);g.fillRect(169,179,40,117);g.fillRect(153,170,79,36);for(const x of [68,168])g.fillRect(x,316,11,127);g.strokeStyle='#4a3622';g.lineWidth=17;g.beginPath();g.moveTo(24,439);g.quadraticCurveTo(128,475,236,439);g.stroke();g.fillStyle='#231b16';g.fillRect(214,178,5,7);
    }return c;
  };
  const props={wardrobe:makeProp('wardrobe'),dresser:makeProp('dresser'),doll:makeProp('doll'),key:makeProp('key'),horse:makeProp('horse'),box:makeProp('box')};
  return {
    draw(state,time,reduced){
      if(disposed)return;const rect=canvas.getBoundingClientRect(),width=Math.max(240,Math.min(700,Math.round(rect.width*.7))),height=Math.max(200,Math.round(width*rect.height/Math.max(1,rect.width)));
      if(canvas.width!==width||canvas.height!==height||!frame){canvas.width=width;canvas.height=height;frame=ctx.createImageData(width,height);depths=new Float32Array(width);}
      const p=state.player,fy=-Math.cos(p.yaw),fx=Math.sin(p.yaw),rx=Math.cos(p.yaw),rz=Math.sin(p.yaw),projection=height/(2*Math.tan(74*Math.PI/360));
      const horizon=height/2+Math.tan(p.pitch)*projection+(reduced?0:Math.sin(time*6)*.4),pixels=frame.data;
      // Floor and ceiling use real perspective and the same weathered materials.
      for(let y=0;y<height;y+=2){const floor=y>horizon,plane=floor?1.65:1.35,row=Math.max(.5,Math.abs(y-horizon)),dist=Math.min(60,plane*projection/row),source=floor?floorPixels:ceilingPixels;
        const vertical=(y-horizon)/projection,beamY=vertical*vertical;
        for(let x=0;x<width;x+=2){const side=(x-width/2)/projection,wx=p.x+(fx+rx*side)*dist,wz=p.z+(fy+rz*side)*dist,tx=((Math.floor(wx*120)%512)+512)%512,tz=((Math.floor(wz*120)%512)+512)%512,ti=(tz*512+tx)*4;
          const beam=Math.exp(-(side*side+beamY)*3.3),torch=state.flashlight?beam*1.65/(1+.045*dist*dist):0,red=1/(1+((wx-19)**2+(wz-35)**2)*.33)+.6/(1+((wx-19)**2+(wz-22)**2)*.36),fog=Math.exp(-dist*.065);
          const brightness=.055+torch,rr=Math.min(255,Math.pow((source?.[ti]??65)/255*(brightness+red*.48)*fog,.78)*255),gg=Math.min(255,Math.pow((source?.[ti+1]??61)/255*(brightness*.84+red*.12)*fog,.78)*255),bb=Math.min(255,Math.pow((source?.[ti+2]??58)/255*(brightness*.68+red*.06)*fog,.78)*255);
          for(let yy=0;yy<2&&y+yy<height;yy++)for(let xx=0;xx<2&&x+xx<width;xx++){const i=((y+yy)*width+x+xx)*4;pixels[i]=rr;pixels[i+1]=gg;pixels[i+2]=bb;pixels[i+3]=255;}
        }
      }
      ctx.putImageData(frame,0,0);ctx.imageSmoothingEnabled=true;
      // Cast rays through the exact collision map. The depth buffer also clips props and the stalker.
      for(let x=0;x<width;x+=2){const cameraX=(x-width/2)/projection,dx=fx+rx*cameraX,dz=fy+rz*cameraX;let mx=Math.floor(p.x/TILE),mz=Math.floor(p.z/TILE),side=0,dist=60;
        const stepX=dx<0?-1:1,stepZ=dz<0?-1:1,deltaX=TILE/Math.max(.0001,Math.abs(dx)),deltaZ=TILE/Math.max(.0001,Math.abs(dz));let edgeX=((dx<0?p.x-mx*TILE:(mx+1)*TILE-p.x)/Math.max(.0001,Math.abs(dx))),edgeZ=((dz<0?p.z-mz*TILE:(mz+1)*TILE-p.z)/Math.max(.0001,Math.abs(dz)));
        for(let i=0;i<65;i++){if(edgeX<edgeZ){dist=edgeX;edgeX+=deltaX;mx+=stepX;side=0;}else{dist=edgeZ;edgeZ+=deltaZ;mz+=stepZ;side=1;}if(FLOORPLAN[mz]?.[mx]!=='.')break;}
        dist=Math.max(.08,dist);depths[x]=dist;if(x+1<width)depths[x+1]=dist;
        const top=horizon-(3-1.65)*projection/dist,bottom=horizon+1.65*projection/dist,woodTop=horizon+(.65)*projection/dist,h=(3*projection/dist),hit=side===0?p.z+dz*dist:p.x+dx*dist,texX=Math.floor(((hit/TILE)%1+1)%1*512);
        ctx.drawImage(wall,texX,0,2,512,x,top,2,h);ctx.drawImage(wood,texX,0,2,512,x,woodTop,2,bottom-woodTop);ctx.fillStyle='#806343';ctx.fillRect(x,woodTop-2,2,3);
        const beam=Math.exp(-cameraX*cameraX*3.3),torch=state.flashlight?beam*1.6/(1+.055*dist*dist):0,emergency=.28/(1+Math.abs(p.z+dz*dist-35)*.28),light=Math.min(.94,(.07+torch+emergency)*(side===0?.84:1)*Math.exp(-dist*.045));ctx.fillStyle=`rgba(0,0,0,${1-light})`;ctx.fillRect(x,top,2,h);ctx.fillStyle=`rgba(124,17,12,${emergency*.28})`;ctx.fillRect(x,top,2,h);
      }
      const sprites:Sprite[]=[...LOCKERS.map(l=>({x:l.x,z:l.z+.8,y:0,width:1.4,height:2.4,image:props.wardrobe,glow:false})),...RELICS.map(l=>({x:l.x,z:l.z+.75,y:0,width:1.25,height:1.05,image:props.dresser,glow:false})),{x:MUSIC_BOX.x,z:MUSIC_BOX.z,y:.85,width:.65,height:.55,image:props.box,glow:true},{x:30,z:33,y:0,width:1.4,height:1.45,image:props.horse,glow:false}];
      for(const [x,z]of [[5,35],[5,9],[30,7],[32,21],[5,21],[32,35]])sprites.push({x:x??5,z:z??35,y:0,width:.55,height:.9,image:props.doll,glow:false});
      RELICS.forEach((r,i)=>{if(!state.collected[i])sprites.push({x:r.x,z:r.z,y:.93+(reduced?0:Math.sin(time*2+i)*.02),width:.48,height:.55,image:props.key,glow:true});});
      if(state.enemy.awake&&clown.complete&&clown.naturalWidth){let x=state.enemy.x,z=state.enemy.z;if(state.status==='caught'){x=p.x+fx*.8;z=p.z+fy*.8;}sprites.push({x,z,y:reduced?0:Math.sin(time*6)*.02,width:1.8,height:2.7,image:clown,glow:false});}
      sprites.sort((a,b)=>(b.x-p.x)*fx+(b.z-p.z)*fy-((a.x-p.x)*fx+(a.z-p.z)*fy));
      for(const sprite of sprites){const dx=sprite.x-p.x,dz=sprite.z-p.z,d=dx*fx+dz*fy;if(d<.1)continue;const horizontal=dx*rx+dz*rz,cx=width/2+horizontal/d*projection,sw=sprite.width/d*projection,sh=sprite.height/d*projection,left=cx-sw/2,top=horizon-(sprite.y+sprite.height-1.65)*projection/d;if(left>width||left+sw<0)continue;
        const light=sprite.glow?1:Math.min(1,.18+(state.flashlight?1.1*Math.exp(-((horizontal/d)**2)*2.4)/(1+.035*d*d):0)+.15/(1+Math.abs(sprite.z-35)*.1));ctx.filter=`brightness(${light})`;
        for(let x=Math.max(0,Math.floor(left));x<Math.min(width,left+sw);x+=2){if((depths[x]??60)<d-.12)continue;const sx=(x-left)/sw*sprite.image.width,swidth=Math.max(.5,2/sw*sprite.image.width);ctx.drawImage(sprite.image,sx,0,Math.min(swidth,sprite.image.width-sx),sprite.image.height,x,top,2,sh);}
      }ctx.filter='none';
      if(state.doorOpen){const dz=EXIT.z-p.z,dx=EXIT.x-p.x,d=dx*fx+dz*fy;if(d>.15){const x=width/2+(dx*rx+dz*rz)/d*projection;ctx.fillStyle='#d6dcb232';ctx.fillRect(x-projection/d,Math.max(0,horizon-1.05*projection/d),2*projection/d,2.1*projection/d);}}
    },dispose(){disposed=true;clown.src='';frame=null;},
  };
}
