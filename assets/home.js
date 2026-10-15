// 首頁：開場、分層景深、火金姑與油桐花、捲動切換的作品框、游標圈
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body=document.body;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  // ---------- 開場：等場景圖層載完 ----------
  const loader=document.getElementById('loader');
  const scene=document.querySelector('.scene');
  const sceneImgs=[...scene.querySelectorAll('img')];
  let loaded=0,finished=false;
  function finish(){
    if(finished)return;finished=true;
    setTimeout(()=>{if(loader)loader.classList.add('done');body.classList.add('awake')},reduce?0:350);
  }
  function bump(){
    loaded++;
    if(loader){
      loader.style.setProperty('--load',loaded/sceneImgs.length);
      loader.querySelector('.pct').textContent=Math.round(loaded/sceneImgs.length*100)+'%';
    }
    if(loaded>=sceneImgs.length)finish();
  }
  sceneImgs.forEach(i=>{
    if(i.complete)bump();
    else{i.addEventListener('load',bump,{once:true});i.addEventListener('error',bump,{once:true})}
  });
  setTimeout(finish,3200);

  // ---------- 頂欄：捲過場景後恢復底色 ----------
  function headerState(){body.classList.toggle('past-hero',scrollY>scene.offsetHeight-70)}
  addEventListener('scroll',headerState,{passive:true});headerState();

  // ---------- 分層景深 ----------
  const layers=[...scene.querySelectorAll('[data-depth]')].map(el=>({el,d:+el.dataset.depth}));
  const word=scene.querySelector('.word');
  let mx=0,my=0,cx=0,cy=0,sceneOn=true;
  if(fine)addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1},{passive:true});
  function place(){
    cx+=(mx-cx)*.06;cy+=(my-cy)*.06;
    const h=scene.offsetHeight,p=clamp(scrollY/h,0,1);
    for(const {el,d} of layers){
      const x=-cx*d*34,y=-cy*d*18+p*h*(.5-d)*.7,s=1+p*d*.22;
      el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    }
    if(word)word.style.opacity=(1-p*1.3).toFixed(3);
  }

  // ---------- 火金姑與油桐花 ----------
  function motes(canvas,opt){
    const ctx=canvas.getContext('2d');
    let w=0,h=0,dpr=1,items=[],on=false,px=-999,py=-999;
    const glow=document.createElement('canvas');glow.width=glow.height=64;
    const g=glow.getContext('2d'),grad=g.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,'rgba(255,236,170,1)');grad.addColorStop(.18,'rgba(229,200,90,.8)');
    grad.addColorStop(.45,'rgba(200,190,80,.18)');grad.addColorStop(1,'rgba(200,190,80,0)');
    g.fillStyle=grad;g.fillRect(0,0,64,64);
    function size(){
      dpr=Math.min(devicePixelRatio||1,2);
      w=canvas.clientWidth;h=canvas.clientHeight;
      canvas.width=w*dpr;canvas.height=h*dpr;
      const area=w*h/(1280*720);
      items=[];
      for(let i=0;i<Math.round(opt.flies*clamp(area,.45,1.4));i++)items.push(fly(true));
      for(let i=0;i<Math.round(opt.petals*clamp(area,.45,1.4));i++)items.push(petal(true));
    }
    function fly(init){
      return {k:0,x:Math.random()*w,y:h*(opt.top+Math.random()*(1-opt.top)),vx:0,vy:0,
        a:Math.random()*6.28,sp:.3+Math.random()*.5,r:6+Math.random()*10,ph:Math.random()*6.28}
    }
    function petal(init){
      return {k:1,x:Math.random()*w,y:init?Math.random()*h:-20,s:3+Math.random()*3.5,
        vy:.25+Math.random()*.45,sw:Math.random()*6.28,rot:Math.random()*6.28,vr:(Math.random()-.5)*.03}
    }
    function drawPetal(p){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle='rgba(246,240,228,.85)';
      for(let i=0;i<5;i++){ctx.rotate(1.2566);ctx.beginPath();ctx.ellipse(0,-p.s*.9,p.s*.55,p.s*.9,0,0,6.283);ctx.fill()}
      ctx.fillStyle='rgba(224,120,90,.9)';ctx.beginPath();ctx.arc(0,0,p.s*.28,0,6.283);ctx.fill();
      ctx.restore();
    }
    function frame(t){
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      for(const p of items){
        if(p.k===0){
          p.a+=(Math.random()-.5)*.25;
          p.vx+=(Math.cos(p.a)*p.sp-p.vx)*.04;p.vy+=(Math.sin(p.a)*p.sp*.6-.04-p.vy)*.04;
          const dx=p.x-px,dy=p.y-py,dd=dx*dx+dy*dy;
          if(dd<14000){p.vx+=dx/Math.sqrt(dd+1)*.25;p.vy+=dy/Math.sqrt(dd+1)*.25}
          p.x+=p.vx;p.y+=p.vy;
          if(p.x<-20)p.x=w+20;if(p.x>w+20)p.x=-20;
          if(p.y<h*opt.top-40||p.y>h+20)Object.assign(p,fly(),{x:p.x,y:h*(opt.top+.3+Math.random()*.6)});
          const a=.25+.75*Math.max(0,Math.sin(t/900+p.ph));
          ctx.globalAlpha=a;ctx.drawImage(glow,p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.globalAlpha=1;
        }else{
          p.sw+=.012;p.y+=p.vy;p.x+=Math.sin(p.sw)*.5+.15;p.rot+=p.vr;
          if(p.y>h+20)Object.assign(p,petal(false));
          drawPetal(p);
        }
      }
      if(on)requestAnimationFrame(frame);
    }
    if(fine)canvas.parentElement.addEventListener('pointermove',e=>{
      const r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;
    },{passive:true});
    size();addEventListener('resize',size);
    new IntersectionObserver(es=>{
      const v=es[0].isIntersecting;
      if(v&&!on){on=true;requestAnimationFrame(frame)}else if(!v)on=false;
    }).observe(canvas);
  }

  if(!reduce){
    motes(scene.querySelector('canvas.motes'),{flies:26,petals:14,top:.35});
    (function loop(){if(sceneOn)place();requestAnimationFrame(loop)})();
    new IntersectionObserver(es=>{sceneOn=es[0].isIntersecting}).observe(scene);
  }

  // ---------- 整頁背景：往下捲，夜慢慢轉成天亮 ----------
  (function backdrop(){
    const cv=document.querySelector('canvas.backdrop');
    if(!cv)return;
    const ctx=cv.getContext('2d');
    // 每組調色盤：[捲動進度, 天頂, 中段, 地平線, 星光, 太陽, 火金姑, 霧, 三層山稜]
    const DARK=[
      [0,  '#05080F','#0B1220','#141D2B',1,  0,  1,  .05,['#141D2B','#0E1520','#0A0F17']],
      [.5, '#0A111E','#18233A','#3A2A36',.7, 0,  .8, .07,['#1A2436','#121A27','#0B1119']],
      [.8, '#16223A','#3E3448','#A0563A',.25,.35,.4, .09,['#2A2B3C','#1B1F2C','#10141D']],
      [1,  '#22324D','#6A4650','#E09A4E',0,  1,  .1, .1, ['#3A3446','#252634','#151821']],
    ];
    const LIGHT=[
      [0,  '#D9DCE2','#E6E4DF','#ECE4D8',0,0,0,.18,['#C5CAD3','#B3B9C4','#A2A9B6']],
      [.6, '#E2DFDC','#EEE2D4','#F1D9BC',0,.2,0,.2,['#CCC6C6','#BBB4B6','#A9A3A8']],
      [1,  '#F1E6D3','#F4D9B4','#F1B467',0,1,0,.22,['#D2B9A2','#BFA48F','#A88E7D']],
    ];
    const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
    const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return `rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`};
    function pal(P){
      const set=document.documentElement.dataset.theme==='light'?LIGHT:DARK;
      let i=0;while(i<set.length-2&&P>set[i+1][0])i++;
      const a=set[i],b=set[i+1],t=clamp((P-a[0])/(b[0]-a[0]),0,1),e=t*t*(3-2*t);
      const num=k=>a[k]+(b[k]-a[k])*e;
      return {top:mix(a[1],b[1],e),mid:mix(a[2],b[2],e),hor:mix(a[3],b[3],e),
        stars:num(4),sun:num(5),flies:num(6),mist:num(7),ridge:a[8].map((c,k)=>mix(c,b[8][k],e))};
    }
    let w=0,h=0,dpr=1,stars=[],ridges=[],flies=[];
    function seeded(s){return()=>(s=(s*16807)%2147483647)/2147483647}
    function size(){
      dpr=Math.min(devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;
      cv.width=w*dpr;cv.height=h*dpr;
      const r=seeded(7);
      stars=Array.from({length:Math.round(w*h/5200)},()=>({x:r()*w,y:Math.pow(r(),1.4)*h*.75,s:r()*1.3+.3,p:r()*6.28,f:.5+r()*1.5}));
      ridges=[0,1,2].map(k=>{ // 三層山稜：疊幾個正弦波，前層更起伏
        const ph=[r()*6,r()*6,r()*6,r()*6],amp=[.05,.035,.02,.007].map(v=>v*(1+k*.5)),fr=[1.3,3.1,7.3,19].map(v=>v*(1+k*.35));
        const pts=[];for(let x=0;x<=w+24;x+=12){
          let y=0;for(let j=0;j<4;j++)y+=Math.sin(x/w*fr[j]*Math.PI+ph[j])*amp[j];
          y-=Math.pow(Math.max(0,-y)/.1,1.5)*.012; // 讓峰頂尖一點
          pts.push([x,y*Math.min(h,w*.75)]); // 直式螢幕不要讓山變得太陡
        }
        return pts;
      });
      flies=Array.from({length:18},()=>({x:r()*w,y:h*(.35+r()*.6),a:r()*6.28,ph:r()*6.28,r:5+r()*8}));
    }
    const glow=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
      gr.addColorStop(0,'rgba(255,236,170,1)');gr.addColorStop(.2,'rgba(229,200,90,.7)');gr.addColorStop(1,'rgba(200,190,80,0)');
      g.fillStyle=gr;g.fillRect(0,0,64,64);return c})();
    function progress(){
      const start=scene.offsetHeight*.5,end=document.documentElement.scrollHeight-innerHeight;
      return clamp((scrollY-start)/Math.max(1,end-start),0,1);
    }
    function draw(t){
      const P=progress(),c=pal(P);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const sky=ctx.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,c.top);sky.addColorStop(.55,c.mid);sky.addColorStop(1,c.hor);
      ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      if(c.stars>.01){ // 星星閃爍
        for(const s of stars){
          ctx.globalAlpha=c.stars*(.35+.65*Math.abs(Math.sin(t/1000*s.f+s.p)))*(1-s.y/h*.8);
          ctx.fillStyle='#F3E9D7';ctx.fillRect(s.x,s.y,s.s,s.s);
        }
        ctx.globalAlpha=1;
      }
      if(c.sun>.01){ // 太陽從地平線升起
        const sx=w*(w>h?.84:.8),sy=h*(1.1-(w>h?.42:.3)*c.sun),sr=Math.min(w,h)*.075;
        const g=ctx.createRadialGradient(sx,sy,sr*.5,sx,sy,sr*6);
        g.addColorStop(0,`rgba(255,214,140,${.55*c.sun})`);g.addColorStop(1,'rgba(255,190,110,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
        const disc=ctx.createRadialGradient(sx-sr*.3,sy-sr*.3,sr*.1,sx,sy,sr);
        disc.addColorStop(0,'#FFF3D2');disc.addColorStop(.7,'#F9D08A');disc.addColorStop(1,'#EFA85A');
        ctx.globalAlpha=Math.min(1,c.sun*1.4);ctx.fillStyle=disc;
        ctx.beginPath();ctx.arc(sx,sy,sr,0,6.283);ctx.fill();ctx.globalAlpha=1;
      }
      // 霧：幾條橫向的柔光帶，慢慢飄
      for(let k=0;k<5;k++){
        const y=h*(.42+k*.11),x=((t/1000*(6+k*3)+k*w*.37)%(w*1.6))-w*.3;
        ctx.save();ctx.translate(x,y);ctx.scale(1,.16);
        const g=ctx.createRadialGradient(0,0,0,0,0,w*.45);
        g.addColorStop(0,`rgba(200,210,226,${c.mist})`);g.addColorStop(1,'rgba(200,210,226,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w*.45,0,6.283);ctx.fill();ctx.restore();
      }
      // 山稜：往下捲時慢慢升起
      ridges.forEach((pts,k)=>{
        const base=h*([.8,.87,.94][k]+(1-P)*.06*(k+1));
        ctx.fillStyle=c.ridge[k];ctx.beginPath();ctx.moveTo(0,h);
        for(const [x,y] of pts)ctx.lineTo(x,base+y);
        ctx.lineTo(w,h);ctx.closePath();ctx.fill();
      });
      if(c.flies>.02&&!reduce){ // 火金姑，天亮就散了
        for(const f of flies){
          f.a+=(Math.random()-.5)*.2;f.x+=Math.cos(f.a)*.35;f.y+=Math.sin(f.a)*.22-.03;
          if(f.x<-20)f.x=w+20;if(f.x>w+20)f.x=-20;if(f.y<h*.3||f.y>h+10)f.y=h*(.5+Math.random()*.45);
          ctx.globalAlpha=c.flies*(.2+.8*Math.max(0,Math.sin(t/900+f.ph)));
          ctx.drawImage(glow,f.x-f.r,f.y-f.r,f.r*2,f.r*2);
        }
        ctx.globalAlpha=1;
      }
    }
    size();addEventListener('resize',()=>{size();draw(performance.now())});
    if(reduce){ // 不動：只在捲動或換主題時重畫
      addEventListener('scroll',()=>draw(0),{passive:true});
      new MutationObserver(()=>draw(0)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
      draw(0);return;
    }
    (function loop(t){
      if(scrollY>scene.offsetHeight*.3||!cv.dataset.drawn){draw(t);cv.dataset.drawn=1}
      requestAnimationFrame(loop);
    })(0);
  })();

  // ---------- 作品框：依捲動切換三件作品 ----------
  const ch=document.querySelector('.chapters');
  if(ch){
    const slides=[...ch.querySelectorAll('.slide')],caps=[...ch.querySelectorAll('.cap')];
    const segs=[...ch.querySelectorAll('.segs button')],now=ch.querySelector('.now');
    const n=slides.length;let cur=-1;
    function update(){
      const r=ch.getBoundingClientRect(),total=r.height-innerHeight;
      const p=clamp(-r.top/total,0,.9999),f=p*n,i=Math.floor(f),lp=f-i;
      if(i!==cur){
        cur=i;
        slides.forEach((s,k)=>s.classList.toggle('is-on',k===i));
        caps.forEach((c,k)=>c.classList.toggle('is-on',k===i));
        now.textContent=String(i+1).padStart(2,'0');
      }
      slides[i].style.setProperty('--lp',lp.toFixed(3));
      segs.forEach((b,k)=>b.style.setProperty('--fill',k<i?1:k===i?lp.toFixed(3):0));
    }
    let queued=false;
    addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;update()})}},{passive:true});
    addEventListener('resize',update);update();
    segs.forEach((b,k)=>b.addEventListener('click',()=>{
      const total=ch.offsetHeight-innerHeight;
      scrollTo({top:ch.offsetTop+total*(k+.15)/n,behavior:reduce?'auto':'smooth'});
    }));
  }

  // ---------- 游標圈 ----------
  const cur=document.getElementById('cursor');
  if(cur&&fine&&!reduce){
    let x=innerWidth/2,y=innerHeight/2,tx=x,ty=y;
    addEventListener('pointermove',e=>{
      tx=e.clientX;ty=e.clientY;cur.classList.add('on');
      cur.classList.toggle('link',!!e.target.closest('a,button'));
    },{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>cur.classList.remove('on'));
    (function move(){
      x+=(tx-x)*.18;y+=(ty-y)*.18;
      cur.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      requestAnimationFrame(move);
    })();
  }
})();
