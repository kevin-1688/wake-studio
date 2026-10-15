const io=new IntersectionObserver(es=>{
  es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ---------- 主題切換 ----------
const tBtn=document.querySelector('.theme-toggle');
function setTheme(t){
  document.documentElement.dataset.theme=t;
  try{localStorage.setItem('wake-theme',t)}catch(e){}
  const en=(document.documentElement.lang||'').startsWith('en');
  if(tBtn)tBtn.textContent=t==='light'?(en?'☾ Dark':'暈 暗色'):(en?'☼ Light':'☼ 亮色');
}
setTheme(document.documentElement.dataset.theme||'dark');
if(tBtn)tBtn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light'));

// ---------- 手機漢堡選單 ----------
(function(){
  const nav=document.querySelector('.nav');
  if(!nav)return;
  const toggle=document.createElement('button');
  toggle.className='nav-toggle';
  toggle.setAttribute('aria-label','Toggle navigation');
  toggle.setAttribute('aria-expanded','false');
  toggle.innerHTML='<span></span><span></span><span></span>';
  const ul=nav.querySelector('ul');
  const themeBtn=nav.querySelector('.theme-toggle');
  nav.insertBefore(toggle,themeBtn||null);
  toggle.addEventListener('click',()=>{
    const open=toggle.classList.toggle('open');
    if(ul){ul.classList.toggle('open',open)}
    toggle.setAttribute('aria-expanded',String(open));
  });
  if(ul)ul.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    toggle.classList.remove('open');
    ul.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
})();

// ---------- 立體肖像 ----------
(function(){
  const el=document.querySelector('.portrait .tilt');
  if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  let tx=0,ty=0,x=0,y=0,visible=false,raf=0;
  if(fine){
    addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(r.width*.9)));
      ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(r.height*.9)));
    },{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{tx=0;ty=0});
  }
  function frame(t){
    if(!fine){ // 觸控裝置：依捲動位置俯仰，再加一點左右擺動
      const r=el.getBoundingClientRect();
      ty=Math.max(-1,Math.min(1,(r.top+r.height/2-innerHeight/2)/(innerHeight/2)));
      tx=Math.sin(t/2600)*.5;
    }
    x+=(tx-x)*.08;y+=(ty-y)*.08;
    const s=el.style;
    s.setProperty('--ry',(x*9).toFixed(2)+'deg');
    s.setProperty('--rx',(-y*9).toFixed(2)+'deg');
    s.setProperty('--px',x.toFixed(3));
    s.setProperty('--py',y.toFixed(3));
    s.setProperty('--gx',(50+x*40).toFixed(1)+'%');
    s.setProperty('--gy',(30+y*40).toFixed(1)+'%');
    raf=visible?requestAnimationFrame(frame):0;
  }
  new IntersectionObserver(es=>{
    visible=es[0].isIntersecting;
    if(visible&&!raf)raf=requestAnimationFrame(frame);
  }).observe(el);
})();
