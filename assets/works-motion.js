// 作品檔案頁的動態（參考 lenis.dev）：平滑捲動、標題逐字升起、引言隨捲動逐字亮起、卡片內容依序滑入。
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const root=document.documentElement;
  root.classList.add('wm');

  // ---------- 平滑捲動 ----------
  if(window.Lenis){
    const lenis=new Lenis({lerp:.09,wheelMultiplier:.95});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now());
  }

  // 把文字拆成一個個 <span>：中文逐字、英文逐詞（byChar 時英文也逐字母）
  function split(el,cls,byChar){
    const isEn=(root.lang||'').startsWith('en');
    const parts=isEn&&!byChar?el.textContent.split(/(\s+)/):[...el.textContent];
    el.setAttribute('aria-label',el.textContent);
    el.textContent='';
    return parts.map(p=>{
      if(/^\s+$/.test(p)){el.append(p);return null}
      const s=document.createElement('span');s.className=cls;s.textContent=p;s.setAttribute('aria-hidden','true');
      el.append(s);return s;
    }).filter(Boolean);
  }

  // ---------- 標題：逐字從遮罩下升起 ----------
  const h1=document.querySelector('.page-head h1');
  if(h1){
    split(h1,'wm-ch',true).forEach((s,i)=>{
      const w=document.createElement('span');w.className='wm-mask';s.replaceWith(w);w.append(s);
      s.style.transitionDelay=(i*.07)+'s';
    });
    h1.getBoundingClientRect(); // 先讓瀏覽器排版一次，轉場才會從起點開始
    setTimeout(()=>h1.classList.add('wm-in'),60);
  }

  // ---------- 引言：隨捲動逐字亮起 ----------
  const lede=document.querySelector('.page-head .lede');
  if(lede){
    const words=split(lede,'wm-w');
    const update=()=>{
      // 引言一開始就在畫面上：先亮兩成，往下捲約四成畫面高度內逐字亮完
      const p=.2+.8*Math.max(0,Math.min(1,scrollY/(innerHeight*.4)));
      const lit=Math.round(p*words.length);
      words.forEach((w,i)=>w.classList.toggle('on',i<lit));
    };
    addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
  }

  // ---------- 卡片與主案：進入畫面時，內容依序滑入 ----------
  const boxes=document.querySelectorAll('.works .card,.works .feature');
  boxes.forEach(box=>{
    [...box.children].forEach((c,i)=>{c.classList.add('wm-rise');c.style.transitionDelay=(i*.06)+'s'});
  });
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('wm-in');io.unobserve(e.target)}
  }),{rootMargin:'0px 0px -12% 0px'});
  boxes.forEach(b=>io.observe(b));
})();
