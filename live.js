/* Live layer: people using every station, balls in play, and screens that run real content.
   Called once by game.js with the shared context; returns {update(t,dt)}. */
window.ParkLive = function(C){
'use strict';
const PI=Math.PI, rnd=Math.random, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const {scene,state,toWorld,toLocal,STS,ZONES,low}=C;
const byId={}; STS.forEach(s=>byId[s.id]=s);

/* ================= people (instanced, 4 draw calls) ================= */
const MAXA=low?340:580;
const mat=(o)=>new THREE.MeshStandardMaterial(Object.assign({color:'#ffffff',roughness:.8},o||{}));
const iT=new THREE.InstancedMesh(new THREE.BoxGeometry(.42,.6,.24).translate(0,.3,0),mat(),MAXA);
const iH=new THREE.InstancedMesh(new THREE.SphereGeometry(.135,10,8),mat({roughness:.6}),MAXA);
const iL=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,.46,.18).translate(0,-.23,0),mat(),MAXA*2);
const iS=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,.44,.16).translate(0,-.22,.0),mat(),MAXA*2);
const iR=new THREE.InstancedMesh(new THREE.SphereGeometry(.152,10,6,0,PI*2,0,PI*.56),mat({roughness:.9}),MAXA);
const iA=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,.6,.11).translate(0,-.3,0),mat(),MAXA*2);
[iT,iH,iL,iA,iS,iR].forEach(m=>{ m.castShadow=!low; m.receiveShadow=false; m.frustumCulled=false; scene.add(m); });
const SHIRT=['#d33163','#2f6fa5','#e0a030','#4a8a5a','#7a4ea0','#f2eee7','#c2571b','#1f8a8a','#712846','#e8c9d2','#9db7cf','#f4d27a'].map(c=>new THREE.Color(c));
const PANT=['#3a3437','#2d3a55','#5b4a3a','#6f6a62','#1f2a33','#8a7f70'].map(c=>new THREE.Color(c));
const SKIN=['#8a5a44','#a06b4f','#6e4532','#b9805f','#7b4e3a'].map(c=>new THREE.Color(c));
const DIDI=new THREE.Color('#d33163');
const HAIR=['#1d1713','#2b211b','#151210','#3a2a20','#8f8a84'].map(c=>new THREE.Color(c));
const people=[]; let nA=0;
const BASEY={pod:.24,yoga:.2,kiosk:.28,booth:.14,table:.21,arena:.21,helpdesk:.12,hall:.2,cage:.08,court:.06};
function P(st,lx,lz,fy,o){ o=o||{}; if(nA>=MAXA) return null;
  const a={i:nA++,st,lx,lz,fy,y:(o.y||0)+(BASEY[st.kind]||0),s:o.s||(o.kid?.7:.93+rnd()*.12),sit:o.sit?1:0,lA:.06,rA:.06,lL:0,rL:0,kL:.05,kR:.05,lZ:.08,rZ:.08,lean:0,ph:rnd()*9,x:0,z:0,ry:0,w:o.world||false};
  if(a.sit){ a.lL=a.rL=PI/2; a.kL=a.kR=PI/2; }
  const sh=o.shirt||SHIRT[Math.floor(rnd()*SHIRT.length)], pa=PANT[Math.floor(rnd()*PANT.length)];
  iT.setColorAt(a.i,sh); iA.setColorAt(a.i*2,sh); iA.setColorAt(a.i*2+1,sh); iL.setColorAt(a.i*2,pa); iL.setColorAt(a.i*2+1,pa); iS.setColorAt(a.i*2,pa); iS.setColorAt(a.i*2+1,pa); iR.setColorAt(a.i,HAIR[o.kid?0:Math.floor(rnd()*HAIR.length)]); iH.setColorAt(a.i,SKIN[Math.floor(rnd()*SKIN.length)]);
  place(a); people.push(a); return a; }
function place(a){ const [x,z]=toWorld(a.st,a.lx,a.lz); a.x=x; a.z=z; a.ry=a.st.rot+a.fy; }
const face=(a,tx,tz)=>{ a.fy=Math.atan2(tx-a.lx,tz-a.lz); };
const _B=new THREE.Matrix4(), _P=new THREE.Matrix4(), _M=new THREE.Matrix4(), _Q=new THREE.Quaternion(), _E=new THREE.Euler(), _V=new THREE.Vector3(), _S=new THREE.Vector3(), _O=new THREE.Vector3(1,1,1);
function part(m,idx,px,py,pz,rx,rz){ _E.set(rx,0,rz); _Q.setFromEuler(_E); _V.set(px,py,pz); _P.compose(_V,_Q,_O); _M.multiplyMatrices(_B,_P); m.setMatrixAt(idx,_M); }
function write(a){
  _E.set(0,a.ry,0); _Q.setFromEuler(_E); _V.set(a.x,a.y,a.z); _S.set(a.s,a.s,a.s); _B.compose(_V,_Q,_S);
  const hip=a.sit?.48:.88, cl=Math.cos(a.lean), sl=Math.sin(a.lean);
  for(let k=0;k<2;k++){ const L=k?a.rL:a.lL, K=k?a.rK!=null?a.rK:a.kR:a.kL, x=k?.11:-.11;
    part(iL,a.i*2+k,x,hip,0,-L,0); part(iS,a.i*2+k,x,hip-.45*Math.cos(L),.45*Math.sin(L),-(L-K),0); }
  part(iT,a.i,0,hip,0,a.lean,0);
  const sy=hip+.57*cl, sz=.57*sl;
  part(iA,a.i*2,-.27,sy,sz,-a.lA,-a.lZ); part(iA,a.i*2+1,.27,sy,sz,-a.rA,a.rZ);
  part(iH,a.i,0,hip+.74*cl,.74*sl,0,0); part(iR,a.i,0,hip+.755*cl-.01*sl,.755*sl-.012*cl,a.lean-.12,0);
}
function hand(a,side){ // world position of a hand
  const hip=a.sit?.48:.88, sx=side==='l'?-.27:.27, A=side==='l'?a.lA:a.rA;
  const lx=sx, ly=hip+.57*Math.cos(a.lean)-.6*Math.cos(A), lz=.57*Math.sin(a.lean)+.6*Math.sin(A);
  const c=Math.cos(a.ry), s=Math.sin(a.ry);
  return [a.x+(lx*c+lz*s)*a.s, a.y+ly*a.s, a.z+(-lx*s+lz*c)*a.s];
}
// poses
function walk(a,dt,sp){ a.ph+=dt*sp*4.2; const k=Math.sin(a.ph); const amp=clamp(.25+sp*.12,.3,.9); a.lL=k*amp; a.rL=-k*amp; a.kL=.08+.7*amp*Math.max(0,-Math.cos(a.ph)); a.kR=.08+.7*amp*Math.max(0,Math.cos(a.ph)); a.lA=-k*amp*.8; a.rA=k*amp*.8; a.lZ=a.rZ=.08; a.lean=sp>4?.22:.04; a.y0=Math.abs(Math.cos(a.ph))*(sp>4?.08:.03); }
function idle(a,t){ if(!a.sit){ a.lL=a.rL=0; a.kL=a.kR=.05; } a.lA=.06+.03*Math.sin(t*.9+a.ph); a.rA=.06+.03*Math.sin(t*.8+a.ph+1); a.lZ=a.rZ=.08; a.lean=a.sit?.1:0; }
function talk(a,t){ idle(a,t); a.rA=.35+.45*Math.abs(Math.sin(t*1.6+a.ph)); a.lA=.2+.3*Math.abs(Math.sin(t*1.1+a.ph*2)); a.rZ=.2; }
function tap(a,t){ idle(a,t); a.rA=1.0+.18*Math.max(0,Math.sin(t*3.2+a.ph)); a.lean=.08; }
function sitIdle(a,t){ a.lA=.75+.05*Math.sin(t+a.ph); a.rA=.75+.05*Math.sin(t*1.1+a.ph); a.lZ=a.rZ=.15; a.lean=.08; }
// wanderer inside a sampler of local points
function wander(a,sample,sp){ a.sample=sample; a.sp=sp||1.1; a.wait=rnd()*3; [a.tx,a.tz]=sample(); }
function stepWander(a,t,dt){
  if(a.wait>0){ a.wait-=dt; idle(a,t); a.lean=.1; a.y0=0; return; }
  const dx=a.tx-a.lx, dz=a.tz-a.lz, d=Math.hypot(dx,dz);
  if(d<.25){ a.wait=2+rnd()*5; [a.tx,a.tz]=a.sample(); return; }
  const v=Math.min(d,a.sp*dt); a.lx+=dx/d*v; a.lz+=dz/d*v; const goal=Math.atan2(dx,dz); let df=goal-a.fy; df=Math.atan2(Math.sin(df),Math.cos(df)); a.fy+=df*Math.min(1,dt*6); walk(a,dt,a.sp);
}
const box=(x0,x1,z0,z1)=>()=>[lerp(x0,x1,rnd()),lerp(z0,z1,rnd())];
const ring=(r0,r1,a0=0,a1=PI*2)=>()=>{ const a=lerp(a0,a1,rnd()), r=lerp(r0,r1,rnd()); return [Math.cos(a)*r,Math.sin(a)*r]; };

/* ================= balls and small props ================= */
const MAXB=72; const iB=new THREE.InstancedMesh(new THREE.SphereGeometry(.11,12,8),mat({roughness:.45}),MAXB); iB.frustumCulled=false; iB.castShadow=!low; scene.add(iB);
const balls=[]; function ball(col,s,sy){ const b={i:balls.length,x:0,y:-50,z:0,s:s||1,sy:sy||1,vis:true}; iB.setColorAt(b.i,new THREE.Color(col)); balls.push(b); return b; }
const _bm=new THREE.Matrix4(), _bq=new THREE.Quaternion();
function writeBalls(){ for(const b of balls){ _V.set(b.x,b.vis?b.y:-50,b.z); _S.set(b.s,b.s*b.sy,b.s); _bm.compose(_V,_bq,_S); iB.setMatrixAt(b.i,_bm); } iB.count=balls.length; iB.instanceMatrix.needsUpdate=true; }
const W=(st,lx,ly,lz)=>{ const [x,z]=toWorld(st,lx,lz); return [x,ly,z]; };
function setB(b,p){ b.x=p[0]; b.y=p[1]; b.z=p[2]; }
function arc(p0,p1,k,h){ return [lerp(p0[0],p1[0],k),lerp(p0[1],p1[1],k)+Math.sin(k*PI)*h,lerp(p0[2],p1[2],k)]; }

/* ================= live screens ================= */
const screens=[];
const SC={ kiosk:[0,2.25,.3,1.5,.9], booth:[0,1.7,-1.85,2.6,1.5], pod:[0,1.7,-3.2,3,1.6], amphi:[0,3.4,-5.2,9,4.6], plot:[3.8,1.7,3.6,1,.7], table:[0,1.7,-.95,1.4,.7], bikes:[0,2.4,-1.6,6,1.6], bin:[0,2,-.3,2.6,.9], cityfloor:[0,1.8,-11.2,5,2.8], brain:[0,1.5,.1,3,1.2] };
function addScreen(st,spec,draw){
  const [lx,ly,lz,w,h]=spec; const big=w>5; const cw=big?(low?512:768):(low?256:384), ch=Math.round(cw*h/w);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const ctx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv); tex.encoding=THREE.sRGBEncoding; tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w*.97,h*.95),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  const [x,z]=toWorld(st,lx,lz+.05); m.position.set(x,ly,z); m.rotation.y=st.rot; scene.add(m);
  const s={st,ctx,W:cw,H:ch,tex,draw,last:-9,x,z,ly,mem:{}}; screens.push(s); try{ draw(s,0); }catch(e){} tex.needsUpdate=true; return s;
}
// drawing helpers
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function wrap(c,text,maxW){ const words=text.split(' '); const lines=[]; let cur=''; for(const w of words){ const tt=cur?cur+' '+w:w; if(c.measureText(tt).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=tt; } if(cur) lines.push(cur); return lines; }
const F=(px,w=600)=>`${w} ${px}px Inter, 'Noto Sans Devanagari', 'Nirmala UI', system-ui, sans-serif`;
const H=(px)=>`700 ${px}px Manrope, Inter, 'Noto Sans Devanagari', system-ui, sans-serif`;
function header(s,t,title){ const {ctx:c,W:w,H:h}=s, hh=Math.round(h*.18), col=ZONES[s.st.zone].color;
  c.fillStyle='#f7f4ef'; c.fillRect(0,0,w,h); c.fillStyle=col; c.fillRect(0,0,w,hh);
  c.fillStyle='#fff'; c.font=H(Math.round(hh*.46)); c.textBaseline='middle'; c.textAlign='left';
  let tt=title||s.st.name; while(c.measureText(tt).width>w*.68&&tt.length>4) tt=tt.slice(0,-2); if(tt!==(title||s.st.name)) tt+='…'; c.fillText(tt,hh*.45,hh/2);
  c.textAlign='right'; c.font=F(Math.round(hh*.36),700); c.fillText('LIVE',w-hh*.45,hh/2); c.fillStyle=Math.sin(t*5)>0?'#ffffff':'rgba(255,255,255,.35)'; c.beginPath(); c.arc(w-hh*.45-c.measureText('LIVE').width-hh*.3,hh/2,hh*.13,0,7); c.fill();
  c.textAlign='left'; return hh; }
// a chat that types itself out, then loops
function chat(lines){ return (s,t)=>{
  const {ctx:c,W:w,H:h}=s; const hh=header(s,t); const pad=w*.04, fs=Math.round(h*.082); c.font=F(fs,500);
  if(!s.mem.tl){ let acc=0; s.mem.tl=lines.map((l,i)=>{ const q=i%2===0; const d=q?1.6:Math.min(4.5,l.length/34)+2.4; const o={q,l,t0:acc,type:q?0:Math.min(3.2,l.length/34)}; acc+=d; return o; }); s.mem.total=acc+3; }
  const tl=s.mem.tl, tt=t%s.mem.total; const vis=tl.filter(m=>m.t0<=tt);
  let y=h-pad*.8; const maxW=w*.74;
  for(let i=vis.length-1;i>=0;i--){ const m=vis[i]; let txt=m.l; if(!m.q&&tt-m.t0<m.type){ const n=Math.floor(txt.length*(tt-m.t0)/m.type); txt=txt.slice(0,n)+'▍'; }
    if(!m.q&&tt-m.t0<.5) txt='• • •';
    c.font=F(fs,m.q?600:500); const ls=wrap(c,txt,maxW); const lh=fs*1.25, bh=ls.length*lh+fs*.7, bw=Math.min(maxW,Math.max(...ls.map(l=>c.measureText(l).width)))+fs*1.1;
    y-=bh; if(y<hh+pad*.4) break; const x=m.q?w-pad-bw:pad;
    c.fillStyle=m.q?ZONES[s.st.zone].color:'#ffffff'; rr(c,x,y,bw,bh,fs*.6); c.fill(); if(!m.q){ c.strokeStyle='#e6dfe2'; c.lineWidth=1.5; c.stroke(); }
    c.fillStyle=m.q?'#ffffff':'#1a1a1a'; c.textBaseline='top'; ls.forEach((l,k)=>c.fillText(l,x+fs*.55,y+fs*.38+k*lh)); y-=fs*.45; }
}; }
const QA={
 'st-student':['Is page ka sawal samjhao: photosynthesis kya hai?','Plants make food from sunlight, water and air. Think of the leaf as a small kitchen.','Ek desi example do','A chulha cooks with heat. A leaf cooks with sunlight.'],
 'st-shop':['Meri shelf ki photo se list bana do','Found 24 items. Catalogue and WhatsApp listing are ready to send.','Ramesh ji ka udhaar likho: ₹340','Saved. Ramesh ji owes ₹340. Send a reminder on Sunday?'],
 'st-artisan':['Is booti ke 3 naye pattern dikhao','Here are 3 variations: jaali, phanda and murri. Tap one to see it on a kurta.','Listing likh do','Hand-embroidered Lucknowi chikankari kurta, pure cotton, 12 days of handwork.'],
 'st-home':['Fridge mein aloo, paneer, palak hai. Aaj kya banau?','Palak paneer and jeera aloo. 35 minutes, serves four.','School ka notice samjhao','Parent-teacher meeting on Saturday at 10 am. Bring the report card.'],
 'st-driver':['Aaj kitna kamaya?','₹1,240 from 14 rides. ₹180 more than last Monday.','Charbagh ka sabse tez rasta?','Go via Shahnajaf Road. About 18 minutes, light traffic.'],
 'st-job':['Mera resume English mein kar do','Done: Field sales, 3 years in Hazratganj market. Grew monthly orders by 30%.','Mock interview shuru karo','Question 1: tell me about a customer you won back. Take your time.'],
 'st-elders':['Yeh dawai ka parcha padh ke sunao','One tablet every morning after breakfast. Reading it aloud now.','Yeh WhatsApp message sach hai?','Probably false. No news source reports it. Please do not forward it.'],
 'st-citizen':['Meri beti ke liye koi scheme hai?','You may qualify for Kanya Sumangala Yojana. Three documents needed.','Form bharne mein madad karo','Name, Aadhaar and bank details are filled in. Please check and sign.'],
 foodtrail:['2 ghante, veg, ₹500 budget','Start with chaat in Hazratganj, then kulfi in Aminabad, then khasta near Chowk.','Kitna chalna padega?','2.1 km on foot, or an e-rickshaw from stop 2.'],
 shop:['Mera design kurta par ban sakta hai?','Yes. A local artisan stitches it and it reaches your home in 10 days.'],
 vending:['Ek nimbu paani','₹20 · scan to pay by UPI','Paid','Enjoy. Your bottle can be refilled free at the water point.'],
 watching:['Mera phone kya data le raha hai?','14 apps can see your location. 3 use it in the background.','Kaise band karun?','Settings, then Location, then App permissions. Let’s do the first one together.'],
 alive:['Kya tum sach mein mehsoos karte ho?','No. I predict likely next words from patterns. Sounding human is not feeling.','Phir itna achha kaise bolte ho?','I learned from millions of human sentences, so I sound like them.'],
 liar:['Bara Imambara kisne banwaya?','It was built in 1921 by Lord Curzon as a railway station.','Sach?','Fact check: false. Nawab Asaf-ud-Daula built it in 1784. This is why you verify.'],
 science:['Mera test karo','Jump 41 cm · reaction 0.29 s · grip 32 kg','Mere liye kaunsa sport?','Try kabaddi or badminton. Your reaction time is above average.'],
 desi:['Lattu kitni der ghooma?','14.2 seconds. Today’s park record is 21.7 seconds.','Kanche ka score?','3 of 5 on target. The camera judged it, no arguments.'],
 health:['BP check karo','128/82, slightly high. Walk 20 minutes a day and cut salt. Recheck in a week.'],
 carrom:['Kaunsa shot lun?','Black to top-left pocket: 62% chance. Red needs a rebound: 18%.','Beginner level','Done. I will leave you easier shots and explain each one.'],
 calligraphy:['Mera naam: Ayesha','Writing it in Devanagari and Urdu nastaliq. Ready in 40 seconds.'],
 chai:['Ek cutting, kam cheeni','Camera sees: cup placed · milk 40 ml · sugar half spoon. Ready in 50 s.'],
 tabla:['Teen taal bajao','Listening. 16 beats found. Playing along at 92 bpm.'],
 exo:['Dadi ji ke liye kitna support?','Hip assist at 30%. 42 steps so far, balance steady.'],
 workshops:['Aaj ka topic?','4 pm: make a Diwali poster with AI. 6 seats left.','Kaise judun?','Just walk in. No phone needed, we have tablets.'],
 'lab-built':['Yeh model kab bana?','Version 37 of the canopy petal, printed in March. The final one is on your left.'],
};
function genericChat(st){ const ss=st.text.split(/\.\s+/).map((x,i,a)=>i<a.length-1?x+'.':x); const l=['What happens here?',ss[0]]; if(ss[1]||st.how){ l.push('How does it work?',ss[1]||st.how); } return chat(l); }
// special screens
const SP={};
SP.deepfake=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Deepfake mirror');
  const k=(Math.sin(t*.8)+1)/2; for(const [i,lab] of [[0,'You'],[1,'Live swap']]){ const cx=w*(.28+i*.44), cy=hh+(h-hh)*.42, r=(h-hh)*.27;
    c.fillStyle=i?`rgb(${lerp(160,110,k)|0},${lerp(107,75,k)|0},${lerp(79,60,k)|0})`:'#a06b4f'; c.beginPath(); c.ellipse(cx,cy,r*.8,r,0,0,7); c.fill();
    c.fillStyle='#1a1a1a'; const bl=i&&Math.sin(t*3)>.9?.15:1; c.beginPath(); c.ellipse(cx-r*.3,cy-r*.15,r*.1,r*.1*bl,0,0,7); c.ellipse(cx+r*.3,cy-r*.15,r*.1,r*.1*bl,0,0,7); c.fill();
    c.strokeStyle='#1a1a1a'; c.lineWidth=3; c.beginPath(); c.arc(cx,cy+r*.3,r*.3,.2,PI-.2); c.stroke();
    if(i){ c.strokeStyle='rgba(211,49,99,.6)'; c.setLineDash([6,5]); c.beginPath(); c.ellipse(cx,cy,r*.86,r*1.06,0,0,7); c.stroke(); c.setLineDash([]); }
    c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.06)); c.textAlign='center'; c.fillText(lab,cx,cy+r*1.25); }
  const tips=['Tell 1: blinking looks wrong','Tell 2: blurry edges at the jaw','Tell 3: light does not match the room','Tell 4: lips lag behind the voice'];
  c.fillStyle='#1a1a1a'; c.fillRect(0,h*.86,w,h*.14); c.fillStyle='#fff'; c.font=F(Math.round(h*.07),600); c.textAlign='center'; c.textBaseline='middle'; c.fillText(tips[Math.floor(t/3.5)%4],w/2,h*.93); c.textAlign='left'; };
SP.voice=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Voice-clone booth'); const ph=t%14;
  c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.075),600); c.textBaseline='top'; c.fillText(ph<10?`Recording your voice · ${Math.floor(ph)+1} of 10 s`:'Clone ready. Hear yourself say:',w*.05,hh+h*.05);
  const n=36; for(let i=0;i<n;i++){ const amp=ph<10?(.15+.85*Math.abs(Math.sin(t*6+i*.7)*Math.sin(i*.3+t))):(.2+.6*Math.abs(Math.sin(t*4+i*.5))); const bh=amp*h*.32; c.fillStyle=ph<10?'#d33163':'#712846'; c.fillRect(w*.05+i*(w*.9/n),h*.55-bh/2,w*.9/n*.6,bh); }
  if(ph<10){ c.fillStyle='#eadfe2'; c.fillRect(w*.05,h*.8,w*.9,h*.035); c.fillStyle='#d33163'; c.fillRect(w*.05,h*.8,w*.9*ph/10,h*.035); }
  else { c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.07),500); c.fillText('“Mummy, I’m in trouble, send money.”  Family code word: CHAMELI',w*.05,h*.78,w*.9); } };
SP.mood=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Expression mirror'); const cx=w*.25, cy=hh+(h-hh)*.48, r=(h-hh)*.33; const sm=Math.sin(t*.7);
  c.fillStyle='#b9805f'; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill(); c.fillStyle='#1a1a1a'; c.beginPath(); c.arc(cx-r*.35,cy-r*.2,r*.09,0,7); c.arc(cx+r*.35,cy-r*.2,r*.09,0,7); c.fill();
  c.strokeStyle='#1a1a1a'; c.lineWidth=3; c.beginPath(); c.moveTo(cx-r*.4,cy+r*.35); c.quadraticCurveTo(cx,cy+r*.35+sm*r*.35,cx+r*.4,cy+r*.35); c.stroke();
  const em=[['Happy',.45+.3*sm],['Calm',.3+.2*Math.sin(t*.5+1)],['Angry',.15+.12*Math.sin(t*1.3)],['Sad',.12-.1*sm]];
  em.forEach(([l,v],i)=>{ v=clamp(v,.03,.95); const y=hh+h*.1+i*h*.17; c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.065),600); c.textBaseline='middle'; c.fillText(l,w*.5,y); c.fillStyle='#eadfe2'; c.fillRect(w*.66,y-h*.03,w*.28,h*.06); c.fillStyle=i===0?'#d33163':'#712846'; c.fillRect(w*.66,y-h*.03,w*.28*v,h*.06); });
  c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.06),500); c.fillText('A guess, often wrong. Faces are not feelings.',w*.5,h*.9,w*.47); };
SP.bias=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Bias mirror'); const pr=['a doctor','a pilot','a nurse'][Math.floor(t/5)%3];
  c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.075),600); c.textBaseline='top'; c.fillText(`Prompt: “${pr}”`,w*.05,hh+h*.04);
  const nurse=pr==='a nurse'; for(let i=0;i<6;i++){ const x=w*(.1+i*.15), y=h*.5; const fem=nurse?i!==3:i===4; c.fillStyle=fem?'#d33163':'#2f6fa5'; c.beginPath(); c.arc(x,y,h*.06,0,7); c.fill(); rr(c,x-h*.07,y+h*.08,h*.14,h*.18,h*.04); c.fill(); }
  c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.062),500); c.fillText(nurse?'5 of 6 shown as women. The training photos taught it this.':'5 of 6 shown as men. The training photos taught it this.',w*.05,h*.82,w*.9); };
SP.fakenews=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Fake news factory'); const ph=t%12;
  c.fillStyle='#e7f3e7'; c.fillRect(0,hh,w,h-hh); c.fillStyle='#fff'; rr(c,w*.06,hh+h*.08,w*.88,h*.48,10); c.fill();
  c.fillStyle='#666'; c.font=F(Math.round(h*.05),500); c.textBaseline='top'; c.fillText('↪ Forwarded many times',w*.09,hh+h*.11);
  c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.068),600); wrap(c,'URGENT!! Gomti water poisoned tonight. Do not drink tap water. SHARE NOW',w*.8).forEach((l,i)=>c.fillText(l,w*.09,hh+h*.19+i*h*.085));
  if(ph>5){ c.fillStyle='#712846'; rr(c,w*.06,h*.72,w*.88,h*.22,10); c.fill(); c.fillStyle='#fff'; c.font=F(Math.round(h*.064),600); c.fillText('Check 1: who sent it first?  2: what date?  3: does any news site say so?',w*.09,h*.75,w*.82); c.font=F(Math.round(h*.064),500); c.fillText('Made by AI in 10 seconds.',w*.09,h*.85); } };
SP.english=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Speak your language'); const L=[['Awadhi','Ka haal ba? Hum theek hain.'],['Bhojpuri','Rauwa kaisan baani?'],['Urdu','آپ کیسے ہیں؟'],['Hindi','आप कैसे हैं?'],['Lucknowi Hindi','Kahiye janaab, mizaaj kaise hain?']]; const k=Math.floor(t/3)%L.length;
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#712846'; c.font=F(Math.round(h*.07),700); c.fillText(L[k][0].toUpperCase(),w/2,hh+h*.18); c.fillStyle='#1a1a1a'; c.font=H(Math.round(h*.11)); c.fillText(L[k][1],w/2,h*.55,w*.9);
  c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.06),500); c.fillText('Reply comes back in the same language',w/2,h*.82); c.textAlign='left'; };
SP.jobs=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const J=[['Shop clerk',[['Billing and stock count',.85],['Talking to regular customers',.2],['Trust built over years',0]]],['Driver',[['Route planning',.9],['Handling a passenger in a rush',.25],['Knowing every gali',.1]]],['Teacher',[['Checking spelling',.8],['Explaining to a shy child',.2],['Caring if they come back',0]]]]; const j=J[Math.floor(t/6)%3];
  const hh=header(s,t,'Your job: '+j[0]); j[1].forEach(([l,v],i)=>{ const y=hh+h*.12+i*h*.24; c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.064),600); c.textBaseline='top'; c.fillText(l,w*.05,y); c.fillStyle='#eadfe2'; c.fillRect(w*.05,y+h*.09,w*.62,h*.05); c.fillStyle='#c2571b'; c.fillRect(w*.05,y+h*.09,w*.62*v*Math.min(1,(t%6)/1.5),h*.05); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.058),500); c.fillText(v>.6?'AI does well':v>.05?'AI does badly':'Only you',w*.71,y+h*.075); }); };
SP['st-farmer']=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Leaf check'); const ph=t%9;
  c.save(); c.translate(w*.27,hh+(h-hh)*.5); c.rotate(-.5); c.fillStyle='#5d8c3e'; c.beginPath(); c.ellipse(0,0,w*.18,h*.22,0,0,7); c.fill(); c.strokeStyle='#3f6e33'; c.lineWidth=2; c.beginPath(); c.moveTo(-w*.18,0); c.lineTo(w*.18,0); c.stroke();
  c.fillStyle='#9b6b2e'; [[-.08,-.07],[.04,.08],[.1,-.05],[-.02,.03]].forEach(([a,b])=>{ c.beginPath(); c.arc(a*w,b*h,h*.025,0,7); c.fill(); }); c.restore();
  if(ph<3){ const y=hh+(h-hh)*(ph/3); c.fillStyle='rgba(47,111,165,.5)'; c.fillRect(w*.05,y-2,w*.45,4); }
  c.fillStyle='#1a1a1a'; c.textBaseline='top'; c.font=F(Math.round(h*.075),700); c.fillText(ph<3?'Scanning…':'Leaf rust',w*.55,hh+h*.08);
  if(ph>=3){ c.font=F(Math.round(h*.062),500); c.fillStyle='#4a4a4a'; ['Confidence 87%','Spray advice in Hindi','Rain likely Thursday','Mandi price trend: up'].forEach((l,i)=>c.fillText(l,w*.55,hh+h*.22+i*h*.13,w*.42)); } };
SP.bikes=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Power bikes'); let tot=0;
  for(let i=0;i<4;i++){ const v=60+40*Math.abs(Math.sin(t*.6+i*1.7))+i*12; tot+=v; const x=w*(.06+i*.16); const bh=(h-hh)*.62*v/150; c.fillStyle='#1f8a8a'; c.fillRect(x,h*.86-bh,w*.1,bh); c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.08),700); c.textAlign='center'; c.textBaseline='bottom'; c.fillText(Math.round(v)+' W',x+w*.05,h*.84-bh); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.065),500); c.textBaseline='top'; c.fillText('Bike '+(i+1),x+w*.05,h*.88); }
  c.textAlign='left'; c.fillStyle='#712846'; c.font=H(Math.round(h*.16)); c.textBaseline='middle'; c.fillText(Math.round(tot)+' W',w*.72,hh+(h-hh)*.38); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.075),500); c.fillText(`${Math.floor(tot/110)} phones charging`,w*.72,hh+(h-hh)*.68); };
SP.waste=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Which bin?'); const I=[['Paper chai cup','Green bin · compost','#2f7d4f'],['Plastic bottle','Blue bin · recycle','#2f6fa5'],['Chips packet','Grey bin · multilayer','#7a7f86'],['Banana peel','Green bin · compost','#2f7d4f']]; const k=Math.floor(t/4)%4;
  c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.1),700); c.textBaseline='middle'; c.fillText('Seen: '+I[k][0],w*.05,hh+(h-hh)*.33); c.fillStyle=I[k][2]; rr(c,w*.05,hh+(h-hh)*.56,w*.62,(h-hh)*.32,8); c.fill(); c.fillStyle='#fff'; c.font=F(Math.round(h*.09),600); c.fillText(I[k][1],w*.08,hh+(h-hh)*.72); };
SP['lab-10']=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const ph=t%12; const hh=header(s,t,ph<7?'Training on your hands':'Testing a new hand');
  const G=ph<7?[['Thumbs up',.94],['Wave',.88],['Fist',.91]]:[['Thumbs up',.41],['Wave',.22],['Fist',.37]];
  G.forEach(([l,v],i)=>{ const y=hh+h*.12+i*h*.2; c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.07),600); c.textBaseline='middle'; c.fillText(l,w*.05,y+h*.04); c.fillStyle='#eadfe2'; c.fillRect(w*.38,y,w*.45,h*.08); c.fillStyle=ph<7?'#2f6fa5':'#c2571b'; c.fillRect(w*.38,y,w*.45*v*Math.min(1,(ph%7)/1.2),h*.08); c.fillStyle='#4a4a4a'; c.fillText(Math.round(v*100)+'%',w*.86,y+h*.04); });
  c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.062),500); c.fillText(ph<7?'Trained on 40 photos of hands in this room.':'It never saw this hand. That is how bias works.',w*.05,h*.9,w*.9); };
SP.brain=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Park brain · now'); const nf=state.nf;
  const R=[['Canopy',nf>.5?'Glowing · AQI '+(168+Math.round(Math.sin(t*.05)*40)):'Petals '+(55+Math.round(Math.sin(t*.2)*10))+'% open · shade'],['Cloud pavilion','Rain on · avoiding 2 visitors'],['Misting · Environment','On · 41 °C · 6 nozzles'],['Irrigation','Bed 3 watering · soil 22%'],['Footfall today',(1284+Math.floor(t/3)).toLocaleString('en-IN')]];
  R.forEach(([a,b],i)=>{ const y=hh+h*.04+i*(h-hh)*.19; c.fillStyle=i%2?'#ffffff':'#f1ece6'; c.fillRect(0,y,w,(h-hh)*.19); c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.065),700); c.textBaseline='middle'; c.fillText(a,w*.04,y+(h-hh)*.095); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.062),500); c.fillText(b,w*.42,y+(h-hh)*.095,w*.56); }); };
SP.cityfloor=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,'Lucknow right now'); const aqi=168+Math.round(Math.sin(t*.05)*40);
  const R=[['Air quality',aqi+' · '+(aqi>200?'Poor':'Moderate')],['Metro red line','On time · next in 4 min'],['Gomti water','Dissolved oxygen 6.1 mg/L'],['Traffic','Hazratganj heavy · Gomti Nagar clear']];
  R.forEach(([a,b],i)=>{ const y=hh+h*.06+i*(h-hh)*.23; c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.07),700); c.textBaseline='top'; c.fillText(a,w*.05,y); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.065),500); c.fillText(b,w*.42,y,w*.55); }); };
function rally(name){ return (s,t)=>{ const {ctx:c,W:w,H:h}=s; const hh=header(s,t,name); const r=Math.floor(t/1.7)%22;
  c.fillStyle='#1a1a1a'; c.font=H(Math.round(h*.3)); c.textBaseline='middle'; c.fillText(r,w*.06,hh+(h-hh)*.42); c.font=F(Math.round(h*.07),600); c.fillStyle='#4a4a4a'; c.fillText('rally',w*.06,hh+(h-hh)*.78);
  c.fillStyle='#1a1a1a'; c.font=F(Math.round(h*.075),600); c.fillText(`Shot speed ${30+Math.round(Math.abs(Math.sin(t))*14)} km/h`,w*.4,hh+(h-hh)*.3); c.fillStyle='#4a4a4a'; c.font=F(Math.round(h*.065),500); c.fillText('Tip: meet the ball earlier, in front of you',w*.4,hh+(h-hh)*.62,w*.58); }; }
const SLIDES=[['आज का विषय','Today: how a map app finds the fastest road'],['सड़कें एक जाल हैं','Roads become points joined by lines'],['हर सड़क का समय','Every line gets a live travel time'],['सबसे छोटा जोड़','Add them up and pick the smallest total'],['सवाल?','Questions? Raise your hand']];
SP.paathshala=(s,t)=>{ const {ctx:c,W:w,H:h}=s; const k=Math.floor(t/8)%SLIDES.length; const sl=SLIDES[k];
  c.fillStyle='#10241f'; c.fillRect(0,0,w,h); c.fillStyle='#2f6fa5'; c.fillRect(0,0,w,h*.025);
  c.fillStyle='#ffffff'; c.font=H(Math.round(h*.12)); c.textBaseline='top'; c.fillText(sl[0],w*.05,h*.08);
  c.fillStyle='rgba(255,255,255,.6)'; c.font=F(Math.round(h*.045),600); c.fillText('THE OPEN PAATHSHALA · THURSDAY 7 PM',w*.05,h*.26);
  if(k>=1&&k<=3){ const N=[[.15,.55],[.32,.42],[.35,.7],[.52,.5],[.6,.72],[.72,.4],[.85,.58]], E=[[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,6],[5,6],[3,4]];
    c.lineWidth=h*.012; E.forEach(([a,b],i)=>{ c.strokeStyle=k>=3&&[0,2,4,6].includes(i)?'#f2b134':'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(N[a][0]*w,N[a][1]*h); c.lineTo(N[b][0]*w,N[b][1]*h); c.stroke();
      if(k>=2){ c.fillStyle='rgba(255,255,255,.8)'; c.font=F(Math.round(h*.038),600); c.fillText(((a*3+b*5)%7+2)+'m',(N[a][0]+N[b][0])/2*w,(N[a][1]+N[b][1])/2*h-h*.05); } });
    N.forEach(([x,y],i)=>{ c.fillStyle=i===0||i===6?'#d33163':'#ffffff'; c.beginPath(); c.arc(x*w,y*h,h*.022,0,7); c.fill(); });
    if(k>=3){ const path=[0,2,4,6]; const f=(t%4)/4*3, j=Math.floor(f), u=f-j; const A=N[path[j]], B=N[path[j+1]]; c.fillStyle='#f2b134'; c.beginPath(); c.arc(lerp(A[0],B[0],u)*w,lerp(A[1],B[1],u)*h,h*.03,0,7); c.fill(); } }
  c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(0,h*.84,w,h*.16); c.fillStyle='#f2b134'; c.font=F(Math.round(h*.034),700); c.fillText('LIVE SUBTITLES · EN',w*.04,h*.855); c.fillStyle='#fff'; c.font=F(Math.round(h*.055),600); c.fillText(sl[1],w*.04,h*.9); };
SP.tabletennis=rally('Table tennis robot'); SP.badminton=rally('Badminton feeder');

/* ================= speech bubbles ================= */
const LINES={
  dastango:['Ek zamana tha, jab Gomti ke kinare… (Once, on the banks of the Gomti…)','…nawabon ke baagh mein shaam ko mehfil sajti thi. (…evenings filled the nawabs’ gardens with music.)','Aur aaj, usi shahar mein ek park sochta hai. (And today, in the same city, a park thinks.)'],
  paathshala:['Socho, har sadak ek line hai. (Think of every road as a line.)','Ab har line par samay likho. (Now write a time on each line.)','Sabse chhota jod, sabse tez rasta! (Smallest total, fastest road!)','Haan, peeche wale bhaiya, aapka sawal? (Yes, at the back, your question?)'],
  didis:['Namaste! Kis cheez mein madad karun? (Hello! What can I help with?)','Phone nahi hai? Tablet le lijiye. (No phone? Take a tablet.)','Chaliye, pehla step saath mein. (Let’s do the first step together.)'],
};
const bub=document.createElement('div'); bub.className='bubble talk'; bub.style.display='none'; document.getElementById('labels').appendChild(bub);
const talkers=[]; // {st, a, key}

/* ================= stations come alive ================= */
const G=[]; const grp=(st,fn,ppl)=>G.push({st,fn,ppl:ppl||[]});
const Lsit=(arr)=>arr.filter(Boolean);
function setup(st){
  const k=st.kind, id=st.id, ppl=[];
  const add=(a)=>{ if(a) ppl.push(a); return a; };
  const spec=SC[k];
  // screens
  if(k==='kiosk'||k==='booth'||(k==='pod'&&(id==='lab-10'||id==='workshops'||id==='tabletennis'||id==='badminton'))||k==='amphi'||k==='plot'||k==='bikes'||k==='bin'||k==='cityfloor'||(k==='table'&&!['inteltable','machinesees'].includes(id))||(k==='pavilion'&&st.glass)){
    const d=SP[id]||(k==='pavilion'?SP.brain:k==='amphi'?SP.paathshala:k==='bikes'?SP.bikes:k==='bin'?SP.waste:k==='cityfloor'?SP.cityfloor:QA[id]?chat(QA[id]):genericChat(st));
    addScreen(st,k==='pavilion'?SC.brain:spec,d); }
  switch(k){
  case 'kiosk': { const v=add(P(st,(rnd()-.5)*.6,1.55,PI)); const c2=rnd()<.5?add(P(st,1.25,2.3,PI-.45)):null; const didi=st.zone==='learn'?add(P(st,1.9,1.0,0,{shirt:DIDI})):null; if(didi) face(didi,v.lx,v.lz);
    grp(st,(t)=>{ tap(v,t); if(c2) idle(c2,t); if(didi) talk(didi,t); },ppl); break; }
  case 'plot': { const f=add(P(st,0,3.75,PI)); f.tx=0; let mode=0, until=0;
    grp(st,(t,dt)=>{ if(t>until){ mode=mode?0:1; until=t+(mode?5:3); if(!mode) f.tx=(rnd()-.5)*6; }
      if(mode===0){ const d=f.tx-f.lx; if(Math.abs(d)>.05){ f.lx+=Math.sign(d)*Math.min(Math.abs(d),dt*.9); f.fy=d>0?PI/2:-PI/2; walk(f,dt,.9); } else { f.fy=PI; idle(f,t); } }
      else { f.fy=PI; idle(f,t); f.lean=.55; f.rA=1.3; f.lA=.9; f.lL=.35; f.rL=.1; } },ppl); break; }
  case 'booth': { const v=add(P(st,0,.3,PI)); const fr=rnd()<.6?add(P(st,1.05,1.5,PI-.35)):null;
    grp(st,(t)=>{ idle(v,t); if(id==='voice'){ v.rA=2.5; v.rZ=.25; } else if(id==='mood'){ const k2=Math.sin(t*.7); v.lA=v.rA=k2>0?.4+k2*1.8:.1; v.lZ=v.rZ=.3; } else if(id==='deepfake'){ v.lean=.05*Math.sin(t*2); v.rA=.6+.5*Math.max(0,Math.sin(t*1.3)); } else tap(v,t); if(fr) idle(fr,t); },ppl); break; }
  case 'pod': {
    if(id==='tabletennis'||id==='badminton'){ const pl=add(P(st,0,2.1,PI)); const b=ball(id==='badminton'?'#ffffff':'#f2b134',id==='badminton'?.8:.55); const A0=W(st,0,1.25,-2.7), B0=W(st,.25,1.2,1.55);
      grp(st,(t)=>{ const T=1.7, u=(t%T)/T; let p; if(u<.5) p=arc(A0,B0,u*2,.7); else p=arc(B0,A0,(u-.5)*2,.9); setB(b,p); idle(pl,t); const sw=Math.exp(-Math.pow((u-.5)*14,2)); pl.rA=.5+sw*1.4; pl.rZ=.4+sw*.6; pl.lean=.15; },ppl); }
    else { const seats=[]; for(let i=0;i<6;i++){ const a=i/6*PI*2+.3; const lx=Math.cos(a)*2, lz=Math.sin(a)*2+.4; if(id==='lab-10'&&i%3===2) continue; const s2=add(P(st,lx,lz,0,{sit:true})); face(s2,0,-3.2); seats.push(s2); }
      const pres=add(P(st,1.9,-2.3,0,{shirt:DIDI})); face(pres,0,.6);
      grp(st,(t)=>{ talk(pres,t); seats.forEach((s2,i)=>{ sitIdle(s2,t); if(id==='lab-10'){ const g=Math.floor(t/2.2+i)%3; s2.rA=g===0?2.6:g===1?1.6+.3*Math.sin(t*6):.9; s2.rZ=g===1?.5:.15; } else if(Math.floor(t/5)%seats.length===i){ s2.rA=2.8; } }); },ppl); }
    break; }
  case 'pavilion': {
    if(st.glass){ const ops=[-1.6,0,1.6].map(x=>add(P(st,x,1.35,PI,{sit:true,shirt:new THREE.Color('#712846')}))); const vis=[-3,3,4.6].map((x,i)=>add(P(st,x,3.4,PI)));
      grp(st,(t)=>{ ops.forEach((o,i)=>{ sitIdle(o,t); o.lA=1.05+.1*Math.abs(Math.sin(t*7+i)); o.rA=1.05+.1*Math.abs(Math.sin(t*6+i*2)); o.lean=.2; }); vis.forEach(v=>idle(v,t)); },ppl); }
    else { const w=st.w||14,d=st.d||10; const vs=[0,1,2,3,4].map(()=>{ const a=add(P(st,(rnd()-.5)*(w-3),(rnd()-.5)*(d-3),rnd()*6)); wander(a,box(-w/2+1.4,w/2-1.4,-d/2+1.4,d/2-1.4),.8); return a; });
      grp(st,(t,dt)=>vs.forEach(a=>stepWander(a,t,dt)),ppl); }
    break; }
  case 'helpdesk': { const pairs=[[0,2.3,0,3.5],[2.0,-1.1,3.1,-1.7],[-2.0,-1.1,-3.1,-1.7]].map(([dx,dz,vx,vz])=>{ const d=add(P(st,dx,dz,0,{shirt:DIDI})); const v=add(P(st,vx,vz,0)); face(d,vx,vz); face(v,dx,dz); return [d,v]; });
    talkers.push({st,a:pairs[0][0],key:'didis'});
    grp(st,(t)=>pairs.forEach(([d,v])=>{ talk(d,t); idle(v,t); v.rA=Math.sin(t*.5+v.ph)>.6?.9:.1; }),ppl); break; }
  case 'amphi': { const st2=[]; const N=low?22:40; let tries=0;
    while(st2.length<N&&tries<400){ tries++; const tr=Math.floor(rnd()*4), r=9+tr*2.3, n=Math.round(PI*r/2.3), i=Math.floor(rnd()*(n+1)); const a=PI*i/n; const lx=Math.cos(a)*(r+.25), lz=Math.sin(a)*(r+.25);
      if(st2.some(p=>Math.hypot(p.lx-lx,p.lz-lz)<1)) continue; const p=add(P(st,lx,lz,0,{sit:true,y:.45*(tr+1)-.02})); face(p,0,-2); st2.push(p); }
    const tch=add(P(st,0,-3,0,{y:.6,shirt:new THREE.Color('#2f6fa5')})); talkers.push({st,a:tch,key:'paathshala'});
    let hand=null, handT=0;
    grp(st,(t,dt)=>{ const u=t%14; let tx=u<6?-3+u:u<7?3:u<13?3-(u-7):-3; const moving=(u<6||(u>7&&u<13)); const dx=tx-tch.lx; tch.lx=tx; if(moving){ tch.fy=dx>=0?PI/2:-PI/2; walk(tch,dt,.9); } else { tch.fy=Math.sin(t*.3)>0?0:PI; talk(tch,t); }
      if(t>handT){ hand=st2[Math.floor(rnd()*st2.length)]; handT=t+6; }
      st2.forEach(p=>{ sitIdle(p,t); p.lean=.04; if(p===hand&&handT-t>3) { p.rA=2.9; p.rZ=.1; } }); },ppl); break; }
  case 'maths': { const sp=[-2.2,0,2.4].map(x=>add(P(st,x,6.4+rnd(),PI,{kid:x===0})));
    grp(st,(t)=>sp.forEach((a,i)=>{ idle(a,t); a.lean=-.08; if(i===1) a.rA=2.3+.2*Math.sin(t*2); }),ppl); break; }
  case 'board': case 'wall': { const n=k==='wall'?(id==='humanai'?3:2):(rnd()<.6?1:0); const rs=[]; for(let i=0;i<n;i++) rs.push(add(P(st,(i-(n-1)/2)*1.6+(rnd()-.5)*.4,k==='wall'?2.6:2.1,PI)));
    if(id==='penalty'){ const kid=add(P(st,0,6.5,PI,{kid:true})); const b=ball('#ffffff',1.1); let tgt=[0,2,0];
      grp(st,(t)=>{ const T=2.6,u=(t%T)/T; if(u<.02) tgt=[(rnd()-.5)*8,1+rnd()*3.3]; const foot=W(st,0,.13,5.9), aim=W(st,tgt[0],tgt[1],.45); idle(kid,t); kid.rL=-.6+Math.exp(-Math.pow((u-.05)*30,2))*1.6;
        if(u<.06) setB(b,foot); else if(u<.25) setB(b,arc(foot,aim,(u-.06)/.19,.3)); else if(u<.75) setB(b,arc(aim,foot,(u-.25)/.5,.8)); else setB(b,foot); rs.forEach(r=>idle(r,t)); },ppl.concat(rs)); }
    else grp(st,(t)=>rs.forEach((r,i)=>{ idle(r,t); if(id==='humanai'&&Math.sin(t*.8+i*2)>.7){ r.rA=2.4; } if(id==='fearwall'&&i===0) tap(r,t); }),ppl);
    break; }
  case 'lockers': { const a=add(P(st,-1.2,1.1,PI)); grp(st,(t)=>{ idle(a,t); a.rA=Math.sin(t*.6)>0?1.4:.2; },ppl); break; }
  case 'arch': { const ws=[0,1].map(i=>add(P(st,i?1:-1,6*(i?-1:1),i?0:PI)));
    grp(st,(t,dt)=>ws.forEach((a,i)=>{ const dir=i?1:-1; a.lz+=dir*dt*1.1; if(a.lz>7) a.lz=-7; if(a.lz<-7) a.lz=7; a.fy=dir>0?0:PI; walk(a,dt,1.1); }),ppl); break; }
  case 'cityfloor': { const vs=[0,1,2,3,4].map(i=>{ const a=add(P(st,(rnd()-.5)*12,(rnd()-.5)*12,rnd()*6,{kid:i===0})); wander(a,box(-8,8,-8,8),.9); return a; });
    grp(st,(t,dt)=>vs.forEach(a=>{ stepWander(a,t,dt); if(a.wait>0) a.lean=.35; }),ppl); break; }
  case 'pillars': { const vs=[0,1,2].map(()=>{ const a=add(P(st,(rnd()-.5)*8,(rnd()-.5)*8,0,{kid:rnd()<.6})); wander(a,box(-5,5,-5,5),1); return a; });
    grp(st,(t,dt)=>vs.forEach(a=>{ stepWander(a,t,dt); place(a); a.y=C.groundAt(a.x,a.z); }),ppl); break; }
  case 'nightgarden': { const vs=[0,1,2,3].map(i=>add(P(st,0,0,0,{kid:i===3}))); vs.forEach((a,i)=>a.ang=i/4*PI*2);
    grp(st,(t,dt)=>vs.forEach((a,i)=>{ a.ang+=dt*(i%2?.11:-.09); a.lx=Math.cos(a.ang)*10; a.lz=Math.sin(a.ang)*10; a.fy=Math.atan2(-Math.sin(a.ang)*(i%2?1:-1),Math.cos(a.ang)*(i%2?1:-1)); walk(a,dt,1); }),ppl); break; }
  case 'canopy': { const seated=[]; for(let i=0;i<14;i++){ if(rnd()<.35) continue; const a=i/14*PI*2+.2; const s2=add(P(st,Math.cos(a)*24-Math.cos(a)*.35,Math.sin(a)*24-Math.sin(a)*.35,0,{sit:true,y:.02})); face(s2,0,0); seated.push(s2); }
    const ws=[0,1,2,3,4,5].map(()=>{ const a=add(P(st,0,12,0)); wander(a,ring(10,21),1.1); a.lx=a.tx; a.lz=a.tz; return a; });
    const kids=[0,1,2].map(i=>{ const a=add(P(st,9.5,0,0,{kid:true})); a.ang=i*2.1; return a; });
    grp(st,(t,dt)=>{ seated.forEach(a=>sitIdle(a,t)); ws.forEach(a=>stepWander(a,t,dt)); kids.forEach((a,i)=>{ a.ang+=dt*.45; a.lx=Math.cos(a.ang)*9.6; a.lz=Math.sin(a.ang)*9.6; a.fy=Math.atan2(-Math.sin(a.ang),Math.cos(a.ang)); walk(a,dt,4.4); }); },ppl); break; }
  case 'cloud': { const vs=[-2,0,2].map((z,i)=>{ const a=add(P(st,-6+i*3,z,PI/2,{y:.15})); a.dir=1; return a; });
    grp(st,(t,dt)=>vs.forEach(a=>{ a.lx+=a.dir*dt*.55; if(a.lx>3.2) a.dir=-1; if(a.lx<-7) a.dir=1; a.fy=a.dir>0?PI/2:-PI/2; walk(a,dt,.55); a.lA=.7; a.lZ=.6; }),ppl); break; }
  case 'gardener': { const ws=[0,1,2,3].map(i=>{ const a=PI*.15+i*PI*.23; const p=add(P(st,Math.cos(a)*14.5,Math.sin(a)*14.5,0,{kid:i===1})); face(p,0,0); return p; });
    grp(st,(t)=>ws.forEach((a,i)=>{ idle(a,t); if(i===1) a.rA=2+.3*Math.sin(t); }),ppl); break; }
  case 'arena': { const vs=[0,1,2,3].map(()=>{ const a=add(P(st,(rnd()-.5)*24,(rnd()-.5)*12,0)); wander(a,box(-13,13,-7,7),.9); return a; }); grp(st,(t,dt)=>vs.forEach(a=>stepWander(a,t,dt)),ppl); break; }
  case 'table': {
    if(id==='inteltable'){ const ps=[[-1.2,2],[1.2,2],[2.9,0]].map(([x,z])=>{ const p=add(P(st,x,z,0)); face(p,x*.3,0); return p; }); grp(st,(t)=>ps.forEach((p,i)=>{ tap(p,t+i); p.lean=.25; }),ppl); break; }
    if(id==='machinesees'){ const ps=[-.8,.9].map(x=>add(P(st,x,2,PI))); grp(st,(t)=>ps.forEach((p,i)=>{ idle(p,t); p.lean=.2; if(i) p.rA=1.2+.2*Math.sin(t); }),ppl); break; }
    if(id==='exo'){ const el=add(P(st,-.3,.7,PI,{shirt:new THREE.Color('#e8c9d2')})); const at=add(P(st,1.6,.7,PI,{shirt:DIDI})); let dir=-1;
      grp(st,(t,dt)=>{ el.lz+=dir*dt*.25; if(el.lz<-.7) dir=1; if(el.lz>.75) dir=-1; el.fy=dir<0?PI:0; walk(el,dt,.35); el.lean=.15; el.lA=el.rA=.5; el.lZ=el.rZ=.4; at.lz=el.lz; at.fy=el.fy; walk(at,dt,.35); at.lA=1; },ppl); break; }
    const v=add(P(st,(rnd()-.5)*.4,1.35,PI));
    if(id==='carrom'){ const cs=[0,1,2].map(i=>ball(i===1?'#c0392b':i?'#2a2321':'#f4efe4',.55,.35)); const pk=[[-.68,-.68],[.68,-.68],[-.68,.68],[.68,.68]];
      grp(st,(t)=>{ tap(v,t); v.rA=.9; cs.forEach((b,i)=>{ const T=4.5, u=((t+i*1.5)%T)/T; const p=pk[(Math.floor((t+i*1.5)/T)+i)%4]; const k2=u<.3?0:clamp((u-.3)/.4,0,1); const e=1-Math.pow(1-k2,3); setB(b,W(st,lerp(-.1+i*.1,p[0],e),.97,lerp(.05*i,p[1],e))); b.vis=u<.75; }); },ppl); }
    else if(id==='calligraphy'){ const pen=ball('#1a1a1a',.4); grp(st,(t)=>{ idle(v,t); v.lean=.15; const a=t*1.6; setB(pen,W(st,Math.sin(a)*.5,.93,Math.sin(a*2)*.25)); },ppl); }
    else if(id==='chai'){ const cup=ball('#f2eee7',.7,1.1); grp(st,(t)=>{ idle(v,t); const u=(t%8)/8; setB(cup,W(st,lerp(-.4,.5,clamp(u*2,0,1)),.95,.3)); if(u>.7){ v.rA=1.1; } },ppl); }
    else if(id==='tabla'){ grp(st,(t)=>{ idle(v,t); v.lean=.1; v.lA=.9+.25*Math.abs(Math.sin(t*9)); v.rA=.9+.25*Math.abs(Math.sin(t*9+1.3)); },ppl); }
    else grp(st,(t)=>tap(v,t),ppl);
    break; }
  case 'nets': { const L=22; const lanes=[0,1,2].map(i=>{ const x=-4.4+i*4.4; const bat=add(P(st,x+.35,L/2-2.7,PI)); const b=ball('#c0392b',.75); return {x,bat,b,off:i*1.13}; });
    grp(st,(t)=>lanes.forEach(o=>{ const T=3.4, u=((t+o.off)%T); const rel=W(st,o.x,1.2,-L/2+1.8), bnc=W(st,o.x,.08,3.5), bat=W(st,o.x,.75,L/2-3);
      let p; if(u<.55) p=arc(rel,bnc,u/.55,.25); else if(u<.8) p=arc(bnc,bat,(u-.55)/.25,.35); else if(u<1.7){ const k2=(u-.8)/.9; const out=W(st,o.x+(o.off-1.1)*6,.1,-2); p=arc(bat,out,k2,4); } else p=[0,-50,0];
      setB(o.b,p); idle(o.bat,t); const sw=Math.exp(-Math.pow((u-.8)*9,2)); o.bat.lA=o.bat.rA=.5+sw*1.6; o.bat.lZ=o.bat.rZ=.25; o.bat.lean=.2; }),ppl); break; }
  case 'peepal': { const sto=add(P(st,0,3.1,0,{y:.6,shirt:new THREE.Color('#e0a030')})); talkers.push({st,a:sto,key:'dastango'});
    const aud=[]; for(let i=0;i<10;i++){ const a=i/10*PI*2; const x=Math.cos(a)*6.4, z=Math.sin(a)*6.4; if(z<1.5||rnd()<.2) continue; const p=add(P(st,x*.96,z*.96,0,{sit:true,y:.02})); face(p,0,3.1); aud.push(p); }
    for(let i=0;i<4;i++){ const p=add(P(st,-1.8+i*1.2,5.2,PI,{sit:true,kid:true,y:-.2})); aud.push(p); }
    grp(st,(t)=>{ talk(sto,t); sto.lA=.3+.6*Math.abs(Math.sin(t*.9)); sto.lZ=.5; aud.forEach(a=>sitIdle(a,t)); },ppl); break; }
  case 'radar': { const ps=[0,1,2,3].map(i=>{ const a=i/4*PI*2+.4; const p=add(P(st,Math.cos(a)*3.25,Math.sin(a)*3.25,0,{kid:i===2})); face(p,0,0); return p; });
    grp(st,(t)=>ps.forEach((p,i)=>{ idle(p,t); p.lean=.35; if(Math.sin(t*.7+i*1.7)>.75) p.rA=1.3; }),ppl); break; }
  case 'forest': { const ps=[[3,4],[-4,2]].map(([x,z])=>add(P(st,x,z,rnd()*6))); grp(st,(t)=>ps.forEach(p=>{ idle(p,t); p.lean=.8; p.lA=p.rA=.9; p.lL=.5; }),ppl); break; }
  case 'mist': { const ps=[0,1,2,3,4].map(i=>{ if(rnd()<.3) return null; return add(P(st,-4+i*2,-1+(i%2)*2+(i%2?.3:-.3),i%2?0:PI,{sit:true,y:.02})); }).filter(Boolean); grp(st,(t)=>ps.forEach(p=>sitIdle(p,t)),ppl); break; }
  case 'solar': { const ps=[0,1,2].map(i=>rnd()<.75?add(P(st,-4+i*4+(rnd()-.5),1.85,0,{sit:true,y:.02})):null).filter(Boolean); grp(st,(t)=>ps.forEach(p=>sitIdle(p,t)),ppl); break; }
  case 'bin': { const v=add(P(st,0,1.35,PI)); const it=ball('#2f6fa5',.9,1.6); const binsX=[-1.05,0,1.05];
    grp(st,(t)=>{ const T=4,u=(t%T)/T, k2=Math.floor(t/T)%4; idle(v,t); v.rA=u<.55?1.5:lerp(1.5,.6,clamp((u-.55)*5,0,1)); const h=hand(v,'r'); const bx=[0,1,2,0][k2];
      if(u<.6) setB(it,h); else { const tgt=W(st,binsX[bx],.6,0); setB(it,arc(h,tgt,clamp((u-.6)/.25,0,1),.2)); } it.vis=u<.88; },ppl); break; }
  case 'court': { const pl=[0,1,2,3].map(i=>{ const a=add(P(st,(i-1.5)*3,-1,0,{shirt:new THREE.Color(i%2?'#2f6fa5':'#c98a12')})); a.tx=a.lx; a.tz=a.lz; return a; }); const b=ball('#d9772b',1.15);
    let holder=0, mode='dribble', t0=0, from=null, to=null, next=0;
    const hoop=W(st,0,3.05,-6.95);
    grp(st,(t,dt)=>{ pl.forEach((a,i)=>{ if(Math.hypot(a.tx-a.lx,a.tz-a.lz)<.2||!a.tx){ a.tx=(rnd()-.5)*12; a.tz=-6+rnd()*9; } const dx=a.tx-a.lx, dz=a.tz-a.lz, d=Math.hypot(dx,dz)||1e-3; const v=Math.min(d,dt*2.2); a.lx+=dx/d*v; a.lz+=dz/d*v; a.fy=Math.atan2(dx,dz); walk(a,dt,2.2); });
      const hp=pl[holder]; if(mode==='dribble'){ const h=hand(hp,'r'); hp.rA=.5; b.x=h[0]; b.z=h[2]; b.y=.12+Math.abs(Math.sin(t*7))*.85; if(t-t0>1.8){ t0=t; from=[b.x,b.y+.9,b.z]; if(rnd()<.35){ mode='shot'; to=hoop; hp.fy=Math.atan2(-hp.lx,-6.95-hp.lz); hp.rA=hp.lA=2.7; } else { mode='pass'; next=(holder+1+Math.floor(rnd()*3))%4; } } }
      else if(mode==='pass'){ const tp=hand(pl[next],'r'); const k2=(t-t0)/.6; setB(b,arc(from,[tp[0],1.1,tp[2]],clamp(k2,0,1),.6)); if(k2>=1){ holder=next; mode='dribble'; t0=t; } }
      else if(mode==='shot'){ const k2=(t-t0)/1.1; if(k2<1) setB(b,arc(from,hoop,k2,2.6)); else if(k2<1.5) setB(b,[hoop[0],lerp(3.05,.15,(k2-1)*2),hoop[2]]); else { let best=0,bd=1e9; pl.forEach((a,i)=>{ const d=Math.hypot(a.x-hoop[0],a.z-hoop[2]); if(d<bd){ bd=d; best=i; } }); holder=best; mode='dribble'; t0=t; } } },ppl); break; }
  case 'cage': { const kid=add(P(st,0,2.5,PI,{kid:true})); const b=ball('#ffffff',1.1);
    grp(st,(t)=>{ const on=Math.floor(t*1.3)%6, u=(t*1.3)%1; const foot=W(st,0,.13,1.9), pad=W(st,-3.5+on*1.4,1.2+(on%2)*1.4,-3.75); idle(kid,t); kid.rL=-.5+Math.exp(-Math.pow(u*12,2))*1.5;
      if(u<.35) setB(b,arc(foot,pad,u/.35,.2)); else setB(b,arc(pad,foot,(u-.35)/.65,.5)); },ppl); break; }
  case 'lane': {
    if(id==='basketball'){ const pl=add(P(st,0,-2.2,PI)); const b=ball('#d9772b',1.15); const hoop=W(st,0,3.05,-7.65);
      grp(st,(t)=>{ const T=3.6,u=(t%T); idle(pl,t); const rel=hand(pl,'r'); pl.rA=pl.lA=u<.25?2.8:.4+(u>3?2*(u-3):0);
        if(u<.25) setB(b,[rel[0],rel[1],rel[2]]); else if(u<1.3) setB(b,arc([rel[0],2.3,rel[2]],hoop,(u-.25)/1.05,1.6)); else if(u<1.7) setB(b,[hoop[0],lerp(3.05,.12,(u-1.3)/.4),hoop[2]]); else { const k2=(u-1.7)/1.6; const pp=W(st,0,.12,-2.6); setB(b,arc([hoop[0],.12,hoop[2]],pp,clamp(k2,0,1),.5)); } },ppl); }
    else { const pl=add(P(st,0,7.1,PI,{sit:true,y:.05,shirt:new THREE.Color('#1f8a8a')})); const b=ball('#c0392b',1.3); let tgt=[0,-6];
      grp(st,(t)=>{ const T=4,u=(t%T)/T; if(u<.01) tgt=[(rnd()-.5)*2.4,-4.5-rnd()*2.4]; sitIdle(pl,t); pl.rA=u<.15?.4+u*12:.9; const s0=W(st,.3,.9,6.6), e=W(st,tgt[0],.14,tgt[1]); if(u<.15) setB(b,s0); else { const k2=1-Math.pow(1-clamp((u-.15)/.6,0,1),2); setB(b,arc(s0,e,k2,.3)); } },ppl); }
    break; }
  case 'sprint': { const r=add(P(st,1,16,PI)); const w2=add(P(st,-1,-16,0));
    grp(st,(t,dt)=>{ const T=14,u=t%T; if(u<4.2){ r.lx=1; r.lz=16-32*u/4.2; r.fy=PI; walk(r,dt,7.6); } else { r.lx=-1; r.lz=-16+32*(u-4.2)/9.8; r.fy=0; walk(r,dt,3.2); }
      const u2=(t+7)%T; if(u2<4.2){ w2.lx=1; w2.lz=16-32*u2/4.2; w2.fy=PI; walk(w2,dt,7.2); } else { w2.lx=-1; w2.lz=-16+32*(u2-4.2)/9.8; w2.fy=0; walk(w2,dt,3.2); } },ppl); break; }
  case 'climb': { const cl=add(P(st,0,.75,PI,{shirt:new THREE.Color('#d33163')})); const at=add(P(st,2.4,2.8,PI,{shirt:DIDI})); face(at,0,0);
    grp(st,(t)=>{ const T=28,u=t%T; let y; if(u<20) y=8.2*u/20; else if(u<24) y=8.2*(1-(u-20)/4); else y=0; cl.y=y; const k2=Math.sin(u*2.2); cl.lx=Math.sin(u*.4)*1.2;
      if(u<20){ cl.lA=2.5+.45*k2; cl.rA=2.5-.45*k2; cl.lL=.45+.45*k2; cl.rL=.45-.45*k2; cl.kL=.9+.4*k2; cl.kR=.9-.4*k2; cl.lZ=cl.rZ=.35; cl.lean=-.05; } else { idle(cl,t); cl.lA=cl.rA=2.9; } idle(at,t); at.rA=.6; },ppl); break; }
  case 'kabaddi': { const n=6, s=1.35; const tile=i=>[(i%n-2.5)*s,(Math.floor(i/n)-2.5)*s]; const kids=[0,13].map(off=>{ const a=add(P(st,0,0,0,{kid:true})); a.off=off; return a; });
    grp(st,(t)=>{ const k2=Math.floor(t*2), u=t*2-k2; kids.forEach(a=>{ const A0=tile(((k2-1)*7+a.off)%36), B0=tile((k2*7+a.off)%36); const e=clamp(u*2.2,0,1); a.lx=lerp(A0[0],B0[0],e); a.lz=lerp(A0[1],B0[1],e); a.y=Math.sin(e*PI)*.45+.08; a.fy=Math.atan2(B0[0]-A0[0],B0[1]-A0[1]); a.lL=a.rL=e<1?.7:0; a.kL=a.kR=e<1?1.3:.05; a.lA=a.rA=e<1?1.6:.3; a.lZ=a.rZ=.6; }); },ppl); break; }
  case 'yoga': { const tr=add(P(st,0,-3.9,0,{shirt:new THREE.Color('#f2eee7')})); const ps=[]; for(let i=0;i<8;i++){ if(rnd()<.2) continue; ps.push(add(P(st,-4.5+(i%4)*3,-1+Math.floor(i/4)*3+.2,PI,{y:.03}))); }
    grp(st,(t)=>{ const ph=Math.floor(t/4)%4, e=clamp((t%4)/1,0,1); [tr,...ps].forEach((a,i)=>{ idle(a,t); const d=i?.15:0;
      if(ph===1){ a.lA=a.rA=lerp(.1,PI-.05,e); a.lZ=a.rZ=.1; a.rL=lerp(0,.9,e)-d; a.lean=0; }
      else if(ph===2){ a.lZ=a.rZ=lerp(.1,1.5,e); a.lA=a.rA=0; a.lL=-.4*e; a.rL=.5*e; }
      else if(ph===3){ a.lean=lerp(0,1.1,e)-d; a.lA=a.rA=lerp(.1,.9,e); }
    }); },ppl); break; }
  case 'bikes': { const rs=[0,1,2,3].map(i=>add(P(st,-5+i*2+(i>1?2:0),-.45,0,{sit:true,y:.64})));
    grp(st,(t)=>rs.forEach((r,i)=>{ const a=t*(5+i)+i; r.lL=1.05+.35*Math.sin(a); r.rL=1.05-.35*Math.sin(a); r.kL=r.lL-(.35+.35*Math.sin(a+1.2)); r.kR=r.rL-(.35-.35*Math.sin(a+1.2)); r.lA=r.rA=1.15; r.lZ=r.rZ=.12; r.lean=.35; }),ppl); break; }
  case 'steps': { const kid=add(P(st,-5.5,0,PI/2,{kid:true}));
    grp(st,(t)=>{ const T=11,u=t%T; if(u<5){ kid.lx=-5.5+u*2.2; kid.lz=0; kid.fy=PI/2; kid.y=Math.abs(Math.sin(u*PI/.45))*.32; kid.lL=kid.rL=.4; kid.lA=kid.rA=1.2; kid.lZ=kid.rZ=.5; } else { kid.lx=5.5-(u-5)*11/6; kid.lz=2; kid.fy=-PI/2; kid.y=0; walk(kid,1/60,1.8); } },ppl); break; }
  case 'shuttlestop': { const ps=[-1.3,0,1.3].map(x=>rnd()<.8?add(P(st,x,-.75,0,{sit:true,y:.02})):null).filter(Boolean); grp(st,(t)=>ps.forEach(p=>sitIdle(p,t)),ppl); break; }
  case 'hall': { const vs=[0,1,2,3].map(()=>{ const a=add(P(st,8+(rnd()-.5)*6,-6+rnd()*4,PI)); wander(a,box(3,15,-9,0),.8); return a; }); grp(st,(t,dt)=>vs.forEach(a=>stepWander(a,t,dt)),ppl); break; }
  case 'dronecage': { const ps=[-1.5,0,1.6].map(x=>add(P(st,x,5.3,PI,{kid:x===0}))); grp(st,(t)=>ps.forEach((p,i)=>{ idle(p,t); p.lean=-.1; if(i===1) p.rA=2.6; }),ppl); break; }
  case 'megaphone': { const ks=[-1,1].map(sx=>{ const [lx,lz]=toLocal(st,16*sx,st.z+1.5); const a=add(P(st,lx,lz,PI,{kid:true})); return a; });
    grp(st,(t)=>ks.forEach((a,i)=>{ idle(a,t); const on=(Math.floor(t/4.5)%2)===i; a.rA=on?2.2:.3; a.lA=on?2.2:.1; a.lZ=a.rZ=on?.3:.08; }),ppl); break; }
  case 'psa': case 'tower': case 'sign': break;
  default: break;
  }
}
STS.forEach(st=>{ try{ setup(st); }catch(e){ console.error('live',st.id,e); } });
/* visitors walking the paths between zones */
const WORLD={id:'world',x:0,z:0,rot:0,kind:'world'};
const walkers=[];
if(C.paths){ const {N,ADJ}=C.paths, nodes=Object.keys(N); const n=low?26:46;
  for(let i=0;i<n;i++){ const a0=nodes[Math.floor(rnd()*nodes.length)], b0=ADJ[a0][Math.floor(rnd()*ADJ[a0].length)];
    const k=rnd(), kid=k<.15, a=P(WORLD,0,0,0,{kid}); if(!a) break; a.na=a0; a.nb=b0; a.u=rnd(); a.sp=kid?1.5:.95+rnd()*.5; a.off=(rnd()-.5)*2.6; walkers.push(a);
    if(rnd()<.35&&nA<MAXA){ const b=P(WORLD,0,0,0,{}); b.follow=a; b.dx=.75; walkers.push(b); } } }
function stepWalkers(t,dt){ const {N,ADJ}=C.paths;
  for(const a of walkers){ if(a.follow) continue; const A=N[a.na],B=N[a.nb]; const len=Math.hypot(B[0]-A[0],B[1]-A[1])||1; a.u+=a.sp*dt/len;
    if(a.u>=1){ a.u=0; const opts=ADJ[a.nb].filter(x=>x!==a.na); const nx=(opts.length?opts:ADJ[a.nb])[Math.floor(rnd()*(opts.length||ADJ[a.nb].length))]; a.na=a.nb; a.nb=nx; }
    const A2=N[a.na],B2=N[a.nb], L2=Math.hypot(B2[0]-A2[0],B2[1]-A2[1])||1, ux=(B2[0]-A2[0])/L2, uz=(B2[1]-A2[1])/L2;
    a.lx=A2[0]+(B2[0]-A2[0])*a.u-uz*a.off; a.lz=A2[1]+(B2[1]-A2[1])*a.u+ux*a.off; a.fy=Math.atan2(ux,uz); walk(a,dt,a.sp); a.ux=ux; a.uz=uz; }
  for(const b of walkers){ if(!b.follow) continue; const a=b.follow; b.lx=a.lx-a.uz*b.dx; b.lz=a.lz+a.ux*b.dx; b.fy=a.fy; walk(b,dt,a.sp); b.ph=a.ph+.4; }
}
if(walkers.length) G.push({st:WORLD,always:true,fn:stepWalkers,ppl:walkers});
iT.count=iH.count=iR.count=nA; iL.count=iA.count=iS.count=nA*2;
people.forEach(a=>{ a.y0=0; write(a); });
[iT,iH,iL,iA,iS,iR].forEach(m=>{ m.instanceMatrix.needsUpdate=true; if(m.instanceColor) m.instanceColor.needsUpdate=true; });
if(iB.instanceColor) iB.instanceColor.needsUpdate=true; writeBalls();

/* ================= per-frame ================= */
let scrT=0, active=[];
function update(t,dt){
  const p=state.player, high=p.y>18, R=high?240:110, R2=R*R;
  for(const g of G){ const dx=g.st.x-p.x, dz=g.st.z-p.z; if(!g.always&&dx*dx+dz*dz>R2) continue; g.fn(t,dt);
    for(const a of g.ppl){ if(!a.w) { const yy=a.y; if(a.st.kind!=='pillars'){ const [x,z]=toWorld(a.st,a.lx,a.lz); a.x=x; a.z=z; } a.ry=a.st.rot+a.fy; const yb=a.y0||0; a.y=yy+yb; write(a); a.y=yy; } } }
  iT.instanceMatrix.needsUpdate=iH.instanceMatrix.needsUpdate=iL.instanceMatrix.needsUpdate=iA.instanceMatrix.needsUpdate=iS.instanceMatrix.needsUpdate=iR.instanceMatrix.needsUpdate=true;
  writeBalls();
  // screens: redraw the nearest few
  scrT-=dt; if(scrT<=0){ scrT=.25; active=screens.map(s=>{ s.d=Math.hypot(s.x-p.x,s.z-p.z); return s; }).filter(s=>s.d<(high?0:32)).sort((a,b)=>a.d-b.d).slice(0,low?3:6); }
  for(const s of active){ if(t-s.last>(low?.18:.11)){ s.last=t; try{ s.draw(s,t); }catch(e){} s.tex.needsUpdate=true; } }
  // speech bubble for the nearest talker
  let best=null, bd=17; if(!high) for(const k of talkers){ const d=Math.hypot(k.a.x-p.x,k.a.z-p.z); if(d<bd){ bd=d; best=k; } }
  if(best){ const L=LINES[best.key]; const line=L[Math.floor(t/4.2)%L.length]; if(bub.dataset.l!==line){ bub.dataset.l=line; const m=line.match(/^(.*?)\s*\((.*)\)$/); bub.innerHTML=''; const b1=document.createElement('b'); b1.textContent=m?m[1]:line; bub.appendChild(b1); if(m){ const s2=document.createElement('span'); s2.textContent=m[2]; bub.appendChild(s2); } }
    if(!C.place(bub,best.a.x,best.a.y+(best.a.sit?1.7:2.25)*best.a.s,best.a.z)) bub.style.display='none'; }
  else bub.style.display='none';
}
return {update, count:()=>nA};
};
