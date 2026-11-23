/* Art pass two: the robotics zone (arena, robot arms, a robot dog, a greeter), the sports zone stations,
   glass dome pods, totems and screen walls, the cloud sculpture and the defence hall facade. */
window.ParkArt2=(function(){
'use strict';
const PI=Math.PI, V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d), Cy=(a,b,h,s=16,o=false)=>new THREE.CylinderGeometry(a,b,h,s,1,o), Sp=(r,d=1)=>new THREE.IcosahedronGeometry(r,d);
const H=()=>window.ParkArt.h;
const FONT=(w,px)=>`${w} ${px}px Manrope, Inter, system-ui, sans-serif`;
const mesh=(g,m,cast=true)=>{ const o=new THREE.Mesh(g,m); o.castShadow=cast; o.receiveShadow=true; return o; };

/* an articulated robot arm: base, turret, shoulder, elbow, wrist; returns joints to animate */
function robotArm(Cx,K,lx,ly,lz,ry,sc,colKey){ const M=Cx.M, col=M[colKey]||M.pinkMetal;
  const g=new THREE.Group(); g.scale.setScalar(sc);
  g.add(mesh(Cy(.26,.32,.16,24),M.darksteel)); const tur=new THREE.Group(); tur.position.y=.08; g.add(tur);
  const tb=mesh(Cy(.2,.22,.3,20),col); tb.position.y=.15; tur.add(tb); const ring=mesh(new THREE.TorusGeometry(.21,.025,6,24).rotateX(PI/2),M.pinkGlow,false); ring.position.y=.31; tur.add(ring);
  const sh=new THREE.Group(); sh.position.y=.34; tur.add(sh); const j1=mesh(Cy(.13,.13,.34,16).rotateZ(PI/2),M.chrome); sh.add(j1);
  const up=mesh(B(.16,.7,.16),col); up.position.y=.35; sh.add(up);
  const el=new THREE.Group(); el.position.y=.7; sh.add(el); const j2=mesh(Cy(.1,.1,.26,14).rotateZ(PI/2),M.chrome); el.add(j2);
  const fo=mesh(B(.12,.6,.12),M.marble); fo.position.y=.3; el.add(fo);
  const wr=new THREE.Group(); wr.position.y=.6; el.add(wr); wr.add(mesh(Sp(.08,1),M.darksteel));
  const f1=mesh(B(.04,.16,.06),M.chrome), f2=f1.clone(); f1.position.set(-.05,.1,0); f2.position.set(.05,.1,0); wr.add(f1,f2); const led=mesh(Sp(.03,0),M.pinkGlow,false); led.position.set(0,.02,.08); wr.add(led);
  K.obj(g,lx,ly,lz,ry); g.traverse(o=>{ if(o.isMesh){ o.castShadow=!Cx.low; } });
  return {g,tur,sh,el,wr,f1,f2};
}

const OV={};
/* the robot arena: a wave-roof pavilion with an LED floor */
OV.arena=(st,K,Cx)=>{ const w=30,d=18;
  const ft=document.createElement('canvas'); ft.width=1024; ft.height=640; const x=ft.getContext('2d'); x.fillStyle='#1b1d26'; x.fillRect(0,0,1024,640);
  const hx=(cx,cy,r)=>{ x.beginPath(); for(let i=0;i<6;i++){ const a=i/6*PI*2+PI/6; x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } x.closePath(); };
  for(let r=0;r<16;r++) for(let c=0;c<26;c++){ const cx=c*40+(r%2)*20, cy=r*40; hx(cx,cy,21); x.strokeStyle='rgba(106,75,163,.55)'; x.lineWidth=2; x.stroke(); if((r*7+c*3)%11===0){ x.fillStyle='rgba(211,49,99,.35)'; x.fill(); } }
  x.fillStyle='rgba(255,255,255,.9)'; x.font=FONT(800,70); x.textAlign='center'; x.fillText('ROBOT ARENA',512,600);
  const t=new THREE.CanvasTexture(ft); t.encoding=THREE.sRGBEncoding; t.anisotropy=8;
  const fm=new THREE.MeshStandardMaterial({map:t,roughness:.35,metalness:.2,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.25});
  const fl=mesh(new THREE.PlaneGeometry(w,d),fm,false); fl.rotation.x=-PI/2; const flg=new THREE.Group(); flg.add(fl); K.obj(flg,0,.21,0); K.put(B(w+.6,.2,d+.6),'darksteel',0,.1,0);
  // columns and a roof of five shallow vaults
  for(let i=0;i<=5;i++){ const px=-w/2+i*w/5; for(const pz of [-d/2,d/2]){ K.put(Cy(.18,.24,4.85,12),'chrome',px,2.43,pz); K.circ(px,pz,.4); } }
  for(let i=0;i<5;i++){ const px=-w/2+(i+.5)*w/5; const v=new THREE.CylinderGeometry(3.5,3.5,d+2,28,1,true,PI-1.05,2.1); v.rotateX(PI/2); K.put(v,'marble',px,3.05,0);
    const vi=new THREE.CylinderGeometry(3.46,3.46,d+2,28,1,true,PI-1.05,2.1); vi.rotateX(PI/2); K.put(vi,'plumMetal',px,3.05,0);
    if(i<4) K.put(B(.16,.16,d+2),'pinkGlow',px+3,4.85,0); }
  K.put(B(w+2,.5,.5),'plumMetal',0,6.3,-d/2-.5); K.put(B(w+2,.5,.5),'plumMetal',0,6.3,d/2+.5);
  K.put(window.ParkArt.h.signGeo('ROBOT ARENA',Cx.ZONES[st.zone].color,9,1.1),'signs',0,7.25,d/2+.55); K.put(B(9.4,1.3,.3),'darksteel',0,7.25,d/2+.35);
  // a robot dog patrols the floor and a greeter waves at the front
  const M=Cx.M, dog=new THREE.Group(); const body=mesh(B(.5,.28,1),M.marble); body.position.y=.62; dog.add(body); const head=mesh(B(.34,.26,.36),M.plumMetal); head.position.set(0,.8,.6); dog.add(head);
  const eye=mesh(B(.26,.06,.02),M.pinkGlow,false); eye.position.set(0,.82,.79); dog.add(eye); const legs=[];
  for(const [lx,lz] of [[-.22,-.38],[.22,-.38],[-.22,.38],[.22,.38]]){ const lg=new THREE.Group(); lg.position.set(lx,.55,lz); const a=mesh(B(.1,.32,.1),M.darksteel); a.position.y=-.16; lg.add(a); const b2=mesh(B(.08,.3,.08),M.chrome); b2.position.set(0,-.45,.05); lg.add(b2); dog.add(lg); legs.push(lg); }
  Cx.scene.add(dog);
  const gr=new THREE.Group(); const gb=mesh(Cy(.38,.5,1.1,24),M.plumMetal); gb.position.y=.75; gr.add(gb); const gh=mesh(new THREE.SphereGeometry(.42,24,16),M.marble); gh.position.y=1.62; gr.add(gh);
  const visor=mesh(new THREE.SphereGeometry(.43,24,12,-PI*.35,PI*.7,PI*.35,PI*.25),M.pinkGlow,false); visor.position.y=1.62; gr.add(visor);
  const arm=new THREE.Group(); arm.position.set(.5,1.15,0); const am=mesh(B(.12,.6,.12),M.marble); am.position.y=-.3; arm.add(am); gr.add(arm); const arm2=arm.clone(); arm2.position.x=-.5; gr.add(arm2);
  const base=mesh(Cy(.55,.6,.2,24),M.darksteel); base.position.y=.1; gr.add(base); K.obj(gr,-13.2,.2,d/2-1.2,0); K.circ(-13.2,d/2-1.2,.7);
  Cx.anim.push((t)=>{ if(!Cx.state.near(st,70)) return; const a=t*.22; const lx=Math.cos(a)*9, lz=Math.sin(a)*4.2; const [wx,wz]=Cx.toWorld(st,lx,lz); dog.position.set(wx,.21,wz);
    dog.rotation.y=st.rot+Math.atan2(-Math.sin(a)*9,Math.cos(a)*4.2); legs.forEach((lg,i)=>lg.rotation.x=Math.sin(t*7+(i%2?PI:0)+(i>1?PI:0))*.45); body.position.y=.62+Math.abs(Math.sin(t*7))*.02;
    arm.rotation.z=2.4+Math.sin(t*4)*.35; gr.rotation.y=st.rot+Math.sin(t*.5)*.5; gh.rotation.y=Math.sin(t*.9)*.3; visor.rotation.y=gh.rotation.y; });
};
/* robot tables: each game has its own articulated arm */
OV.table=(st,K,Cx)=>{ const id=st.id, M=Cx.M, h=H();
  if(id==='inteltable'){ K.put(B(4.4,.9,2.8),'darksteel',0,.45,0); K.put(B(4.2,.06,2.6),'screen2',0,.93,0); K.put(B(4.5,.05,2.9),'pinkGlow',0,.9,0); K.box(0,0,2.3,1.5); return; }
  if(id==='machinesees'){ K.put(B(4.4,.9,3),'wood',0,.45,0); K.put(B(4.2,.12,2.8),'sand',0,.95,0); for(let i=0;i<6;i++) K.put(B(.3+.2*(i%2),.18,.16+.1*(i%2)),i%2?'red':'plant',-1.5+i*.6,1.1,-.6+(i%3)*.5); K.put(Cy(.04,.04,2.2,6),'darksteel',1.9,1.6,-1.2); K.put(B(.3,.2,.3),'white',1.9,2.7,-1.2); K.box(0,0,2.3,1.6); return; }
  // a sleek plinth table
  K.put(B(2.5,.1,1.7),'marble',0,.86,0); K.put(B(2.1,.8,1.3),'plumMetal',0,.42,0); K.put(B(2.52,.04,1.72),'pinkGlow',0,.8,0); K.put(Cy(1.6,1.6,.06,32),'darksteel',0,.03,0);
  if(id==='carrom') K.put(B(1.6,.1,1.6),'carromtop',0,.9,0);
  if(id==='calligraphy') K.put(B(1.4,.02,.9),'white',0,.92,0);
  if(id==='tabla'){ K.put(Cy(.22,.18,.35,16),'wood',-.3,1.07,.1); K.put(Cy(.26,.22,.32,16),'darksteel',.3,1.06,.1); }
  if(id==='exo'){ K.put(B(.06,1.1,1.6),'chrome',-1,1.1,0); K.put(B(.06,1.1,1.6),'chrome',1,1.1,0); }
  K.put(Cy(.04,.04,.9,8),'darksteel',0,1.35,-.95); h.seg; K.put(B(1.56,.86,.06),'darksteel',0,1.7,-.98);
  K.put(h.signGeo(st.name,Cx.ZONES[st.zone].color,2.3,.3),'signs',0,.42,.66);
  K.box(0,0,1.25,.85);
  if(id==='exo') return;
  const arms=[]; if(id==='tabla'){ arms.push(robotArm(Cx,K,-.75,.9,-.45,.4,.55,'pinkMetal'),robotArm(Cx,K,.75,.9,-.45,-.4,.55,'plumMetal')); }
  else arms.push(robotArm(Cx,K,.85,.9,-.45,-.5,id==='chai'?.8:.7,id==='chai'?'plumMetal':'pinkMetal'));
  if(id==='chai'){ const k=mesh(Cy(.12,.15,.22,14),M.chrome); k.position.set(0,.2,.12); k.rotation.x=PI/2; arms[0].wr.add(k); K.put(Cy(.07,.06,.12,10),'white',-.2,.98,.3); K.put(Cy(.07,.06,.12,10),'white',.1,.98,.35); }
  if(id==='calligraphy'){ const pen=mesh(Cy(.015,.015,.3,6),M.darksteel); pen.position.y=.2; arms[0].wr.add(pen); }
  Cx.anim.push((t)=>{ if(!Cx.state.near(st,45)) return;
    arms.forEach((a,i)=>{ let tu=0,sh=.6,el=1.2,wr=.6;
      if(id==='carrom'){ const u=(t%4.5)/4.5; tu=.9+Math.sin(t*.7)*.35; sh=.75; el=1.35+(u<.3?Math.sin(u/.3*PI)*.3:0); wr=.5; }
      else if(id==='calligraphy'){ tu=.8+Math.sin(t*1.6)*.25; sh=.8+Math.sin(t*3.2)*.08; el=1.5; wr=.35; }
      else if(id==='chai'){ const u=(t%8)/8; tu=.6+(u<.5?u:1-u)*.8; sh=.55; el=1.1; wr=u>.35&&u<.6?1.6:.4; }
      else if(id==='tabla'){ tu=i?-.7:.7; sh=.9; el=1.2+Math.abs(Math.sin(t*9+i*1.3))*.35; wr=.5; }
      a.tur.rotation.y=tu; a.sh.rotation.x=sh; a.el.rotation.x=el; a.wr.rotation.x=wr; const g=.03+Math.abs(Math.sin(t*2))*.03; a.f1.position.x=-g; a.f2.position.x=g; }); });
};
/* the garden that tends itself: an industrial arm, raised beds and a banyan with aerial roots */
OV.gardener=(st,K,Cx)=>{ const M=Cx.M;
  K.put(Cy(16,16,.06,64),'turf2',0,.03,0); K.put(new THREE.TorusGeometry(16,.12,6,96).rotateX(PI/2),'marble',0,.08,0);
  K.put(Cy(1,1.6,6,14),'bark',0,3,-6); for(let i=0;i<9;i++){ const a=i/9*PI*2; K.put(Sp(2.6+(i%3)*.5,1),i%2?'leaf':'leafdark',Math.cos(a)*3.8,7+(i%2),-6+Math.sin(a)*3.8); } K.put(Sp(3.6,1),'leafdark',0,8.8,-6); K.circ(0,-6,1.7);
  for(let i=0;i<16;i++){ const a=i/16*PI*2, r=2.2+(i%3)*.9; K.put(Cy(.04,.07,6.2-(i%4)*.6,5),'bark',Math.cos(a)*r,3.1-(i%4)*.3,-6+Math.sin(a)*r); }
  K.put(Cy(.9,1.1,1.1,24),'darksteel',5,.55,-6); K.circ(5,-6,1.2);
  const arm=robotArm(Cx,K,5,1.1,-6,0,3.2,'awningGold');
  const beds=[[-9,4],[-3,6],[3,6],[9,4]], bots=[];
  beds.forEach(([x,z],i)=>{ K.put(B(5,.6,2.2),'marble2',x,.3,z); K.put(B(4.8,.06,2),'soil',x,.62,z); K.put(B(5.02,.05,2.22),'pinkGlow',x,.62,z);
    for(let k=0;k<9;k++) K.put(Sp(.24+(k%3)*.06,0),k%4===0?'awningGold':'plant',x-2.1+k*.52,.82,z+((k%2)-.5)*.6); K.box(x,z,2.5,1.1);
    const r=new THREE.Group(); const body=mesh(Sp(.38,2).scale(1,.62,1.25),M.marble); body.position.y=.4; r.add(body);
    const top=mesh(Cy(.18,.18,.12,16),M.plumMetal); top.position.y=.66; r.add(top); const eye=mesh(B(.3,.06,.02),M.pinkGlow,false); eye.position.set(0,.45,.42); r.add(eye);
    for(const wx of [-.32,.32]) for(const wz of [-.25,.25]){ const wh=mesh(Cy(.13,.13,.08,14).rotateZ(PI/2),M.darksteel); wh.position.set(wx,.13,wz); r.add(wh); }
    const mast=mesh(Cy(.02,.02,.4,6),M.chrome); mast.position.set(.12,.85,-.1); r.add(mast); const tip=mesh(Sp(.05,0),M.pinkGlow,false); tip.position.set(.12,1.07,-.1); r.add(tip);
    Cx.scene.add(r); bots.push({r,x,z:z+1.8,ph:i*1.3}); });
  Cx.anim.push(t=>{ if(!Cx.state.near(st,80)) return; arm.tur.rotation.y=Math.sin(t*.25)*.9-1.2; arm.sh.rotation.x=.5+Math.sin(t*.4)*.25; arm.el.rotation.x=1.1+Math.sin(t*.55)*.3; arm.wr.rotation.x=.6;
    bots.forEach(o=>{ const lx=o.x+Math.sin(t*.4+o.ph)*2.2; const [wx,wz]=Cx.toWorld(st,lx,o.z); o.r.position.set(wx,0,wz); o.r.rotation.y=st.rot+(Math.cos(t*.4+o.ph)>0?PI/2:-PI/2); }); });
};
/* AI bowler nets: proper pitches, a bowling machine per lane, side screens */
OV.nets=(st,K,Cx)=>{ const L=22;
  for(let i=0;i<3;i++){ const x=-4.4+i*4.4;
    K.put(B(4.2,.06,L),'turf2',x,.03,0); K.put(B(1.6,.03,L-4),'sand',x,.075,0); K.put(B(1.6,.02,.06),'white',x,.1,L/2-3.2); K.put(B(1.6,.02,.06),'white',x,.1,-L/2+3.2);
    K.put(B(1,1.1,1.3),'plumMetal',x,.75,-L/2+1.3); K.put(Cy(.32,.32,.14,20).rotateZ(PI/2),'chrome',x-.2,1.2,-L/2+1.7); K.put(Cy(.32,.32,.14,20).rotateZ(PI/2),'chrome',x+.2,1.2,-L/2+1.7); K.put(B(.6,.1,.8),'pinkGlow',x,1.32,-L/2+1.3);
    K.put(B(.2,.5,.2),'darksteel',x,.25,-L/2+1.3);
    for(const s of [-.12,0,.12]) K.put(Cy(.02,.02,.71,6),'marble',x+s,.36,L/2-2); K.put(B(.32,.03,.03),'gold',x,.73,L/2-2);
  }
  for(const x of [-6.6,-2.2,2.2,6.6]){ K.put(B(.04,4,L),'fence',x,2,0); K.box(x,0,.12,L/2); for(let k=0;k<=4;k++) K.put(Cy(.05,.05,4.1,6),'chrome',x,2.05,-L/2+k*L/4); }
  K.put(B(13.2,4,.04),'fence',0,2,-L/2); K.box(0,-L/2,6.6,.12); K.put(B(13.2,.04,L),'fence',0,4,0); K.put(B(13.4,.1,.1),'pinkGlow',0,4.05,L/2);
  K.put(B(4.6,2.4,.25),'darksteel',9.2,2.5,4); K.put(B(.2,1.4,.2),'darksteel',9.2,.7,4); const H2=H();
  const sc=H2.canvasPlane(4.4,2.2,440,220,(g,w,h)=>{ g.fillStyle='#0d1216'; g.fillRect(0,0,w,h); g.fillStyle='#6a4ba3'; g.fillRect(0,0,w,40); g.fillStyle='#fff'; g.font=FONT(800,24); g.fillText('AI BOWLER · LANE 2',16,28);
    g.font=FONT(700,26); [['Speed','118 km/h'],['Line','off stump'],['Length','good'],['Coach','Head still. Play late.']].forEach(([a,b],i)=>{ g.fillStyle='#9aa3ad'; g.fillText(a,16,80+i*40); g.fillStyle='#fff'; g.fillText(b,150,80+i*40); }); });
  K.obj(sc,9.2,2.5,4.14);
  K.put(H2.signGeo('THE AI BOWLER',Cx.ZONES[st.zone].color,6,.75),'signs',0,4.6,L/2);
};
/* football skills cage */
OV.cage=(st,K,Cx)=>{ K.put(B(10,.08,8),'turf2',0,.04,0); K.put(B(10,.02,.08),'white',0,.09,2); K.put(new THREE.RingGeometry(1.4,1.5,32,1,0,PI).rotateX(-PI/2),'white',0,.1,2);
  for(const [x,z] of [[-5,-4],[5,-4],[-5,4],[5,4]]) K.put(Cy(.08,.08,4,8),'chrome',x,2,z);
  K.put(B(10,4,.04),'fence',0,2,-4); K.put(B(.04,4,8),'fence',-5,2,0); K.put(B(.04,4,8),'fence',5,2,0); K.put(B(10,.04,8),'fence',0,4,0); K.put(B(10.2,.1,.1),'pinkGlow',0,4.05,4);
  K.put(B(9.6,3.4,.15),'darksteel',0,1.85,-4.05);
  const pads=[]; for(let i=0;i<6;i++){ const m=mesh(B(1.2,1.2,.08),Cx.M.ledoff,false); K.obj(m,-3.5+i*1.4,1.2+(i%2)*1.4,-3.9); pads.push(m); }
  const on=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ff3b7a',emissiveIntensity:1.6});
  Cx.anim.push(t=>{ const k=Math.floor(t*1.3)%6; pads.forEach((m,i)=>m.material=i===k?on:Cx.M.ledoff); });
  K.box(0,-4,5,.15); K.box(-5,0,.15,4); K.box(5,0,.15,4);
  K.put(H().signGeo(st.name,Cx.ZONES[st.zone].color,4.2,.55),'signs',0,4.5,4.02);
};
/* basketball and boccia lanes */
OV.lane=(st,K,Cx)=>{ const bb=st.id==='basketball';
  K.put(B(3.8,.08,16.4),'darksteel',0,.03,0); K.put(B(3.6,.06,16),bb?'court':'court2',0,.07,0); K.put(B(.06,.02,16),'white',-1.75,.11,0); K.put(B(.06,.02,16),'white',1.75,.11,0);
  if(bb){ K.put(Cy(.12,.14,3.6,10),'darksteel',0,1.8,-8.4); K.put(B(.12,.12,1),'darksteel',0,3.55,-8); K.put(B(1.8,1.1,.06),'glass',0,3.4,-7.6); K.put(B(1.84,.06,.08),'pinkGlow',0,2.86,-7.6); K.put(new THREE.TorusGeometry(.23,.03,6,16),'red',0,3.05,-7.3,0,PI/2); K.circ(0,-8.4,.3); }
  else { K.put(B(3.9,.25,.15),'marble',0,.12,-8.1); K.put(B(.15,.25,16.2),'marble',-1.92,.12,0); K.put(B(.15,.25,16.2),'marble',1.92,.12,0); K.put(Sp(.12,1),'white',0,.2,-6); for(let i=0;i<6;i++) K.put(Sp(.14,1),i%2?'red':'blue',-.6+((i*37)%10)/8,.2,-6.8+((i*53)%10)/6); }
  K.put(H().signGeo(st.name,Cx.ZONES[st.zone].color,3.4,.45),'signs',0,.45,8.35);
};
/* kabaddi: keep the LED floor, add a mat border and posts */
const baseKabaddi=window.ParkBuilders.kabaddi;
OV.kabaddi=(st,K,Cx)=>{ baseKabaddi(st,K,Cx); K.put(B(9.8,.1,9.8),'awningGold',0,.01,0); for(const [x,z] of [[-4.9,-4.9],[4.9,-4.9],[-4.9,4.9],[4.9,4.9]]){ K.put(Cy(.1,.1,2.4,8),'chrome',x,1.2,z); K.put(Sp(.16,1),'pinkGlow',x,2.45,z); K.circ(x,z,.25); }
  K.put(H().signGeo('KABADDI REACTION ARENA',Cx.ZONES[st.zone].color,5,.6),'signs',0,2.2,-4.95); K.put(B(5.2,.75,.1),'darksteel',0,2.2,-5.02); };
/* AR yoga deck */
OV.yoga=(st,K,Cx)=>{ K.put(B(15,.2,11),'wood',0,.1,0); for(let i=0;i<14;i++) K.put(B(15,.01,.04),'darksteel',0,.205,-5.4+i*.8);
  for(let i=0;i<8;i++) K.put(B(.7,.03,1.8),'mat'+(i%3),-4.5+(i%4)*3,.23,-1+Math.floor(i/4)*3+.2);
  const c=document.createElement('canvas'); c.width=640; c.height=360; const x=c.getContext('2d'); x.fillStyle='#0f2027'; x.fillRect(0,0,640,360); x.strokeStyle='#7ee0c3'; x.lineWidth=7; x.lineCap='round';
  const P=[[320,80],[320,190],[250,120],[390,120],[270,320],[370,320]]; x.beginPath(); x.arc(320,55,22,0,7); x.stroke(); [[0,1],[0,2],[0,3],[1,4],[1,5]].forEach(([a,b])=>{ x.beginPath(); x.moveTo(...P[a]); x.lineTo(...P[b]); x.stroke(); });
  x.fillStyle='#fff'; x.font=FONT(700,26); x.fillText('Tree pose · 92 / 100',28,340); x.fillStyle='#d33163'; x.fillRect(0,0,640,8);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const m=new THREE.Mesh(new THREE.PlaneGeometry(6,3.4),new THREE.MeshBasicMaterial({map:t,toneMapped:false})); K.obj(m,0,2.6,-5.38);
  K.put(B(6.4,3.8,.25),'darksteel',0,2.6,-5.55); K.put(B(6.5,.08,.3),'pinkGlow',0,4.55,-5.55); K.put(B(.25,1,.25),'chrome',-2.2,.7,-5.55); K.put(B(.25,1,.25),'chrome',2.2,.7,-5.55); K.box(0,-5.55,3.2,.2);
  for(const sx of [-1,1]) for(let i=0;i<3;i++){ K.put(B(.8,.6,.8),'marble2',sx*7,.5,-4+i*4); K.put(Sp(.5,1),'leaf',sx*7,1.1,-4+i*4); }
  K.plat(0,0,0,.2,7.5,5.5);
};
/* power bikes under a solar shade */
OV.bikes=(st,K,Cx)=>{ K.put(B(13,.12,4),'marble2',0,.06,0);
  for(let i=0;i<6;i++){ const x=-5+i*2; K.put(B(.16,.8,1.1),'plumMetal',x,.55,0,0,.35,0); K.put(new THREE.TorusGeometry(.38,.06,8,24),'darksteel',x,.45,.5,PI/2); K.put(new THREE.TorusGeometry(.3,.025,6,24),'pinkGlow',x,.45,.5,PI/2);
    K.put(B(.34,.08,.3),'darksteel',x,1.1,-.35); K.put(B(.6,.05,.08),'chrome',x,1.28,.5); K.put(Cy(.03,.03,.5,6),'chrome',x,1.05,.45); }
  for(const [x,z] of [[-6.3,-1.8],[6.3,-1.8],[-6.3,1.8],[6.3,1.8]]){ K.put(Cy(.07,.07,3.2,8),'chrome',x,1.6,z); K.circ(x,z,.2); }
  K.put(B(13.4,.12,4.4),'solarpanel',0,3.25,0,0,.08,0); K.put(B(13.6,.08,.08),'pinkGlow',0,3.15,2.2);
  K.put(B(6.2,1.8,.2),'darksteel',0,2.4,-1.7); K.put(B(.2,1.6,.2),'darksteel',-2.8,.8,-1.7); K.put(B(.2,1.6,.2),'darksteel',2.8,.8,-1.7);
  K.box(0,-.3,6.2,1.4);
};
/* glass dome pods with steel ribs */
OV.pod=(st,K,Cx)=>{ K.put(Cy(4.6,4.7,.24,48),'marble2',0,.12,0); K.put(new THREE.TorusGeometry(4.45,.06,6,64).rotateX(PI/2),'pinkGlow',0,.26,0);
  K.put(new THREE.SphereGeometry(4.2,32,14,0,PI*2,0,PI/2),'glass',0,.24,0);
  for(let i=0;i<10;i++){ const tg=new THREE.TorusGeometry(4.22,.045,5,28,PI); K.put(tg,'chrome',0,.24,0,i/10*PI,0,0); }
  for(const [r,y] of [[3.95,1.5],[3.2,2.75],[1.9,3.75]]) K.put(new THREE.TorusGeometry(r,.04,5,48).rotateX(PI/2),'chrome',0,.24+y,0);
  K.put(Cy(.5,.5,.2,20),'z_'+st.zone,0,4.45,0); K.put(Sp(.2,1),'pinkGlow',0,4.6,0);
  K.put(B(3.2,1.8,.1),'darksteel',0,1.7,-3.25);
  if(st.id==='tabletennis'){ K.put(B(1.5,.06,2.7),'court',0,.78,-.6); K.put(B(1.5,.15,.02),'white',0,.88,-.6); K.put(B(1.2,.7,2.3),'darksteel',0,.42,-.6); K.put(B(.4,.5,.4),'plumMetal',0,1.05,-2.1); }
  else if(st.id==='badminton'){ K.put(B(3,.02,4),'court',0,.26,0); K.put(B(3,.6,.02),'fence',0,1.4,-.3); K.put(Cy(.03,.03,1.6,6),'chrome',-1.5,.9,-.3); K.put(Cy(.03,.03,1.6,6),'chrome',1.5,.9,-.3); K.put(B(.5,.9,.5),'plumMetal',0,.7,-2.4); }
  else for(let i=0;i<6;i++){ const a=i/6*PI*2+.3; K.put(Cy(.3,.3,.24,16),'pinkMetal',Math.cos(a)*2,.36,Math.sin(a)*2+.4); }
  K.put(H().signGeo(st.name,Cx.ZONES[st.zone].color,3.4,.45),'signs',0,.6,4.5); K.put(B(3.5,.52,.06),'darksteel',0,.6,4.47);
  K.circ(0,0,4.35); K.plat(0,0,4.6,.24);
};
/* public-service light totems: slim, set wide so they never block the gate view */
OV.psa=(st,K,Cx)=>{ const cols=['#f2b134','#7ec4e8','#e46d8c','#9bd17a'], strips=[];
  for(let i=0;i<4;i++){ const a=i/4*PI*2+PI/4, x=Math.cos(a)*10.5, z=Math.sin(a)*10.5;
    K.put(Cy(.5,.6,.25,20),'marble2',x,.12,z); K.put(Cy(.16,.2,3.3,14),'chrome',x,1.85,z); K.circ(x,z,.5);
    const m=new THREE.Mesh(Cy(.22,.22,2.4,20),new THREE.MeshStandardMaterial({color:'#ffffff',emissive:cols[i],emissiveIntensity:.8,roughness:.3,transparent:true,opacity:.9})); K.obj(m,x,2.1,z); strips.push(m);
    K.put(Sp(.2,1),'pinkGlow',x,3.6,z); }
  Cx.anim.push(t=>{ strips.forEach((m,i)=>{ const c=cols[(Math.floor(t/4)+i)%4]; m.material.emissive.set(c); m.material.color.set(c); m.material.emissiveIntensity=.55+Cx.state.nf*1.2; }); });
};
/* info totems */
OV.board=(st,K,Cx)=>{ const zc=Cx.ZONES[st.zone].color;
  K.put(B(2.8,.3,1.2),'marble2',0,.15,0); K.put(B(2.5,3.6,.22),'plumMetal',0,2.1,0); K.put(B(2.58,.12,.3),'pinkGlow',0,3.95,0); K.put(B(2.56,.08,.28),'z_'+st.zone,0,.36,0);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.65),new THREE.MeshBasicMaterial({map:Cx.tex(st.img),toneMapped:false})); K.obj(p,0,2.55,.12); const p2=p.clone(); K.obj(p2,0,2.55,-.12,PI);
  K.put(H().signGeo(st.name,zc,2.2,.3),'signs',0,1.4,.12); K.put(H().signGeo(st.name,zc,2.2,.3),'signs',0,1.4,-.12,PI);
  K.box(0,0,1.4,.5);
};
/* big screen walls with a frame and light bar */
OV.wall=(st,K,Cx)=>{ K.put(B(11,.4,1.4),'marble2',0,.2,0); K.put(B(10.8,5.2,.5),'plumMetal',0,2.95,-.1); K.put(B(10.9,.1,.6),'pinkGlow',0,5.6,-.1); K.put(B(10.9,.1,.6),'z_'+st.zone,0,.45,-.1);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(10,4.3),new THREE.MeshBasicMaterial({map:Cx.tex(st.img),toneMapped:false})); K.obj(p,0,3.05,.16);
  K.put(H().signGeo(st.name,Cx.ZONES[st.zone].color,4.4,.55),'signs',-2.6,.62,.73); K.box(0,0,5.5,.7);
};

/* additions on top of existing stations */
function cloudSculpture(Cx){ const st=Cx.STS.find(s=>s.kind==='cloud'); if(!st) return; const K=Cx.kitFor(st); let sd=5; const r=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  for(let i=0;i<26;i++){ const x=-7+r()*14, z=-4+r()*8, s=1.2+r()*1.6; K.put(Sp(s,2),'marble',x,5.6+r()*.9,z); }
  for(let i=0;i<10;i++) K.put(Sp(.9+r()*.8,2),'marble',-7.5+i*1.6,5.4,4.6+r()*.3);
  K.put(B(17,.1,.1),'pinkGlow',0,4.9,5.2); K.put(B(17,.1,.1),'pinkGlow',0,4.9,-5.2); }
function hallFacade(Cx){ const st=Cx.STS.find(s=>s.kind==='hall'); if(!st) return; const K=Cx.kitFor(st);
  for(let i=0;i<14;i++){ const x=-16+i*2.46; if(Math.abs(x)<7.5) continue; K.put(B(.35,7.6,1.4),'marble2',x,3.8,12.8); }
  K.put(B(34.6,1.4,1.6),'plumMetal',0,8.5,12.6); K.put(B(34.6,.1,1.7),'pinkGlow',0,7.75,12.6);
  K.put(H().signGeo('LUCKNOW’S OWN DEFENCE STORY',Cx.ZONES[st.zone].color,12,1.3),'signs',0,8.55,13.42);
  K.put(new THREE.TorusGeometry(6.6,.08,6,48,PI),'pinkGlow',0,.2,12.3); }
function labPrints(Cx){ const st=Cx.STS.find(s=>s.id==='lab-built'); if(!st) return; const K=Cx.kitFor(st), w=st.w||16,d=st.d||10;
  for(let i=0;i<10;i++){ const x=-w/2+1.5+(i%5)*(w-3)/4, z=-1.5+Math.floor(i/5)*3; const hgt=.4+((i*7)%5)*.12; K.put(Cy(.04,.12,hgt,6),'chrome',x,.9+hgt/2,z); for(let k=0;k<5;k++){ const a=k/5*PI*2; K.put(B(.28,.02,.08),'pinkMetal',x+Math.cos(a)*.12,.9+hgt,z+Math.sin(a)*.12,-a); } }
  const gan=new THREE.Group(); const M=Cx.M; const rail=mesh(B(.12,.12,4),M.chrome); rail.position.y=2.6; gan.add(rail); const head=mesh(B(.4,.4,.4),M.pinkMetal); head.position.y=2.3; gan.add(head); const noz=mesh(new THREE.ConeGeometry(.08,.25,8).rotateX(PI),M.gold); noz.position.y=2.02; gan.add(noz);
  for(const sz of [-2,2]){ const p=mesh(B(.1,2.6,.1),M.chrome); p.position.set(0,1.3,sz); gan.add(p); } K.obj(gan,w/2-2.5,0,0); K.put(B(2,.8,2),'darksteel',w/2-2.5,.4,0);
  Cx.anim.push(t=>{ if(!Cx.state.near(st,40)) return; head.position.z=Math.sin(t*1.3)*1.4; noz.position.z=head.position.z; head.position.x=Math.sin(t*2.1)*.6; noz.position.x=head.position.x; }); }

return { init(Cx){ Object.assign(window.ParkBuilders,OV); }, world(Cx){ cloudSculpture(Cx); hallFacade(Cx); labPrints(Cx); } };
})();
