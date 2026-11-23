/* Art pass: landmark architecture, sculptural megaphone trees, a proper sports zone, zone gateways,
   street signage, and Indian park planting. Overrides some builders and adds world pieces. */
window.ParkArt=(function(){
'use strict';
const PI=Math.PI, V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), Cy=(a,b,h,s=16,o=false)=>new THREE.CylinderGeometry(a,b,h,s,1,o), Sp=(r,d=1)=>new THREE.IcosahedronGeometry(r,d);
let C=null, sign=null;
const FONT=(w,px)=>`${w} ${px}px Manrope, Inter, 'Noto Sans Devanagari', system-ui, sans-serif`;

/* cylinder between two local points */
function seg(K,a,b,r0,r1,mat,sides=10){ const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], L=Math.hypot(dx,dy,dz);
  K.put(Cy(r1,r0,L,sides),mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,Math.atan2(dx,dz),Math.acos(dy/L),0); }
/* put a Y-up geometry so its +Y axis points along dir */
function aim(K,geo,mat,p,dir){ const L=Math.hypot(dir[0],dir[1],dir[2]); K.put(geo,mat,p[0],p[1],p[2],Math.atan2(dir[0],dir[2]),Math.acos(dir[1]/L),0); }
function horn(len,r0,r1,seg=28){ const pts=[]; for(let i=0;i<=14;i++){ const u=i/14; pts.push(new THREE.Vector2(r0+(r1-r0)*Math.pow(u,2.4),u*len)); } return new THREE.LatheGeometry(pts,seg); }

/* ---------- materials ---------- */
function mats(M){
  const mk=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6},o||{}));
  Object.assign(M,{
    marble:mk('#f3efe8',{roughness:.32}), marble2:mk('#e9e1d3',{roughness:.45}),
    chrome:mk('#dde2e8',{metalness:1,roughness:.16}), gold:mk('#c9a45c',{metalness:.85,roughness:.28}), goldIn:mk('#d8b46a',{metalness:.7,roughness:.3,side:THREE.DoubleSide}),
    pinkMetal:mk('#d33163',{metalness:.55,roughness:.32,side:THREE.DoubleSide}), plumMetal:mk('#712846',{metalness:.5,roughness:.35}),
    pinkGlow:mk('#ff5c8f',{emissive:'#ff3b7a',emissiveIntensity:1.2,roughness:.4}), warmGlow:mk('#fff1d6',{emissive:'#ffd59a',emissiveIntensity:1.4}),
    flood:mk('#ffffff',{emissive:'#fff6e8',emissiveIntensity:1.2}), awningPink:mk('#e0567f',{roughness:.8,side:THREE.DoubleSide}), awningGold:mk('#e7a93a',{roughness:.8,side:THREE.DoubleSide}), awningTeal:mk('#2c8f8a',{roughness:.8,side:THREE.DoubleSide}),
    seat:mk('#d9d1c4',{roughness:.7}), fence:mk('#ffffff',{transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}), turf2:mk('#5e9c45',{roughness:.95}),
  });
  // jaali: a lattice screen, cut with alphaTest so it casts lacy shadows
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,128,128); x.fillStyle='#fff';
  x.save(); x.translate(64,64); for(let i=0;i<8;i++){ x.rotate(PI/4); x.beginPath(); x.ellipse(0,-30,9,22,0,0,7); x.fill(); } x.restore();
  x.beginPath(); x.arc(64,64,10,0,7); x.fill(); for(const [a,b] of [[0,0],[128,0],[0,128],[128,128]]){ x.beginPath(); x.arc(a,b,20,0,7); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(4,3);
  M.jaali=mk('#f1ebe2',{alphaMap:t,alphaTest:.5,side:THREE.DoubleSide,roughness:.5}); M.jaaliPink=mk('#d33163',{alphaMap:t,alphaTest:.5,side:THREE.DoubleSide,roughness:.5,metalness:.3});
  // sign atlas: one texture for every name board in the park
  const ac=document.createElement('canvas'); ac.width=2048; ac.height=2048; const tex=new THREE.CanvasTexture(ac); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=8;
  M.signs=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
  sign={c:ac,ctx:ac.getContext('2d'),tex,slots:[],SW:512,SH:64};
}
function drawSlot(s){ const g=sign.ctx, W=sign.SW, H=sign.SH, x0=(s.i%4)*W, y0=Math.floor(s.i/4)*H;
  g.fillStyle='#1c1418'; g.fillRect(x0,y0,W,H); g.fillStyle=s.col; g.fillRect(x0,y0,14,H); g.fillRect(x0,y0+H-5,W,5);
  g.fillStyle='#ffffff'; g.textBaseline='middle'; let f=30; g.font=FONT(800,f); while(g.measureText(s.text).width>W-44&&f>16){ f--; g.font=FONT(800,f); } g.fillText(s.text,x0+28,y0+H/2-2); }
function signGeo(text,col,w,h){ const i=sign.slots.length, s={i,text,col}; sign.slots.push(s); drawSlot(s);
  const g=new THREE.PlaneGeometry(w,h), uv=g.attributes.uv, u0=(i%4)*.25, v1=1-Math.floor(i/4)*sign.SH/2048, v0=v1-sign.SH/2048;
  for(let k=0;k<uv.count;k++){ uv.setXY(k,u0+uv.getX(k)*.25,v0+uv.getY(k)*(v1-v0)); } return g; }
function canvasPlane(w,h,cw,ch,draw){ const c=document.createElement('canvas'); c.width=cw; c.height=ch; const x=c.getContext('2d'); draw(x,cw,ch); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,toneMapped:false,transparent:true})); m.userData.redraw=()=>{ x.clearRect(0,0,cw,ch); draw(x,cw,ch); t.needsUpdate=true; }; return m; }

/* ---------- builders ---------- */
const OV={};
// a Lucknow street kiosk: barrel vault, jaali back screen, name board
OV.kiosk=(st,K,Cx)=>{ const zc=Cx.ZONES[st.zone].color;
  K.put(B(4.8,.22,4.6),'marble2',0,.11,0); K.put(B(4.9,.06,4.7),'z_'+st.zone,0,.23,0);
  for(const [x,z] of [[-2.35,-1.9],[2.35,-1.9],[-2.35,1.95],[2.35,1.95]]){ K.put(Cy(.08,.1,3.45,10),'chrome',x,1.95,z); K.circ(x,z,.22); }
  const vault=new THREE.CylinderGeometry(2.8,2.8,4.5,28,1,true,PI-1.1,2.2); vault.rotateX(PI/2); K.put(vault,'marble',0,2.4,0);
  const vin=new THREE.CylinderGeometry(2.76,2.76,4.5,28,1,true,PI-1.1,2.2); vin.rotateX(PI/2); K.put(vin,'z_'+st.zone,0,2.4,0);
  for(const z of [2.27,-2.27]){ const rim=new THREE.TorusGeometry(2.8,.055,6,40,2.2); rim.rotateZ(PI/2-1.1); K.put(rim,'pinkGlow',0,2.4,z); }
  K.put(B(4.3,2.6,.06),'jaali',0,1.55,-1.98); K.box(0,-1.98,2.15,.1);
  K.put(B(2.6,1.05,.9),'wood',0,.75,.5); K.put(B(2.7,.06,1),'marble',0,1.3,.5); K.box(0,.5,1.35,.5);
  K.put(Cy(.05,.05,.7,6),'darksteel',0,1.6,.3);
  K.put(signGeo(st.name,zc,3.9,.5),'signs',0,3.05,2.2); K.put(B(4,.58,.06),'darksteel',0,3.05,2.17);
  for(const sx of [-1,1]){ K.put(B(.7,.55,.7),'marble2',sx*2.9,.28,1.6); K.put(Sp(.42,1),'leaf',sx*2.9,.85,1.6); K.put(Sp(.2,0),'awningGold',sx*2.9+.15,1.1,1.5); K.circ(sx*2.9,1.6,.45); }
};
// Unlearn booths: striped awnings, neon fascia and a name board
OV.booth=(st,K,Cx)=>{ const zc=Cx.ZONES[st.zone].color, aw=['awningPink','awningGold','awningTeal'][(st.id.length)%3];
  K.put(B(4.2,.14,4.2),'darkfloor',0,.07,0);
  K.put(B(4.2,3.4,.2),'marble',0,1.7,-2); K.put(B(.2,3.4,4.2),'marble',-2,1.7,0); K.put(B(.2,3.4,4.2),'marble',2,1.7,0);
  K.put(B(4.6,.25,4.6),'roof',0,3.52,0); K.put(B(4.62,.1,4.62),'pinkGlow',0,3.38,0);
  for(let i=0;i<6;i++) K.put(B(.7,.04,1.6),i%2?aw:'marble',-1.75+i*.7,3.05,2.75,0,-.45,0);
  K.put(signGeo(st.name,zc,3.9,.5),'signs',0,3.7,2.33); K.put(B(4.1,.62,.08),'darksteel',0,3.7,2.28);
  K.put(B(4.2,.06,.06),'pinkGlow',0,.16,2.08);
  K.put(B(1.4,.9,.6),'darksteel',0,.45,-.6);
  K.box(0,-.9,2.15,1.25); K.box(-2,1.2,.15,.9); K.box(2,1.2,.15,.9);
};
// the megaphone trees: two sculptural steel trees with flared horns, speaker blossoms and sound rings
OV.megaphone=(st,K,Cx)=>{
  const ringTex=(()=>{ const c=document.createElement('canvas'); c.width=1024; c.height=1024; const x=c.getContext('2d'); x.translate(512,512);
    x.fillStyle='#e9e1d3'; x.beginPath(); x.arc(0,0,512,0,7); x.fill(); x.fillStyle='#712846'; x.beginPath(); x.arc(0,0,470,0,7); x.arc(0,0,330,0,7,true); x.fill('evenodd');
    x.fillStyle='#fff'; x.font=FONT(800,60); x.textAlign='center'; x.textBaseline='middle'; const words=['बोलिए','SPEAK','بولیے','BOLIYE','बोलिए','SPEAK','بولیے','BOLIYE'];
    words.forEach((w,i)=>{ x.save(); x.rotate(i/words.length*PI*2); x.fillText(w,0,-400); x.restore(); }); const t=new THREE.CanvasTexture(x.canvas); t.encoding=THREE.sRGBEncoding; return t; })();
  const ringMat=new THREE.MeshStandardMaterial({map:ringTex,roughness:.5});
  const waves=[];
  for(const sx of [-1,1]){
    const k=Cx.worldKit(16*sx,st.z,0);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(4.6,64),ringMat); disc.rotation.x=-PI/2; disc.position.set(16*sx,.05,st.z); disc.receiveShadow=true; Cx.scene.add(disc);
    k.put(Cy(1.6,1.9,.5,40),'marble',0,.25,0); k.put(new THREE.TorusGeometry(1.75,.06,8,60).rotateX(PI/2),'pinkGlow',0,.52,0); k.circ(0,0,1.7);
    // trunk: a twisting steel stem that leans toward the other tree
    const P=[[0,.5,0],[.25*sx,2.4,.15],[-.15*sx,4.3,-.1],[-.9*sx,6.1,.1],[-1.9*sx,7.3,0]]; const R=[.62,.5,.42,.34,.26];
    for(let i=0;i<P.length-1;i++) seg(k,P[i],P[i+1],R[i],R[i+1],'plumMetal',14);
    for(let i=1;i<P.length;i++) k.put(Sp(R[i]*1.02,2),'plumMetal',...P[i]);
    // helical LED band up the trunk
    const hp=[]; for(let i=0;i<=60;i++){ const u=i/60, j=Math.min(3,Math.floor(u*4)), f=u*4-j; const a=P[j], b=P[j+1]; const ang=u*PI*7, rr=lerp(R[j],R[j+1],f)+.04; hp.push(V3(lerp(a[0],b[0],f)+Math.cos(ang)*rr,lerp(a[1],b[1],f),lerp(a[2],b[2],f)+Math.sin(ang)*rr)); }
    k.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp),160,.035,5),'pinkGlow',0,0,0);
    // the big horn at the top, aimed at the other tree and down toward people
    const top=P[P.length-1], dir=[-sx,-.18,.12];
    aim(k,horn(3.4,.28,2.1),'pinkMetal',top,dir); aim(k,horn(3.35,.24,2.0),'goldIn',top,dir);
    const L=Math.hypot(...dir), dn=dir.map(v=>v/L), mouth=[top[0]+dn[0]*3.4,top[1]+dn[1]*3.4,top[2]+dn[2]*3.4];
    aim(k,new THREE.TorusGeometry(2.1,.09,8,64).rotateX(PI/2),'pinkGlow',mouth,dir); aim(k,new THREE.TorusGeometry(2.1,.12,8,64).rotateX(PI/2),'chrome',[mouth[0]-dn[0]*.12,mouth[1]-dn[1]*.12,mouth[2]-dn[2]*.12],dir);
    // branches ending in speaker blossoms
    const br=[[3.3,[.9*sx,1.1,.8]],[4.0,[1.1*sx,1.0,-.9]],[5.0,[-.3*sx,1.3,1.1]],[5.6,[.4*sx,1.4,-1.0]],[6.4,[.3*sx,1.6,.2]]];
    br.forEach(([h,d],i)=>{ const j=Math.min(3,Math.floor((h-.5)/1.75)); const f=((h-.5)/1.75)-j; const a=P[j], b=P[j+1]; const base=[lerp(a[0],b[0],f),h,lerp(a[2],b[2],f)];
      const tip=[base[0]+d[0]*1.6,base[1]+d[1]*1.4,base[2]+d[2]*1.6]; seg(k,base,tip,.16,.09,'plumMetal',8);
      aim(k,horn(.9,.08,.55,18),i%2?'pinkMetal':'gold',tip,[d[0],d[1]*.6,d[2]]); aim(k,new THREE.TorusGeometry(.55,.035,6,30).rotateX(PI/2),'pinkGlow',[tip[0]+d[0]/Math.hypot(...d)*.9,tip[1]+d[1]*.6/Math.hypot(...d)*.9,tip[2]+d[2]/Math.hypot(...d)*.9],[d[0],d[1]*.6,d[2]]); });
    // sound rings that travel from the horn while this tree is talking
    const wm=new THREE.MeshBasicMaterial({color:'#ff7aa6',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
    const wv={sx,mouth:V3(16*sx+mouth[0],mouth[1],st.z+mouth[2]),dir:V3(...dn),rings:[]};
    for(let i=0;i<4;i++){ const m=new THREE.Mesh(new THREE.TorusGeometry(1,.05,6,48),wm.clone()); m.quaternion.setFromUnitVectors(V3(0,0,1),wv.dir); m.visible=false; Cx.scene.add(m); wv.rings.push(m); }
    waves.push(wv);
  }
  Cx.anim.push((t)=>{ if(!Cx.state.near(st,70)) return; const k=t%4.5;
    waves.forEach(w=>{ const on=w.sx<0?k<3.8:k>1.6; w.rings.forEach((m,i)=>{ const p=((t*.55)+i/4)%1; m.visible=on; if(!on) return; m.position.copy(w.mouth).addScaledVector(w.dir,p*14); const s=2+p*5; m.scale.set(s,s,s); m.material.opacity=(1-p)*.55; }); }); });
};
function lerp(a,b,t){ return a+(b-a)*t; }
// the smart court: painted court, glass fence, floodlights, live scoreboard and bleachers
OV.court=(st,K,Cx)=>{
  const ct=document.createElement('canvas'); ct.width=1024; ct.height=800; const x=ct.getContext('2d');
  x.fillStyle='#1f6e8c'; x.fillRect(0,0,1024,800); x.fillStyle='#2a86a8'; x.fillRect(40,40,944,720);
  x.fillStyle='#e07b39'; x.fillRect(392,40,240,300); x.strokeStyle='#ffffff'; x.lineWidth=8; x.strokeRect(40,40,944,720); x.strokeRect(392,40,240,300);
  x.beginPath(); x.arc(512,340,120,0,PI); x.stroke(); x.beginPath(); x.moveTo(120,40); x.lineTo(120,230); x.arc(512,230,392,PI,0,true); x.lineTo(904,40); x.stroke();
  x.beginPath(); x.moveTo(40,760); x.lineTo(984,760); x.stroke(); x.beginPath(); x.arc(512,760,120,PI,0); x.stroke();
  x.fillStyle='rgba(255,255,255,.85)'; x.font=FONT(800,54); x.textAlign='center'; x.fillText('AI SPORTS ZONE',512,610);
  const tex=new THREE.CanvasTexture(ct); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=8;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,14),new THREE.MeshStandardMaterial({map:tex,roughness:.55})); floor.rotation.x=-PI/2; floor.receiveShadow=true; const fg=new THREE.Group(); fg.add(floor); K.obj(fg,0,.1,0);
  K.put(B(19.6,.08,15.6),'darksteel',0,.03,0);
  // hoop
  K.put(Cy(.12,.14,3.6,10),'darksteel',0,1.8,-7.7); K.put(B(.12,.12,1),'darksteel',0,3.55,-7.25); K.put(B(1.8,1.1,.06),'glass',0,3.4,-6.85); K.put(B(1.84,.06,.08),'pinkGlow',0,2.86,-6.85);
  K.put(new THREE.TorusGeometry(.23,.03,6,16),'red',0,3.05,-6.55,0,PI/2); K.circ(0,-7.7,.3);
  // glass fence with steel posts
  for(const [w,d,px,pz] of [[19.6,.06,0,-7.8],[.06,15.6,-9.8,0],[.06,15.6,9.8,0]]){ K.put(B(w,3,d),'fence',px,1.5,pz); }
  for(let i=0;i<=8;i++){ const px=-9.8+i*19.6/8; K.put(Cy(.06,.06,3.2,8),'chrome',px,1.6,-7.8); } for(let i=0;i<=6;i++){ const pz=-7.8+i*15.6/6; for(const sx of [-9.8,9.8]) K.put(Cy(.06,.06,3.2,8),'chrome',sx,1.6,pz); }
  K.box(0,-7.8,9.8,.1); K.box(-9.8,0,.1,7.8); K.box(9.8,0,.1,7.8);
  // floodlights
  for(const [fx,fz] of [[-10.6,-8.6],[10.6,-8.6],[-10.6,7.4],[10.6,7.4]]){ K.put(Cy(.16,.24,13,10),'darksteel',fx,6.5,fz); K.circ(fx,fz,.35);
    K.put(B(2.6,1.3,.3),'darksteel',fx,13,fz,Math.atan2(-fx,-fz),-.5,0); K.put(B(2.3,1.05,.08),'flood',fx-Math.sign(fx)*.12,12.95,fz-Math.sign(fz)*.15,Math.atan2(-fx,-fz),-.5,0); }
  // scoreboard
  K.put(B(5.4,2.6,.4),'darksteel',0,6.6,-9.2); K.put(Cy(.15,.15,5.3,8),'darksteel',-2.2,2.65,-9.2); K.put(Cy(.15,.15,5.3,8),'darksteel',2.2,2.65,-9.2); K.circ(-2.2,-9.2,.3); K.circ(2.2,-9.2,.3);
  const S={a:12,b:10,clock:462};
  const sb=canvasPlane(5,2.2,512,224,(g,w,h)=>{ g.fillStyle='#0d1216'; g.fillRect(0,0,w,h); g.fillStyle='#d33163'; g.fillRect(0,0,w,34); g.fillStyle='#fff'; g.font=FONT(800,22); g.textAlign='center'; g.fillText('SMART COURT · LIVE',w/2,24);
    const s=S; g.font=FONT(800,96); g.fillStyle='#ffd166'; g.fillText(s.a,w*.22,150); g.fillStyle='#7ee0c3'; g.fillText(s.b,w*.78,150);
    g.fillStyle='#fff'; g.font=FONT(700,40); const m=Math.floor(s.clock/60), ss=String(s.clock%60).padStart(2,'0'); g.fillText(`${m}:${ss}`,w/2,140); g.font=FONT(600,22); g.fillStyle='#bbb'; g.fillText('HOME          AWAY',w/2,196); });
  K.obj(sb,0,6.6,-8.98);
  let last=0; Cx.anim.push(t=>{ if(t-last<1||!Cx.state.near(st,60)) return; last=t; const s=S; s.clock=Math.max(0,s.clock-1); if(Math.random()<.12) s[Math.random()<.5?'a':'b']+=Math.random()<.3?3:2; if(s.clock===0) Object.assign(s,{a:0,b:0,clock:600}); sb.userData.redraw(); });
  // bleachers on the open side
  for(let r=0;r<3;r++){ K.put(B(14,.5*(r+1),1.2),'seat',0,.25*(r+1),9+r*1.2); K.put(B(14,.05,1.22),'z_'+st.zone,0,.5*(r+1)+.02,9+r*1.2); K.plat(0,9+r*1.2,0,.5*(r+1),7,.6); }
  K.put(signGeo('THE SMART COURT',Cx.ZONES[st.zone].color,6,.75),'signs',0,4.2,-7.74);
};
// sprint lane with timing gates and a speed board
OV.sprint=(st,K,Cx)=>{ Cx.sprint=st;
  K.put(B(4.4,.08,36),'track',0,.04,0); for(const x of [-2.1,0,2.1]) K.put(B(.07,.02,36),'white',x,.09,0);
  const gate=(z)=>{ K.put(B(.3,3.4,.3),'chrome',-2.6,1.7,z); K.put(B(.3,3.4,.3),'chrome',2.6,1.7,z); K.put(B(5.5,.7,.4),'darksteel',0,3.5,z); K.put(B(5.5,.08,.42),'pinkGlow',0,3.12,z); K.circ(-2.6,z,.3); K.circ(2.6,z,.3); };
  gate(-15); gate(15); K.put(B(4.4,.03,.3),'white',0,.1,-15); K.put(B(4.4,.03,.3),'white',0,.1,15);
  const T={txt:'READY'};
  const disp=[-15,15].map(z=>{ const d=canvasPlane(5,.6,512,64,(g,w,h)=>{ g.fillStyle='#0d1216'; g.fillRect(0,0,w,h); g.fillStyle='#ffd166'; g.font=FONT(800,44); g.textAlign='center'; g.textBaseline='middle'; g.fillText(T.txt,w/2,h/2+2); }); K.obj(d,0,3.5,z+(z<0?.21:-.21),z<0?0:PI); return d; });
  // the comparison board
  K.put(B(6.4,3.4,.3),'darksteel',4.9,2.8,-17.5); K.put(B(.2,1.1,.2),'darksteel',3,.55,-17.5); K.put(B(.2,1.1,.2),'darksteel',6.8,.55,-17.5); K.box(4.9,-17.5,3.2,.2);
  const cb=canvasPlane(6,3,600,300,(g,w,h)=>{ g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.fillStyle='#c98a12'; g.fillRect(0,0,w,46); g.fillStyle='#fff'; g.font=FONT(800,26); g.fillText('30 m · HOW FAST ARE YOU?',22,32);
    [['Cheetah','1.0 s',.98],['Horse','1.5 s',.66],['Usain Bolt','2.9 s',.34],['E-rickshaw','4.3 s',.23],['You','?',0]].forEach(([n,v,f],i)=>{ const y=74+i*44; g.fillStyle='#1a1a1a'; g.font=FONT(700,24); g.fillText(n,22,y+18); g.fillStyle='#eadfe2'; g.fillRect(190,y,300,26); g.fillStyle=i===4?'#d33163':'#712846'; g.fillRect(190,y,300*f,26); g.fillStyle='#1a1a1a'; g.fillText(v,505,y+20); }); });
  K.obj(cb,4.9,2.8,-17.33);
  let last=-1; Cx.anim.push(t=>{ if(!Cx.state.near(st,60)) return; const u=t%14; const txt=u<4.2?(u).toFixed(2)+' s':u<9?'4.21 s':'READY'; if(txt!==last){ last=txt; T.txt=txt; disp.forEach(d=>d.userData.redraw()); } });
};
// climbing wall with angled wings
OV.climb=(st,K)=>{
  K.put(B(8,10,.6),'concrete',0,5,0); K.put(B(9,.3,3),'mat',0,.15,1.6);
  K.put(B(3.4,9,.4),'plumMetal',-5.4,4.5,-.9,.62); K.put(B(3.4,9,.4),'z_'+'sports',5.4,4.5,-.9,-.62);
  K.put(B(8,10,.05),'awningPink',0,5,.33,0,0,0);
  for(let i=0;i<90;i++){ const x=-3.6+Math.random()*7.2, y=.8+Math.random()*8.8; K.put(Sp(.13+Math.random()*.08,0),['hold1','hold2','hold3','gold'][i%4],x,y,.42); }
  for(let i=0;i<30;i++){ const sx=i%2?1:-1, y=.8+Math.random()*8, d=Math.random()*2.6; K.put(Sp(.14,0),['hold2','hold3','hold1'][i%3],sx*(4.2+d*.8),y,-.25-d*.55); }
  for(const x of [-2.5,0,2.5]){ K.put(B(.5,.5,.6),'marble',x,10.2,.3); K.put(Cy(.02,.02,9.4,4),'chrome',x,5.4,.9); }
  K.put(B(8.2,.12,.12),'pinkGlow',0,10.05,.36); K.box(0,0,4.2,.5); K.box(-5.4,-.9,1.7,.3); K.box(5.4,-.9,1.7,.3);
};

/* ---------- world pieces ---------- */
function gateArch(Cx,Z){ const K=Cx.worldKit(0,Z,0);
  const sh=new THREE.Shape(); sh.moveTo(-10.5,0); sh.lineTo(-6.6,0); sh.lineTo(-6.6,8.4);
  const N=7, R=6.6, cy=8.4; for(let i=0;i<N;i++){ const a0=PI-i*PI/N, a1=PI-(i+1)*PI/N, am=(a0+a1)/2; sh.quadraticCurveTo(Math.cos(am)*R*.8,cy+Math.sin(am)*R*.8,Math.cos(a1)*R,cy+Math.sin(a1)*R); }
  sh.lineTo(6.6,0); sh.lineTo(10.5,0); sh.lineTo(10.5,19); sh.lineTo(4,19); sh.lineTo(4,21); sh.lineTo(-4,21); sh.lineTo(-4,19); sh.lineTo(-10.5,19); sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:2.6,bevelEnabled:false,curveSegments:10}); g.translate(0,0,-1.3); K.put(g,'marble',0,0,0);
  // pink LED trim around the opening, front and back
  const pts=[V3(-6.6,0.2,0),V3(-6.6,8.4,0)]; for(let i=0;i<N;i++){ const a0=PI-i*PI/N, a1=PI-(i+1)*PI/N, am=(a0+a1)/2; const q=new THREE.QuadraticBezierCurve3(V3(Math.cos(a0)*R,cy+Math.sin(a0)*R,0),V3(Math.cos(am)*R*.8,cy+Math.sin(am)*R*.8,0),V3(Math.cos(a1)*R,cy+Math.sin(a1)*R,0)); q.getPoints(8).slice(1).forEach(p=>pts.push(p)); } pts.push(V3(6.6,.2,0));
  const path=new THREE.CurvePath(); for(let i=0;i<pts.length-1;i++) path.add(new THREE.LineCurve3(pts[i],pts[i+1]));
  for(const z of [1.34,-1.34]){ const tg=new THREE.TubeGeometry(path,240,.07,6); K.put(tg,'pinkGlow',0,0,z); }
  // panels, chhatris and the name
  K.put(B(21.2,.5,3),'marble2',0,19,0); K.put(B(8.4,.4,3),'marble2',0,21,0);
  for(const sx of [-8.5,8.5]){ for(const [dx,dz] of [[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9]]) K.put(Cy(.12,.12,2,8),'marble',sx+dx,20.2,dz); K.put(B(2.4,.25,2.4),'marble2',sx,21.3,0);
    K.put(new THREE.SphereGeometry(1.2,20,10,0,PI*2,0,PI/2),'gold',sx,21.4,0); K.put(new THREE.ConeGeometry(.12,.8,8),'gold',sx,22.9,0); }
  K.put(new THREE.SphereGeometry(1.8,24,12,0,PI*2,0,PI/2),'marble',0,21.2,0); K.put(new THREE.ConeGeometry(.16,1.1,8),'gold',0,23.4,0);
  for(const sx of [-1,1]) for(let i=0;i<3;i++) K.put(B(1.1,1.8,.2),'jaaliPink',sx*(8.6),3+i*4.6,1.32);
  const name=canvasPlane(12.5,2.2,1250,220,(x,w,h)=>{ x.fillStyle='#712846'; x.fillRect(0,0,w,h); x.fillStyle='#ffffff'; x.font=FONT(800,92); x.textAlign='center'; x.textBaseline='middle'; x.fillText('A PARK THAT THINKS',w/2,h*.43); x.font=FONT(600,34); x.fillStyle='#ffd3df'; x.fillText('LUCKNOW · प्रकृति और AI',w/2,h*.82); });
  name.material.transparent=false; K.obj(name,0,16.6,1.32); const back=name.clone(); K.obj(back,0,16.6,-1.32,PI);
  Cx.colB.push({x:-8.55,z:Z,hw:1.95,hd:1.4,c:1,s:0},{x:8.55,z:Z,hw:1.95,hd:1.4,c:1,s:0});
}
function gantries(Cx){ const G=[['learn',[-57,40],[-1,0]],['unlearn',[53,40],[1,0]],['novelty',[0,-28],[0,-1]],['env',[-61,-65.5],[-72,-30]],['sports',[59.5,-57],[70,-20]],['everyday',[30,120],[60,-2]],['defence',[-76,121.3],[-44,2]]];
  for(const [z,[x,zz],d] of G){ const rot=Math.atan2(d[0],d[1]), K=Cx.worldKit(x,zz,rot), col=Cx.ZONES[z].color, nm=Cx.ZONES[z].name.toUpperCase();
    for(const sx of [-1,1]){ K.put(B(.5,7.2,.5),'z_'+z,sx*4.6,3.6,0,0,0,sx*-.06); K.put(B(.56,.08,.56),'pinkGlow',sx*4.6,.4,0); K.circ(sx*4.6,0,.45); }
    K.put(B(10.4,1.7,.5),'darksteel',0,6.6,0); K.put(B(10.4,.08,.56),'pinkGlow',0,5.72,0);
    K.put(signGeo(nm,col,9.8,1.25),'signs',0,6.65,.26); K.put(signGeo(nm,col,9.8,1.25),'signs',0,6.65,-.26,PI); }
}
function zonePads(Cx){ const M=Cx.M; const mk=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
  M.rubberTeal=mk('#3d8577'); M.rubberOrange=mk('#c9774a'); M.novFloor=mk('#3a2f52',{roughness:.5,metalness:.2}); M.envFloor=mk('#9c8a66'); M.learnFloor=mk('#d9cdb8');
  const skip={canopy:1,hall:1,amphi:1,forest:1,megaphone:1,cityfloor:1,pillars:1,nightgarden:1,peepal:1};
  Cx.STS.forEach((st,i)=>{ if(skip[st.kind]) return; const K=Cx.kitFor(st); const z=st.zone; let mat=null, r=Math.min(st.reach+2.2,16);
    if(z==='sports') mat=i%2?'rubberTeal':'rubberOrange'; else if(z==='novelty') mat='novFloor'; else if(z==='env'&&st.kind!=='board') { mat='envFloor'; r=Math.min(r,9); } if(!mat) return;
    if(st.kind==='sprint'||st.kind==='lane'||st.kind==='nets'){ const w=st.kind==='nets'?16:st.kind==='sprint'?8:6.5, d=st.kind==='nets'?26:st.kind==='sprint'?40:19; K.put(new THREE.BoxGeometry(w,.04,d),mat,0,.02,0); K.put(new THREE.BoxGeometry(w+.3,.03,d+.3),'z_'+z,0,.012,0); return; }
    K.put(new THREE.CylinderGeometry(r,r,.04,48),mat,0,.02,0); K.put(new THREE.CylinderGeometry(r+.25,r+.25,.03,48),'z_'+z,0,.012,0); });
  // a sports plaza ring at the hub
  const [hx,hz]=Cx.ZONES.sports.hub, K2=Cx.worldKit(hx,hz,0); K2.put(new THREE.CylinderGeometry(11,11,.04,48),'rubberOrange',0,.02,0); K2.put(new THREE.TorusGeometry(10.6,.12,6,64).rotateX(PI/2),'pinkGlow',0,.05,0);
  const [nx,nz]=Cx.ZONES.novelty.hub, K3=Cx.worldKit(nx,nz,0); K3.put(new THREE.CylinderGeometry(10,10,.04,48),'novFloor',0,.02,0); K3.put(new THREE.TorusGeometry(9.6,.12,6,64).rotateX(PI/2),'pinkGlow',0,.05,0);
}
function canopyGlow(Cx){ const st=Cx.STS.find(s=>s.kind==='canopy'); const K=Cx.kitFor(st);
  for(let t=0;t<8;t++){ const a=t/8*PI*2+PI/8, R=t%2?17:13, H=15+((t*7)%4), lx=Math.cos(a)*R, lz=Math.sin(a)*R;
    K.put(Cy(2.1,2.3,.55,32),'marble',lx,.28,lz); K.put(new THREE.TorusGeometry(2.0,.05,6,48).rotateX(PI/2),'warmGlow',lx,.58,lz);
    for(let k=0;k<6;k++){ const ka=k/6*PI*2; K.put(Sp(.45,1),k%2?'leaf':'awningGold',lx+Math.cos(ka)*1.6,.75,lz+Math.sin(ka)*1.6); }
    const hp=[]; for(let i=0;i<=50;i++){ const u=i/50, y=.6+u*(H-2.4), r=.95-(.5)*u+.06, ang=u*PI*6+t; hp.push(V3(lx+Math.cos(ang)*r,y,lz+Math.sin(ang)*r)); }
    K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp),120,.04,5),'pinkGlow',0,0,0); }
}

/* ---------- planting: neem, ashoka and gulmohar, plus marigold beds ---------- */
function trees(Cx,list){ const scene=Cx.scene, low=Cx.low, M=Cx.M;
  const merge=(arr)=>THREE.BufferGeometryUtils.mergeBufferGeometries(arr.map(g=>{ const n=g.index?g.toNonIndexed():g; for(const a of Object.keys(n.attributes)) if(!['position','normal'].includes(a)) n.deleteAttribute(a); return n; }));
  const neem=merge([Sp(1.7,1).translate(0,0,0),Sp(1.3,1).translate(1.1,-.3,.4),Sp(1.25,1).translate(-.9,-.2,-.6),Sp(1.1,1).translate(.2,.7,-.9)]);
  const ashoka=merge([new THREE.ConeGeometry(1.2,3.2,7).translate(0,0,0),new THREE.ConeGeometry(1.0,2.6,7).translate(0,1.6,0),new THREE.ConeGeometry(.75,2.0,7).translate(0,3,0)]);
  const gulC=merge([Sp(2.3,1).scale(1,.42,1),Sp(1.6,1).scale(1,.5,1).translate(1.4,-.2,.6),Sp(1.5,1).scale(1,.5,1).translate(-1.3,-.1,-.7)]);
  const flw=[]; for(let i=0;i<26;i++){ const a=Math.random()*PI*2, r=Math.random()*2.3; flw.push(Sp(.32+Math.random()*.2,0).translate(Math.cos(a)*r,.55+Math.random()*.4,Math.sin(a)*r)); } const gulF=merge(flw);
  const trunkG=Cy(.16,.28,3,7).translate(0,1.5,0);
  const sets={neem:[],ashoka:[],gul:[]};
  list.forEach((t,i)=>{ const k=t.k===1||t.edge?'ashoka':(t.far?(i%3?'neem':'ashoka'):(i%5===0?'gul':'neem')); sets[k].push(t); });
  const fm=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,flatShading:true},o||{}));
  const d=new THREE.Object3D(); const crownCols={neem:['#5d8c3e','#4f7f37','#6a9a48','#557d3a','#678f3f'],ashoka:['#2f5f2a','#3a6b30','#2b5626'],gul:['#5f9440','#6aa04a','#7aa850']};
  const mkIM=(g,m,n)=>{ const im=new THREE.InstancedMesh(g,m,n); im.castShadow=!low; im.receiveShadow=true; im.frustumCulled=false; scene.add(im); return im; };
  for(const k of ['neem','ashoka','gul']){ const L=sets[k]; if(!L.length) continue;
    const tr=mkIM(trunkG,M.bark,L.length), cr=mkIM(k==='neem'?neem:k==='ashoka'?ashoka:gulC,fm('#ffffff'),L.length), fl=k==='gul'?mkIM(gulF,fm('#e8552f',{emissive:'#3a0a00'}),L.length):null;
    const cols=crownCols[k].map(c=>new THREE.Color(c));
    L.forEach((t,i)=>{ const s=t.s, ry=Math.random()*6;
      const th=k==='ashoka'?1.6:k==='gul'?1.25:1.1; d.position.set(t.x,0,t.z); d.rotation.set(0,ry,0); d.scale.set(s,s*th,s); d.updateMatrix(); tr.setMatrixAt(i,d.matrix);
      const cyv=k==='ashoka'?3.6*s:k==='gul'?4.3*s:3.9*s; d.position.set(t.x,cyv,t.z); d.scale.set(s*(k==='gul'?1.15:1),s*(k==='ashoka'?1.25:1),s*(k==='gul'?1.15:1)); d.updateMatrix(); cr.setMatrixAt(i,d.matrix); if(fl) fl.setMatrixAt(i,d.matrix);
      cr.setColorAt(i,cols[i%cols.length]); if(!t.far) Cx.colC.push({x:t.x,z:t.z,r:.35*s}); });
  }
}
function flowers(Cx){ const {N,E}=Cx.paths, scene=Cx.scene; const main=[['gate','p1'],['p1','c'],['c','cn'],['cn','n'],['c','l'],['c','u'],['p1','ev'],['p1','ng']]; const P=[];
  for(const [a,b] of main){ const A=N[a],B2=N[b], len=Math.hypot(B2[0]-A[0],B2[1]-A[1]), ux=(B2[0]-A[0])/len, uz=(B2[1]-A[1])/len;
    for(let d=6;d<len-6;d+=Cx.low?.9:.55) for(const side of [-1,1]) for(const off of [2.6,3.1]){ if(Math.random()<.15) continue; P.push([A[0]+ux*d-uz*side*(off+Math.random()*.15),A[1]+uz*d+ux*side*(off+Math.random()*.15),(Math.floor(d/7)+(side>0?1:0))%3]); } }
  const im=new THREE.InstancedMesh(Sp(.17,0),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.7}),P.length), lv=new THREE.InstancedMesh(Sp(.2,0),new THREE.MeshStandardMaterial({color:'#4f7f37',roughness:.9,flatShading:true}),P.length);
  const cols=['#f39c12','#f7c531','#e0567f'].map(c=>new THREE.Color(c)), d=new THREE.Object3D();
  P.forEach(([x,z,c],i)=>{ d.position.set(x,.32,z); d.rotation.set(0,i,0); d.scale.setScalar(.8+Math.random()*.5); d.updateMatrix(); im.setMatrixAt(i,d.matrix); im.setColorAt(i,cols[c]); d.position.y=.12; d.scale.set(1.3,.6,1.3); d.updateMatrix(); lv.setMatrixAt(i,d.matrix); });
  [im,lv].forEach(m=>{ m.frustumCulled=false; scene.add(m); });
}

return {
  init(Cx){ C=Cx; mats(Cx.M); Object.assign(window.ParkBuilders,OV); },
  world(Cx){ gateArch(Cx,Cx.Z1); gantries(Cx); zonePads(Cx); canopyGlow(Cx); flowers(Cx);
    const redraw=()=>{ sign.ctx.clearRect(0,0,2048,2048); sign.slots.forEach(drawSlot); sign.tex.needsUpdate=true; };
    sign.tex.needsUpdate=true; if(document.fonts&&document.fonts.ready) document.fonts.ready.then(redraw); },
  trees,
  h:{seg,aim,horn,signGeo,canvasPlane,lerp},
};
})();
