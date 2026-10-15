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
    const c=document.querySelector('.closing canvas.motes');
    if(c)motes(c,{flies:22,petals:0,top:.2});
    (function loop(){if(sceneOn)place();requestAnimationFrame(loop)})();
    new IntersectionObserver(es=>{sceneOn=es[0].isIntersecting}).observe(scene);
  }

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
