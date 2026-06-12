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
