// 中和島 ambient soundtrack — generated live with Web Audio (no audio files).
// Ocean swell + slow pentatonic pad + occasional soft mallet notes.
(function(){
  let ctx=null,master=null,timer=null,playing=false;
  const SCALE=[0,2,4,7,9];            // major pentatonic
  const ROOT=196;                      // G3
  const hz=(deg,oct)=>ROOT*Math.pow(2,(SCALE[((deg%5)+5)%5]+12*(oct+Math.floor(deg/5)))/12);

  function impulse(sec,decay){const n=ctx.sampleRate*sec,b=ctx.createBuffer(2,n,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)}return b}

  function build(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    const verb=ctx.createConvolver();verb.buffer=impulse(4.5,2.6);
    const wet=ctx.createGain();wet.gain.value=.55;verb.connect(wet).connect(master);
    const dry=ctx.createGain();dry.gain.value=.6;dry.connect(master);
    ctx.__out=[dry,verb];

    // ocean: brown noise -> lowpass, swelling gain
    const len=ctx.sampleRate*4,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);let last=0;
    for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=520;
    const sea=ctx.createGain();sea.gain.value=.16;
    const lfo=ctx.createOscillator();lfo.frequency.value=.085;const lfoG=ctx.createGain();lfoG.gain.value=.11;
    lfo.connect(lfoG).connect(sea.gain);
    const lfo2=ctx.createOscillator();lfo2.frequency.value=.06;const lfo2G=ctx.createGain();lfo2G.gain.value=260;
    lfo2.connect(lfo2G).connect(lp.frequency);
    src.connect(lp).connect(sea);sea.connect(dry);sea.connect(verb);
    src.start();lfo.start();lfo2.start();
  }

  function pad(t){
    const chord=[[0,0],[2,0],[4,0]].map(([d,o])=>[d+Math.floor(Math.random()*2)*2,o]);
    chord.forEach(([deg,oct],i)=>{
      const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();
      o.type="sine";o2.type="triangle";o.frequency.value=hz(deg,oct);o2.frequency.value=hz(deg,oct)*1.003;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+2.5);g.gain.linearRampToValueAtTime(0,t+9);
      o.connect(g);o2.connect(g);ctx.__out.forEach(n=>g.connect(n));
      o.start(t);o2.start(t);o.stop(t+9.2);o2.stop(t+9.2);
    });
  }
  function mallet(t){
    const deg=Math.floor(Math.random()*8),o=ctx.createOscillator(),g=ctx.createGain(),f=hz(deg,1);
    o.type="sine";o.frequency.value=f;
    const o2=ctx.createOscillator();o2.type="sine";o2.frequency.value=f*4.01;const g2=ctx.createGain();g2.gain.value=.12;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+2.4);
    o.connect(g);o2.connect(g2).connect(g);ctx.__out.forEach(n=>g.connect(n));
    o.start(t);o2.start(t);o.stop(t+2.5);o2.stop(t+2.5);
  }
  let next=0,bar=0;
  function schedule(){
    const now=ctx.currentTime;
    while(next<now+1.5){
      if(bar%4===0)pad(next);
      if(Math.random()<.62)mallet(next+Math.random()*.4);
      if(Math.random()<.25)mallet(next+1.1+Math.random()*.3);
      next+=2.2;bar++;
    }
  }

  function start(){
    if(!ctx)build();
    ctx.resume();next=Math.max(next,ctx.currentTime+.1);
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
    master.gain.linearRampToValueAtTime(.9,ctx.currentTime+2);
    schedule();timer=setInterval(schedule,500);playing=true;
  }
  function stop(){
    if(!ctx)return;clearInterval(timer);playing=false;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
    master.gain.linearRampToValueAtTime(0,ctx.currentTime+.8);
    setTimeout(()=>{if(!playing)ctx.suspend()},900);
  }
  document.addEventListener("visibilitychange",()=>{if(!ctx||!playing)return;document.hidden?ctx.suspend():ctx.resume()});

  document.querySelectorAll("[data-music]").forEach(btn=>{
    btn.setAttribute("aria-pressed","false");
    btn.addEventListener("click",()=>{
      try{playing?stop():start()}catch(e){btn.disabled=true;return}
      document.querySelectorAll("[data-music]").forEach(b=>{b.setAttribute("aria-pressed",String(playing));const l=b.querySelector(".lbl");if(l)l.textContent=playing?"音樂開":"音樂"});
    });
  });
})();
