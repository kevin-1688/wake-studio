// 360° 轉台：一組繞一圈拍的渲染圖，拖曳或方向鍵切換角度；沒人動時慢慢自己轉。
// 用法：<div class="turntable" data-src="../assets/caster/turn/{i}.webp" data-count="36">
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)document.querySelectorAll('video.loop').forEach(v=>{v.removeAttribute('autoplay');v.pause();v.controls=true});
  document.querySelectorAll('.turntable').forEach(box=>{
    const n=+box.dataset.count,pad=String(n-1).length;
    const src=i=>box.dataset.src.replace('{i}',String(i).padStart(pad,'0'));
    const img=box.querySelector('img');
    const frames=[];let cur=0,loaded=0,touched=false,visible=false,last=0;
    function show(i){
      cur=((i%n)+n)%n;
      if(frames[cur]&&frames[cur].complete)img.src=frames[cur].src;
      box.setAttribute('aria-valuenow',cur*Math.round(360/n));
    }
    function preload(){
      if(frames.length)return;
      for(let i=0;i<n;i++){const im=new Image();im.decoding='async';im.onload=()=>{if(++loaded===n)box.classList.add('ready')};im.src=src(i);frames.push(im)}
    }
    let dragX=null,startFrame=0;
    box.addEventListener('pointerdown',e=>{
      preload();touched=true;dragX=e.clientX;startFrame=cur;box.setPointerCapture(e.pointerId);box.classList.add('dragging');
    });
    box.addEventListener('pointermove',e=>{
      if(dragX===null)return;
      show(startFrame-Math.round((e.clientX-dragX)/(box.clientWidth/n*.9)));
    });
    const end=()=>{dragX=null;box.classList.remove('dragging')};
    box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
    box.addEventListener('keydown',e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();preload();touched=true;show(cur+(e.key==='ArrowRight'?1:-1))}
    });
    new IntersectionObserver(es=>{
      visible=es[0].isIntersecting;
      if(visible)preload();
    },{rootMargin:'200px'}).observe(box);
    if(!reduce)(function spin(t){
      if(visible&&!touched&&loaded===n&&t-last>110){last=t;show(cur+1)}
      requestAnimationFrame(spin);
    })(0);
  });
})();
