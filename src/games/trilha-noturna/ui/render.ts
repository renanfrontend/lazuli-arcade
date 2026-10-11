import { EXIT, FLOORPLAN, LOCKERS, MUSIC_BOX, RELICS, TILE, type MansionState } from '../domain/game';
import { createSoftwareRenderer } from './software';

interface Mesh { readonly buffer: WebGLBuffer; readonly count: number; readonly texture: WebGLTexture }
interface Surface { readonly data: number[]; readonly texture: WebGLTexture }
type Color = readonly [number,number,number];
const WOOD:Color=[.58,.46,.32],BRASS:Color=[.66,.49,.23],WHITE:Color=[.78,.77,.67];
const vertexSource=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;attribute vec3 aColor;attribute float aGlow;
uniform mat4 uMatrix;varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vColor;varying float vGlow;
void main(){vPosition=aPosition;vNormal=aNormal;vUV=aUV;vColor=aColor;vGlow=aGlow;gl_Position=uMatrix*vec4(aPosition,1.0);}`;
const fragmentSource=`precision mediump float;
uniform sampler2D uTexture;uniform vec3 uEye;uniform vec3 uDirection;uniform float uTorch;uniform float uTime;
uniform vec4 uLights[5];uniform vec3 uColors[5];varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vColor;varying float vGlow;
void main(){vec4 tex=texture2D(uTexture,vUV);if(tex.a<0.12)discard;
vec3 normal=normalize(vNormal),toEye=uEye-vPosition;float d=length(toEye);
vec3 light=vec3(0.035,0.041,0.054);float cone=smoothstep(0.66,0.97,dot(normalize(-toEye),uDirection));
float torch=uTorch*cone*(0.3+0.7*max(0.0,dot(normal,normalize(toEye))))*2.9/(1.0+d*d*0.075);
light+=vec3(1.0,0.85,0.65)*torch;
for(int i=0;i<5;i++){vec3 delta=uLights[i].xyz-vPosition;float len=length(delta);light+=uColors[i]*uLights[i].w*(0.2+0.8*max(0.0,dot(normal,normalize(delta))))/(1.0+len*len*0.42);}
vec3 color=tex.rgb*vColor*light+tex.rgb*vColor*vGlow;
if(normal.y>0.8){float sheen=pow(max(0.0,dot(reflect(normalize(-toEye),normal),normalize(toEye))),18.0);color+=vec3(0.11,0.09,0.06)*sheen*torch;}
float fog=exp(-d*0.074);color=mix(vec3(0.008,0.01,0.015),color,fog);
float grain=fract(sin(dot(gl_FragCoord.xy*0.01+uTime*0.01,vec2(12.9898,78.233)))*43758.5453);color+=(grain-0.5)*0.008;
gl_FragColor=vec4(pow(max(color,vec3(0.0)),vec3(0.72)),tex.a);}`;

function mul(a:Float32Array,b:Float32Array):Float32Array {
  const out=new Float32Array(16);for(let col=0;col<4;col++)for(let row=0;row<4;row++){let v=0;for(let k=0;k<4;k++)v+=(a[k*4+row]??0)*(b[col*4+k]??0);out[col*4+row]=v;}return out;
}
function camera(state:MansionState,width:number,height:number,time:number,reduced:boolean):{matrix:Float32Array;eye:number[];direction:number[]} {
  const p=state.player,yaw=p.yaw,pitch=p.pitch,cp=Math.cos(pitch),sp=Math.sin(pitch),sy=Math.sin(yaw),cy=Math.cos(yaw);
  const shake=reduced?0:state.fear/100*.009,bob=reduced?0:Math.sin(time*6)*.006;
  const eye=[p.x+Math.sin(time*17)*shake,1.65+bob,p.z+Math.cos(time*21)*shake];
  const r=[cy,0,sy],u=[-sy*sp,cp,cy*sp],f=[sy*cp,sp,-cy*cp];
  const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*(b[i]??0),0);
  const view=new Float32Array([r[0]??1,u[0]??0,-(f[0]??0),0,r[1]??0,u[1]??1,-(f[1]??0),0,r[2]??0,u[2]??0,-(f[2]??-1),0,-dot(r,eye),-dot(u,eye),dot(f,eye),1]);
  const near=.08,far=65,fov=1/Math.tan(74*Math.PI/360),aspect=width/Math.max(1,height);
  const projection=new Float32Array([fov/aspect,0,0,0,0,fov,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
  return {matrix:mul(projection,view),eye,direction:f};
}
function quad(surface:Surface,points:readonly number[][],normal:readonly number[],color:Color,repeat=1,glow=0):void {
  const uv=[[0,0],[repeat,0],[repeat,repeat],[0,repeat]];
  for(const i of [0,1,2,0,2,3]){const p=points[i],t=uv[i];if(p&&t)surface.data.push(p[0]??0,p[1]??0,p[2]??0,normal[0]??0,normal[1]??0,normal[2]??0,t[0]??0,t[1]??0,...color,glow);}
}
function box(surface:Surface,x:number,y:number,z:number,w:number,h:number,d:number,color:Color,glow=0):void {
  const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;
  quad(surface,[[l,b,n],[r,b,n],[r,t,n],[l,t,n]],[0,0,-1],color,Math.max(w,h)/2,glow);
  quad(surface,[[r,b,f],[l,b,f],[l,t,f],[r,t,f]],[0,0,1],color,Math.max(w,h)/2,glow);
  quad(surface,[[l,b,f],[l,b,n],[l,t,n],[l,t,f]],[-1,0,0],color,Math.max(d,h)/2,glow);
  quad(surface,[[r,b,n],[r,b,f],[r,t,f],[r,t,n]],[1,0,0],color,Math.max(d,h)/2,glow);
  quad(surface,[[l,t,n],[r,t,n],[r,t,f],[l,t,f]],[0,1,0],color,Math.max(w,d)/2,glow);
  quad(surface,[[l,b,f],[r,b,f],[r,b,n],[l,b,n]],[0,-1,0],color,Math.max(w,d)/2,glow);
}
function ball(surface:Surface,x:number,y:number,z:number,r:number,color:Color,glow=0):void {
  for(let ring=0;ring<8;ring++)for(let segment=0;segment<12;segment++){
    const p:number[][]=[];for(const [rr,ss] of [[ring,segment],[ring,segment+1],[ring+1,segment+1],[ring+1,segment]]){const a=(rr??0)/8*Math.PI,b=(ss??0)/12*Math.PI*2;p.push([x+Math.sin(a)*Math.cos(b)*r,y+Math.cos(a)*r,z+Math.sin(a)*Math.sin(b)*r]);}
    const a=(ring+.5)/8*Math.PI,b=(segment+.5)/12*Math.PI*2;quad(surface,p,[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)],color,1,glow);
  }
}
function textureCanvas(kind:'wall'|'wood'|'ceiling'|'cloth'|'plain'):HTMLCanvasElement {
  const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');if(!ctx)return c;
  if(kind==='plain'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,512);return c;}
  let seed=821;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle=kind==='wall'?'#94a397':kind==='wood'?'#aa8b65':kind==='cloth'?'#973645':'#928c78';ctx.fillRect(0,0,512,512);
  for(let i=0;i<6000;i++){ctx.fillStyle=`rgba(${random()>.6?'230,216,190':'10,16,12'},${random()*.2})`;ctx.fillRect(random()*512,random()*512,1+random()*9,1+random()*3);}
  if(kind==='wood'){
    for(let y=0;y<512;y+=64){ctx.fillStyle='#201810';ctx.fillRect(0,y,512,3);for(let j=0;j<30;j++){const yy=y+random()*61;ctx.strokeStyle=`rgba(35,20,12,${random()*.36})`;ctx.beginPath();ctx.moveTo(0,yy);ctx.bezierCurveTo(150,yy+random()*6,350,yy-random()*5,512,yy);ctx.stroke();}for(let x=(y%128===0?0:128);x<512;x+=256){ctx.fillRect(x,y,2,64);ctx.fillRect(x+6,y+7,3,3);}}
  }else if(kind==='wall'){
    ctx.strokeStyle='#263c3445';ctx.lineWidth=2;for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=64){ctx.beginPath();ctx.moveTo(x+32,y);ctx.bezierCurveTo(x-6,y+24,x+8,y+48,x+32,y+64);ctx.bezierCurveTo(x+56,y+48,x+70,y+24,x+32,y);ctx.stroke();}
    for(let i=0;i<45;i++){const x=random()*512,y=random()*512;ctx.fillStyle=`rgba(24,28,20,${random()*.3})`;ctx.beginPath();ctx.ellipse(x,y,5+random()*40,8+random()*75,random(),0,Math.PI*2);ctx.fill();}
    for(let i=0;i<12;i++){const x=random()*512,y=random()*512;ctx.fillStyle='#b7afa68c';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*40,y+20);ctx.lineTo(x+15,y+70);ctx.lineTo(x-15,y+20);ctx.fill();ctx.strokeStyle='#23292366';ctx.stroke();}
  }else if(kind==='cloth'){for(let x=0;x<512;x+=16){const grad=ctx.createLinearGradient(x,0,x+16,0);grad.addColorStop(0,'#0008');grad.addColorStop(1,'#ffcbac15');ctx.fillStyle=grad;ctx.fillRect(x,0,16,512);}}
  return c;
}
export interface MansionRenderer { readonly draw:(state:MansionState,time:number,reduced:boolean)=>void; readonly dispose:()=>void }
export function createMansionRenderer(canvas:HTMLCanvasElement,clownUrl:string,software=false):MansionRenderer {
  if(software)return createSoftwareRenderer(canvas,clownUrl,textureCanvas);
  const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});if(!gl)return createSoftwareRenderer(canvas,clownUrl,textureCanvas);
  const resources:{buffers:WebGLBuffer[];textures:WebGLTexture[]}={buffers:[],textures:[]};let disposed=false;
  const shader=(type:number,source:string)=>{const s=gl.createShader(type);if(!s)throw new Error('Não foi possível preparar os gráficos.');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(error??'Falha ao preparar os gráficos.');}return s;};
  const vs=shader(gl.VERTEX_SHADER,vertexSource),fs=shader(gl.FRAGMENT_SHADER,fragmentSource),program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Falha ao abrir o cenário 3D.');gl.useProgram(program);
  const makeTexture=(source:TexImageSource)=>{const texture=gl.createTexture();resources.textures.push(texture);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);return texture;};
  const materials={wall:{data:[],texture:makeTexture(textureCanvas('wall'))},wood:{data:[],texture:makeTexture(textureCanvas('wood'))},ceiling:{data:[],texture:makeTexture(textureCanvas('ceiling'))},cloth:{data:[],texture:makeTexture(textureCanvas('cloth'))},plain:{data:[],texture:makeTexture(textureCanvas('plain'))}} satisfies Record<string,Surface>;
  const wall:Surface=materials.wall,wood:Surface=materials.wood,plain:Surface=materials.plain,cloth:Surface=materials.cloth;
  quad(wood,[[0,0,0],[0,0,42],[38,0,42],[38,0,0]],[0,1,0],[.58,.58,.55],19);
  quad(materials.ceiling,[[0,3,0],[38,3,0],[38,3,42],[0,3,42]],[0,-1,0],[.43,.45,.45],18);
  FLOORPLAN.forEach((row,z)=>{for(let x=0;x<row.length;x++)if(row[x]==='#'){
    box(wall,(x+.5)*TILE,1.5,(z+.5)*TILE,TILE,3,TILE,[.65,.67,.61]);
    box(wood,(x+.5)*TILE,.47,(z+.5)*TILE,TILE+.015,.94,TILE+.015,WOOD);
    box(wood,(x+.5)*TILE,1,(z+.5)*TILE,TILE+.035,.075,TILE+.035,WOOD);
    box(wood,(x+.5)*TILE,2.86,(z+.5)*TILE,TILE+.035,.15,TILE+.035,WOOD);
  }});
  // Worn carpet anchors the long corridor. Door frames make room entrances legible.
  box(cloth,19,.006,21,2.8,.008,35,[.55,.39,.27]);
  for(const z of [7,19,33])for(const x of [15,23]){box(wood,x,.95,z-.85,.13,1.9,.13,WOOD);box(wood,x,.95,z+.85,.13,1.9,.13,WOOD);box(wood,x,2.6,z,2.06,.3,2.08,WOOD);}
  for(const l of LOCKERS){box(wood,l.x,1.18,l.z+.8,1.3,2.36,.65,[.38,.36,.29]);box(wood,l.x,1.18,l.z+.46,1.19,2.15,.04,[.5,.42,.29]);box(plain,l.x-.04,1.1,l.z+.425,.05,.11,.04,BRASS);box(wood,l.x,2.38,l.z+.8,1.5,.1,.8,WOOD);}
  for(const relic of RELICS){box(wood,relic.x,.53,relic.z+.75,1.25,1.05,.8,WOOD);for(let i=0;i<3;i++){box(wood,relic.x,.23+i*.3,relic.z+.335,1.12,.25,.04,[.44,.32,.21]);box(plain,relic.x,.23+i*.3,relic.z+.3,.17,.03,.05,BRASS);}}
  box(wood,MUSIC_BOX.x,.45,MUSIC_BOX.z+.25,1.1,.9,.65,WOOD);box(plain,MUSIC_BOX.x,.99,MUSIC_BOX.z,.53,.2,.4,BRASS);
  // Cold windows, curtains, iron chandeliers and crooked frame-like wall ornaments.
  for(const z of [7,19,33])for(const x of [2.035,35.965]){
    const side=x<10?1:-1;box(plain,x,1.85,z,.025,1.65,1.65,[.17,.27,.4],.5);box(wood,x+side*.04,1.85,z,.08,1.7,.055,WOOD);box(wood,x+side*.05,1.85,z,.08,.065,1.7,WOOD);
    for(const offset of [-1,1])box(cloth,x+side*.1,1.85,z+offset, .13,2.1,.48,[.55,.35,.31]);
  }
  for(const z of [9,22,35]){box(plain,19,2.65,z,.035,.65,.035,[.12,.11,.08]);box(plain,19,2.34,z,1.7,.055,.06,[.16,.14,.1]);for(const x of [18.3,19,19.7]){box(plain,x,2.43,z,.06,.3,.06,[.6,.49,.28],.25);ball(plain,x,2.6,z,.045,[1,.42,.17],.75);}}
  for(const z of [5,11,17,25,31,37])for(const x of [16.03,21.97]){box(wood,x,1.8,z,.07,1,.75,BRASS);box(plain,x+(x<19?.05:-.05),1.8,z,.035,.82,.57,[.08,.08,.07]);ball(plain,x+(x<19?.09:-.09),1.87,z,.15,[.37,.31,.24]);}
  // Abandoned beds and a rocking horse in the two spare rooms.
  for(const [x,z] of [[29,5],[8,20]]){box(wood,x??29,.42,z??5,1.8,.84,2.4,WOOD);box(cloth,x??29,.91,z??5,1.7,.22,2.2,[.43,.46,.41]);box(wood,x??29,1.2,(z??5)-1.2,1.9,1.3,.12,WOOD);}
  box(wood,30,.65,33,1.1,.4,.4,WOOD);box(wood,30.5,1,33,.25,.75,.3,WOOD);box(wood,30.6,1.35,33,.6,.28,.3,WOOD);for(const x of [29.6,30.4])for(const z of [32.85,33.15])box(wood,x,.28,z,.08,.65,.08,WOOD);
  const bind=(surface:Surface):Mesh=>{const buffer=gl.createBuffer();resources.buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(surface.data),gl.STATIC_DRAW);return {buffer,count:surface.data.length/12,texture:surface.texture};};
  const world=Object.values(materials).filter(s=>s.data.length>0).map(bind);
  const dynamicBuffer=gl.createBuffer();resources.buffers.push(dynamicBuffer);
  const clownTexture=makeTexture(textureCanvas('plain'));gl.bindTexture(gl.TEXTURE_2D,clownTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const image=new Image();image.onload=()=>{if(disposed)return;gl.bindTexture(gl.TEXTURE_2D,clownTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);};image.src=clownUrl;
  const attrs=[['aPosition',3,0],['aNormal',3,3],['aUV',2,6],['aColor',3,8],['aGlow',1,11]] as const;
  const drawMesh=(mesh:Mesh)=>{gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);for(const [name,size,offset]of attrs){const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,48,offset*4);}gl.bindTexture(gl.TEXTURE_2D,mesh.texture);gl.drawArrays(gl.TRIANGLES,0,mesh.count);};
  const drawDynamic=(surface:Surface)=>{gl.bindBuffer(gl.ARRAY_BUFFER,dynamicBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(surface.data),gl.DYNAMIC_DRAW);drawMesh({buffer:dynamicBuffer,count:surface.data.length/12,texture:surface.texture});};
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1i(gl.getUniformLocation(program,'uTexture'),0);
  return {
    draw(state,time,reduced){
      if(disposed||gl.isContextLost())return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.25),width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.clearColor(.008,.01,.015,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      const view=camera(state,width,height,time,reduced);gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMatrix'),false,view.matrix);gl.uniform3fv(gl.getUniformLocation(program,'uEye'),view.eye);gl.uniform3fv(gl.getUniformLocation(program,'uDirection'),view.direction);gl.uniform1f(gl.getUniformLocation(program,'uTorch'),state.flashlight?1:0);gl.uniform1f(gl.getUniformLocation(program,'uTime'),reduced?0:time);
      const flicker=!reduced&&state.enemy.awake&&Math.sin(time*.32)>.985?.12:1;
      gl.uniform4fv(gl.getUniformLocation(program,'uLights[0]'),[19,2.5,9,1.5,19,2.5,22,1.2*flicker,19,2.5,35,1.5*flicker,6,2.3,7,.6,31,2.3,19,.65]);gl.uniform3fv(gl.getUniformLocation(program,'uColors[0]'),[1,.17,.1,1,.23,.13,state.doorOpen?.3:1,state.doorOpen?1:.18,.2,.25,.34,.55,.65,.13,.11]);
      world.forEach(drawMesh);
      const props:Surface={data:[],texture:plain.texture};
      if(!state.doorOpen){box(props,EXIT.x,1.35,40.015,2.4,2.7,.04,[.2,.12,.08]);box(props,EXIT.x+.7,1.2,39.975,.035,.13,.035,BRASS);}
      else box(props,EXIT.x,1.25,40.015,2.4,2.5,.04,[.32,.44,.35],1);
      RELICS.forEach((p,i)=>{if(state.collected[i])return;const y=1.22+(reduced?0:Math.sin(time*2+i)*.025);box(props,p.x,y,p.z,.16,.16,.17,[1,.77,.28],.3);ball(props,p.x,y+.13,p.z,.09,[1,.83,.5],.22);box(props,p.x+.16,y,p.z,.22,.025,.025,BRASS,.25);});
      for(const [x,z]of [[5,35],[5,9],[30,7],[32,21],[5,21],[32,35]]){
        const xx=x??5,zz=z??35;box(props,xx,.22,zz,.34,.44,.25,[.44,.35,.31]);ball(props,xx,.56,zz,.18,WHITE);const toward=Math.atan2(state.player.x-xx,state.player.z-zz),s=Math.sin(toward),c=Math.cos(toward);for(const eye of [-1,1]){ball(props,xx+s*.14+c*eye*.06,.6,zz+c*.14-s*eye*.06,.025,[.025,.021,.016]);}box(props,xx,.11,zz+.18,.27,.12,.35,[.17,.1,.08]);
      }
      drawDynamic(props);
      if(state.enemy.awake){
        const sprites:Surface={data:[],texture:clownTexture};let x=state.enemy.x,z=state.enemy.z;const yaw=state.player.yaw;
        if(state.status==='caught'){x=state.player.x+Math.sin(yaw)*.72;z=state.player.z-Math.cos(yaw)*.72;}
        const right=[Math.cos(yaw)*.9,Math.sin(yaw)*.9],y=reduced?0:Math.sin(time*(state.enemy.mode==='chase'?9:4))*.025;
        quad(sprites,[[x-(right[0]??0),y,z-(right[1]??0)],[x+(right[0]??0),y,z+(right[1]??0)],[x+(right[0]??0),y+2.7,z+(right[1]??0)],[x-(right[0]??0),y+2.7,z-(right[1]??0)]],[-Math.sin(yaw),0,Math.cos(yaw)],[.88,.83,.78],1,.045);drawDynamic(sprites);
      }
    },
    dispose(){disposed=true;image.onload=null;resources.buffers.forEach(b=>{gl.deleteBuffer(b);});resources.textures.forEach(t=>{gl.deleteTexture(t);});gl.deleteProgram(program);},
  };
}
