/* Procedural park sound: no audio files. Wind, birds by day, crickets by night, rain at the cloud,
   a crowd murmur near busy stations, and small chimes for stamps and teleports. */
window.ParkAudio = function(){
  'use strict';
  let ctx=null, master=null, on=true, started=false;
  try{ const v=localStorage.getItem('ldaParkSound'); if(v==='0') on=false; }catch(e){}
  let wind, rain, crowd, crick, birdT=0;
  function noiseBuf(sec){ const b=ctx.createBuffer(1,ctx.sampleRate*sec,ctx.sampleRate), d=b.getChannelData(0); let last=0; for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; last=(last+.02*w)/1.02; d[i]=w*.5+last*3; } return b; }
  function loop(buf,filter,f,q){ const s=ctx.createBufferSource(); s.buffer=buf; s.loop=true; const fl=ctx.createBiquadFilter(); fl.type=filter; fl.frequency.value=f; if(q) fl.Q.value=q; const g=ctx.createGain(); g.gain.value=0; s.connect(fl); fl.connect(g); g.connect(master); s.start(); return g; }
  function start(){
    if(started){ if(ctx&&ctx.state==='suspended') ctx.resume(); return; }
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; started=true;
    ctx=new AC(); master=ctx.createGain(); master.gain.value=on?.9:0; master.connect(ctx.destination);
    const nb=noiseBuf(4);
    wind=loop(nb,'lowpass',420); rain=loop(nb,'highpass',1400); crowd=loop(nb,'bandpass',380,.7);
    // crickets: a high tone chopped into chirps
    const o=ctx.createOscillator(); o.frequency.value=4300; const am=ctx.createGain(); am.gain.value=0; const lfo=ctx.createOscillator(); lfo.type='square'; lfo.frequency.value=22; const lg=ctx.createGain(); lg.gain.value=.5; lfo.connect(lg); lg.connect(am.gain); o.connect(am); crick=ctx.createGain(); crick.gain.value=0; am.connect(crick); crick.connect(master); o.start(); lfo.start();
  }
  function chirp(){ const t=ctx.currentTime, n=2+Math.floor(Math.random()*4), base=2200+Math.random()*1800, pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
    const g=ctx.createGain(); g.gain.value=0; if(pan){ pan.pan.value=Math.random()*1.6-.8; g.connect(pan); pan.connect(master); } else g.connect(master);
    for(let i=0;i<n;i++){ const o=ctx.createOscillator(); o.type='sine'; const t0=t+i*.11; o.frequency.setValueAtTime(base,t0); o.frequency.exponentialRampToValueAtTime(base*1.6,t0+.07); o.connect(g); o.start(t0); o.stop(t0+.09);
      g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(.025,t0+.015); g.gain.linearRampToValueAtTime(0,t0+.08); } }
  function tone(freqs,dur,vol){ if(!ctx||!on) return; const t=ctx.currentTime; freqs.forEach((f,i)=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(master); const t0=t+i*.09; g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(vol||.08,t0+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+dur); o.start(t0); o.stop(t0+dur+.05); }); }
  function whoosh(){ if(!ctx||!on) return; const t=ctx.currentTime, s=ctx.createBufferSource(); s.buffer=noiseBuf(1); const f=ctx.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2600,t+.45); const g=ctx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.22,t+.12); g.gain.exponentialRampToValueAtTime(.0001,t+.7); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+.8); }
  const set=(g,v)=>{ if(g) g.gain.setTargetAtTime(v,ctx.currentTime,.25); };
  function update(dt,env){ if(!ctx||!on) return; // env: {nf, rain (0..1), crowd (0..1), alt}
    const day=1-env.nf, high=Math.min(1,env.alt/40);
    set(wind,.05+.09*high); set(rain,.32*env.rain); set(crowd,.1*env.crowd*(1-high)); set(crick,.012*env.nf*(1-high));
    birdT-=dt; if(birdT<=0){ birdT=.7+Math.random()*2.6; if(day>.5&&high<.6) chirp(); } }
  function setOn(v){ on=v; try{ localStorage.setItem('ldaParkSound',v?'1':'0'); }catch(e){} if(master) master.gain.setTargetAtTime(v?.9:0,ctx.currentTime,.1); }
  return { start, update, setOn, isOn:()=>on, chime:()=>tone([880,1320],.5,.07), stamp:()=>tone([660,880,1320],.7,.08), whoosh };
};
