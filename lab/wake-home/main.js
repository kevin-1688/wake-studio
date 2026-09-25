(() => {
const EN = document.querySelector('main')?.dataset.lang === 'en';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const $ = s => document.querySelector(s);
const root = document.documentElement, mqLight = matchMedia('(prefers-color-scheme: light)');
const isLight = () => root.dataset.theme ? root.dataset.theme==='light' : mqLight.matches;
const themeSubs = []; const onTheme = fn => { themeSubs.push(fn); fn(isLight()); };
const fireTheme = () => themeSubs.forEach(fn=>fn(isLight()));
new MutationObserver(fireTheme).observe(root,{attributes:true,attributeFilter:['data-theme']});
mqLight.addEventListener('change', fireTheme);
$('#themeBtn').addEventListener('click', ()=>{ root.dataset.theme = isLight() ? 'dark' : 'light'; });

/* ================= INTRO: signal line wakes into WAKE, flies into nav ================= */
const intro = $('#intro'), mark = $('#introMark'), sig = $('#sig'), letters = [...document.querySelectorAll('#introWord span')], navLogo = $('#navLogo'), skip = $('#skip');
let introAnims = [];
function endIntro(){
  introAnims.forEach(a=>a.cancel()); introAnims=[];
  intro.hidden = true; skip.hidden = true; navLogo.style.opacity = 1;
}
function runIntro(){
  if (RM){ endIntro(); return; }
  introAnims.forEach(a=>a.cancel()); introAnims=[]; clearTimeout(runIntro.fly);
  intro.hidden = false; skip.hidden = false; intro.style.opacity = 1;
  mark.style.transform = ''; navLogo.style.opacity = 0;
  const L = sig.getTotalLength();
  sig.style.strokeDasharray = L;
  const A = (el,k,o) => { const a = el.animate(k,o); introAnims.push(a); return a; };
  A(sig,[{strokeDashoffset:L,opacity:1},{strokeDashoffset:0,opacity:1}],{duration:1000,easing:'cubic-bezier(.6,0,.2,1)',fill:'forwards'});
  // Yushan: the R-peak of the heartbeat is the 3,952 m summit
  const fillEl = $('#ridgeFill'), dot = $('#summit'), lbl = $('#summitLbl'), back = $('#ridgeBack');
  const LB = back.getTotalLength(); back.style.strokeDasharray = LB;
  A(back,[{strokeDashoffset:LB,opacity:.35},{strokeDashoffset:0,opacity:.35}],{duration:1200,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});
  A(fillEl,[{opacity:0},{opacity:1}],{duration:500,delay:750,fill:'forwards'});
  A(dot,[{opacity:0,transform:'scale(0)'},{opacity:1,transform:'scale(1)'}],{duration:260,delay:620,easing:'cubic-bezier(.2,1.6,.4,1)',fill:'forwards'});
  A(lbl,[{opacity:0,transform:'translateX(-4px)'},{opacity:1,transform:'translateX(0)'}],{duration:360,delay:780,fill:'forwards'});
  [sig,fillEl,dot,lbl].forEach(el=>A(el,[{opacity:1},{opacity:0}],{duration:360,delay:1750,fill:'forwards'}));
  A(back,[{opacity:.35},{opacity:0}],{duration:360,delay:1750,fill:'forwards'});
  letters.forEach((s,i)=>A(s,[{opacity:0,transform:'translateY(.35em)'},{opacity:1,transform:'translateY(0)'}],{duration:420,delay:1700+i*60,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}));
  // fly to nav logo (FLIP)
  runIntro.fly = setTimeout(()=>{
    if (intro.hidden) return;
    const word = $('#introWord');
    const a = word.getBoundingClientRect(), b = navLogo.getBoundingClientRect();
    const s = b.height / (a.height*0.62);
    const dx = (b.left + b.width/2) - (a.left + a.width/2), dy = (b.top + b.height/2) - (a.top + a.height/2);
    A(mark,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${dx}px,${dy}px) scale(${s})`}],{duration:750,easing:'cubic-bezier(.7,0,.2,1)',fill:'forwards'});
    const f = A(intro,[{backgroundColor:getComputedStyle(intro).backgroundColor},{backgroundColor:'transparent'}],{duration:650,delay:250,easing:'ease-out',fill:'forwards'});
    f.onfinish = endIntro;
  },2400);
  clearTimeout(runIntro.safe); runIntro.safe = setTimeout(endIntro, 3900);
}
skip.addEventListener('click', endIntro);
$('#replay').addEventListener('click', ()=>{ scrollTo({top:0}); runIntro(); });
runIntro();

/* ================= HERO: physics bodies with inertia + magnetic cursor ================= */
const canvas = $('#gl');
if (window.THREE){
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32,1,.1,100);
  camera.position.set(0,0,22);

  // procedural studio environment for reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const roomMat = new THREE.MeshBasicMaterial({color:0x1D2A3C, side:THREE.BackSide});
  env.add(new THREE.Mesh(new THREE.BoxGeometry(30,30,30), roomMat));
  const panel = (c,w,h,p,r)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); m.position.set(...p); m.lookAt(0,0,0); env.add(m); };
  panel(0xfff3d6,14,4,[0,12,4]); panel(0xffffff,4,10,[-12,2,6]); panel(0x93A2B5,6,8,[12,-3,2]); panel(0xF0BE6A,10,2,[0,-12,-4]);
  const amb = new THREE.AmbientLight(0x93A2B5,.28); scene.add(amb);
  const key = new THREE.DirectionalLight(0xfff0d0,1.4); key.position.set(-6,8,10); scene.add(key);

  const mats = [
    new THREE.MeshStandardMaterial({color:0xE5A33D, metalness:.75, roughness:.3, emissive:0x3a2306}),  // gold (less metal so it doesn't go olive in the dark env)
    new THREE.MeshStandardMaterial({color:0x1D2A3C, metalness:.3, roughness:.32}), // dusk
    new THREE.MeshStandardMaterial({color:0xF3E9D7, metalness:0, roughness:.6}),   // cream
    new THREE.MeshStandardMaterial({color:0xC2652F, metalness:.6, roughness:.35}), // ember
  ];
  let envRT = null;
  onTheme(light=>{
    roomMat.color.set(light ? 0xE9E2D4 : 0x1D2A3C);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(env,0.03); scene.environment = envRT.texture;
    amb.intensity = light ? .55 : .28;
    renderer.toneMappingExposure = light ? .95 : 1.05;
    mats[0].color.set(light ? 0xD9962E : 0xE5A33D);   // gold reads deeper on paper
    mats[2].color.set(light ? 0x93A2B5 : 0xF3E9D7);   // cream would vanish on light ground → haze
    mats[3].color.set(light ? 0xB4541E : 0xC2652F);
    try{ if(!running) renderer.render(scene,camera); }catch(e){}
  });
  // Taiwan main island outline (lon, lat), clockwise from 富貴角
  const TW = [[121.53,25.30],[121.66,25.20],[121.75,25.14],[122.00,25.01],[121.87,24.86],[121.83,24.62],[121.86,24.45],[121.70,24.15],[121.62,23.98],[121.55,23.62],[121.48,23.32],[121.36,23.02],[121.18,22.76],[120.98,22.47],[120.90,22.22],[120.86,21.92],[120.72,21.92],[120.70,22.10],[120.62,22.30],[120.45,22.47],[120.28,22.60],[120.18,22.88],[120.10,23.05],[120.08,23.25],[120.14,23.45],[120.20,23.70],[120.34,24.00],[120.47,24.22],[120.60,24.46],[120.72,24.64],[120.90,24.84],[121.02,25.02],[121.20,25.10],[121.40,25.17]];
  const kLon = Math.cos(23.7*Math.PI/180);
  let minY=1e9,maxY=-1e9,sx=0,sy=0;
  const pts = TW.map(([lo,la])=>{ const x=lo*kLon, y=la; minY=Math.min(minY,y); maxY=Math.max(maxY,y); sx+=x; sy+=y; return [x,y]; });
  const cxT = sx/pts.length, cyT = sy/pts.length, H = maxY-minY; // normalise to height 2
  const shape = new THREE.Shape(pts.map(([x,y])=>new THREE.Vector2((x-cxT)/H*2,(y-cyT)/H*2)));
  const islandGeo = new THREE.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:true,bevelThickness:.1,bevelSize:.06,bevelSegments:4,curveSegments:2});
  islandGeo.center(); islandGeo.computeVertexNormals();
  const small = innerWidth < 700;
  const N = small ? 16 : 26;
  const bodies = [];
  for (let i=0;i<N;i++){
    const sc = .55 + Math.random()*.75;           // island height = 2*sc
    const mat = i%6===0 ? mats[3] : i%5===0 ? mats[2] : i%2===0 ? mats[0] : mats[1];
    const m = new THREE.Mesh(islandGeo, mat);
    m.scale.setScalar(sc);
    m.rotation.set((Math.random()-.5)*1.2,(Math.random()-.5)*1.2,(Math.random()-.5)*.8);
    scene.add(m);
    const a = Math.random()*Math.PI*2, d = 3+Math.random()*6;
    bodies.push({m,r:sc*.72,p:new THREE.Vector3(Math.cos(a)*d,Math.sin(a)*d*.6,(Math.random()-.5)*2),v:new THREE.Vector3(),w:new THREE.Vector3((Math.random()-.5),(Math.random()-.5),0)});
  }
  // cursor body
  const mouse = {p:new THREE.Vector3(99,99,0), prev:new THREE.Vector3(99,99,0), r: small?1.4:1.8, speed:0, active:false};
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0,0,1),0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  let center = new THREE.Vector3(3.2,.6,0);

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
    center.set(w>760 ? 3.6 : 0, w>760 ? .8 : 2.2, 0);
  }
  resize(); addEventListener('resize', resize);

  function toWorld(e){
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(ndc,camera); ray.ray.intersectPlane(plane,hit); return hit;
  }
  canvas.addEventListener('pointermove', e=>{ mouse.p.copy(toWorld(e)); mouse.active = true; });
  canvas.addEventListener('pointerleave', ()=>{ mouse.active=false; mouse.p.set(99,99,0); });
  canvas.addEventListener('pointerdown', e=>{
    const m = toWorld(e).clone();
    bodies.forEach(b=>{ const d = b.p.clone().sub(m); const L = d.length()+.5; b.v.add(d.normalize().multiplyScalar(22/L)); b.w.z += (Math.random()-.5)*6; });
    energy = 1;
  });

  let energy = 0, last = performance.now(), running = true;
  const sigVal = $('#sigVal'), sigBar = $('#sigBar');
  const tmp = new THREE.Vector3();
  function step(now){
    let dt = Math.min((now-last)/1000, 1/30); last = now;
    // cursor velocity
    const mv = mouse.p.distanceTo(mouse.prev)/Math.max(dt,1e-3);
    mouse.speed += ((mouse.active?Math.min(mv,40):0) - mouse.speed)*.12;
    mouse.prev.copy(mouse.p);
    for (const b of bodies){
      // spring toward cluster center (flatter on z) — gives inertia + settle
      tmp.copy(center).sub(b.p); tmp.z *= 3;
      b.v.addScaledVector(tmp, 2.2*dt);
      b.v.multiplyScalar(Math.pow(.18, dt)); // damping
    }
    // collisions
    for (let i=0;i<bodies.length;i++){
      const A = bodies[i];
      for (let j=i+1;j<bodies.length;j++){
        const B = bodies[j]; tmp.copy(B.p).sub(A.p);
        const d = tmp.length(), min = A.r+B.r;
        if (d < min && d>1e-4){
          tmp.divideScalar(d); const push = (min-d)*.5;
          A.p.addScaledVector(tmp,-push); B.p.addScaledVector(tmp,push);
          const rel = B.v.clone().sub(A.v).dot(tmp);
          if (rel<0){ A.v.addScaledVector(tmp,rel*.6); B.v.addScaledVector(tmp,-rel*.6); }
        }
      }
      // cursor: a solid body that shoves (magnetic falloff just outside)
      tmp.copy(A.p).sub(mouse.p); tmp.z=0;
      const d = tmp.length(), min = A.r+mouse.r;
      if (d < min && d>1e-4){ tmp.divideScalar(d); A.p.addScaledVector(tmp,(min-d)); A.v.addScaledVector(tmp,(min-d)*18); A.w.x += tmp.y*.4; A.w.y -= tmp.x*.4; }
      else if (mouse.active && d < min+2.2){ A.v.addScaledVector(tmp.normalize(), -1.4*dt*6); } // slight magnetic pull
    }
    for (const b of bodies){
      b.p.addScaledVector(b.v, dt);
      b.w.multiplyScalar(Math.pow(.5,dt));
      b.m.position.copy(b.p);
      b.m.rotation.x += (b.w.x + b.v.y*.25)*dt; b.m.rotation.y += (b.w.y - b.v.x*.25)*dt; b.m.rotation.z += b.w.z*dt;
    }
    // signal readout
    energy = Math.max(energy*Math.pow(.35,dt), Math.min(mouse.speed/30,1));
    sigBar.style.transform = `scaleX(${energy.toFixed(3)})`;
    sigVal.textContent = energy.toFixed(2) + (energy>.6?' · AWAKE':energy>.15?' · STIRRING':' · DORMANT');
    renderer.render(scene,camera);
  }
  function loop(now){ if (!running) return; step(now); requestAnimationFrame(loop); }
  new IntersectionObserver(([en])=>{ const was = running; running = en.isIntersecting; if (running && !was){ last=performance.now(); requestAnimationFrame(loop);} }).observe(canvas);
  if (RM){ for(let i=0;i<240;i++) step(last + i*16); running=false; renderer.render(scene,camera);
    canvas.addEventListener('pointermove',()=>{ if(!running){ running=true; last=performance.now(); requestAnimationFrame(loop);} },{once:true});
  } else requestAnimationFrame(loop);
}

/* ================= service mini-animations (2D canvas) ================= */
let GOLD, PAPER, STEEL;
onTheme(()=>{ const cs=getComputedStyle(root); GOLD=cs.getPropertyValue('--gold').trim(); PAPER=cs.getPropertyValue('--paper').trim(); STEEL=cs.getPropertyValue('--steel').trim(); });
document.querySelectorAll('.svc canvas').forEach(cv=>{
  const ctx = cv.getContext('2d'); let t=0, hover=0, target=0;
  const card = cv.closest('.svc');
  card.addEventListener('pointerenter',()=>target=1); card.addEventListener('pointerleave',()=>target=0);
  function size(){ const r=cv.getBoundingClientRect(), d=Math.min(devicePixelRatio,2); cv.width=r.width*d; cv.height=r.height*d; ctx.setTransform(d,0,0,d,0,0); }
  size(); addEventListener('resize',size);
  const kind = cv.dataset.anim;
  function draw(){
    const w=cv.clientWidth, h=cv.clientHeight; ctx.clearRect(0,0,w,h);
    hover += (target-hover)*.08; t += RM?0:.016;
    ctx.lineWidth=1.2;
    if (kind==='explode'){ // exploded layers of a product
      const cx=w*.28, cy=h*.55;
      for(let i=0;i<5;i++){
        const off=(i-2)*(6+hover*16);
        ctx.strokeStyle = i===2?GOLD:STEEL; ctx.fillStyle = i===2?GOLD:STEEL;
        ctx.beginPath(); ctx.moveTo(cx-54,cy+off); ctx.lineTo(cx,cy-26+off); ctx.lineTo(cx+54,cy+off); ctx.lineTo(cx,cy+26+off); ctx.closePath(); ctx.globalAlpha=i===2?.15:.06; ctx.fill(); ctx.globalAlpha=1; ctx.stroke();
      }
      ctx.fillStyle=STEEL; ctx.font='500 10px "IBM Plex Mono",monospace'; ctx.fillText(hover>.5?'EXPLODED · 5 PARTS':'ASSEMBLED', w*.55, h*.5);
    } else if (kind==='scroll'){ // a page scrolling with a product reveal
      const pw=Math.min(90,w*.3), ph=h-16, x=16, y=8, s=(Math.sin(t*1.2)*.5+.5)*(.4+hover*.6);
      ctx.strokeStyle=STEEL; ctx.strokeRect(x,y,pw,ph);
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,pw,ph); ctx.clip();
      for(let i=0;i<6;i++){ const yy=y+10+i*28-s*60; ctx.fillStyle=i===2?GOLD:STEEL; ctx.globalAlpha=i===2?1:.35; ctx.fillRect(x+10,yy,i===2?pw-20:pw*.5,i===2?18:4); ctx.globalAlpha=1; }
      ctx.restore();
      ctx.strokeStyle=GOLD; ctx.beginPath(); ctx.arc(x+pw+60, h/2, 22+s*10, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle=STEEL; ctx.font='500 10px "IBM Plex Mono",monospace'; ctx.fillText('SCROLL '+Math.round(s*100)+'%', x+pw+100, h/2+4);
    } else { // signal waking
      ctx.strokeStyle=STEEL; ctx.globalAlpha=.4; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke(); ctx.globalAlpha=1;
      ctx.strokeStyle=GOLD; ctx.beginPath();
      for(let x=0;x<=w;x+=2){ const k=Math.exp(-Math.pow((x/w-.5)*4,2)); const y=h/2 - Math.sin(x*.06 - t*5)*k*(8+hover*30); x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  draw();
});

/* ================= work list peek ================= */
const peek = $('#peek'), peekArt = peek.querySelector('.art'), peekLbl = peek.querySelector('.lbl');
let px=0, py=0, tx=0, ty=0;
if (FINE){
  document.querySelectorAll('.works a').forEach(a=>{
    a.addEventListener('pointerenter',()=>{ peekArt.textContent=a.dataset.peek; peek.style.background=a.dataset.bg; peekLbl.textContent=a.dataset.lbl; peek.classList.add('on'); });
    a.addEventListener('pointerleave',()=>peek.classList.remove('on'));
    a.addEventListener('click',e=>e.preventDefault());
  });
}

/* ================= cursor + magnetic buttons (inertia) ================= */
const cur = $('#cur'); let cx=innerWidth/2, cy=innerHeight/2, mx=cx, my=cy;
addEventListener('pointermove', e=>{ mx=e.clientX; my=e.clientY; tx=e.clientX+170; ty=e.clientY; });
document.querySelectorAll('a,button').forEach(el=>{ el.addEventListener('pointerenter',()=>cur.classList.add('big')); el.addEventListener('pointerleave',()=>cur.classList.remove('big')); });
const magnets = [...document.querySelectorAll('.magnet')].map(el=>({el,x:0,y:0,tx:0,ty:0}));
if (FINE && !RM){
  magnets.forEach(m=>{
    m.el.addEventListener('pointermove',e=>{ const r=m.el.getBoundingClientRect(); m.tx=(e.clientX-(r.left+r.width/2))*.35; m.ty=(e.clientY-(r.top+r.height/2))*.45; });
    m.el.addEventListener('pointerleave',()=>{ m.tx=0; m.ty=0; });
  });
}
(function tick(){
  const k = RM?1:.18;
  cx += (mx-cx)*k; cy += (my-cy)*k; cur.style.transform=`translate(${cx}px,${cy}px)`;
  px += (tx-px)*.12; py += (ty-py)*.12; peek.style.left=px+'px'; peek.style.top=py+'px';
  magnets.forEach(m=>{ // spring with overshoot = elastic feel
    m.vx = (m.vx||0)*.78 + (m.tx-m.x)*.16; m.vy = (m.vy||0)*.78 + (m.ty-m.y)*.16;
    m.x += m.vx; m.y += m.vy; m.el.style.transform=`translate(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px)`;
  });
  requestAnimationFrame(tick);
})();

/* ================= copy email + Taipei clock ================= */
$('#copyBtn').addEventListener('click', ()=>{
  const out = $('#copied');
  navigator.clipboard.writeText('kevin@wake.com.tw').then(()=>out.textContent=EN?'Copied kevin@wake.com.tw':'已複製 kevin@wake.com.tw').catch(()=>{
    const r=document.createRange(); r.selectNodeContents($('#mail')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); out.textContent=EN?'Selected — press ⌘C / Ctrl+C to copy':'已選取，按 ⌘C／Ctrl+C 複製';
  });
});
const clock = $('#clock');
const fmt = new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
setInterval(()=>clock.textContent=fmt.format(new Date()),1000); clock.textContent=fmt.format(new Date());
})();
