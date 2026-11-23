(function(){
'use strict';
const ZONES=window.PARK_ZONES, STS=window.PARK_STATIONS, BLD=window.ParkBuilders;
const PI=Math.PI, $=s=>document.querySelector(s);
const isTouch=matchMedia('(pointer: coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
const LOW=isTouch;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;

/* ---------------- renderer, scene, camera ---------------- */
const host=$('#game');
let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:!LOW,powerPreference:'high-performance'}); }
catch(e){ $('#loadtxt').textContent='This browser could not start 3D graphics. Please open the link in Chrome or Edge with hardware acceleration on.'; $('#loadbar').hidden=true; throw e; }
let PR=Math.min(devicePixelRatio,LOW?1.35:1.75);
renderer.setPixelRatio(PR);
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=.86;
renderer.shadowMap.enabled=!LOW; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(LOW?74:70,1,.1,1100); camera.rotation.order='YXZ';
scene.fog=new THREE.Fog('#dfe7ec',140,460);
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();

// sky dome
const skyU={lin:{value:0},top:{value:new THREE.Color('#6d9fcf')},hor:{value:new THREE.Color('#e7e1d6')},gnd:{value:new THREE.Color('#b9c4a8')},sunDir:{value:new THREE.Vector3(.5,.45,-.4).normalize()},night:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader:`uniform vec3 top,hor,gnd,sunDir; uniform float night; uniform float lin; varying vec3 vW;
  float h21(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec3 d=normalize(vW-cameraPosition); float h=d.y;
    vec3 c=mix(hor,top,smoothstep(0.,.5,h)); c=mix(gnd,c,smoothstep(-.06,.02,h));
    float s=max(dot(d,sunDir),0.); c+=(1.-night)*(vec3(1.,.86,.62)*pow(s,400.)*3.+vec3(1.,.72,.45)*pow(s,10.)*.18);
    c+=night*vec3(.85,.9,1.)*pow(s,900.)*2.;
    if(night>0.01){ vec2 g=floor(d.xz/(abs(d.y)+.25)*260.); float st=step(.9965,h21(g)); c+=night*st*smoothstep(.08,.3,h)*vec3(.9); }
    if(lin>.5) c=pow(c,vec3(2.2)); gl_FragColor=vec4(c,1.); }`}));
scene.add(sky);

// lights
const hemi=new THREE.HemisphereLight('#f3f6ff','#7d8a62',.5); scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe9cc',1.7); sun.castShadow=!LOW;
if(!LOW){ sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:1,far:260}); sun.shadow.bias=-.0006; sun.shadow.normalBias=.02; }
scene.add(sun); scene.add(sun.target);

/* ---------------- image pipeline: sky reflections and bloom ---------------- */
const pmrem=new THREE.PMREMGenerator(renderer); let envNf=-1;
const envCv=document.createElement('canvas'); envCv.width=256; envCv.height=128; const envTex=new THREE.CanvasTexture(envCv); envTex.mapping=THREE.EquirectangularReflectionMapping; envTex.encoding=THREE.sRGBEncoding;
let envTuned=false;
function buildEnv(){ const x=envCv.getContext('2d'), f=state.nf, hex=c=>'#'+c.getHexString();
  const g=x.createLinearGradient(0,0,0,128); g.addColorStop(0,hex(skyU.top.value)); g.addColorStop(.47,hex(skyU.hor.value)); g.addColorStop(.53,hex(skyU.gnd.value)); g.addColorStop(1,f>.5?'#0b0f14':'#5f6f4a'); x.fillStyle=g; x.fillRect(0,0,256,128);
  if(f<.5){ const sg=x.createRadialGradient(170,30,0,170,30,40); sg.addColorStop(0,'rgba(255,240,210,.95)'); sg.addColorStop(1,'rgba(255,240,210,0)'); x.fillStyle=sg; x.fillRect(0,0,256,128); }
  else { x.fillStyle='rgba(255,90,140,.35)'; for(let i=0;i<14;i++) x.fillRect(i*19,62,6,4); }
  envTex.needsUpdate=true; const rt=pmrem.fromEquirectangular(envTex); if(scene.environment) scene.environment.dispose(); scene.environment=rt.texture;
  if(!envTuned){ envTuned=true; scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]; ms.forEach(m=>{ if(m&&m.isMeshStandardMaterial) m.envMapIntensity=m.metalness>.4?1.0:(m.roughness<.4?.35:.12); }); }); } }
let composer=null, bloom=null;
try{ if(!LOW&&THREE.EffectComposer&&THREE.UnrealBloomPass&&renderer.capabilities.isWebGL2){
  const rt=new THREE.WebGLMultisampleRenderTarget(innerWidth*PR,innerHeight*PR,{format:THREE.RGBAFormat}); rt.samples=4;
  composer=new THREE.EffectComposer(renderer,rt); composer.setPixelRatio(PR); composer.setSize(innerWidth,innerHeight);
  composer.addPass(new THREE.RenderPass(scene,camera)); bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.2,.5,.9); composer.addPass(bloom);
  composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader)); skyU.lin.value=1; } }catch(e){ console.warn('bloom off',e); composer=null; }
addEventListener('resize',()=>{ if(composer){ composer.setPixelRatio(PR); composer.setSize(innerWidth,innerHeight); } });

/* ---------------- materials ---------------- */
const mk=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o));
const M={
  paving:mk('#c4b6a1',{roughness:.95}), paving2:mk('#b9ab96'), path:mk('#a99272',{roughness:1}), stone:mk('#c9bda9'), sandstone:mk('#d4a373',{roughness:.9}),
  steel:mk('#bdbab4',{metalness:.65,roughness:.35}), darksteel:mk('#4a4e55',{metalness:.45,roughness:.45}), white:mk('#f2eee7',{roughness:.7}), white2:mk('#f2eee7',{roughness:.6}),
  roof:mk('#efe9df'), wood:mk('#9b6b45',{roughness:.8}), glass:mk('#bfe0ea',{transparent:true,opacity:.26,roughness:.1,metalness:.1,depthWrite:false}),
  glassDark:mk('#2a3a48',{roughness:.2}), net:mk('#ffffff',{transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide}),
  screen:mk('#14283a',{emissive:'#3d78a8',emissiveIntensity:.5,roughness:.3}), screen2:mk('#0f2a26',{emissive:'#2fb59a',emissiveIntensity:.5,roughness:.3}),
  eink:mk('#e9e7df'), soil:mk('#6b4a33'), plant:mk('#4f8a3a'), plantY:mk('#b8a23a'), leaf:mk('#5d8c3e'), leafdark:mk('#3f6e33'), bark:mk('#6e5440'),
  water:mk('#5f93a8',{roughness:.12,metalness:.25}), turf:mk('#6fa04c'), court:mk('#3f6f8f'), court2:mk('#b8835a'), track:mk('#b5543c'), concrete:mk('#cfcac2'),
  mat:mk('#2f6fa5'), mat0:mk('#d33163'), mat1:mk('#2f7d4f'), mat2:mk('#c98a12'), solarpanel:mk('#24344f',{metalness:.5,roughness:.3,side:THREE.DoubleSide}),
  darkfloor:mk('#3a3d42'), wetfloor:mk('#7c8c95',{roughness:.12,metalness:.2}), sand:mk('#d7c08a'), hold1:mk('#d33163'), hold2:mk('#f2b134'), hold3:mk('#2f6fa5'),
  bio:mk('#2d5f5a',{emissive:'#55f0d8',emissiveIntensity:0}), ledon:mk('#ffffff',{emissive:'#7ee0c3',emissiveIntensity:1.4}), ledoff:mk('#2b3340'),
  lamp:mk('#fff6e0',{emissive:'#ffd89a',emissiveIntensity:0}), lampstrip:mk('#ffffff',{emissive:'#ffffff',emissiveIntensity:.9}),
  city:mk('#d6c6ab',{roughness:1}), city2:mk('#c7b296',{roughness:1}), cityDome:mk('#e6dccb',{roughness:.9}), red:mk('#c0392b'), blue:mk('#2f6fa5'), green:mk('#2f7d4f'), grey:mk('#7a7f86'), asphalt:mk('#5a5c60'), hedge:mk('#4d7a3a'),
  radarscreen:mk('#06221a',{emissive:'#0c4a33',emissiveIntensity:.8}), radarline:mk('#7cf2a6',{emissive:'#7cf2a6',emissiveIntensity:.8}),
  blip:new THREE.MeshBasicMaterial({color:'#ffe07a'}), petal:mk('#f3eee8',{roughness:.45,metalness:.25,side:THREE.DoubleSide,emissive:'#000000'}),
};
for(const k in ZONES) M['z_'+k]=mk(ZONES[k].color,{roughness:.55});
(function carrom(){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#e9cf9e'; x.fillRect(0,0,256,256); x.strokeStyle='#5a2e1a'; x.lineWidth=18; x.strokeRect(0,0,256,256); x.lineWidth=2; x.beginPath(); x.arc(128,128,40,0,7); x.stroke(); x.fillStyle='#1c1412'; for(const [a,b] of [[22,22],[234,22],[22,234],[234,234]]){ x.beginPath(); x.arc(a,b,12,0,7); x.fill(); } for(let i=0;i<9;i++){ x.fillStyle=i%2?'#2a2321':'#f4efe4'; x.beginPath(); x.arc(118+(i%3)*10,118+Math.floor(i/3)*10,5,0,7); x.fill(); } const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; M.carromtop=mk('#ffffff',{map:t}); })();
const grassTex=(function(){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#7f9c5a'; x.fillRect(0,0,256,256); for(let i=0;i<5000;i++){ const g=110+Math.random()*60; x.fillStyle=`rgba(${70+Math.random()*40},${g},${50+Math.random()*30},.35)`; x.fillRect(Math.random()*256,Math.random()*256,2,2+Math.random()*3); } const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(90,90); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; return t; })();
const sprite=(function(){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();

// textures for boards and walls
const loadMgr=new THREE.LoadingManager(); const loader=new THREE.TextureLoader(loadMgr); const texCache={};
function tex(name){ if(!texCache[name]){ const t=loader.load('img/'+name+'.jpg'); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; texCache[name]=t; } return texCache[name]; }
loadMgr.onProgress=(u,l,t)=>{ $('#loadbar i').style.width=Math.round(l/t*100)+'%'; $('#loadtxt').textContent=l<t?`Loading the park’s pictures · ${l} of ${t}`:'The park is ready.'; };
loadMgr.onLoad=()=>{ $('#loadbar i').style.width='100%'; $('#loadtxt').textContent='The park is ready.'; };

/* ---------------- static batching ---------------- */
const BATCH={};
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _e=new THREE.Euler(), _p=new THREE.Vector3(), _s=new THREE.Vector3(1,1,1);
function addGeo(geo,mat,x,y,z,ry=0,rx=0,rz=0){
  _e.set(rx,ry,rz,'YXZ'); _q.setFromEuler(_e); _p.set(x,y,z); _m.compose(_p,_q,_s);
  let g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(_m);
  for(const a of Object.keys(g.attributes)) if(!['position','normal','uv'].includes(a)) g.deleteAttribute(a);
  if(!g.attributes.uv){ g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2)); }
  (BATCH[mat]||(BATCH[mat]=[])).push(g); geo.dispose();
}
const colC=[], colB=[], dynCol=[], plats=[], groundFns=[];
function toWorld(st,lx,lz){ const c=Math.cos(st.rot),s=Math.sin(st.rot); return [st.x+lx*c+lz*s, st.z-lx*s+lz*c]; }
function toLocal(st,x,z){ const c=Math.cos(st.rot),s=Math.sin(st.rot); const dx=x-st.x, dz=z-st.z; return [dx*c-dz*s, dx*s+dz*c]; }
function kitFor(st){
  return {
    put(geo,mat,lx,ly,lz,ry=0,rx=0,rz=0){ const [x,z]=toWorld(st,lx,lz); addGeo(geo,mat,x,ly,z,st.rot+ry,rx,rz); },
    obj(o,lx,ly,lz,ry=0){ const [x,z]=toWorld(st,lx,lz); o.position.set(x,ly,z); o.rotation.y+=st.rot+ry; if(o.isMesh){o.castShadow=!LOW&&!o.material.transparent; o.receiveShadow=true;} scene.add(o); return o; },
    box(lx,lz,hw,hd,ry=0){ const [x,z]=toWorld(st,lx,lz); const r=st.rot+ry; colB.push({x,z,hw,hd,c:Math.cos(r),s:Math.sin(r)}); },
    circ(lx,lz,r){ const [x,z]=toWorld(st,lx,lz); colC.push({x,z,r}); },
    plat(lx,lz,r,h,hw,hd){ const [x,z]=toWorld(st,lx,lz); plats.push(hw?{x,z,hw,hd,h,c:Math.cos(st.rot),s:Math.sin(st.rot)}:{x,z,r,h}); },
  };
}
const worldKit=(x,z,rot)=>kitFor({x,z,rot});
const trees=[]; const anim=[];
const state={nf:0,night:0,player:null,aqiColor:'#F2D33A',near(st,r){ const p=this.player; return Math.abs(p.x-st.x)<r&&Math.abs(p.z-st.z)<r; }};
const CTX={M,scene,anim,tex,trees,state,sprite,low:LOW,reduce,toWorld,toLocal,worldKit,dynCol,ground:groundFns,sprint:null};

/* ---------------- ground, boundary, paths ---------------- */
const X0=-162,X1=162,Z0=-142,Z1=164;
const grassGeo=new THREE.PlaneGeometry(900,900,220,220); (function(){ const pos=grassGeo.attributes.position, col=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i), z=-pos.getY(i); let v=.9+.07*Math.sin(x*.045+Math.sin(z*.03)*2)+.05*Math.sin(z*.07+x*.02)+.04*Math.sin(x*.21)*Math.sin(z*.17);
    if(x>X0&&x<X1&&z>Z0&&z<Z1) v+=(Math.floor((x+400)/7)%2?.045:-.02); else v-=.05; col[i*3]=v*.98; col[i*3+1]=v; col[i*3+2]=v*.95; }
  grassGeo.setAttribute('color',new THREE.BufferAttribute(col,3)); })();
const grass=new THREE.Mesh(grassGeo,mk('#ffffff',{map:grassTex,roughness:1,vertexColors:true})); grass.rotation.x=-PI/2; grass.receiveShadow=true; scene.add(grass);
const W0=worldKit(0,0,0);
// hedge boundary with a gate gap
W0.put(new THREE.BoxGeometry(X1-X0,1.6,1.2),'hedge',0,.8,Z0); colB.push({x:0,z:Z0,hw:(X1-X0)/2,hd:.6,c:1,s:0});
W0.put(new THREE.BoxGeometry(1.2,1.6,Z1-Z0),'hedge',X0,.8,(Z0+Z1)/2); colB.push({x:X0,z:(Z0+Z1)/2,hw:.6,hd:(Z1-Z0)/2,c:1,s:0});
W0.put(new THREE.BoxGeometry(1.2,1.6,Z1-Z0),'hedge',X1,.8,(Z0+Z1)/2); colB.push({x:X1,z:(Z0+Z1)/2,hw:.6,hd:(Z1-Z0)/2,c:1,s:0});
for(const s of [-1,1]){ const len=X1-10; W0.put(new THREE.BoxGeometry(len,1.6,1.2),'hedge',s*(10+len/2),.8,Z1); colB.push({x:s*(10+len/2),z:Z1,hw:len/2,hd:.6,c:1,s:0}); }
// gate piers
if(!window.ParkArt){ for(const s of [-1,1]){ W0.put(new THREE.BoxGeometry(2,6,2),'sandstone',s*10,3,Z1); W0.put(new THREE.BoxGeometry(2.4,.6,2.4),'z_gate',s*10,6.2,Z1); colC.push({x:s*10,z:Z1,r:1.3}); } }
// fitness loop around the inside of the hedge
const TR=[[X0+7,Z0+7],[X1-7,Z0+7],[X1-7,Z1-10],[X0+7,Z1-10]];
for(let i=0;i<4;i++){ const a=TR[i], b=TR[(i+1)%4]; const len=Math.hypot(b[0]-a[0],b[1]-a[1]); W0.put(new THREE.BoxGeometry(3.4,.05,len+3.4),'track',(a[0]+b[0])/2,.025,(a[1]+b[1])/2,Math.atan2(b[0]-a[0],b[1]-a[1])); }
// path graph (also used by visitors)
const N={out:[0,182],gate:[0,160],p1:[0,122],c:[0,74],cn:[0,4],n:[0,-40],a:[0,-84],l:[-40,40],l2:[-74,40],lc:[-100,40],u:[40,40],u2:[66,40],u3:[130,40],
  cl:[-28,-50],gd:[28,-50],ds:[-40,-92],nt:[40,-82],e:[-72,-70],e2:[-112,-92],e3:[-124,-38],s:[70,-60],s2:[112,-88],s3:[128,-36],
  ev:[60,118],ev2:[104,118],ng:[-40,118],d:[-84,122],lab:[-60,4],pa:[-100,72],wk:[-124,62]};
const E=[['out','gate'],['gate','p1'],['p1','c'],['c','cn'],['cn','n'],['n','a'],['c','l'],['l','l2'],['l2','lc'],['lc','pa'],['lc','wk'],['l2','lab'],['c','u'],['u','u2'],['u2','u3'],
  ['n','cl'],['n','gd'],['cl','ds'],['gd','nt'],['a','ds'],['a','nt'],['n','e'],['e','e2'],['e','e3'],['n','s'],['s','s2'],['s','s3'],['p1','ev'],['ev','ev2'],['p1','ng'],['ng','d'],['cn','l'],['cn','u']];
const ADJ={}; for(const [a,b] of E){ (ADJ[a]=ADJ[a]||[]).push(b); (ADJ[b]=ADJ[b]||[]).push(a); }
for(const [a,b] of E){ const A=N[a],B=N[b]; const len=Math.hypot(B[0]-A[0],B[1]-A[1]); W0.put(new THREE.BoxGeometry(4,.06,len),'path',(A[0]+B[0])/2,.03,(A[1]+B[1])/2,Math.atan2(B[0]-A[0],B[1]-A[1])); }
for(const k in N){ W0.put(new THREE.CylinderGeometry(3.4,3.4,.06,24),'path',N[k][0],.031,N[k][1]); }
// a slow water channel across the great lawn
const CH=[[-158,-24],[-110,-20],[-60,-26],[-20,-22],[20,-26],[70,-20],[120,-24],[158,-20]];
for(let i=0;i<CH.length-1;i++){ const A=CH[i],B=CH[i+1]; const len=Math.hypot(B[0]-A[0],B[1]-A[1]); W0.put(new THREE.BoxGeometry(3,.05,len+1),'water',(A[0]+B[0])/2,.045,(A[1]+B[1])/2,Math.atan2(B[0]-A[0],B[1]-A[1])); }
// lamps and benches along paths
const lampPos=[], benchPos=[];
for(const [a,b] of E){ const A=N[a],B=N[b]; const len=Math.hypot(B[0]-A[0],B[1]-A[1]); const ux=(B[0]-A[0])/len, uz=(B[1]-A[1])/len;
  for(let d=10;d<len-6;d+=18){ lampPos.push([A[0]+ux*d-uz*2.8, A[1]+uz*d+ux*2.8]); }
  for(let d=19;d<len-8;d+=36){ benchPos.push([A[0]+ux*d+uz*3.2, A[1]+uz*d-ux*3.2, Math.atan2(ux,uz)]); } }
for(const [x,z] of lampPos){ W0.put(new THREE.CylinderGeometry(.06,.09,4.2,8),'darksteel',x,2.1,z); W0.put(new THREE.BoxGeometry(.5,.18,.5),'lamp',x,4.25,z); colC.push({x,z,r:.2}); }
for(const [x,z,r] of benchPos){ W0.put(new THREE.BoxGeometry(2.2,.12,.6),'wood',x,.48,z,r); W0.put(new THREE.BoxGeometry(2.2,.5,.1),'wood',x,.75,z+0,r); W0.put(new THREE.BoxGeometry(.1,.45,.5),'darksteel',x,.22,z,r); }
// zone pylons at each hub
for(const k in ZONES){ const [x,z]=ZONES[k].hub; W0.put(new THREE.BoxGeometry(.7,7,.7),'z_'+k,x+5,3.5,z+5); W0.put(new THREE.BoxGeometry(1,1,1),'white',x+5,7.5,z+5); colC.push({x:x+5,z:z+5,r:.6}); }

/* ---------------- Lucknow on the horizon, and clouds ---------------- */
(function skyline(){ let sd=11; const r=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  for(let i=0;i<170;i++){ const a=i/170*PI*2+r()*.02, R=300+r()*130, x=Math.cos(a)*R, z=Math.sin(a)*R+10; const w=10+r()*24, h=5+r()*(r()<.12?50:22), d=10+r()*18;
    W0.put(new THREE.BoxGeometry(w,h,d),r()<.5?'city':'city2',x,h/2,z,-a); }
  const dome=(x,z,R,y)=>{ W0.put(new THREE.SphereGeometry(R,20,10,0,PI*2,0,PI/2),'cityDome',x,y,z); W0.put(new THREE.CylinderGeometry(R*.9,R*.9,R*.5,20),'city',x,y-R*.25,z); W0.put(new THREE.ConeGeometry(R*.12,R*.6,8),'cityDome',x,y+R+R*.2,z); };
  const minar=(x,z,h)=>{ W0.put(new THREE.CylinderGeometry(1.1,1.5,h,10),'city',x,h/2,z); W0.put(new THREE.CylinderGeometry(2.2,2.2,.8,10),'city2',x,h*.7,z); dome(x,z,1.8,h); };
  // an imambara-like hall to the north
  W0.put(new THREE.BoxGeometry(70,20,22),'city',-30,10,-330); W0.put(new THREE.BoxGeometry(76,3,24),'city2',-30,21,-330);
  for(const dx of [-22,0,22]) dome(-30+dx,-330,dx?6:9,22.5); for(const dx of [-37,37]) minar(-30+dx,-322,36);
  // a gateway arch to the north-east
  W0.put(new THREE.BoxGeometry(30,26,9),'city2',70,13,-345); W0.put(new THREE.BoxGeometry(12,16,10),'city',70,8,-344.5); for(const dx of [-17,17]) minar(70+dx,-345,32);
  // domes and minarets to the west
  dome(-330,-60,10,16); W0.put(new THREE.BoxGeometry(30,16,30),'city',-330,8,-60); minar(-312,-44,30); minar(-348,-44,30);
  dome(330,40,8,14); W0.put(new THREE.BoxGeometry(24,14,24),'city2',330,7,40); minar(316,56,26);
})();
const cloudTex=(function(){ const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d');
  for(let i=0;i<22;i++){ const px=40+Math.random()*176, py=50+Math.random()*40, r=18+Math.random()*30; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
  return new THREE.CanvasTexture(c); })();
const clouds=[]; for(let i=0;i<(LOW?10:16);i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:.85,depthWrite:false,fog:false})); const a=Math.random()*PI*2, R=160+Math.random()*300;
  m.position.set(Math.cos(a)*R,110+Math.random()*70,Math.sin(a)*R); const sc=110+Math.random()*90; m.scale.set(sc,sc*.42,1); scene.add(m); clouds.push(m); }

/* ---------------- stations ---------------- */
const KIND={canopy:[30,21],cloud:[10,7.2],arena:[9,8],hall:[13,10.5],gardener:[13,12],nets:[13,6],court:[11,6],cityfloor:[11,4],pillars:[7,3.5],nightgarden:[12,4],amphi:[14,8],
  pavilion:[10,6.5],pod:[7,5],booth:[5.5,4.6],kiosk:[5.5,4.6],table:[3.2,2.6],wall:[7,6.4],board:[4.5,4.3],tower:[4,7],sign:[4,4.3],psa:[9,6.5],megaphone:[6,9.5],arch:[7,9.6],
  lockers:[5,3.4],plot:[7,3],helpdesk:[5,5],maths:[8,8.6],cage:[8,5],lane:[9,3.5],sprint:[18,4],climb:[7,11.5],kabaddi:[7,3],yoga:[9,5],bikes:[7,4],steps:[8,3],
  shuttlestop:[6,4],dronecage:[7,6],radar:[9,4.5],forest:[15,7],mist:[8,5],solar:[10,6],bin:[5,3.6],peepal:[9,14]};
Object.assign(CTX,{ZONES,STS,kitFor,colB,colC,Z1,paths:{N,E,ADJ}});
if(window.ParkArt) ParkArt.init(CTX); if(window.ParkArt2) ParkArt2.init(CTX);
for(const st of STS){
  if(st.rot==null){ const h=ZONES[st.zone].hub; st.rot=Math.atan2(h[0]-st.x,h[1]-st.z); }
  if(st.kind==='shuttlestop'||st.kind==='megaphone') st.rot=0;
  const k=KIND[st.kind]||[6,4]; st.reach=st.reach||k[0]; st.lh=k[1];
  try{ BLD[st.kind](st,kitFor(st),CTX); }catch(e){ console.error('build',st.id,e); }
}

/* ---------------- trees, shrubs ---------------- */
function segDist(px,pz,a,b){ const vx=b[0]-a[0], vz=b[1]-a[1]; const t=clamp(((px-a[0])*vx+(pz-a[1])*vz)/(vx*vx+vz*vz),0,1); return Math.hypot(px-(a[0]+vx*t),pz-(a[1]+vz*t)); }
function freeSpot(x,z,pad){ for(const st of STS){ const r=(st.kind==='canopy'?33:st.kind==='hall'?22:st.kind==='arena'?19:st.kind==='sprint'?20:st.reach+4)+pad; if(Math.abs(x-st.x)<r&&Math.abs(z-st.z)<r&&Math.hypot(x-st.x,z-st.z)<r) return false; }
  for(const [a,b] of E){ if(segDist(x,z,N[a],N[b])<4.5+pad) return false; } for(let i=0;i<4;i++){ if(segDist(x,z,TR[i],TR[(i+1)%4])<3.5) return false; }
  if(z>154&&z<162&&x>20) return false; return true; }
let rs=7; const rnd=()=>{ rs=(rs*16807)%2147483647; return rs/2147483647; };
for(let x=X0+3;x<X1-2;x+=6.5){ for(const z of [Z0+2.6,Z1-2.6]) if(Math.abs(x)>14) trees.push({x:x+rnd()*2,z,s:.8+rnd()*.5,k:1,edge:1}); }
for(let z=Z0+3;z<Z1-2;z+=6.5){ for(const x of [X0+2.6,X1-2.6]) trees.push({x,z:z+rnd()*2,s:.8+rnd()*.5,k:1,edge:1}); }
let tries=0; while(trees.length<(LOW?330:430)&&tries<6000){ tries++; const x=X0+12+rnd()*(X1-X0-24), z=Z0+12+rnd()*(Z1-Z0-26); if(freeSpot(x,z,0)) trees.push({x,z,s:.7+rnd()*.7,k:rnd()<.25?1:0}); }
for(let i=0;i<120;i++){ const a=rnd()*PI*2, r=180+rnd()*90; trees.push({x:Math.cos(a)*r,z:Math.sin(a)*r*.9+10,s:1+rnd()*.8,k:rnd()<.4?1:0,far:1}); }
(function(){
  const n=trees.length, d=new THREE.Object3D();
  const cols=['#5d8c3e','#4f7f37','#6a9a48','#3f6e33','#7a9f4c','#557d3a'].map(c=>new THREE.Color(c));
  if(window.ParkArt) ParkArt.trees(CTX,trees); else { const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.26,3,7).translate(0,1.5,0),M.bark,n);
  const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9,1).translate(0,0,0),mk('#ffffff',{roughness:.9,flatShading:true}),n);
  trees.forEach((t,i)=>{ const s=t.s;
    d.position.set(t.x,0,t.z); d.rotation.set(0,rnd()*6,0); d.scale.set(s,s*(t.k===1?1.3:1),s); d.updateMatrix(); trunk.setMatrixAt(i,d.matrix);
    d.position.set(t.x,(t.k===1?4.3:3.5)*s,t.z); d.scale.set(s*(t.k===2?.8:1.1),s*(t.k===1?1.7:t.k===2?1.2:1),s*(t.k===2?.8:1.1)); d.updateMatrix(); crown.setMatrixAt(i,d.matrix);
    crown.setColorAt(i,cols[Math.floor(rnd()*cols.length)]); if(!t.far) colC.push({x:t.x,z:t.z,r:.35*s}); });
  trunk.castShadow=crown.castShadow=!LOW; trunk.frustumCulled=crown.frustumCulled=false; trunk.receiveShadow=crown.receiveShadow=true; scene.add(trunk); scene.add(crown); }
  // shrubs along paths
  const sh=[]; for(const [a,b] of E){ const A=N[a],B=N[b]; const len=Math.hypot(B[0]-A[0],B[1]-A[1]); const ux=(B[0]-A[0])/len, uz=(B[1]-A[1])/len; for(let dd=6;dd<len-5;dd+=5.5){ const side=(sh.length%2?1:-1)*(4.2+rnd()); const x=A[0]+ux*dd-uz*side, z=A[1]+uz*dd+ux*side; if(freeSpot(x,z,-3.5)) sh.push([x,z]); } }
  const shrub=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,1),mk('#ffffff',{roughness:.95,flatShading:true}),sh.length);
  sh.forEach(([x,z],i)=>{ d.position.set(x,.45,z); d.rotation.set(0,i,0); const s=.7+rnd()*.6; d.scale.set(s*1.3,s*.8,s*1.1); d.updateMatrix(); shrub.setMatrixAt(i,d.matrix); shrub.setColorAt(i,cols[i%cols.length]); });
  shrub.receiveShadow=true; shrub.frustumCulled=false; scene.add(shrub);
})();

if(window.ParkArt) ParkArt.world(CTX); if(window.ParkArt2) ParkArt2.world(CTX);
/* ---------------- merge static batches ---------------- */
for(const k in BATCH){ const geo=THREE.BufferGeometryUtils.mergeBufferGeometries(BATCH[k],false); if(!geo){ console.warn('merge failed',k); continue; } geo.computeBoundingSphere();
  const mesh=new THREE.Mesh(geo,M[k]||M.white); const tr=M[k]&&M[k].transparent; mesh.castShadow=!LOW&&!tr&&!['path','water','track','paving','city','city2','cityDome','signs','pinkGlow','warmGlow','flood'].includes(k); mesh.receiveShadow=!tr; scene.add(mesh); }

/* ---------------- visitors (instanced) ---------------- */
const NPCN=0; // visitors on the paths now come from live.js
const npcBody=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.27,1.1,8).translate(0,.95,0),mk('#ffffff',{roughness:.8}),NPCN);
const npcHead=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,10,8).translate(0,1.68,0),mk('#8a5a44',{roughness:.7}),NPCN);
const npcLegs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.17,.15,.42,8).translate(0,.21,0),mk('#3a3437',{roughness:.8}),NPCN);
[npcBody,npcHead,npcLegs].forEach(m=>{ m.castShadow=!LOW; m.frustumCulled=false; scene.add(m); });
const shirt=['#d33163','#2f6fa5','#e0a030','#4a8a5a','#7a4ea0','#f2eee7','#c2571b','#1f8a8a','#712846'].map(c=>new THREE.Color(c));
const nodes=Object.keys(N); const npcs=[];
for(let i=0;i<NPCN;i++){ const a=nodes[Math.floor(rnd()*nodes.length)]; const b=ADJ[a][Math.floor(rnd()*ADJ[a].length)]; npcs.push({a,b,t:rnd(),sp:.9+rnd()*.6,off:(rnd()-.5)*2.4,ph:rnd()*9}); npcBody.setColorAt(i,shirt[i%shirt.length]); }
const _d=new THREE.Object3D();
function updateNPC(dt,t){
  npcs.forEach((n,i)=>{ const A=N[n.a],B=N[n.b]; const len=Math.hypot(B[0]-A[0],B[1]-A[1])||1; n.t+=n.sp*dt/len;
    if(n.t>=1){ n.t=0; const opts=ADJ[n.b].filter(x=>x!==n.a); const nx=(opts.length?opts:ADJ[n.b])[Math.floor(rnd()*(opts.length||ADJ[n.b].length))]; n.a=n.b; n.b=nx; }
    const A2=N[n.a],B2=N[n.b], L2=Math.hypot(B2[0]-A2[0],B2[1]-A2[1])||1; const ux=(B2[0]-A2[0])/L2, uz=(B2[1]-A2[1])/L2;
    const x=A2[0]+(B2[0]-A2[0])*n.t-uz*n.off, z=A2[1]+(B2[1]-A2[1])*n.t+ux*n.off;
    _d.position.set(x,Math.abs(Math.sin(t*6+n.ph))*.04,z); _d.rotation.set(0,Math.atan2(ux,uz),0); _d.updateMatrix();
    npcBody.setMatrixAt(i,_d.matrix); npcHead.setMatrixAt(i,_d.matrix); npcLegs.setMatrixAt(i,_d.matrix); });
  npcBody.instanceMatrix.needsUpdate=npcHead.instanceMatrix.needsUpdate=npcLegs.instanceMatrix.needsUpdate=true;
}

/* ---------------- drone murmuration ---------------- */
const DN=LOW?110:180, dpos=new Float32Array(DN*3), dcol=new Float32Array(DN*3);
for(let i=0;i<DN;i++){ const c=new THREE.Color(i%5?'#ffffff':'#ff7aa2'); dcol[i*3]=c.r; dcol[i*3+1]=c.g; dcol[i*3+2]=c.b; }
const dgeo=new THREE.BufferGeometry(); dgeo.setAttribute('position',new THREE.BufferAttribute(dpos,3)); dgeo.setAttribute('color',new THREE.BufferAttribute(dcol,3));
const drones=new THREE.Points(dgeo,new THREE.PointsMaterial({size:.9,map:sprite,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
drones.frustumCulled=false; scene.add(drones);
function updateDrones(t){ drones.material.opacity=clamp((state.nf-.3)*1.6,0,1); drones.visible=state.nf>.3; if(!drones.visible) return;
  const p=state.player; const cx=lerp(0,p.x,.25), cz=lerp(-12,p.z,.15); const k=(Math.sin(t*.12)+1)/2;
  for(let i=0;i<DN;i++){ const u=i/DN*PI*2; const ring=[Math.cos(u)*22, 34+Math.sin(u*3+t)*2, Math.sin(u)*22];
    const fl=[Math.sin(u*2+t*.7)*26+Math.sin(i*1.7+t*.9)*4, 30+Math.cos(u*3+t*.5)*7+Math.sin(i+t)*1.5, Math.cos(u+t*.4)*16*Math.sin(u*2)+Math.cos(i*.7+t)*3];
    dpos[i*3]=cx+lerp(ring[0],fl[0],k); dpos[i*3+1]=lerp(ring[1],fl[1],k); dpos[i*3+2]=cz+lerp(ring[2],fl[2],k); }
  dgeo.attributes.position.needsUpdate=true; }

/* ---------------- player ---------------- */
const player={x:0,z:180,y:0,vy:0,yaw:0,pitch:-.04,onGround:true};
state.player=player;
const EYE=1.65, R=.45;
function groundAt(x,z){ let h=0; for(const p of plats){ if(p.r){ if((x-p.x)**2+(z-p.z)**2<p.r*p.r) h=Math.max(h,p.h); } else { const dx=x-p.x,dz=z-p.z; const lx=dx*p.c-dz*p.s, lz=dx*p.s+dz*p.c; if(Math.abs(lx)<p.hw&&Math.abs(lz)<p.hd) h=Math.max(h,p.h); } } for(const f of groundFns) h=Math.max(h,f(x,z)); return h; }
function collide(){
  if(player.y>9){ player.x=clamp(player.x,X0-60,X1+60); player.z=clamp(player.z,Z0-60,Z1+60); return; }
  for(const c of colC){ const dx=player.x-c.x, dz=player.z-c.z; if(Math.abs(dx)>c.r+R||Math.abs(dz)>c.r+R) continue; const d=Math.hypot(dx,dz), m=c.r+R; if(d<m&&d>1e-5){ player.x=c.x+dx/d*m; player.z=c.z+dz/d*m; } }
  for(const c of dynCol){ const dx=player.x-c.x, dz=player.z-c.z, d=Math.hypot(dx,dz), m=c.r+R; if(d<m&&d>1e-5){ player.x=c.x+dx/d*m; player.z=c.z+dz/d*m; } }
  for(const b of colB){ const dx=player.x-b.x, dz=player.z-b.z; const lim=b.hw+b.hd+R; if(Math.abs(dx)>lim||Math.abs(dz)>lim) continue;
    let lx=dx*b.c-dz*b.s, lz=dx*b.s+dz*b.c; const qx=clamp(lx,-b.hw,b.hw), qz=clamp(lz,-b.hd,b.hd); let ex=lx-qx, ez=lz-qz; let d=Math.hypot(ex,ez);
    if(d<R){ if(d<1e-5){ const px=b.hw-Math.abs(lx), pz=b.hd-Math.abs(lz); if(px<pz){ lx=Math.sign(lx||1)*(b.hw+R); } else { lz=Math.sign(lz||1)*(b.hd+R); } }
      else { lx=qx+ex/d*R; lz=qz+ez/d*R; }
      player.x=b.x+lx*b.c+lz*b.s; player.z=b.z-lx*b.s+lz*b.c; } }
  player.x=clamp(player.x,X0+1.2,X1-1.2); player.z=clamp(player.z,Z0+1.2,Z1+20);
}
const audio=window.ParkAudio?window.ParkAudio():null;
const keys={}; let look={active:false}, stick={id:null,ox:0,oy:0,x:0,y:0}, lookTouch={id:null,x:0,y:0};
const uiOpen=()=>!$('#card').hidden||!$('#pass').hidden||!$('#map').hidden||!$('#start').hidden||!$('#done').hidden||!$('#go').hidden;
addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT') return; const k=e.key.toLowerCase();
  if(tour.on&&$('#card').hidden&&$('#map').hidden){ if(k==='arrowright'||k==='enter') $('#tbNext').click(); else if(k==='arrowleft') goStop(tour.i-1); else if(k===' ') $('#tbPause').click(); else if(k==='escape') endTour(); e.preventDefault(); return; }
  keys[k]=true;
  if(k==='escape'){ closeAll(); }
  if(uiOpen()){ if((k==='e'||k==='enter')&&!$('#card').hidden){ closeCard(); } return; }
  if(k==='e'||k==='enter'){ if(nearest) openCard(nearest); }
  if(k==='m') openMap(); if(k==='p') openPass(); if(k==='n') toggleNight(); if(k==='f') toggleFly(); if(k==='t'){ openGo(); e.preventDefault(); } if(k==='g') startTour();
  if(k===' '){ if(!state.fly) jump(); e.preventDefault(); }
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
function jump(){ if(player.onGround){ player.vy=5; player.onGround=false; } }
const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{
  if(uiOpen()) return;
  if(e.pointerType==='touch'){
    if(e.clientX<innerWidth*.45&&stick.id===null){ stick={id:e.pointerId,ox:e.clientX,oy:e.clientY,x:0,y:0}; const s=$('#stick'); s.style.display='block'; s.style.left=(e.clientX-60)+'px'; s.style.top=(e.clientY-60)+'px'; s.firstElementChild.style.transform='translate(0,0)'; }
    else if(lookTouch.id===null){ lookTouch={id:e.pointerId,x:e.clientX,y:e.clientY}; }
    hideHint(); return; }
  look={active:true,x:e.clientX,y:e.clientY}; try{ const r=cv.requestPointerLock&&cv.requestPointerLock(); if(r&&r.catch) r.catch(()=>{}); }catch(err){}
});
addEventListener('pointermove',e=>{
  if(e.pointerType==='touch'){
    if(e.pointerId===stick.id){ let dx=e.clientX-stick.ox, dy=e.clientY-stick.oy; const L=Math.hypot(dx,dy), m=56; if(L>m){ dx=dx/L*m; dy=dy/L*m; } stick.x=dx/m; stick.y=dy/m; $('#stick').firstElementChild.style.transform=`translate(${dx}px,${dy}px)`; }
    else if(e.pointerId===lookTouch.id){ player.yaw-=(e.clientX-lookTouch.x)*.006; player.pitch=clamp(player.pitch-(e.clientY-lookTouch.y)*.005,-1.25,1.2); lookTouch.x=e.clientX; lookTouch.y=e.clientY; }
    return; }
  if(document.pointerLockElement===cv){ player.yaw-=e.movementX*.0024; player.pitch=clamp(player.pitch-e.movementY*.0022,-1.3,1.25); }
  else if(look.active){ player.yaw-=(e.clientX-look.x)*.005; player.pitch=clamp(player.pitch-(e.clientY-look.y)*.004,-1.3,1.25); look.x=e.clientX; look.y=e.clientY; }
});
function endPtr(e){ if(e.pointerType==='touch'){ if(e.pointerId===stick.id){ stick={id:null,ox:0,oy:0,x:0,y:0}; $('#stick').style.display='none'; } if(e.pointerId===lookTouch.id) lookTouch={id:null}; return; } look.active=false; }
addEventListener('pointerup',endPtr); addEventListener('pointercancel',endPtr);
if(isTouch){ $('#touch').hidden=false; $('#keysDesk').hidden=true; $('#keysTouch').hidden=false; $('#prompt').style.display='none'; }
let tUp=false, tDown=false;
$('#tJump').addEventListener('pointerdown',e=>{ e.stopPropagation(); if(state.fly) tUp=true; else jump(); });
$('#tDown').addEventListener('pointerdown',e=>{ e.stopPropagation(); tDown=true; });
['pointerup','pointercancel','pointerleave'].forEach(ev=>{ $('#tJump').addEventListener(ev,()=>tUp=false); $('#tDown').addEventListener(ev,()=>tDown=false); });
$('#tRead').addEventListener('click',()=>{ if(nearest) openCard(nearest); });

/* ---------------- HUD: labels, prompt, toasts ---------------- */
const labelsEl=$('#labels'); const LBL={};
for(const st of STS){ const el=document.createElement('div'); el.className='lbl'; el.innerHTML=`<i style="background:${ZONES[st.zone].color}"></i><span></span>`; el.lastChild.textContent=st.name; el.style.display='none'; labelsEl.appendChild(el); LBL[st.id]=el; }
const ZL={}; for(const k in ZONES){ const el=document.createElement('div'); el.className='lbl zone'; el.innerHTML=`<i style="background:${ZONES[k].color}"></i><span></span>`; el.lastChild.textContent=ZONES[k].name; el.style.display='none'; labelsEl.appendChild(el); ZL[k]=el; }
const bubbles=[0,1].map(()=>{ const b=document.createElement('div'); b.className='bubble'; b.style.display='none'; labelsEl.appendChild(b); return b; });
const _v=new THREE.Vector3();
function place(el,x,y,z){ _v.set(x,y,z).project(camera); if(_v.z>1||_v.z<-1||Math.abs(_v.x)>1.15||Math.abs(_v.y)>1.15){ el.style.display='none'; return false; } el.style.display='flex'; el.style.transform=`translate(${(_v.x+1)/2*innerWidth}px,${(1-_v.y)/2*innerHeight}px) translate(-50%,-100%)`; return true; }
let nearest=null, frameN=0;
function updateLabels(){
  const fx=-Math.sin(player.yaw), fz=-Math.cos(player.yaw), alt=Math.max(0,player.y-2), rng=48+alt*2.6;
  const list=[];
  for(const st of STS){ const dx=st.x-player.x, dz=st.z-player.z, d=Math.hypot(dx,dz); st._d=d; if(d<rng&&(alt>6||dx*fx+dz*fz>-2)) list.push(st); else LBL[st.id].style.display='none'; }
  list.sort((a,b)=>a._d-b._d); const maxL=tour.on?(alt>10?0:1):alt>10?(LOW?10:22):(LOW?7:12);
  list.forEach((st,i)=>{ const el=LBL[st.id]; if(i>=maxL){ el.style.display='none'; return; } place(el,st.x,st.lh+(st._d>20?1:0),st.z); el.style.opacity=alt<6&&st._d>26&&st!==nearest?Math.max(.45,1-(st._d-26)/40).toFixed(2):'1'; el.classList.toggle('done',!!save.v[st.id]); el.classList.toggle('near',st===nearest); });
  for(const k in ZONES){ const [x,z]=ZONES[k].hub; const d=Math.hypot(x+5-player.x,z+5-player.z); if(d<130+alt*3&&(d>14||alt>10)) place(ZL[k],x+5,8.6,z+5); else ZL[k].style.display='none'; }
}
function findNearest(){ let best=null, bv=1; for(const st of STS){ const d=st._d!=null?st._d:1e9; const v=d/st.reach; if(v<bv){ bv=v; best=st; } } return best; }
const toastsEl=$('#toasts');
function toast(html){ const t=document.createElement('div'); t.className='toast'; t.innerHTML=html; toastsEl.appendChild(t); setTimeout(()=>t.remove(),2600); while(toastsEl.children.length>3) toastsEl.firstChild.remove(); }
const hintEl=$('#hint'); let hintT;
function showHint(s){ hintEl.textContent=s; hintEl.hidden=false; hintEl.style.opacity=1; clearTimeout(hintT); hintT=setTimeout(hideHint,5000); }
function hideHint(){ hintEl.style.opacity=0; }

/* ---------------- passport, quests, persistence ---------------- */
const QUESTS=[
  ['read10','Read 10 stations anywhere in the park'],
  ['talk','Hear the Talking Trees translate at the gate'],
  ['cityfloor','Stand on Lucknow: walk onto the city floor'],
  ['dry','Walk into the cloud and stay dry in the rain'],
  ['sprint','Run the 30 m sprint lane in the Sports Zone'],
  ['canopyNight','Watch the canopy glow after dark'],
  ['drones','See the drone murmuration over the great lawn'],
  ['zones','Stamp all nine zones'],
];
const save={v:{},z:{},q:{},pts:0};
try{ const s=JSON.parse(localStorage.getItem('ldaParkWorld')||'null'); if(s&&s.v){ Object.assign(save,s); } }catch(e){}
function persist(){ try{ localStorage.setItem('ldaParkWorld',JSON.stringify(save)); }catch(e){} }
function award(n){ save.pts+=n; renderChip(); }
function renderChip(){ $('#pts').textContent=save.pts; $('#cnt').textContent=Object.keys(save.v).length+'/'+STS.length;
  const ms=$('#miniStamps'); if(!ms.children.length) for(const k in ZONES){ const i=document.createElement('i'); i.style.setProperty('--zc',ZONES[k].color); i.title=ZONES[k].name; i.dataset.z=k; ms.appendChild(i); }
  for(const i of ms.children) i.classList.toggle('got',!!save.z[i.dataset.z]); }
function quest(id){ if(save.q[id]) return; save.q[id]=1; award(30); if(audio) audio.stamp(); const q=QUESTS.find(x=>x[0]===id); toast(`Quest complete · <b>${q[1]}</b> · +30`); persist();
  if(Object.keys(save.q).length===QUESTS.length) setTimeout(()=>toast('All park quests complete'),1200); }
function visit(st){
  if(save.v[st.id]) return; save.v[st.id]=1; award(10); if(audio) audio.chime(); toast(`+10 · ${escapeHtml(st.name)}`);
  if(!save.z[st.zone]){ save.z[st.zone]=1; award(20); if(audio) setTimeout(()=>audio.stamp(),650); setTimeout(()=>toast(`Passport stamp · <b>${ZONES[st.zone].name}</b> · +20`),700);
    if(Object.keys(save.z).length===Object.keys(ZONES).length){ setTimeout(()=>{ quest('zones'); $('#dStats').textContent=`${Object.keys(save.v).length} stations read · ${save.pts} points`; showOv('#done'); },1600); } }
  if(Object.keys(save.v).length>=10) quest('read10');
  persist(); renderChip();
}
function escapeHtml(s){ return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------------- overlays ---------------- */
function showOv(sel){ $(sel).hidden=false; look.active=false; if(document.pointerLockElement) document.exitPointerLock(); for(const k in keys) keys[k]=false; stick={id:null,ox:0,oy:0,x:0,y:0}; $('#stick').style.display='none'; }
function closeAll(){ ['#card','#pass','#map','#done','#go'].forEach(s=>$(s).hidden=true); if(!$('#start').hidden&&started) $('#start').hidden=true; }
function openCard(st){ const z=ZONES[st.zone];
  $('#cImg').src='img/'+st.img+'.jpg'; $('#cImg').alt=st.name;
  const eb=$('#cEb'); eb.firstElementChild.style.background=z.color; eb.lastElementChild.textContent=z.name+(st.eb?' · '+st.eb.replace(/^[^·]*· ?/,''):'');
  $('#cTitle').textContent=st.name; $('#cText').textContent=st.text; $('#cHow').textContent=st.how||''; $('#cHow').hidden=!st.how;
  const left=STS.filter(s=>s.zone===st.zone&&!save.v[s.id]&&s!==st).length;
  $('#cMeta').textContent= left? `${left} more to find in ${z.name}` : `You’ve read every station in ${z.name}`;
  cardSt=st; $('#cNext').hidden=STS.every(s=>save.v[s.id]||s===st);
  showOv('#card'); visit(st); setTimeout(()=>$('#cClose').focus(),30); }
function closeCard(){ $('#card').hidden=true; }
$('#cClose').onclick=closeCard;
let cardSt=null;
$('#cNext').onclick=()=>{ const from=cardSt||player; let best=null,bd=1e9; for(const s of STS){ if(save.v[s.id]||s===cardSt) continue; const d=Math.hypot(s.x-from.x,s.z-from.z); if(d<bd){ bd=d; best=s; } } closeCard(); if(best) teleportTo(best); else toast('You have read every station. Well walked.'); }; $('#card').addEventListener('click',e=>{ if(e.target.id==='card') closeCard(); });
function openPass(){
  const vz={}; STS.forEach(s=>{ vz[s.zone]=vz[s.zone]||[0,0]; vz[s.zone][1]++; if(save.v[s.id]) vz[s.zone][0]++; });
  $('#pZones').innerHTML=''; for(const k in ZONES){ const d=document.createElement('div'); d.className=save.z[k]?'got':''; d.style.setProperty('--zc',ZONES[k].color);
    d.innerHTML=`<i>${ZONES[k].name.replace(/[^A-Z]/g,'').slice(0,2)||ZONES[k].name[0]}</i><div></div>`; d.lastChild.innerHTML=`${escapeHtml(ZONES[k].name)}<span>${vz[k][0]} of ${vz[k][1]} read</span>`; $('#pZones').appendChild(d); }
  $('#pQuests').innerHTML=''; QUESTS.forEach(([id,t])=>{ const li=document.createElement('li'); li.className=save.q[id]?'done':''; li.innerHTML='<i></i><span></span>'; li.lastChild.textContent=t; $('#pQuests').appendChild(li); });
  const n=Object.keys(save.v).length; $('#pCount').textContent=`${n} of ${STS.length} stations read`; $('#pPts').textContent=`${save.pts} points`; $('#pBar').style.width=(n/STS.length*100)+'%';
  showOv('#pass'); }
$('#chip').onclick=openPass; $('#chip').onkeydown=e=>{ if(e.key==='Enter') openPass(); }; $('#pClose').onclick=()=>$('#pass').hidden=true;
$('#dClose').onclick=()=>$('#done').hidden=true;
$('#bHelp').onclick=()=>{ $('#bStart').textContent='Back to the park'; showOv('#start'); };

/* ---------------- maps: an illustrated site plan, drawn once, then panned and zoomed ---------------- */
const mini=$('#mini'), mctx=mini.getContext('2d'), big=$('#bigmap'), bctx=big.getContext('2d');
const PXM=LOW?2.4:3.4, BX0=X0-34, BZ0=Z0-34, BW=Math.ceil((X1-X0+68)*PXM), BH=Math.ceil((Z1-Z0+68)*PXM);
const base=document.createElement('canvas'); base.width=BW; base.height=BH;
const tint=(hex,k)=>{ const c=new THREE.Color(hex); c.lerp(new THREE.Color('#ffffff'),k); return '#'+c.getHexString(); };
const FOOT={kiosk:['r',4.4,4.4],booth:['r',4.2,4.2],pod:['c',4.4],helpdesk:['c',2.4],plot:['r',9,6],amphi:['semi'],maths:['c',4.8],wall:['r',10.6,1.2],board:['r',2.6,1.2],sign:['c',.7],tower:['c',.7],psa:['psa'],arch:['r',10.4,2.2],lockers:['r',6,.9],cityfloor:['r',19,19],pillars:['r',12,12],nightgarden:['band'],canopy:['canopy'],cloud:['r',17,11],gardener:['c',16],arena:['r',32,20],table:['r',2.4,1.6],nets:['nets'],peepal:['peepal'],radar:['c',2.8],forest:['none'],mist:['c',5.5],solar:['r',16,10],bin:['r',3.2,1],court:['court'],cage:['r',10,8],lane:['r',3.6,16],sprint:['sprint'],climb:['r',8,3],kabaddi:['r',8.7,8.7],yoga:['r',14,10],bikes:['r',12,3],steps:['r',12,2.6],shuttlestop:['r',6,3],hall:['r',34,24],dronecage:['r',8,8],megaphone:['none']};
// the plan is drawn as vectors through a world-to-screen mapping, so the full map stays sharp at any zoom
const MAPCITY=[]; for(let i=0;i<160;i++){ const x=BX0+Math.random()*(X1-X0+68), z=BZ0+Math.random()*(Z1-Z0+68); if(x>X0-6&&x<X1+6&&z>Z0-6&&z<Z1+6) continue; MAPCITY.push([x,z,4+Math.random()*10,4+Math.random()*8]); }
const GRAIN=(()=>{ const g=document.createElement('canvas'); g.width=g.height=96; const o=g.getContext('2d'); for(let i=0;i<132;i++){ o.fillStyle=Math.random()<.5?'rgba(110,145,80,.08)':'rgba(255,255,255,.14)'; o.fillRect(Math.random()*95,Math.random()*95,2,2); } return g; })();
const planOff=document.createElement('canvas');
function drawPlan(c,bx,bz,m,vw,vh){
  const vis=(x,z,r)=>{ const X=bx(x), Y=bz(z), R=m(r); return X>-R&&Y>-R&&X<vw+R&&Y<vh+R; };
  c.fillStyle='#ebe5d6'; c.fillRect(bx(BX0),bz(BZ0),m(X1-X0+68),m(Z1-Z0+68));
  // the city outside: faint blocks
  c.fillStyle='#e2dbca'; for(const [x,z,w,d] of MAPCITY) c.fillRect(bx(x),bz(z),m(w),m(d));
  c.fillStyle='#d5e1bf'; c.fillRect(bx(X0),bz(Z0),m(X1-X0),m(Z1-Z0));
  c.save(); c.translate(bx(X0),bz(Z0)); c.fillStyle=c.createPattern(GRAIN,'repeat'); c.fillRect(0,0,m(X1-X0),m(Z1-Z0)); c.restore();
  // zone territories, clipped to the park (each zone flattened first so overlaps don't darken)
  c.save(); c.beginPath(); c.rect(bx(X0),bz(Z0),m(X1-X0),m(Z1-Z0)); c.clip();
  const cw=c.canvas.width, ch=c.canvas.height; if(planOff.width!==cw||planOff.height!==ch){ planOff.width=cw; planOff.height=ch; } const o=planOff.getContext('2d'), T=c.getTransform();
  for(const k in ZONES){ o.setTransform(1,0,0,1,0,0); o.clearRect(0,0,cw,ch); o.setTransform(T); o.fillStyle=ZONES[k].color;
    for(const st of STS) if(st.zone===k){ const r=st.kind==='canopy'?37:st.kind==='hall'?24:st.kind==='arena'?21:st.kind==='sprint'?20:Math.max(13,st.reach+7); if(!vis(st.x,st.z,r)) continue; o.beginPath(); o.arc(bx(st.x),bz(st.z),m(r),0,7); o.fill(); }
    c.save(); c.setTransform(1,0,0,1,0,0); c.globalAlpha=.17; c.drawImage(planOff,0,0); c.restore(); }
  c.restore();
  // fitness loop
  c.lineJoin='round'; c.lineCap='round'; c.strokeStyle='#d29a83'; c.lineWidth=m(3.4); c.beginPath(); TR.forEach((p,i)=>i?c.lineTo(bx(p[0]),bz(p[1])):c.moveTo(bx(p[0]),bz(p[1]))); c.closePath(); c.stroke();
  c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=m(.25); c.setLineDash([m(2),m(2)]); c.stroke(); c.setLineDash([]);
  // water channel
  c.strokeStyle='#7fb0c4'; c.lineWidth=m(3.8); c.beginPath(); CH.forEach((p,i)=>i?c.lineTo(bx(p[0]),bz(p[1])):c.moveTo(bx(p[0]),bz(p[1]))); c.stroke(); c.strokeStyle='#a9d3e2'; c.lineWidth=m(2.4); c.stroke();
  // paths
  const pathStroke=(w,col)=>{ c.strokeStyle=col; c.lineWidth=m(w); for(const [a,b] of E){ c.beginPath(); c.moveTo(bx(N[a][0]),bz(N[a][1])); c.lineTo(bx(N[b][0]),bz(N[b][1])); c.stroke(); } c.fillStyle=col; for(const k in N){ c.beginPath(); c.arc(bx(N[k][0]),bz(N[k][1]),m(w/2+1.4),0,7); c.fill(); } };
  pathStroke(5,'#c8b693'); pathStroke(4,'#f6efe1');
  // trees with a soft shadow
  for(const t of trees){ if(t.far||!vis(t.x,t.z,3*t.s)) continue; c.fillStyle='rgba(70,100,50,.22)'; c.beginPath(); c.arc(bx(t.x)+m(.7),bz(t.z)+m(.8),m(2*t.s),0,7); c.fill(); }
  for(const t of trees){ if(t.far||!vis(t.x,t.z,3*t.s)) continue; c.fillStyle=t.k===1?'#93b878':'#a6c78a'; c.beginPath(); c.arc(bx(t.x),bz(t.z),m(1.9*t.s),0,7); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.arc(bx(t.x)-m(.5*t.s),bz(t.z)-m(.5*t.s),m(.8*t.s),0,7); c.fill(); }
  // road and shuttle line outside the gate
  c.fillStyle='#a8a6a2'; c.fillRect(bx(25),bz(157.3),m(130),m(4.4)); c.strokeStyle='#fff'; c.lineWidth=m(.2); c.setLineDash([m(3),m(3)]); c.beginPath(); c.moveTo(bx(25),bz(159.5)); c.lineTo(bx(155),bz(159.5)); c.stroke(); c.setLineDash([]);
  // hedge with the gate gap
  c.strokeStyle='#5f8a45'; c.lineWidth=m(1.6); c.lineCap='butt'; c.beginPath(); c.moveTo(bx(-9),bz(Z1)); c.lineTo(bx(X0),bz(Z1)); c.lineTo(bx(X0),bz(Z0)); c.lineTo(bx(X1),bz(Z0)); c.lineTo(bx(X1),bz(Z1)); c.lineTo(bx(9),bz(Z1)); c.stroke();
  // station footprints
  for(const st of STS){ if(!vis(st.x,st.z,40)) continue; const f=FOOT[st.kind]||['r',4,4]; const col=ZONES[st.zone].color, fill=tint(col,.62);
    c.save(); c.translate(bx(st.x),bz(st.z)); c.rotate(-st.rot); c.scale(m(1),m(1)); c.fillStyle=fill; c.strokeStyle=col; c.lineWidth=.32;
    const R=(w,d,x=0,y=0)=>{ c.fillRect(x-w/2,y-d/2,w,d); c.strokeRect(x-w/2,y-d/2,w,d); }, Ci=(r,x=0,y=0)=>{ c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.stroke(); };
    switch(f[0]){
      case 'r': R(st.kind==='pavilion'?st.w:f[1],st.kind==='pavilion'?st.d:f[2]); break;
      case 'c': Ci(f[1]); break;
      case 'semi': c.beginPath(); c.arc(0,0,16.4,0,PI); c.arc(0,0,8.6,PI,0,true); c.closePath(); c.fill(); c.stroke(); for(let r=10.2;r<16;r+=2.3){ c.beginPath(); c.arc(0,0,r,0,PI); c.stroke(); } R(12,6,0,-2); break;
      case 'psa': for(let i=0;i<4;i++){ const a=i/4*PI*2+PI/4; R(1.4,1.4,Math.cos(a)*7,Math.sin(a)*7); } break;
      case 'band': c.beginPath(); c.arc(0,0,11.2,0,7); c.arc(0,0,8.8,0,7,true); c.fill(); c.stroke(); c.fillStyle=tint('#55c2b0',.3); for(let i=0;i<24;i++){ const a=i/24*PI*2; c.beginPath(); c.arc(Math.cos(a)*6.5,Math.sin(a)*6.5,.6,0,7); c.fill(); } break;
      case 'canopy': c.fillStyle='#efe6d6'; Ci(32); c.fillStyle='#a9d3e2'; c.beginPath(); c.arc(0,0,8.5,0,7); c.arc(0,0,6,0,7,true); c.fill(); c.fillStyle=fill;
        for(let i=0;i<8;i++){ const a=i/8*PI*2+PI/8, r=i%2?17:13; c.fillStyle=tint(col,.35); c.beginPath(); for(let k=0;k<6;k++){ const b=k/6*PI*2; c.lineTo(Math.cos(a)*r+Math.cos(b)*4.2,Math.sin(a)*r+Math.sin(b)*4.2); } c.closePath(); c.fill(); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(Math.cos(a)*r,Math.sin(a)*r,.9,0,7); c.fill(); }
        for(let i=0;i<14;i++){ const a=i/14*PI*2+.2; c.fillStyle='#b99b78'; c.save(); c.translate(Math.cos(a)*24,Math.sin(a)*24); c.rotate(a+PI/2); c.fillRect(-1.5,-.4,3,.8); c.restore(); } break;
      case 'peepal': Ci(4.6); c.fillStyle='rgba(84,128,62,.75)'; c.beginPath(); c.arc(0,0,8,0,7); c.fill(); c.fillStyle='#6e5440'; c.beginPath(); c.arc(0,0,1.5,0,7); c.fill(); break;
      case 'nets': R(13.2,22); for(const x of [-2.2,2.2]){ c.beginPath(); c.moveTo(x,-11); c.lineTo(x,11); c.stroke(); } c.fillStyle='#e2cf9b'; for(const x of [-4.4,0,4.4]) c.fillRect(x-.7,-9,1.4,18); break;
      case 'court': c.fillStyle=tint('#3f6f8f',.25); R(18,14); c.strokeStyle='#fff'; c.beginPath(); c.moveTo(0,-7); c.lineTo(0,7); c.stroke(); c.beginPath(); c.arc(0,-7,3,0,PI); c.stroke(); break;
      case 'sprint': c.fillStyle=tint('#b5543c',.35); R(4,34); c.strokeStyle='#fff'; for(const x of [-1,1]){ c.beginPath(); c.moveTo(x,-17); c.lineTo(x,17); c.stroke(); } break;
    }
    c.restore(); }
  // megaphone trees
  const MG=STS.find(s=>s.kind==='megaphone'); for(const sx of [-1,1]){ c.fillStyle=ZONES.gate.color; c.beginPath(); c.arc(bx(16*sx),bz(MG.z),m(1.4),0,7); c.fill(); }
}
drawPlan(base.getContext('2d'),x=>(x-BX0)*PXM,z=>(z-BZ0)*PXM,v=>v*PXM,BW,BH);
const ZC={}; for(const k in ZONES){ const zs=STS.filter(s=>s.zone===k); ZC[k]=[zs.reduce((a,s)=>a+s.x,0)/zs.length, zs.reduce((a,s)=>a+s.z,0)/zs.length]; }
const FEAT=new Set(['canopy','cloud','arena','paathshala','bowler','court','defence','dastango','gardener','cityfloor','maths','brain','nightgarden','radar','welcome','megaphone','sprint','climbing','aryoga','didis']);
function arrow(c,x,y,yaw,sz){ c.save(); c.translate(x,y); c.rotate(-yaw); c.fillStyle='#1a1a1a'; c.beginPath(); c.moveTo(0,-sz); c.lineTo(sz*.65,sz*.7); c.lineTo(0,sz*.35); c.lineTo(-sz*.65,sz*.7); c.closePath(); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2; c.stroke(); c.restore(); }
// minimap: north up, centred on you
function drawMini(){ const c=mctx, Wm=mini.width, Hm=mini.height, alt=Math.max(0,player.y-2), span=(LOW?110:95)+alt*2, s=Wm/span;
  c.setTransform(1,0,0,1,0,0); c.fillStyle='#ebe5d6'; c.fillRect(0,0,Wm,Hm);
  c.drawImage(base,(BX0-player.x)*s+Wm/2,(BZ0-player.z)*s+Hm/2,BW/PXM*s,BH/PXM*s);
  for(const st of STS){ const X=(st.x-player.x)*s+Wm/2, Y=(st.z-player.z)*s+Hm/2; if(X<-6||Y<-6||X>Wm+6||Y>Hm+6) continue; c.beginPath(); c.arc(X,Y,5,0,7); c.fillStyle=save.v[st.id]?'#ffffff':ZONES[st.zone].color; c.fill(); c.lineWidth=2; c.strokeStyle=save.v[st.id]?ZONES[st.zone].color:'#ffffff'; c.stroke(); }
  c.fillStyle='rgba(26,26,26,.12)'; c.beginPath(); c.arc(Wm/2,Hm/2,26,0,7); c.fill(); arrow(c,Wm/2,Hm/2,player.yaw,15);
  c.fillStyle='#1a1a1a'; c.font='700 22px Manrope, Inter, sans-serif'; c.textAlign='center'; c.textBaseline='top'; c.fillText('N',Wm/2,8); }
// full map
const mv={cx:0,cz:(Z0+Z1)/2,s:2,min:1}; let selSt=null, mHits=[], zHits=[];
function fitMap(){ const w=big.clientWidth||600,h=big.clientHeight||500; mv.s=Math.min(w/(X1-X0+14),h/(Z1-Z0+30)); mv.min=mv.s*.85; mv.cx=0; mv.cz=(Z0+Z1+16)/2; }
function clampView(){ mv.cx=clamp(mv.cx,X0-20,X1+20); mv.cz=clamp(mv.cz,Z0-20,Z1+20); }
function zoomTo(x0,x1,z0,z1){ const w=big.clientWidth,h=big.clientHeight; mv.cx=(x0+x1)/2; mv.cz=(z0+z1)/2; mv.s=clamp(Math.min(w/(x1-x0+30),h/(z1-z0+30)),mv.min,14); }
function drawBig(){ const dpr=Math.min(devicePixelRatio||1,2), w=big.clientWidth, h=big.clientHeight; if(!w) return;
  if(big.width!==Math.round(w*dpr)||big.height!==Math.round(h*dpr)){ big.width=Math.round(w*dpr); big.height=Math.round(h*dpr); }
  const c=bctx; c.setTransform(dpr,0,0,dpr,0,0); c.fillStyle='#ebe5d6'; c.fillRect(0,0,w,h);
  const sx=x=>(x-mv.cx)*mv.s+w/2, sz=z=>(z-mv.cz)*mv.s+h/2;
  c.save(); drawPlan(c,sx,sz,v=>v*mv.s,w,h); c.restore();
  mHits=[]; zHits=[]; const boxes=[]; const free=(x,y,bw,bh)=>{ for(const b of boxes) if(x<b[0]+b[2]&&x+bw>b[0]&&y<b[1]+b[3]&&y+bh>b[1]) return false; boxes.push([x,y,bw,bh]); return true; };
  // you
  const PX=sx(player.x), PY=sz(player.z); c.fillStyle='rgba(211,49,99,.16)'; c.beginPath(); c.arc(PX,PY,16+4*Math.sin(performance.now()/300),0,7); c.fill();
  // stations
  const mr=clamp(mv.s*1.6,4,8);
  for(const st of STS){ const X=sx(st.x), Y=sz(st.z); if(X<-20||Y<-20||X>w+20||Y>h+20) continue; const r=st===selSt?mr+3:mr; const col=ZONES[st.zone].color, done=!!save.v[st.id];
    c.beginPath(); c.arc(X,Y,r,0,7); c.fillStyle=done?'#ffffff':col; c.fill(); c.lineWidth=2; c.strokeStyle=done?col:'#ffffff'; c.stroke();
    if(done&&r>5){ c.strokeStyle=col; c.lineWidth=1.8; c.beginPath(); c.moveTo(X-r*.45,Y); c.lineTo(X-r*.1,Y+r*.38); c.lineTo(X+r*.5,Y-r*.4); c.stroke(); }
    mHits.push({st,X,Y}); boxes.push([X-r,Y-r,r*2,r*2]); }
  // zone names
  const zf=clamp(mv.s*5.2,12,26); c.textBaseline='middle'; c.textAlign='center';
  for(const k in ZONES){ const X=sx(ZC[k][0]), Y=sz(ZC[k][1])-zf*1.2; const t=ZONES[k].name.toUpperCase(); c.font=`800 ${zf}px Manrope, Inter, sans-serif`; const tw=c.measureText(t).width;
    c.lineWidth=5; c.strokeStyle='rgba(255,255,255,.9)'; c.lineJoin='round'; c.strokeText(t,X,Y); c.fillStyle=ZONES[k].color; c.fillText(t,X,Y); boxes.push([X-tw/2,Y-zf/2,tw,zf]); zHits.push({k,x:X-tw/2,y:Y-zf/2,w:tw,h:zf}); }
  // station names
  c.textAlign='left'; const nf=clamp(mv.s*2.6,11,14); c.font=`600 ${nf}px Inter, sans-serif`;
  if(mv.s>1.5){ const list=STS.filter(st=>mv.s>=4.2||FEAT.has(st.id)||st===selSt).sort((a,b)=>(b===selSt)-(a===selSt)||FEAT.has(b.id)-FEAT.has(a.id));
    for(const st of list){ const X=sx(st.x)+mr+4, Y=sz(st.z); if(X>w||Y<0||Y>h) continue; const tw=c.measureText(st.name).width; if(!free(X,Y-nf/2,tw,nf)&&st!==selSt) continue;
      c.lineWidth=4; c.strokeStyle='rgba(255,255,255,.92)'; c.strokeText(st.name,X,Y); c.fillStyle=save.v[st.id]?'#666666':'#1a1a1a'; c.fillText(st.name,X,Y); } }
  arrow(c,PX,PY,player.yaw,12); c.font='700 12px Inter, sans-serif'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#fff'; c.strokeText('You',PX,PY+22); c.fillStyle='#d33163'; c.fillText('You',PX,PY+22);
  // compass and scale
  c.save(); c.translate(w-34,34); c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(0,0,22,0,7); c.fill(); c.fillStyle='#712846'; c.beginPath(); c.moveTo(0,-16); c.lineTo(6,2); c.lineTo(-6,2); c.closePath(); c.fill(); c.fillStyle='#bdb3b6'; c.beginPath(); c.moveTo(0,16); c.lineTo(6,2); c.lineTo(-6,2); c.closePath(); c.fill(); c.fillStyle='#1a1a1a'; c.font='800 11px Manrope, sans-serif'; c.textAlign='center'; c.fillText('N',0,-25+4); c.restore();
  const sm=[10,20,50,100].find(v=>v*mv.s>70)||100, sw=sm*mv.s; c.fillStyle='rgba(255,255,255,.9)'; c.fillRect(10,h-34,sw+20,24); c.fillStyle='#1a1a1a'; c.fillRect(20,h-18,sw,3); c.fillRect(20,h-23,2,8); c.fillRect(20+sw-2,h-23,2,8); c.font='600 11px Inter, sans-serif'; c.textAlign='left'; c.fillText(sm+' m',22,h-26);
  // popover follows the selected station
  const pop=$('#mPop'); if(selSt){ const X=sx(selSt.x), Y=sz(selSt.z); if(X<0||Y<0||X>w||Y>h){ pop.hidden=true; } else { pop.hidden=false; const pw=pop.offsetWidth, ph=pop.offsetHeight; let L=X-pw/2, T=Y-ph-16; if(T<6) T=Y+16; L=clamp(L,6,w-pw-6); pop.style.left=L+'px'; pop.style.top=T+'px'; } } else pop.hidden=true;
}
function selectSt(st){ selSt=st; const pop=$('#mPop'); if(!st){ pop.hidden=true; drawBig(); return; }
  $('#mpImg').src='img/'+st.img+'.jpg'; $('#mpEb').firstElementChild.style.background=ZONES[st.zone].color; $('#mpEb').lastElementChild.textContent=ZONES[st.zone].name; $('#mpName').textContent=st.name; $('#mpRead').textContent=save.v[st.id]?'Read again':'Read'; drawBig(); }
function renderLegend(){ const L=$('#mLegend'); L.innerHTML='';
  for(const k in ZONES){ const zs=STS.filter(s=>s.zone===k); const b=document.createElement('button'); b.className='lz'; b.innerHTML='<i></i><span></span><em></em>'; b.firstChild.style.background=ZONES[k].color; b.children[1].textContent=ZONES[k].name; b.lastChild.textContent=zs.filter(s=>save.v[s.id]).length+'/'+zs.length;
    b.onclick=()=>{ zoomTo(Math.min(...zs.map(s=>s.x)),Math.max(...zs.map(s=>s.x)),Math.min(...zs.map(s=>s.z)),Math.max(...zs.map(s=>s.z))); selectSt(null); }; L.appendChild(b); } }
function openMap(){ showOv('#map'); renderLegend(); requestAnimationFrame(()=>{ fitMap(); selSt=null; drawBig(); }); }
mini.onclick=openMap; $('#bMap').onclick=openMap; $('#mClose').onclick=()=>$('#map').hidden=true;
$('#mZin').onclick=()=>{ mv.s=clamp(mv.s*1.5,mv.min,14); drawBig(); }; $('#mZout').onclick=()=>{ mv.s=clamp(mv.s/1.5,mv.min,14); drawBig(); }; $('#mFit').onclick=()=>{ fitMap(); drawBig(); };
$('#mpGo').onclick=()=>{ const st=selSt; $('#map').hidden=true; teleportTo(st); };
$('#mpRead').onclick=()=>{ const st=selSt; $('#map').hidden=true; openCard(st); };
$('#mpX').onclick=()=>selectSt(null);
addEventListener('resize',()=>{ if(!$('#map').hidden) drawBig(); });
(function(){ const ptrs=new Map(); let moved=0, pinch=null;
  const pos=e=>{ const r=big.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
  function zoomAt(px,py,f){ const w=big.clientWidth,h=big.clientHeight; const wx=(px-w/2)/mv.s+mv.cx, wz=(py-h/2)/mv.s+mv.cz; mv.s=clamp(mv.s*f,mv.min,14); mv.cx=wx-(px-w/2)/mv.s; mv.cz=wz-(py-h/2)/mv.s; clampView(); }
  big.addEventListener('pointerdown',e=>{ try{ big.setPointerCapture(e.pointerId); }catch(err){} ptrs.set(e.pointerId,pos(e)); moved=0; if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,s:mv.s}; } });
  big.addEventListener('pointermove',e=>{ if(!ptrs.has(e.pointerId)) return; const p=ptrs.get(e.pointerId), q=pos(e); const dx=q.x-p.x, dy=q.y-p.y; p.x=q.x; p.y=q.y;
    if(ptrs.size===1){ mv.cx-=dx/mv.s; mv.cz-=dy/mv.s; moved+=Math.abs(dx)+Math.abs(dy); clampView(); }
    else if(pinch){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); zoomAt((a.x+b.x)/2,(a.y+b.y)/2,pinch.s*d/pinch.d/mv.s); moved+=20; }
    drawBig(); });
  const up=e=>{ if(!ptrs.has(e.pointerId)) return; const q=pos(e); ptrs.delete(e.pointerId); if(ptrs.size<2) pinch=null; if(ptrs.size===0&&moved<7) tap(q.x,q.y); };
  big.addEventListener('pointerup',up); big.addEventListener('pointercancel',e=>{ ptrs.delete(e.pointerId); pinch=null; });
  big.addEventListener('wheel',e=>{ e.preventDefault(); const q=pos(e); zoomAt(q.x,q.y,Math.exp(-e.deltaY*.0016)); drawBig(); },{passive:false});
  function tap(x,y){ let best=null,bd=18; for(const h of mHits){ const d=Math.hypot(h.X-x,h.Y-y); if(d<bd){ bd=d; best=h.st; } } if(best){ selectSt(best); return; }
    const z=zHits.find(h=>x>=h.x-6&&x<=h.x+h.w+6&&y>=h.y-6&&y<=h.y+h.h+6); if(z){ $('#mLegend').children[Object.keys(ZONES).indexOf(z.k)].click(); return; } selectSt(null); }
})();

/* ---------------- day and night ---------------- */
function toggleNight(){ state.night=state.night?0:1; $('#bNight').textContent=state.night?'Day':'Night'; toast(state.night?'Evening falls. The canopy and night garden light up.':'Back to daylight.'); }
$('#bNight').onclick=toggleNight;
const C_TOP=[new THREE.Color('#6d9fcf'),new THREE.Color('#0b1430')], C_HOR=[new THREE.Color('#e7e1d6'),new THREE.Color('#2b2a44')], C_GND=[new THREE.Color('#b9c4a8'),new THREE.Color('#151a22')];
const SUNP=[new THREE.Vector3(80,95,-60),new THREE.Vector3(-60,120,-90)];
function applyLight(){ const f=state.nf;
  skyU.top.value.copy(C_TOP[0]).lerp(C_TOP[1],f); skyU.hor.value.copy(C_HOR[0]).lerp(C_HOR[1],f); skyU.gnd.value.copy(C_GND[0]).lerp(C_GND[1],f); skyU.night.value=f;
  scene.fog.color.copy(skyU.hor.value); if(composer) scene.fog.color.convertSRGBToLinear();
  hemi.intensity=lerp(.4,.13,f); hemi.color.set(f>.5?'#9fb3ff':'#f3f6ff'); sun.intensity=lerp(2.0,.12,f); sun.color.set(f>.5?'#a9bdff':'#ffe9cc');
  const sp=SUNP[0].clone().lerp(SUNP[1],f); skyU.sunDir.value.copy(sp).normalize();
  M.lamp.emissiveIntensity=f*1.8; M.bio.emissiveIntensity=f*1.5; M.screen.emissiveIntensity=.5+f*.8; M.screen2.emissiveIntensity=.5+f*.8; M.lampstrip.emissiveIntensity=.9+f;
  renderer.toneMappingExposure=lerp(.86,1.15,f);
  if(Math.abs(f-envNf)>.24||(f!==envNf&&(f===0||f===1))){ envNf=f; buildEnv(); }
  if(bloom){ bloom.strength=lerp(.1,1.05,f); bloom.threshold=lerp(.96,.55,f); bloom.radius=lerp(.45,.7,f); } }

/* ---------------- quests and live triggers ---------------- */
const MEGA=STS.find(s=>s.kind==='megaphone'), CITY=STS.find(s=>s.kind==='cityfloor'), CLOUD=STS.find(s=>s.kind==='cloud'), CAN=STS.find(s=>s.kind==='canopy');
const PHR=[['नमस्ते, लखनऊ!','Hello, Lucknow!'],['पार्क में आपका स्वागत है','Welcome to the park'],['शाम को कैनोपी देखिए','Watch the canopy tonight'],['آپ کیسے ہیں؟','How are you?']];
let dryT=0, sprintState=null;
function liveTriggers(t,dt){
  const p=player;
  // talking trees
  const md=Math.hypot(p.x-0,p.z-MEGA.z);
  if(md<24){ const ph=Math.floor(t/4.5)%PHR.length, k=(t%4.5);
    bubbles[0].textContent=PHR[ph][0]; bubbles[1].textContent=PHR[ph][1];
    if(k<3.8) place(bubbles[0],-16,9.6,MEGA.z); else bubbles[0].style.display='none';
    if(k>1.6) place(bubbles[1],16,9.6,MEGA.z); else bubbles[1].style.display='none';
    if(md<20) quest('talk'); }
  else { bubbles[0].style.display=bubbles[1].style.display='none'; }
  if(Math.hypot(p.x-CITY.x,p.z-CITY.z)<9) quest('cityfloor');
  const [clx,clz]=toLocal(CLOUD,p.x,p.z); if(clx>-7.6&&clx<3.8&&Math.abs(clz)<4.6){ dryT+=dt; if(dryT>3) quest('dry'); } else dryT=0;
  if(state.nf>.8&&Math.hypot(p.x-CAN.x,p.z-CAN.z)<34) quest('canopyNight');
  if(state.nf>.8&&Math.hypot(p.x,p.z+12)<80) quest('drones');
  const sp=CTX.sprint; if(sp){ const [lx,lz]=toLocal(sp,p.x,p.z);
    if(Math.abs(lx)<2.4&&Math.abs(lz)<17){ if(!sprintState&&Math.abs(lz)>14.6) sprintState={from:Math.sign(lz),t0:null};
      if(sprintState){ if(sprintState.t0==null&&Math.abs(lz)<14.6&&Math.sign(lz)===sprintState.from) sprintState.t0=t;
        if(sprintState.t0!=null&&Math.sign(lz)===-sprintState.from&&Math.abs(lz)>15){ const tt=t-sprintState.t0; toast(`Sprint lane · 30 m in <b>${tt.toFixed(2)} s</b> · ${(30/tt*3.6).toFixed(1)} km/h`); if(tt<20) quest('sprint'); sprintState=null; } } }
    else sprintState=null; }
}

/* ---------------- zone banner ---------------- */
let curZone=null, zoneT;
function zoneBanner(){ let best=null,bd=32; for(const st of STS){ if(st._d<bd){ bd=st._d; best=st; } } const z=best?best.zone:null;
  if(z&&z!==curZone){ curZone=z; const el=$('#zoneName'); el.firstElementChild.style.background=ZONES[z].color; el.lastElementChild.textContent=ZONES[z].name; el.classList.add('show'); clearTimeout(zoneT); zoneT=setTimeout(()=>el.classList.remove('show'),2600); } }

/* ---------------- fly mode ---------------- */
state.fly=false;
function toggleFly(){ state.fly=!state.fly; $('#bFly').textContent=state.fly?'Land':'Fly'; $('#bFly').classList.toggle('on',state.fly);
  $('#tJump').textContent=state.fly?'Up':'Jump'; $('#tDown').hidden=!state.fly;
  if(state.fly){ player.vy=0; player.y+=3; toast(isTouch?'Flying. Hold Up or Down, and look where you want to go.':'Flying. W flies where you look · Space up · C down · Shift for speed'); }
  else toast('Landing'); }
$('#bFly').onclick=toggleFly;

/* ---------------- teleport ---------------- */
const flashEl=$('#flash');
function flash(){ flashEl.style.transition='none'; flashEl.style.opacity=.9; requestAnimationFrame(()=>requestAnimationFrame(()=>{ flashEl.style.transition='opacity .7s ease-out'; flashEl.style.opacity=0; })); }
function teleportTo(st){ if(!st) return;
  const VIEW={megaphone:[16,-15],psa:[0,-14],amphi:[0,15.9],peepal:[3,11],court:[3,12],canopy:[4,26],nets:[0,15.5],arena:[3,13],hall:[0,9],cityfloor:[4,12],kabaddi:[2,7],yoga:[2,9],gardener:[3,19],pod:[1.5,6.5],cloud:[0,8],sprint:[4,8],climb:[2,8]};
  const v=VIEW[st.kind]||[1.4,clamp(st.reach*.85,4.5,22)]; const air=state.fly&&player.y>8;
  let [x,z]=toWorld(st,v[0],air?v[1]+16:v[1]);
  player.x=x; player.z=z; player.vy=0;
  if(air) player.y=Math.max(18,player.y); else { const wasFly=player.y; player.y=Math.max(0,groundAt(x,z)); if(state.fly&&wasFly>8) player.y=18; }
  collide();
  player.yaw=Math.atan2(-(st.x-player.x),-(st.z-player.z)); player.pitch=air?-.42:-.08;
  flash(); if(audio) audio.whoosh(); toast(`Teleported to <b>${escapeHtml(st.name)}</b>`); }
function openGo(){ $('#goQ').value=''; renderGo(''); showOv('#go'); if(!isTouch) setTimeout(()=>$('#goQ').focus(),40); }
function renderGo(q){ q=q.trim().toLowerCase(); const list=$('#goList'); list.innerHTML='';
  for(const k in ZONES){ const zn=ZONES[k].name.toLowerCase(); const sts=STS.filter(s=>s.zone===k&&(!q||(s.name+' '+s.text+' '+(s.eb||'')).toLowerCase().includes(q)||zn.includes(q)));
    if(!sts.length) continue;
    const h=document.createElement('div'); h.className='goz'; h.innerHTML='<i></i><span></span><small></small>'; h.firstChild.style.background=ZONES[k].color; h.children[1].textContent=ZONES[k].name;
    const all=STS.filter(s=>s.zone===k); h.lastChild.textContent=all.filter(s=>save.v[s.id]).length+' of '+all.length+' read'; list.appendChild(h);
    for(const s of sts){ const b=document.createElement('button'); b.className='gost'+(save.v[s.id]?' done':''); b.innerHTML='<span></span><em></em>'; b.firstChild.textContent=s.name; b.lastChild.textContent=save.v[s.id]?'Read':'';
      b.onclick=()=>{ $('#go').hidden=true; teleportTo(s); }; list.appendChild(b); } }
  if(!list.children.length){ const p=document.createElement('p'); p.className='small'; p.textContent='No station matches that. Try “cloud”, “cricket” or “paathshala”.'; list.appendChild(p); } }
$('#goQ').addEventListener('input',e=>renderGo(e.target.value));
$('#goQ').addEventListener('keydown',e=>{ if(e.key==='Escape'){ $('#go').hidden=true; } if(e.key==='Enter'){ const b=$('#goList .gost'); if(b) b.click(); } });
$('#goClose').onclick=()=>$('#go').hidden=true;
$('#goRand').onclick=()=>{ const un=STS.filter(s=>!save.v[s.id]); const pool=un.length?un:STS; $('#go').hidden=true; teleportTo(pool[Math.floor(Math.random()*pool.length)]); };
$('#bGo').onclick=openGo;
$('#go').addEventListener('click',e=>{ if(e.target.id==='go') $('#go').hidden=true; });

/* ---------------- live layer: people, balls and running screens ---------------- */
let live=null;
try{ live=window.ParkLive(Object.assign(CTX,{STS,ZONES,camera,place,groundAt,paths:{N,ADJ}})); }catch(e){ console.error('live layer',e); }

/* ---------------- guided tour: an autopilot camera through the highlights ---------------- */
const TOUR=[
  {zone:'gate',pose:{x:0,y:76,z:238,look:[0,0,10]},t:'A Park That Thinks',l:'Nine zones and 87 stations from Devalok’s proposal to Lucknow Development Authority, built as one walk.'},
  {zone:'gate',at:[0,93],h:.4,look:[0,5.5,112],t:'The megaphone trees',l:'Speak Hindi into one tree and the other answers in English or Urdu, 30 m away. The first thing you meet at the gate.'},
  {zone:'canopy',at:[0,86],h:1.5,look:[0,8,40],t:'The Breathing Canopy',l:'Eight kinetic steel trees, 15 to 18 m tall. The petals open for shade in the heat and fold for rain.'},
  {zone:'novelty',id:'cloud',v:[0,9.5],h:.4,ty:2.4,t:'Walk into a cloud',l:'AI makes weather on demand: fog to walk through, and rain that falls everywhere except where you stand.'},
  {zone:'novelty',id:'carrom',v:[1.6,3.4],h:.6,ty:.9,t:'The robot arena',l:'Carrom against a machine that shows its odds, a robot that writes your name in two scripts, and a robot chai stall.'},
  {zone:'novelty',id:'bowler',v:[0,16.5],h:1.2,ty:1,t:'The AI bowler',l:'Three nets where the machine changes line, length and speed to test you, and an AI coach gives one tip an over.'},
  {zone:'sports',id:'court',v:[7,14],h:3,ty:.5,t:'The AI Sports Zone',l:'Twelve stations around one smart court: skills cages, a sprint lane timed against a cheetah, and kabaddi on an LED floor.'},
  {zone:'learn',id:'paathshala',v:[0,15.9],h:0,ty:2.6,t:'The open paathshala',l:'A weekly evening talk in Hindi for 150 to 200 people, with live AI subtitles and translation.'},
  {zone:'unlearn',id:'deepfake',v:[.5,5.2],h:0,ty:1.7,t:'The Unlearn street',l:'Booths that take the fear out of AI: a live deepfake mirror, a voice-clone booth, and a fake news factory that teaches three checks.'},
  {zone:'learn',id:'didis',v:[2.5,8],h:.3,ty:1.2,t:'Learn, with a guide',l:'Nine life stations for the student, farmer, shopkeeper and more, each with an AI Didi or Bhaiya, so visitors have a person to ask and not just a screen.'},
  {zone:'novelty',id:'gardener',v:[5,20],h:3,ty:1.5,t:'The garden that tends itself',l:'Small robots plant, prune and water in full view, while a robotic arm shapes one banyan over 20 years.'},
  {zone:'canopy',night:1,at:[24,74],h:1,look:[0,9,40],t:'After dark',l:'The canopy glows with Lucknow’s live air quality, and the night garden lights up under your feet.'},
  {zone:'novelty',night:1,pose:{x:0,y:30,z:92,look:[0,27,0]},t:'Drone murmurations',l:'Each evening a flock of drones moves like starlings over the great lawn. Now it’s your turn to walk in.'},
];
const tour={on:false,i:0,phase:'move',t:0,from:null,to:null,dur:3,lift:0,paused:false,dwell:8.5};
function tourPose(s){ let x,y,z,lx,ly,lz;
  if(s.pose){ x=s.pose.x; y=s.pose.y; z=s.pose.z; [lx,ly,lz]=s.pose.look; }
  else if(s.at){ [x,z]=s.at; y=groundAt(x,z)+(s.h||0); [lx,ly,lz]=s.look; }
  else { const st=STS.find(q=>q.id===s.id); [x,z]=toWorld(st,s.v[0],s.v[1]); y=groundAt(x,z)+(s.h||0); lx=st.x; lz=st.z; ly=s.ty!=null?s.ty:1.5; }
  const ey=y+EYE; return {x,y,z,yaw:Math.atan2(-(lx-x),-(lz-z)),pitch:Math.atan2(ly-ey,Math.hypot(lx-x,lz-z))}; }
function tourCaption(){ const s=TOUR[tour.i], z=ZONES[s.zone]; $('#tbEb').firstElementChild.style.background=z.color; $('#tbEb').lastElementChild.textContent=`${z.name} · stop ${tour.i+1} of ${TOUR.length}`;
  $('#tbTitle').textContent=s.t; $('#tbLine').textContent=s.l; $('#tbNext').textContent=tour.i===TOUR.length-1?'Start exploring':'Next'; $('#tbBack').disabled=tour.i===0; }
function goStop(i){ i=clamp(i,0,TOUR.length-1); tour.i=i; const s=TOUR[i];
  tour.from={x:player.x,y:player.y,z:player.z,yaw:player.yaw,pitch:player.pitch}; tour.to=tourPose(s);
  const d=Math.hypot(tour.to.x-tour.from.x,tour.to.z-tour.from.z)+Math.abs(tour.to.y-tour.from.y);
  tour.dur=clamp(d/24,2.2,5.5); tour.lift=d>40?Math.min(32,d*.2):0; tour.phase='move'; tour.t=0; state.night=s.night?1:0; $('#bNight').textContent=state.night?'Day':'Night';
  $('#tourBar').classList.remove('show'); tourCaption(); if(d>40&&audio) audio.whoosh(); }
function startTour(){ ['#card','#pass','#map','#done','#go','#start'].forEach(s=>$(s).hidden=true); if(!started) beginPark(true);
  if(audio) audio.start(); tour.on=true; tour.paused=false; $('#tbPause').textContent='Pause'; document.body.classList.add('touring'); $('#tourBar').hidden=false; goStop(0); }
function endTour(){ if(!tour.on) return; tour.on=false; document.body.classList.remove('touring'); $('#tourBar').hidden=true; $('#tourBar').classList.remove('show');
  const gh=groundAt(player.x,player.z); if(player.y-gh>3&&!state.fly) toggleFly(); toast('Your turn. Walk anywhere, or press T to teleport.'); }
function stepTour(dt){ if(!tour.on) return;
  if(tour.phase==='move'){ tour.t+=dt; const u=clamp(tour.t/tour.dur,0,1), e=u*u*u*(u*(u*6-15)+10), F=tour.from, T=tour.to;
    player.x=lerp(F.x,T.x,e); player.z=lerp(F.z,T.z,e); player.y=lerp(F.y,T.y,e)+Math.sin(PI*e)*tour.lift;
    let dy=T.yaw-F.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); player.yaw=F.yaw+dy*e; player.pitch=lerp(F.pitch,T.pitch,e)-Math.sin(PI*e)*Math.min(.3,tour.lift/80);
    if(u>=1){ tour.phase='dwell'; tour.t=0; $('#tourBar').classList.add('show'); } }
  else { if(!tour.paused) tour.t+=dt; const T=tour.to, k=tour.t; player.x=T.x; player.y=T.y; player.z=T.z; player.yaw=T.yaw+Math.sin(k*.33)*.07; player.pitch=T.pitch+Math.sin(k*.27)*.012;
    $('#tbProg').style.width=clamp(k/tour.dwell*100,0,100)+'%'; if(k>tour.dwell&&tour.i<TOUR.length-1) goStop(tour.i+1); }
}
$('#tbNext').onclick=()=>{ if(tour.i===TOUR.length-1) endTour(); else goStop(tour.i+1); };
$('#tbBack').onclick=()=>goStop(tour.i-1);
$('#tbPause').onclick=()=>{ tour.paused=!tour.paused; $('#tbPause').textContent=tour.paused?'Play':'Pause'; };
$('#tbExit').onclick=endTour;
$('#bTour').onclick=startTour; $('#bTourStart').onclick=startTour;

/* ---------------- main loop ---------------- */
let started=false, last=performance.now(), tAcc=0, shExt=70, fpsN=0, fpsT=0;
const BUSY=['arena','court','paathshala','didis','bowler','dastango','cityfloor'].map(id=>STS.find(s=>s.id===id));
const AQIB=[[50,'#2E9E4F'],[100,'#9CCB3B'],[200,'#F2D33A'],[300,'#F08A24'],[400,'#D7263D'],[500,'#7E1F2B']];
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.05); last=now; tAcc+=dt; const t=tAcc; frameN++;
  if(tour.on){ if(!uiOpen()) stepTour(dt); }
  else if(started&&!uiOpen()){
    let mx=0,mz=0;
    if(keys.w||keys.arrowup) mz+=1; if(keys.s||keys.arrowdown) mz-=1; if(keys.a) mx-=1; if(keys.d) mx+=1;
    if(keys.arrowleft) player.yaw+=dt*1.9; if(keys.arrowright) player.yaw-=dt*1.9;
    let speed=state.fly?(keys.shift?32:14):(keys.shift?8:4.6);
    if(stick.id!==null){ mx=stick.x; mz=-stick.y; const m=Math.hypot(mx,mz); speed=state.fly?(m>.92?26:12):(m>.92?7.2:4.6); }
    const ml=Math.hypot(mx,mz); if(ml>1){ mx/=ml; mz/=ml; }
    const fx=-Math.sin(player.yaw), fz=-Math.cos(player.yaw), rx=Math.cos(player.yaw), rz=-Math.sin(player.yaw);
    const cp=state.fly?Math.cos(player.pitch):1;
    player.x+=(fx*mz*cp+rx*mx)*speed*dt; player.z+=(fz*mz*cp+rz*mx)*speed*dt;
    if(state.fly){ let up=0; if(keys[' ']||tUp) up+=1; if(keys.c||tDown) up-=1; player.y+=(Math.sin(player.pitch)*mz*speed+up*speed*.75)*dt; }
    collide();
    if(ml>.1&&isTouch&&frameN%2===0) hideHint();
  }
  const gh=groundAt(player.x,player.z);
  if(state.fly||tour.on){ player.vy=0; player.y=clamp(player.y,gh,170); player.onGround=player.y<=gh+.01; }
  else { player.vy=Math.max(player.vy-13*dt,-22); player.y+=player.vy*dt; if(player.y<=gh){ player.y=gh; player.vy=0; player.onGround=true; } }
  const alt=player.y-gh; scene.fog.near=140+player.y*1.5; scene.fog.far=460+player.y*4;
  if(!LOW&&frameN%10===0){ const ext=clamp(70+player.y*1.4,70,240); if(Math.abs(ext-shExt)>8){ shExt=ext; Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,far:260+ext}); sun.shadow.camera.updateProjectionMatrix(); } }
  const bob=(started&&!state.fly&&!tour.on&&player.onGround&&(keys.w||keys.s||keys.a||keys.d||stick.id!==null))?Math.sin(t*9)*.035:0;
  camera.position.set(player.x,player.y+EYE+bob,player.z); camera.rotation.set(player.pitch,player.yaw,0);
  sky.position.copy(camera.position);
  // light
  state.nf+=(state.night-state.nf)*Math.min(1,dt*1.2); applyLight();
  const aqi=168+Math.round(Math.sin(t*.05)*40); state.aqiColor=AQIB.find(b=>aqi<=b[0])[1];
  if(!LOW){ sun.position.set(player.x+skyU.sunDir.value.x*120,skyU.sunDir.value.y*120,player.z+skyU.sunDir.value.z*120); sun.target.position.set(player.x,0,player.z); }
  for(const f of anim) f(t,dt);
  updateNPC(dt,t); updateDrones(t); if(live) live.update(t,dt);
  if(frameN%2===0){ updateLabels(); nearest=started&&!tour.on&&alt<6?findNearest():null;
    if(nearest&&!uiOpen()){ if(isTouch){ $('#tRead').style.display='block'; $('#tRead').textContent='Read · '+(nearest.name.length>22?nearest.name.slice(0,21)+'…':nearest.name); } else { $('#prompt').style.display='flex'; $('#promptName').textContent=nearest.name; } }
    else { $('#prompt').style.display='none'; $('#tRead').style.display='none'; } }
  for(const c of clouds){ c.position.x+=dt*1.6; if(c.position.x>460) c.position.x=-460; c.material.opacity=lerp(.85,.12,state.nf); }
  if(audio&&frameN%6===0){ const dc=Math.hypot(player.x-CLOUD.x,player.z-CLOUD.z); let cr=0; for(const s of BUSY){ cr=Math.max(cr,1-Math.hypot(player.x-s.x,player.z-s.z)/34); } audio.update(dt*6,{nf:state.nf,rain:clamp(1-dc/22,0,1),crowd:clamp(cr,0,1),alt}); }
  // keep the frame rate up on slower machines
  fpsN++; fpsT+=dt; if(fpsT>2.5){ const fps=fpsN/fpsT; fpsN=0; fpsT=0; if(started&&fps<30){ if(PR>(LOW?.8:1)){ PR=Math.max(LOW?.8:1,PR-.2); renderer.setPixelRatio(PR); resize(); if(composer){ composer.setPixelRatio(PR); composer.setSize(innerWidth,innerHeight); } } else if(composer&&bloom&&bloom.enabled){ bloom.enabled=false; } else if(sun.castShadow){ sun.castShadow=false; } } }
  if(started&&!tour.on){ liveTriggers(t,dt); if(frameN%10===0){ zoneBanner(); } }
  if(frameN%3===0){ drawMini(); }
  if(!$('#map').hidden&&frameN%6===0) drawBig();
  if(composer) composer.render(); else renderer.render(scene,camera);
}
renderChip();
function beginPark(quiet){ $('#start').hidden=true; if(audio) audio.start(); if(!started){ started=true; if(!quiet){ if(isTouch) showHint('Drag left side to walk · right side to look'); else showHint('W A S D to walk · drag or click to look · E to read'); toast('Welcome to <b>A Park That Thinks</b>'); } } }
$('#bStart').disabled=false; $('#bTourStart').disabled=false; $('#bStart').onclick=()=>beginPark(false);
$('#bFull').onclick=()=>{ try{ const d=document.documentElement; const r=(d.requestFullscreen||d.webkitRequestFullscreen).call(d); if(r&&r.catch) r.catch(()=>{}); }catch(e){} };
if(!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)) $('#bFull').hidden=true;
$('#bSnd').textContent=audio&&audio.isOn()?'Sound on':'Sound off'; $('#bSnd').onclick=()=>{ if(!audio) return; audio.start(); audio.setOn(!audio.isOn()); $('#bSnd').textContent=audio.isOn()?'Sound on':'Sound off'; };
if(!Object.keys(texCache).length) $('#loadtxt').textContent='The park is ready.';
requestAnimationFrame(frame);
window.__park={player,state,STS,renderer,scene,startTour,goStop,tour,teleportTo,toggleFly,openMap,openGo,get live(){return live;}};
})();
