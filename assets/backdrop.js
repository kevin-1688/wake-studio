// 整頁背景：往下捲，夜慢慢轉成天亮。每一頁都載入；首頁主視覺還在畫面上時先不畫。
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let cv=document.querySelector('canvas.backdrop');
  if(!cv){cv=document.createElement('canvas');cv.className='backdrop';cv.setAttribute('aria-hidden','true');document.body.prepend(cv)}
  document.documentElement.classList.add('has-backdrop');
  const scene=document.querySelector('.scene'); // 首頁的主視覺；其他頁沒有
  const ctx=cv.getContext('2d');
  // 每組調色盤：[捲動進度, 天頂, 中段, 地平線, 星光, 太陽, 火金姑, 霧, 三層山稜]
  const DARK=[
    [0,  '#05080F','#0B1220','#141D2B',1,  0,  1,  .05,['#141D2B','#0E1520','#0A0F17']],
    [.5, '#0A111E','#18233A','#3A2A36',.7, 0,  .8, .07,['#1A2436','#121A27','#0B1119']],
    [.8, '#16223A','#3E3448','#A0563A',.25,.35,.4, .09,['#2A2B3C','#1B1F2C','#10141D']],
    [1,  '#22324D','#6A4650','#E09A4E',0,  1,  .1, .1, ['#3A3446','#252634','#151821']],
  ];
  const LIGHT=[
    [0,  '#D9DCE2','#E6E4DF','#ECE4D8',0,0,0,.18,['#D6D9DF','#CCD0D7','#C2C7CF']],
    [.6, '#E2DFDC','#EEE2D4','#F1D9BC',0,.2,0,.2,['#DCD5D2','#D2CAC6','#C8BFBB']],
    [1,  '#F1E6D3','#F4D9B4','#F1B467',0,1,0,.22,['#E6D6C4','#DCC9B5','#D1BCA6']],
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
    const start=scene?scene.offsetHeight*.5:0,end=document.documentElement.scrollHeight-innerHeight;
    if(end-start<40)return .6; // 不能捲的短頁：停在天快亮的時候
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
    if(!scene||scrollY>scene.offsetHeight*.3||!cv.dataset.drawn){draw(t);cv.dataset.drawn=1}
    requestAnimationFrame(loop);
  })(0);
})();
