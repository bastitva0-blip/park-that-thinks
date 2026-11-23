/* Station builders for the AI Park world. Each builder draws one station in its own local frame
   (front = +z), registers colliders, and may add animated parts. */
window.ParkBuilders = (function(){
  const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  const Cy=(rt,rb,h,s=16,open=false,ts=0,tl=Math.PI*2)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open,ts,tl);
  const Sp=(r,d=1)=>new THREE.IcosahedronGeometry(r,d);
  const PI=Math.PI;

  function columns(K,w,d,h,step,mat='steel',r=.12){ // perimeter columns
    const pts=[]; const nx=Math.max(1,Math.round(w/step)), nz=Math.max(1,Math.round(d/step));
    for(let i=0;i<=nx;i++){ pts.push([-w/2+i*w/nx,-d/2]); pts.push([-w/2+i*w/nx,d/2]); }
    for(let j=1;j<nz;j++){ pts.push([-w/2,-d/2+j*d/nz]); pts.push([w/2,-d/2+j*d/nz]); }
    for(const [x,z] of pts){ K.put(Cy(r,r,h,10),mat,x,h/2,z); K.circ(x,z,r+.15); }
  }
  function roof(K,w,d,y,zone){ K.put(B(w,.35,d),'roof',0,y,0); K.put(B(w+.06,.4,d+.06),'z_'+zone,0,y-.3,0); }
  function screenOn(K,lx,ly,lz,w,h,ry=0,mat='screen'){ K.put(B(w,h,.08),mat,lx,ly,lz,ry); K.put(B(w+.16,h+.16,.06),'darksteel',lx,ly,lz-.03*Math.cos(ry),ry); }

  const b = {};

  b.kiosk=(st,K)=>{
    K.put(B(4.4,.2,4.4),'paving',0,.1,0);
    for(const [x,z] of [[-1.9,-1.9],[1.9,-1.9],[-1.9,1.9],[1.9,1.9]]){ K.put(Cy(.09,.09,3,8),'steel',x,1.7,z); K.circ(x,z,.25); }
    roof(K,5,5,3.3,st.zone);
    K.put(B(2.6,1.05,.9),'wood',0,.72,.5); K.put(B(2.7,.06,1),'white',0,1.27,.5);
    K.put(Cy(.05,.05,.7,6),'darksteel',0,1.6,.3); screenOn(K,0,2.25,.3,1.5,.9);
    K.box(0,.5,1.35,.5);
  };
  b.booth=(st,K)=>{
    K.put(B(4.2,.12,4.2),'darkfloor',0,.06,0);
    K.put(B(4.2,3.2,.2),'white',0,1.6,-2); K.put(B(.2,3.2,4.2),'white',-2,1.6,0); K.put(B(.2,3.2,4.2),'white',2,1.6,0);
    K.put(B(4.6,.25,4.6),'roof',0,3.32,0); K.put(B(4.2,.8,.24),'z_'+st.zone,0,2.8,2);
    screenOn(K,0,1.7,-1.85,2.6,1.5);
    K.put(B(1.4,.9,.6),'darksteel',0,.45,-.6);
    K.box(0,-.9,2.15,1.25); K.box(-2,1.2,.15,.9); K.box(2,1.2,.15,.9);
  };
  b.pod=(st,K)=>{
    K.put(Cy(4.4,4.4,.2,32),'paving',0,.1,0);
    K.put(Cy(4,4,2.9,32,true),'glass',0,1.6,0);
    K.put(Cy(4.6,4.6,.3,32),'roof',0,3.15,0); K.put(Cy(4.62,4.62,.26,32),'z_'+st.zone,0,2.92,0);
    screenOn(K,0,1.7,-3.2,3,1.6);
    for(let i=0;i<6;i++){ const a=i/6*PI*2+.3; K.put(B(.7,.45,.7),'wood',Math.cos(a)*2,.25,Math.sin(a)*2+.4); }
    K.circ(0,0,4.15);
  };
  b.pavilion=(st,K)=>{
    const w=st.w||14,d=st.d||10;
    K.put(B(w,.2,d),'paving',0,.1,0);
    columns(K,w,d,4.4,4,'steel',.14);
    roof(K,w+2,d+2,4.6,st.zone);
    if(st.glass){ K.put(B(w,4.2,.08),'glass',0,2.3,d/2); K.put(B(w,4.2,.08),'glass',0,2.3,-d/2); K.put(B(.08,4.2,d),'glass',-w/2,2.3,0); K.put(B(.08,4.2,d),'glass',w/2,2.3,0);
      for(let i=0;i<4;i++) screenOn(K,-w/2+2+i*(w-4)/3,2.2,-d/2+.6,2.4,1.4);
      K.put(B(w*.5,.9,1.2),'darksteel',0,.45,0); screenOn(K,0,1.5,.1,3,1.2,0,'screen2');
    } else {
      for(let x=-w/2+.6;x<w/2;x+=.8) K.put(B(.1,3.8,.5),'wood',x,2.3,-d/2);
      for(let i=0;i<10;i++){ const x=-w/2+1.5+(i%5)*(w-3)/4, z=-1.5+Math.floor(i/5)*3; K.put(B(.7,.9,.7),'white',x,.45,z); K.put(B(.5,.25+.2*((i*7)%5),.5),'z_'+st.zone,x,1.05+.1*((i*7)%5),z); }
    }
    K.box(0,0,w/2+.1,d/2+.1);
  };
  b.helpdesk=(st,K)=>{
    K.put(Cy(6,6,.12,32),'paving',0,.06,0);
    K.put(Cy(1.6,1.7,1,24),'wood',0,.5,0); K.put(Cy(1.75,1.75,.08,24),'white',0,1.04,0);
    K.put(Cy(.08,.08,3.6,8),'steel',0,2.6,0); K.put(Cy(.05,3.6,.9,24),'z_'+st.zone,0,4.2,0);
    K.circ(0,0,1.8);
  };
  b.plot=(st,K)=>{
    K.put(B(9,.35,6),'soil',0,.17,0); K.put(B(9.3,.4,.2),'wood',0,.2,3.05); K.put(B(9.3,.4,.2),'wood',0,.2,-3.05); K.put(B(.2,.4,6),'wood',-4.6,.2,0); K.put(B(.2,.4,6),'wood',4.6,.2,0);
    for(let r=0;r<4;r++) for(let c=0;c<9;c++){ const sick=(r*9+c)%7===3; K.put(Sp(.32+.08*((r+c)%3),0),sick?'plantY':'plant',-4+c,.55,-2.2+r*1.45); }
    K.put(Cy(.05,.05,1.6,6),'darksteel',3.8,.8,3.6); screenOn(K,3.8,1.7,3.6,1,.7);
  };
  b.amphi=(st,K,C)=>{
    C.ground.push((x,z)=>{ const dx=x-st.x, dz=z-st.z; if(dx*dx+dz*dz>300) return 0; const [lx,lz]=C.toLocal(st,x,z); if(lz<0) return 0; const r=Math.hypot(lx,lz); const t=Math.round((r-9)/2.3); if(t<0||t>3||Math.abs(r-(9+t*2.3))>1.12) return 0; return .45*(t+1); });
    for(let t=0;t<4;t++){ const r=9+t*2.3, n=Math.round(PI*r/2.3); for(let i=0;i<=n;i++){ const a=PI*i/n; K.put(B(2.2,.45*(t+1),2.1),'stone',Math.cos(a)*r,.225*(t+1),Math.sin(a)*r,-a+PI/2); } }
    K.put(B(12,.6,6),'paving',0,.3,-2); screenOn(K,0,3.4,-5.2,9,4.6,0,'screen2'); K.put(B(.3,6,.3),'darksteel',-4.8,3,-5.4); K.put(B(.3,6,.3),'darksteel',4.8,3,-5.4);
    K.box(0,-5.3,4.8,.3); K.plat(0,-2,4.6,.6,6,3);
  };
  b.maths=(st,K,C)=>{
    K.put(Cy(4.4,4.8,.5,32),'stone',0,.25,0);
    K.put(B(.4,7,.4),'darksteel',-5.4,3.5,0); K.put(B(.4,7,.4),'darksteel',5.4,3.5,0); K.put(B(11.2,.4,.5),'darksteel',0,7,0);
    const words=[['The','Lucknow','A','Every','Our'],['park','city','garden','child','evening'],['is','feels','stays','grows','looks'],['green','cool','alive','open','bright'],['today','tonight','again','together','forever']];
    const wheels=[];
    words.forEach((list,i)=>{
      const c=document.createElement('canvas'); c.width=1024; c.height=128; const x=c.getContext('2d');
      x.fillStyle='#f3efe8'; x.fillRect(0,0,1024,128);
      list.forEach((w,k)=>{ x.fillStyle=k%2?'#efe2e6':'#f8f4f5'; x.fillRect(k*204.8,0,204.8,128); x.fillStyle='#1a1a1a'; x.font='700 46px Manrope, Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(w,k*204.8+102,64); });
      const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
      const m=new THREE.Mesh(Cy(1.05,1.05,1.7,40),new THREE.MeshStandardMaterial({map:t,roughness:.6}));
      const g=new THREE.Group(); g.add(m); m.rotation.z=PI/2; K.obj(g,-4.2+i*2.1,4,0);
      wheels.push({m, target:0, cur:0, next:i*.6});
    });
    K.put(B(10.8,.3,2.6),'z_'+st.zone,0,2.6,0);
    C.anim.push((t,dt)=>{ for(const w of wheels){ if(t>w.next){ w.target=Math.floor(Math.random()*5); w.next=t+2.5+Math.random()*2; } const goal=-w.target/5*PI*2+PI/2; w.cur+=(goal-w.cur)*Math.min(1,dt*2.2); w.m.rotation.x=w.cur+t*0; } });
    K.circ(0,0,5.6);
  };
  b.wall=(st,K,C)=>{
    K.put(B(10.6,.4,1.2),'stone',0,.2,0);
    K.put(B(10.6,5,.5),'darksteel',0,2.9,-.1); K.put(B(10.6,.3,.56),'z_'+st.zone,0,.55,-.1);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(10,4.3),new THREE.MeshBasicMaterial({map:C.tex(st.img),toneMapped:false})); K.obj(p,0,3.05,.16);
    K.box(0,0,5.4,.65);
  };
  b.board=(st,K,C)=>{
    K.put(B(2.6,.3,1.2),'stone',0,.15,0); K.put(B(2.4,3.2,.26),'white',0,1.9,0); K.put(B(2.42,.2,.28),'z_'+st.zone,0,.55,0);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.6),new THREE.MeshBasicMaterial({map:C.tex(st.img),toneMapped:false})); K.obj(p,0,2.45,.14);
    const p2=p.clone(); K.obj(p2,0,2.45,-.14,PI);
    K.box(0,0,1.3,.5);
  };
  b.sign=(st,K)=>{ K.put(B(.9,3.4,.9),'white',0,1.7,0); K.put(B(.74,1.1,.04),'eink',0,2.2,.46); K.put(B(.3,.3,.04),'darksteel',0,1.3,.46); K.put(B(.92,.2,.92),'z_'+st.zone,0,3.3,0); K.circ(0,0,.7); };
  b.tower=(st,K)=>{ K.put(Cy(.12,.16,6,8),'steel',0,3,0); K.put(B(.7,.45,.45),'white',0,5.4,.1); K.put(Sp(.22,1),'white',0,6.1,0); K.put(B(1,.06,.7),'solarpanel',0,4.7,-.3,0,-.5); K.put(B(.8,.5,.1),'z_'+st.zone,0,1.6,.16); K.circ(0,0,.35); };
  b.psa=(st,K,C)=>{
    const mat=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:.6,roughness:.3});
    const msgs=['#f2b134','#7ec4e8','#e46d8c','#9bd17a'];
    const ps=[];
    for(let i=0;i<4;i++){ const a=i/4*PI*2+PI/4, x=Math.cos(a)*7, z=Math.sin(a)*7; K.put(B(1,.3,1),'stone',x,.15,z); const m=new THREE.Mesh(B(.8,5,.8),mat.clone()); K.obj(m,x,2.8,z); ps.push(m); K.circ(x,z,.7); }
    C.anim.push((t)=>{ ps.forEach((m,i)=>{ const c=msgs[(Math.floor(t/4)+i)%4]; m.material.emissive.set(c); m.material.color.set(c); m.material.emissiveIntensity=.35+C.state.nf*1.1; }); });
  };
  b.megaphone=(st,K,C)=>{
    // drawn in world space: a pair 32 m apart across the gate plaza
    for(const sx of [-1,1]){
      const k2=C.worldKit(16*sx, st.z, 0);
      k2.put(Cy(.3,.5,5.5,10),'steel',0,2.75,0);
      k2.put(Cy(.12,.18,3,8),'steel',-.6*sx,5.6,0,0,0,.5*sx); k2.put(Cy(.12,.18,3,8),'steel',.5*sx,5.4,0,0,0,-.4*sx);
      k2.put(Cy(1.2,.25,1.8,20,true),'z_'+st.zone,-1.4*sx,7,0,0,0,-PI/2*sx);
      k2.put(Cy(1.3,1.3,.2,24),'stone',0,.1,0); k2.circ(0,0,.7);
    }
  };
  b.arch=(st,K)=>{
    for(const x of [-4.2,4.2]){ K.put(B(2.2,7,2.2),'sandstone',x,3.5,0); K.put(B(2.6,.5,2.6),'sandstone',x,7.2,0); K.put(Sp(.7,1),'sandstone',x,8,0); K.circ(x,0,1.4); }
    const tor=new THREE.TorusGeometry(4.2,.7,12,24,PI); K.put(tor,'sandstone',0,6.2,0);
    K.put(B(10.4,.6,1.6),'z_'+st.zone,0,7.6,0); K.put(Cy(.6,.6,.2,24),'white',0,6.8,1.05,0,PI/2);
  };
  b.lockers=(st,K)=>{ K.put(B(6,2.4,.9),'steel',0,1.2,0); for(let i=0;i<6;i++) for(let j=0;j<3;j++) K.put(B(.86,.66,.04),(i+j)%3?'white':'z_'+st.zone,-2.5+i,.5+j*.75,.46); K.box(0,0,3.1,.55); };
  b.cityfloor=(st,K,C)=>{
    const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
    const roads=[]; for(let i=0;i<14;i++) roads.push([Math.random()*512,Math.random()*512,Math.random()*512,Math.random()*512]);
    const cars=Array.from({length:60},()=>({r:Math.floor(Math.random()*14),p:Math.random(),v:.05+Math.random()*.12}));
    let last=0;
    function draw(tt){
      x.fillStyle='#0d1a24'; x.fillRect(0,0,512,512);
      x.strokeStyle='#1f6f8f'; x.lineWidth=7; x.beginPath(); x.moveTo(0,330); x.bezierCurveTo(140,250,280,420,512,300); x.stroke(); // the Gomti
      x.strokeStyle='#2e4656'; x.lineWidth=3; roads.forEach(r=>{x.beginPath();x.moveTo(r[0],r[1]);x.lineTo(r[2],r[3]);x.stroke();});
      x.strokeStyle='#d33163'; x.lineWidth=3; x.beginPath(); x.moveTo(40,80); x.lineTo(470,440); x.stroke(); x.strokeStyle='#f2b134'; x.beginPath(); x.moveTo(60,460); x.lineTo(460,60); x.stroke();
      cars.forEach(cv=>{ cv.p=(cv.p+cv.v*.03)%1; const r=roads[cv.r]; x.fillStyle='#ffe9a8'; x.fillRect(r[0]+(r[2]-r[0])*cv.p-2,r[1]+(r[3]-r[1])*cv.p-2,4,4); });
      for(let i=0;i<6;i++){ const px=80+i*70, py=120+((i*97)%260); const a=.35+.35*Math.sin(tt*1.5+i); x.fillStyle=`rgba(156,203,59,${a})`; x.beginPath(); x.arc(px,py,26,0,7); x.fill(); }
      t.needsUpdate=true;
    }
    const m=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshBasicMaterial({map:t,toneMapped:false})); m.rotation.x=-PI/2; K.obj(m,0,.07,0);
    K.put(B(19,.1,19),'glass',0,.04,0);
    for(const [a,bb] of [[0,9.6],[0,-9.6]]) K.put(B(19.4,.2,.4),'darksteel',a,.1,bb); for(const a of [9.6,-9.6]) K.put(B(.4,.2,19.4),'darksteel',a,.1,0);
    screenOn(K,0,1.8,-11.2,5,2.8,0,'screen2'); K.put(B(.2,3.4,.2),'darksteel',-2.6,1.7,-11.3); K.put(B(.2,3.4,.2),'darksteel',2.6,1.7,-11.3); K.box(0,-11.3,2.7,.2);
    C.anim.push((tt)=>{ if(tt-last>.08 && C.state.near(st,40)){ last=tt; draw(tt); } });
    draw(0);
  };
  b.pillars=(st,K,C)=>{
    const n=7, s=1.7, geo=B(1.5,1,1.5), mat=C.M.white2;
    const im=new THREE.InstancedMesh(geo,mat,n*n); im.castShadow=true; im.receiveShadow=true; K.obj(im,0,0,0);
    const d=new THREE.Object3D(); const heights=new Float32Array(n*n);
    C.anim.push((t)=>{ const mode=Math.floor(t/8)%3; let i=0;
      for(let a=0;a<n;a++) for(let c=0;c<n;c++){ const lx=(a-3)*s, lz=(c-3)*s; let h;
        if(mode===0) h=.25+.25*Math.sin(t*1.4+a*.7+c*.5);
        else if(mode===1) h= (a===0||a===6||c===0)?.75:(a>2&&a<5&&c>3?.9:.08); // seating ring with a stage
        else h=.08+.04*Math.sin(t*3+a+c);
        heights[i]+=(h-heights[i])*.06; d.position.set(lx,heights[i]/2,lz); d.scale.set(1,Math.max(.05,heights[i]),1); d.updateMatrix(); im.setMatrixAt(i++,d.matrix); }
      im.instanceMatrix.needsUpdate=true; });
    C.ground.push((x,z)=>{ const [lx,lz]=C.toLocal(st,x,z); const a=Math.round(lx/s)+3, c=Math.round(lz/s)+3; if(a<0||a>6||c<0||c>6) return 0; if(Math.abs(lx-(a-3)*s)>.75||Math.abs(lz-(c-3)*s)>.75) return 0; return heights[a*n+c]; });
  };
  b.nightgarden=(st,K,C)=>{
    const N=64, R=10; const im=new THREE.InstancedMesh(B(1.1,.06,1.5),new THREE.MeshStandardMaterial({color:'#9aa6a8',emissive:'#5fe0d0',emissiveIntensity:0,roughness:.6}),N);
    const d=new THREE.Object3D(); const pos=[];
    for(let i=0;i<N;i++){ const a=i/N*PI*2; d.position.set(Math.cos(a)*R,.04,Math.sin(a)*R); d.rotation.y=-a; d.updateMatrix(); im.setMatrixAt(i,d.matrix); im.setColorAt(i,new THREE.Color('#ffffff')); pos.push(C.toWorld(st,Math.cos(a)*R,Math.sin(a)*R)); }
    K.obj(im,0,0,0);
    for(let i=0;i<70;i++){ const a=Math.random()*PI*2, r=Math.random()<.5? R-2.5-Math.random()*4 : R+1.6+Math.random()*3; const h=.3+Math.random()*.7; K.put(i%3?Sp(.28+Math.random()*.25,0):Cy(.04,.18,h,5),'bio',Math.cos(a)*r,h/2+.05,Math.sin(a)*r); }
    for(let i=0;i<14;i++){ const a=i/14*PI*2; K.put(Sp(1.1,1),'leafdark',Math.cos(a)*(R+5),1.1,Math.sin(a)*(R+5)); }
    const col=new THREE.Color(), lit=new Float32Array(N);
    C.anim.push((t,dt)=>{ if(!C.state.near(st,40)) return; const p=C.state.player; let any=false;
      for(let i=0;i<N;i++){ const dx=pos[i][0]-p.x, dz=pos[i][1]-p.z; const near=dx*dx+dz*dz<9?1:0; lit[i]=Math.max(near, lit[i]-dt*.5); col.setRGB(.3+lit[i]*.7,.3+lit[i]*.7,.3+lit[i]*.7); im.setColorAt(i,col); }
      im.material.emissiveIntensity=.15+C.state.nf*1.6; im.instanceColor.needsUpdate=true; });
  };
  b.court=(st,K)=>{
    K.put(B(18,.08,14),'court',0,.04,0);
    for(const [w,d,x,z] of [[18,.1,0,7],[18,.1,0,-7],[.1,14,9,0],[.1,14,-9,0],[.1,14,0,0]]) K.put(B(w,.02,d),'white',x,.09,z);
    K.put(new THREE.TorusGeometry(3,.05,4,32,PI),'white',0,.09,-7,0,PI/2);
    K.put(Cy(.1,.1,3.4,8),'darksteel',0,1.7,-7.6); K.put(B(1.8,1.1,.06),'white',0,3.3,-7.3); K.put(new THREE.TorusGeometry(.23,.03,6,16),'red',0,3.05,-6.95,0,PI/2); K.circ(0,-7.6,.3);
    for(const [x,z] of [[-9.4,-7.4],[9.4,-7.4],[-9.4,7.4],[9.4,7.4]]){ K.put(Cy(.07,.07,5,6),'darksteel',x,2.5,z); K.put(B(.4,.3,.3),'white',x,5,z); }
  };
  b.cage=(st,K,C)=>{
    K.put(B(10,.08,8),'turf',0,.04,0);
    for(const [x,z] of [[-5,-4],[5,-4],[-5,4],[5,4]]) K.put(Cy(.08,.08,4,6),'darksteel',x,2,z);
    K.put(B(10,4,.04),'net',0,2,-4); K.put(B(.04,4,8),'net',-5,2,0); K.put(B(.04,4,8),'net',5,2,0); K.put(B(10,.08,8),'net',0,4,0);
    const pads=[]; for(let i=0;i<6;i++){ const m=new THREE.Mesh(B(1.2,1.2,.08),C.M.ledoff); K.obj(m,-3.5+i*1.4,1.2+(i%2)*1.4,-3.9); pads.push(m); }
    C.anim.push(t=>{ const on=Math.floor(t*1.3)%6; pads.forEach((m,i)=>m.material=i===on?C.M.ledon:C.M.ledoff); });
    K.box(0,-4,5,.15); K.box(-5,0,.15,4); K.box(5,0,.15,4);
  };
  b.lane=(st,K)=>{
    K.put(B(3.6,.08,16),st.id==='boccia'?'court2':'court',0,.04,0); K.put(B(.06,.02,16),'white',-1.75,.09,0); K.put(B(.06,.02,16),'white',1.75,.09,0);
    if(st.id==='basketball'){ K.put(Cy(.1,.1,3.4,8),'darksteel',0,1.7,-8.3); K.put(B(1.8,1.1,.06),'white',0,3.3,-8); K.put(new THREE.TorusGeometry(.23,.03,6,16),'red',0,3.05,-7.65,0,PI/2); K.circ(0,-8.3,.3); }
    else { K.put(Sp(.12,1),'white',0,.16,-6); for(let i=0;i<6;i++) K.put(Sp(.14,1),i%2?'red':'blue',-.6+Math.random()*1.2,.16,-6.8+Math.random()*1.6); }
  };
  b.sprint=(st,K,C)=>{
    K.put(B(4,.08,34),'track',0,.04,0); for(const x of [-2,0,2]) K.put(B(.06,.02,34),'white',x,.09,0);
    for(const z of [-15,15]){ K.put(B(.3,3,.3),'darksteel',-2.4,1.5,z); K.put(B(.3,3,.3),'darksteel',2.4,1.5,z); K.put(B(5.1,.4,.4),'z_'+st.zone,0,3,z); K.circ(-2.4,z,.3); K.circ(2.4,z,.3); }
    K.put(B(4,.03,.3),'white',0,.1,-15); K.put(B(4,.03,.3),'white',0,.1,15);
    C.sprint=st;
  };
  b.climb=(st,K)=>{
    K.put(B(8,10,.6),'concrete',0,5,0); K.put(B(9,.3,3),'mat',0,.15,1.6);
    for(let i=0;i<70;i++){ const x=-3.6+Math.random()*7.2, y=.8+Math.random()*8.8; K.put(B(.25,.2,.2),['hold1','hold2','hold3'][i%3],x,y,.38); }
    for(const x of [-2.5,0,2.5]) K.put(B(.5,.5,.6),'white',x,10.2,.3);
    K.box(0,0,4.2,.5);
  };
  b.kabaddi=(st,K,C)=>{
    const n=6, s=1.35, im=new THREE.InstancedMesh(B(1.25,.08,1.25),new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:.25,roughness:.5}),n*n);
    const d=new THREE.Object3D(); for(let i=0;i<n*n;i++){ d.position.set((i%n-2.5)*s,.05,(Math.floor(i/n)-2.5)*s); d.updateMatrix(); im.setMatrixAt(i,d.matrix); im.setColorAt(i,new THREE.Color('#2b3340')); }
    K.obj(im,0,0,0); K.put(B(n*s+.6,.04,n*s+.6),'darksteel',0,.02,0);
    const c1=new THREE.Color('#2b3340'), c2=new THREE.Color(st.zone?'#f2b134':'#fff'), c3=new THREE.Color('#d33163'); let last=-1;
    C.anim.push(t=>{ const k=Math.floor(t*2); if(k===last) return; last=k; for(let i=0;i<n*n;i++) im.setColorAt(i,c1); for(let j=0;j<3;j++) im.setColorAt((k*7+j*13)%(n*n), j?c3:c2); im.instanceColor.needsUpdate=true; });
  };
  b.yoga=(st,K)=>{
    K.put(B(14,.04,10),'turf',0,.02,0);
    const cols=['#d33163','#2f6fa5','#2f7d4f','#c98a12','#6a4ba3','#1f8a8a'];
    for(let i=0;i<8;i++) K.put(B(.7,.03,1.8),'mat'+(i%3),-4.5+(i%4)*3,.06,-1+Math.floor(i/4)*3);
    const c=document.createElement('canvas'); c.width=512; c.height=288; const x=c.getContext('2d'); x.fillStyle='#10202c'; x.fillRect(0,0,512,288);
    x.strokeStyle='#7ee0c3'; x.lineWidth=6; x.lineCap='round'; const P=[[256,60],[256,150],[190,95],[322,95],[200,250],[312,250]];
    x.beginPath(); x.arc(256,40,18,0,7); x.stroke(); [[0,1],[0,2],[0,3],[1,4],[1,5]].forEach(([a,b2])=>{x.beginPath();x.moveTo(...P[a]);x.lineTo(...P[b2]);x.stroke();});
    x.fillStyle='#ffffff'; x.font='600 22px Inter, Arial'; x.fillText('Tree pose · 92 / 100',150,280);
    const tex=new THREE.CanvasTexture(c); tex.encoding=THREE.sRGBEncoding;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(6,3.4),new THREE.MeshBasicMaterial({map:tex,toneMapped:false})); K.obj(m,0,2.4,-5.4);
    K.put(B(6.3,3.7,.2),'darksteel',0,2.4,-5.55); K.put(B(.2,1,.2),'darksteel',-2,.5,-5.55); K.put(B(.2,1,.2),'darksteel',2,.5,-5.55); K.box(0,-5.55,3.2,.2);
  };
  b.bikes=(st,K)=>{
    for(let i=0;i<6;i++){ const x=-5+i*2; K.put(B(.18,.9,1.2),'darksteel',x,.6,0); K.put(new THREE.TorusGeometry(.38,.07,6,18),'darksteel',x,.45,.45,PI/2); K.put(B(.4,.08,.3),'mat0',x,1.1,-.35); K.put(B(.6,.06,.1),'steel',x,1.25,.5); }
    screenOn(K,0,2.4,-1.6,6,1.6,0,'screen2'); K.put(B(.2,1.8,.2),'darksteel',-2.8,.9,-1.7); K.put(B(.2,1.8,.2),'darksteel',2.8,.9,-1.7);
    K.box(0,-.3,6.2,1.4);
  };
  b.steps=(st,K,C)=>{
    const n=12, im=new THREE.InstancedMesh(B(.95,.12,2.6),new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:.5,roughness:.4}),n);
    const d=new THREE.Object3D(); const base=new THREE.Color('#e8e2d8'); const lit=new Float32Array(n);
    for(let i=0;i<n;i++){ d.position.set((i-(n-1)/2)*1,.06,0); d.updateMatrix(); im.setMatrixAt(i,d.matrix); im.setColorAt(i,base); }
    K.obj(im,0,0,0); const hue=new THREE.Color();
    C.anim.push((t,dt)=>{ if(!C.state.near(st,20)) return; const [lx,lz]=C.toLocal(st,C.state.player.x,C.state.player.z);
      for(let i=0;i<n;i++){ const on=Math.abs(lx-(i-(n-1)/2))<.5&&Math.abs(lz)<1.3?1:0; lit[i]=Math.max(on,lit[i]-dt*1.5); hue.setHSL(i/n,.7,.5); im.setColorAt(i,base.clone().lerp(hue,lit[i])); }
      im.instanceColor.needsUpdate=true; });
  };
  b.shuttlestop=(st,K,C)=>{
    K.put(B(6,.15,3),'paving',0,.07,0); K.put(B(6,2.6,.1),'glass',0,1.4,-1.4); K.put(B(6.4,.2,3.4),'roof',0,2.8,0); K.put(B(.12,2.7,.12),'darksteel',-3,1.4,1.3); K.put(B(.12,2.7,.12),'darksteel',3,1.4,1.3);
    K.put(B(4,.45,.6),'wood',0,.45,-.9); K.put(B(6.44,.3,3.44),'z_'+st.zone,0,2.6,0); K.box(0,-1.4,3,.2);
    const road=C.worldKit(90,159.5,0); road.put(B(130,.05,4.4),'asphalt',0,.03,0);
    // an electric pod shuttle, after the proposal render: pink rounded shell, white skirt, wraparound glass. Front faces local +x.
    const car=new THREE.Group(), L=4.6, H=2.2, Wd=2, y0=.35, rr=.62, bv=.08;
    const pink=new THREE.MeshStandardMaterial({color:'#efc0cf',roughness:.42,metalness:.08}), glass=new THREE.MeshStandardMaterial({color:'#24313d',roughness:.12,metalness:.3});
    const pm=(g,m,x,y,z,sh)=>{ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); if(sh) o.castShadow=true; car.add(o); return o; };
    const rrShape=(l,h,r)=>{ const sh=new THREE.Shape(), a=l/2, x0=-a, x1=a, b0=0, b1=h; sh.moveTo(x0+r,b0); sh.lineTo(x1-r,b0); sh.quadraticCurveTo(x1,b0,x1,b0+r); sh.lineTo(x1,b1-r); sh.quadraticCurveTo(x1,b1,x1-r,b1); sh.lineTo(x0+r,b1); sh.quadraticCurveTo(x0,b1,x0,b1-r); sh.lineTo(x0,b0+r); sh.quadraticCurveTo(x0,b0,x0+r,b0); return sh; };
    const shell=new THREE.ExtrudeGeometry(rrShape(L-2*bv,H-2*bv,rr),{depth:Wd-2*bv,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:3,curveSegments:10}); shell.translate(0,y0+bv,-(Wd-2*bv)/2);
    pm(shell,pink,0,0,0,true);
    // glass: a band round the sides and a tall windscreen at each end
    for(const sz of [-1,1]) pm(B(3.1,.95,.04),glass,0,1.62,sz*(Wd/2+.005));
    for(const sx of [-1,1]){ pm(B(.04,.9,Wd-.36),glass,sx*(L/2+.005),1.48,0); for(const sz of [-1,1]) pm(B(.45,.95,.04),glass,sx*1.86,1.62,sz*(Wd/2+.005)); }
    // pillars between the side windows, doors on the kerb side
    for(const x of [-.55,.55]) for(const sz of [-1,1]) pm(B(.1,.97,.06),pink,x,1.62,sz*(Wd/2+.01));
    pm(B(.03,1.6,.06),C.M.darksteel,0,1.2,Wd/2+.02);
    // white skirt, roof pod, lights
    pm(B(L-.5,.32,Wd+.03),C.M.white2,0,.56,0); pm(B(L-.9,.06,Wd+.05),C.M['z_'+st.zone],0,.75,0);
    const roof=new THREE.ExtrudeGeometry(rrShape(2.4,.16,.07),{depth:1.2,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2}); roof.translate(0,y0+H,-.6); pm(roof,C.M.white2,0,0,0,true);
    for(const sz of [-1,1]){ pm(B(.05,.09,.45),C.M.lampstrip,L/2+.02,.95,sz*.55); pm(B(.05,.09,.45),C.M.red,-L/2-.02,.95,sz*.55); }
    // wheels sit under the shell with dark arches
    for(const x of [-1.5,1.5]) for(const sz of [-1,1]){ const arch=pm(Cy(.47,.47,.02,24),C.M.glassDark,x,.36,sz*(Wd/2+.012)); arch.rotation.x=PI/2;
      const w=pm(Cy(.36,.36,.22,18),C.M.darksteel,x,.36,sz*.95); w.rotation.x=PI/2; const hub=pm(Cy(.17,.17,.24,12),C.M.steel,x,.36,sz*.95); hub.rotation.x=PI/2; }
    C.scene.add(car);
    const dyn={x:0,z:159.5,r:2.4}; C.dynCol.push(dyn);
    C.anim.push(t=>{ const T=40, ph=(t%T)/T; let s; if(ph<.15) s=0; else if(ph<.5) s=(ph-.15)/.35; else if(ph<.65) s=1; else s=1-(ph-.65)/.35; s=s*s*(3-2*s); const x=30+s*118; car.position.set(x,0,159.5); dyn.x=x; car.rotation.y= ph<.5?0:PI; });
  };
  b.hall=(st,K,C)=>{
    const w=34,d=24,h=8;
    K.put(B(w,.2,d),'darkfloor',0,.1,0);
    K.put(B(w,h,.4),'concrete',0,h/2,-d/2); K.box(0,-d/2,w/2,.3);
    K.put(B(.4,h,d),'concrete',-w/2,h/2,0); K.box(-w/2,0,.3,d/2); K.put(B(.4,h,d),'concrete',w/2,h/2,0); K.box(w/2,0,.3,d/2);
    for(const sx of [-1,1]){ K.put(B(10,h,.4),'concrete',sx*12,h/2,d/2); K.box(sx*12,d/2,5,.3); }
    K.put(B(w+1,.4,d+1),'roof',0,h+.2,0); K.put(B(w+1.1,1,.6),'z_'+st.zone,0,h-.4,d/2+.1);
    for(let i=0;i<5;i++) K.put(B(4,.1,.4),'lampstrip',-12+i*6,h-.2,0);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:C.tex('defence'),toneMapped:false})); K.obj(p,9,4.4,-d/2+.25);
  };
  b.dronecage=(st,K,C)=>{
    K.put(B(8,.08,8),'darkfloor',0,.04,0);
    for(const [x,z] of [[-4,-4],[4,-4],[-4,4],[4,4]]) K.put(Cy(.07,.07,5,6),'darksteel',x,2.5,z);
    K.put(B(8,5,.04),'net',0,2.5,-4); K.put(B(8,5,.04),'net',0,2.5,4); K.put(B(.04,5,8),'net',-4,2.5,0); K.put(B(.04,5,8),'net',4,2.5,0); K.put(B(8,.04,8),'net',0,5,0);
    for(let i=0;i<5;i++) K.put(B(.3,1.2+i%3*.6,.3),'z_'+st.zone,-2.5+i*1.25,(1.2+i%3*.6)/2,(i%2?1.5:-1.5));
    const ds=[]; for(let i=0;i<3;i++){ const g=new THREE.Group(); const body=new THREE.Mesh(B(.4,.1,.4),C.M.darksteel); g.add(body); for(const [x,z] of [[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]]){ const r=new THREE.Mesh(Cy(.13,.13,.02,10),C.M.ledon); r.position.set(x,.07,z); g.add(r);} K.obj(g,0,2,0); ds.push(g); }
    C.anim.push(t=>{ ds.forEach((g,i)=>{ const a=t*.8+i*2.1; const [x,z]=C.toWorld(st,Math.cos(a)*2.6,Math.sin(a*1.3)*2.6); g.position.set(x,1.6+Math.sin(t*1.7+i)*.9,z); g.rotation.y=-a; }); });
    K.box(0,0,4.1,4.1);
  };
  b.table=(st,K,C)=>{
    const id=st.id;
    if(id==='inteltable'){ K.put(B(4.4,.9,2.8),'darksteel',0,.45,0); K.put(B(4.2,.06,2.6),'screen2',0,.93,0); K.box(0,0,2.3,1.5); return; }
    if(id==='machinesees'){ K.put(B(4.4,.9,3),'wood',0,.45,0); K.put(B(4.2,.12,2.8),'sand',0,.95,0); for(let i=0;i<6;i++) K.put(B(.3+.2*(i%2),.18,.16+.1*(i%2)),i%2?'red':'plant',-1.5+i*.6,1.1,-.6+(i%3)*.5); K.put(Cy(.04,.04,2.2,6),'darksteel',1.9,1.6,-1.2); K.put(B(.3,.2,.3),'white',1.9,2.7,-1.2); K.box(0,0,2.3,1.6); return; }
    K.put(B(2.4,.85,1.6),'wood',0,.42,0);
    if(id==='carrom'){ K.put(B(1.6,.1,1.6),'carromtop',0,.9,0); K.put(Cy(.06,.06,.9,8),'darksteel',.9,1.3,-.6); K.put(B(.1,.1,.9),'darksteel',.5,1.75,-.4,.6); }
    else if(id==='calligraphy'){ K.put(B(1.4,.02,.9),'white',0,.86,0); K.put(B(.12,.9,.12),'darksteel',-.6,1.3,-.5); K.put(B(.9,.1,.1),'darksteel',-.2,1.75,-.5); K.put(Cy(.02,.02,.5,6),'darksteel',.2,1.5,-.2); }
    else if(id==='chai'){ K.put(Cy(.25,.3,.5,16),'steel',-.5,1.1,0); K.put(Cy(.06,.06,.12,8),'white',.3,.92,.2); K.put(Cy(.06,.06,.12,8),'white',.5,.92,.2); K.put(B(.1,1,.1),'darksteel',.8,1.35,-.5); }
    else if(id==='tabla'){ K.put(Cy(.22,.18,.35,16),'wood',-.3,1.02,0); K.put(Cy(.26,.22,.32,16),'darksteel',.3,1.01,0); }
    else if(id==='exo'){ K.put(B(.06,1.1,1.6),'steel',-1,1.1,0); K.put(B(.06,1.1,1.6),'steel',1,1.1,0); }
    screenOn(K,0,1.7,-.95,1.4,.7);
    K.box(0,0,1.25,.85);
  };
  b.nets=(st,K)=>{
    const L=22;
    for(let i=0;i<3;i++){ const x=-4.4+i*4.4;
      K.put(B(4.2,.06,L),'turf',x,.03,0); K.put(B(1.4,.03,L-4),'sand',x,.07,0);
      K.put(B(.9,1.1,1),'darksteel',x,.55,-L/2+1.2); K.put(Cy(.25,.25,.12,14),'z_'+st.zone,x,1.2,-L/2+1.7,0,PI/2);
      for(const s of [-.12,0,.12]) K.put(Cy(.02,.02,.71,6),'white',x+s,.36,L/2-2);
    }
    for(const x of [-6.6,-2.2,2.2,6.6]){ K.put(B(.04,4,L),'net',x,2,0); K.box(x,0,.12,L/2); }
    K.put(B(13.2,4,.04),'net',0,2,-L/2); K.box(0,-L/2,6.6,.12); K.put(B(13.2,.04,L),'net',0,4,0);
  };
  b.peepal=(st,K,C)=>{
    K.put(Cy(4.4,4.6,.6,28),'stone',0,.3,0); K.put(Cy(1.2,1.8,7,12),'bark',0,3.5,0);
    for(let i=0;i<8;i++){ const a=i/8*PI*2; K.put(Cy(.08,.12,5.5,5),'bark',Math.cos(a)*2.6,2.8,Math.sin(a)*2.6); }
    for(let i=0;i<9;i++){ const a=i/9*PI*2; K.put(Sp(3.2+((i*5)%3)*.6,1),'leaf',Math.cos(a)*5,8.5+((i*3)%4)*.6,Math.sin(a)*5); } K.put(Sp(4.2,1),'leafdark',0,10.5,0);
    for(let i=0;i<10;i++){ const a=i/10*PI*2; K.put(B(1.6,.45,.7),'wood',Math.cos(a)*6.4,.25,Math.sin(a)*6.4,-a+PI/2); }
    K.put(Cy(.3,.3,.1,16),'z_'+st.zone,0,.66,2.4); K.circ(0,0,2); K.plat(0,0,4.4,.6);
  };
  b.radar=(st,K,C)=>{
    K.put(Cy(2.6,2.8,1,32),'stone',0,.5,0); K.put(Cy(2.3,2.3,.06,40),'radarscreen',0,1.03,0);
    for(let r=.6;r<2.3;r+=.55) K.put(new THREE.TorusGeometry(r,.015,4,48),'radarline',0,1.07,0,0,PI/2);
    const sw=new THREE.Mesh(new THREE.CircleGeometry(2.25,24,0,.5),new THREE.MeshBasicMaterial({color:'#7cf2a6',transparent:true,opacity:.45,toneMapped:false,side:THREE.DoubleSide})); sw.rotation.x=-PI/2; const g=new THREE.Group(); g.add(sw); K.obj(g,0,1.09,0);
    const blips=[]; for(let i=0;i<5;i++){ const m=new THREE.Mesh(Sp(.08,1),C.M.blip); const a=Math.random()*PI*2, r=.5+Math.random()*1.6; K.obj(m,Math.cos(a)*r,1.12,Math.sin(a)*r); blips.push({m,a}); }
    for(let i=0;i<6;i++){ const a=i/6*PI*2; K.put(Cy(.06,.08,3.4,6),'steel',Math.cos(a)*8,1.7,Math.sin(a)*8); K.put(B(.35,.3,.3),'white',Math.cos(a)*8,3.4,Math.sin(a)*8); K.put(B(.5,.04,.35),'solarpanel',Math.cos(a)*8,3.65,Math.sin(a)*8); }
    C.anim.push(t=>{ g.rotation.y=-t*1.2; const ang=(t*1.2)%(PI*2); blips.forEach(b2=>{ let da=(ang-b2.a+PI*4)%(PI*2); b2.m.visible=da<1.5; }); });
    K.circ(0,0,2.9);
  };
  b.forest=(st,K,C)=>{ for(let i=0;i<46;i++){ const a=Math.random()*PI*2, r=2+Math.random()*13; const [x,z]=C.toWorld(st,Math.cos(a)*r,Math.sin(a)*r); C.trees.push({x,z,s:.55+Math.random()*.5,k:2}); } K.put(B(2.4,1.2,.2),'white',0,.9,15.5); K.put(B(2.42,.2,.22),'z_'+st.zone,0,.4,15.5); };
  b.mist=(st,K,C)=>{
    const pts=[]; for(let i=0;i<6;i++){ const a=i/6*PI*2; K.put(Cy(.08,.1,4,8),'steel',Math.cos(a)*5,2,Math.sin(a)*5); K.put(B(.9,.1,.1),'steel',Math.cos(a)*5,3.9,Math.sin(a)*5,a); K.circ(Math.cos(a)*5,Math.sin(a)*5,.25); pts.push([Math.cos(a)*5,Math.sin(a)*5]); }
    for(let i=0;i<5;i++) K.put(B(2,.45,.6),'wood',-4+i*2,.25,-1+(i%2)*2);
    const N=500, arr=new Float32Array(N*3), seed=new Float32Array(N); for(let i=0;i<N;i++){ const p=pts[i%6]; const [x,z]=C.toWorld(st,p[0],p[1]); arr[i*3]=x; arr[i*3+1]=Math.random()*3.8; arr[i*3+2]=z; seed[i]=Math.random()*9; }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(arr,3));
    const pm=new THREE.Points(geo,new THREE.PointsMaterial({size:1.1,map:C.sprite,transparent:true,opacity:.2,depthWrite:false,color:'#ffffff'})); C.scene.add(pm);
    const base=pts.map(p=>C.toWorld(st,p[0],p[1]));
    C.anim.push((t,dt)=>{ if(!C.state.near(st,60)) return; for(let i=0;i<N;i++){ arr[i*3+1]-=dt*(.4+seed[i]%1*.5); arr[i*3]+=Math.sin(t+seed[i])*dt*.3; if(arr[i*3+1]<0){ const p=base[i%6]; arr[i*3]=p[0]+(Math.random()-.5); arr[i*3+1]=3.8; arr[i*3+2]=p[1]+(Math.random()-.5);} } geo.attributes.position.needsUpdate=true; });
  };
  b.solar=(st,K)=>{
    K.put(B(16,.15,10),'paving',0,.07,0);
    for(const [x,z] of [[-6,-3.5],[6,-3.5],[-6,3.5],[6,3.5]]){ K.put(Cy(.15,.15,4,10),'steel',x,2,z); K.circ(x,z,.3); }
    K.put(B(16,.15,10),'solarpanel',0,4.3,0,0,.15); K.put(B(16.2,.1,10.2),'steel',0,4.2,0,0,.15);
    K.put(B(2.4,1.8,1.2),'white',0,.9,-3.6); K.put(B(2.42,.3,1.22),'z_'+st.zone,0,1.5,-3.6); K.box(0,-3.6,1.25,.65);
    for(let i=0;i<3;i++) K.put(B(3,.45,.7),'wood',-4+i*4,.25,1.5);
  };
  b.bin=(st,K)=>{ ['green','blue','grey'].forEach((c,i)=>K.put(B(.9,1.3,.9),c,-1.05+i*1.05,.65,0)); K.put(B(3.2,.12,1),'darksteel',0,1.36,0); screenOn(K,0,2,-.3,2.6,.9); K.put(Sp(.15,1),'white',0,2.6,-.3); K.box(0,0,1.65,.55); };
  b.canopy=(st,K,C)=>{
    K.put(Cy(32,32,.08,72),'paving',0,.04,0);
    const ring=new THREE.RingGeometry(6,8.5,64); ring.rotateX(-PI/2); K.put(ring,'water',0,.1,0);
    for(let i=0;i<14;i++){ const a=i/14*PI*2+.2; K.put(B(3,.5,.8),'wood',Math.cos(a)*24,.25,Math.sin(a)*24,-a+PI/2); }
    const L=6.2, W=1.7, sh=new THREE.Shape(); sh.moveTo(0,0); sh.quadraticCurveTo(L*.45,W,L,0); sh.quadraticCurveTo(L*.45,-W,0,0);
    const pg=new THREE.ShapeGeometry(sh,10); pg.rotateX(-PI/2);
    const sg=new THREE.ShapeGeometry((()=>{const s=new THREE.Shape(); s.moveTo(1,0); s.quadraticCurveTo(L*.5,W*.55,L*.85,0); s.quadraticCurveTo(L*.5,-W*.55,1,0); return s;})(),8); sg.rotateX(-PI/2); sg.translate(0,.03,0);
    const P=192; const pIM=new THREE.InstancedMesh(pg,C.M.petal,P), sIM=new THREE.InstancedMesh(sg,C.M.solarpanel,P); pIM.castShadow=true; C.scene.add(pIM); C.scene.add(sIM);
    const piv=[];
    for(let t=0;t<8;t++){ const a=t/8*PI*2+PI/8, R=t%2?17:13, H=15+((t*7)%4);
      const lx=Math.cos(a)*R, lz=Math.sin(a)*R;
      K.put(Cy(.45,.95,H-1.5,16),'steel',lx,(H-1.5)/2,lz); K.circ(lx,lz,1.05);
      for(let k=0;k<5;k++){ const ka=k/5*PI*2; K.put(Cy(.12,.18,4.2,8),'steel',lx+Math.cos(ka)*1.2,H-2.4,lz+Math.sin(ka)*1.2,0,Math.sin(ka)*.55,-Math.cos(ka)*.55); }
      K.put(Sp(1.1,2),'steel',lx,H-.6,lz);
      const [wx,wz]=C.toWorld(st,lx,lz);
      for(let p=0;p<24;p++) piv.push({x:wx,z:wz,y:H-.6+(p%2?.35:0),ry:p/24*PI*2+(p%2?.13:0),sc:p%2?.82:1,ph:t*.7+p*.05,delay:t*.15,cur:.6});
    }
    const o=new THREE.Object3D(), inner=new THREE.Object3D(); o.add(inner); inner.position.x=.8;
    C.anim.push((t,dt)=>{ const s=C.state; const night=s.nf>.5; const pd=Math.hypot(s.player.x-st.x,s.player.z-st.z);
      const tgt= night?.35 : (pd<40? -.12 : .55);
      piv.forEach((p,i)=>{ p.cur+=(tgt-p.cur)*Math.min(1,dt*1.2/(1+p.delay)); const br= night&&!C.reduce? Math.sin(t*1.2+p.ph)*.2:0;
        o.position.set(p.x,p.y,p.z); o.rotation.set(0,p.ry,0); inner.rotation.set(0,0,p.cur+br); inner.scale.setScalar(p.sc); o.updateMatrixWorld(true);
        pIM.setMatrixAt(i,inner.matrixWorld); sIM.setMatrixAt(i,inner.matrixWorld); });
      pIM.instanceMatrix.needsUpdate=true; sIM.instanceMatrix.needsUpdate=true;
      C.M.petal.emissive.set(C.state.aqiColor); C.M.petal.emissiveIntensity=s.nf*(.9+(C.reduce?0:Math.sin(t*2)*.25));
    });
  };
  b.cloud=(st,K,C)=>{
    const w=16,d=10,h=5;
    K.put(B(w,.15,d),'wetfloor',0,.075,0);
    for(const [x,z] of [[-8,-5],[0,-5],[8,-5],[-8,5],[0,5],[8,5]]){ K.put(Cy(.18,.18,h,12),'white',x,h/2,z); K.circ(x,z,.35); }
    K.put(B(w+1.4,.35,d+1.4),'roof',0,h+.17,0); K.put(B(w+1.46,.4,d+1.46),'z_'+st.zone,0,h-.1,0);
    for(let x=-7;x<=4;x+=1.2) for(let z=-4;z<=4;z+=1.2) K.put(Cy(.05,.07,.18,6),'darksteel',x,h-.1,z);
    K.put(B(.5,.25,d-1),'water',6.4,.27,0);
    // rain that avoids the visitor, fog bank at the far end
    const RN=C.low?1600:3200, rp=new Float32Array(RN*3), rv=new Float32Array(RN);
    const spawn=i=>{ const lx=-7.6+Math.random()*11.4, lz=-4.6+Math.random()*9.2; const [x,z]=C.toWorld(st,lx,lz); rp[i*3]=x; rp[i*3+1]=h-.2-Math.random()*.3; rp[i*3+2]=z; rv[i]=6+Math.random()*2; };
    for(let i=0;i<RN;i++){ spawn(i); rp[i*3+1]=Math.random()*h; }
    const lp=new Float32Array(RN*6); const rg=new THREE.BufferGeometry(); rg.setAttribute('position',new THREE.BufferAttribute(lp,3));
    const syncRain=()=>{ for(let i=0;i<RN;i++){ const j=i*6, k=i*3; lp[j]=lp[j+3]=rp[k]; lp[j+2]=lp[j+5]=rp[k+2]; lp[j+1]=rp[k+1]+.32; lp[j+4]=rp[k+1]; } rg.attributes.position.needsUpdate=true; };
    syncRain(); const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#7d9cb3',transparent:true,opacity:.55})); rain.frustumCulled=false; C.scene.add(rain);
    const FN=C.low?260:520, fp=new Float32Array(FN*3), fs=new Float32Array(FN);
    for(let i=0;i<FN;i++){ const [x,z]=C.toWorld(st,-7.6+Math.random()*5,-4.6+Math.random()*9.2); fp[i*3]=x; fp[i*3+1]=Math.random()*2.4; fp[i*3+2]=z; fs[i]=Math.random()*9; }
    const fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.BufferAttribute(fp,3));
    C.scene.add(new THREE.Points(fg,new THREE.PointsMaterial({color:'#ffffff',size:2.6,map:C.sprite,transparent:true,opacity:.28,depthWrite:false})));
    C.anim.push((t,dt)=>{ const s=C.state; if(!s.near(st,45)) return; const p=s.player;
      for(let i=0;i<RN;i++){ let y=rp[i*3+1]-rv[i]*dt; const dx=rp[i*3]-p.x, dz=rp[i*3+2]-p.z; const dry=dx*dx+dz*dz<1.6; if(y<.15||(dry&&y<h-.5)){ spawn(i); const ex=rp[i*3]-p.x, ez=rp[i*3+2]-p.z; if(ex*ex+ez*ez<1.6) rp[i*3+1]=-40; } else rp[i*3+1]=y; }
      syncRain();
      for(let i=0;i<FN;i++){ fp[i*3]+=Math.sin(t*.3+fs[i])*dt*.2; fp[i*3+2]+=Math.cos(t*.27+fs[i])*dt*.2; fp[i*3+1]=Math.abs(Math.sin(t*.1+fs[i]))*2.2+.2; }
      fg.attributes.position.needsUpdate=true; });
  };
  b.gardener=(st,K,C)=>{
    K.put(Cy(16,16,.06,48),'turf',0,.03,0);
    K.put(Cy(1,1.6,6,12),'bark',0,3,-6); for(let i=0;i<7;i++){ const a=i/7*PI*2; K.put(Sp(2.6+(i%3)*.5,1),'leaf',Math.cos(a)*3.6,7+(i%2),-6+Math.sin(a)*3.6); } K.put(Sp(3.4,1),'leafdark',0,8.6,-6); K.circ(0,-6,1.7);
    K.put(Cy(.7,.9,1,16),'darksteel',4,.5,-6); K.circ(4,-6,1);
    const arm=new THREE.Group(), up=new THREE.Group(), fore=new THREE.Group();
    const m1=new THREE.Mesh(B(.35,3.2,.35),C.M.white2); m1.position.y=1.6; up.add(m1); up.add(fore); fore.position.y=3.2;
    const m2=new THREE.Mesh(B(.3,2.6,.3),C.M.white2); m2.position.y=1.3; fore.add(m2); const tip=new THREE.Mesh(B(.4,.4,.4),C.M['z_'+st.zone]); tip.position.y=2.7; fore.add(tip);
    arm.add(up); K.obj(arm,4,1,-6);
    const robots=[]; const beds=[[-9,4],[-3,6],[3,6],[9,4]];
    beds.forEach(([x,z],i)=>{ K.put(B(5,.6,2.2),'wood',x,.3,z); K.put(B(4.8,.06,2),'soil',x,.62,z); for(let k=0;k<5;k++) K.put(Sp(.3,0),'plant',x-2+k,.85,z); K.box(x,z,2.5,1.1);
      const r=new THREE.Group(); const body=new THREE.Mesh(B(.6,.35,.8),C.M.white2); body.position.y=.35; r.add(body); const hd=new THREE.Mesh(B(.3,.2,.3),C.M['z_'+st.zone]); hd.position.y=.62; r.add(hd);
      C.scene.add(r); robots.push({r,x,z:z+1.8,ph:i*1.3}); });
    C.anim.push(t=>{ up.rotation.z=Math.sin(t*.5)*.5; fore.rotation.z=-.9+Math.sin(t*.7)*.4; arm.rotation.y=st.rot+Math.sin(t*.25)*.6;
      robots.forEach(o=>{ const lx=o.x+Math.sin(t*.4+o.ph)*2.2; const [wx,wz]=C.toWorld(st,lx,o.z); o.r.position.set(wx,0,wz); o.r.rotation.y=st.rot+(Math.cos(t*.4+o.ph)>0?PI/2:-PI/2); }); });
  };
  b.arena=(st,K)=>{
    const w=30,d=18; K.put(B(w,.2,d),'paving2',0,.1,0);
    for(let x=-w/2;x<=w/2;x+=6){ for(const z of [-d/2,d/2]){ K.put(Cy(.2,.2,6,12),'white',x,3,z); K.circ(x,z,.4); } }
    roof(K,w+2,d+2,6.2,st.zone);
    K.put(B(w,.06,.4),'z_'+st.zone,0,.21,d/2-.4);
  };
  return b;
})();
