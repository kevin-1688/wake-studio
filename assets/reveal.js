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
  if(tBtn)tBtn.textContent=t==='light'?(en?'\u263e Dark':'\u6688 \u6697\u8272'):(en?'\u263c Light':'\u263c \u4eae\u8272');
}
setTheme(document.documentElement.dataset.theme||'dark');
if(tBtn)tBtn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light'));
