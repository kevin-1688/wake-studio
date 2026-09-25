(() => {
const EN = document.querySelector('main')?.dataset.lang === 'en';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
const root = document.documentElement, mqLight = matchMedia('(prefers-color-scheme: light)');
const isLight = () => root.dataset.theme ? root.dataset.theme==='light' : mqLight.matches;
const themeSubs = []; const onTheme = fn => { themeSubs.push(fn); fn(isLight()); };
const fireTheme = () => themeSubs.forEach(fn=>fn(isLight()));
new MutationObserver(fireTheme).observe(root,{attributes:true,attributeFilter:['data-theme']});
mqLight.addEventListener('change', fireTheme);
$('#themeBtn').addEventListener('click', ()=>{ root.dataset.theme = isLight() ? 'dark' : 'light'; });

/* ================= INTRO: Yushan heartbeat wakes into WAKE, flies into nav ================= */
const intro = $('#intro'), mark = $('#introMark'), sig = $('#sig'), letters = $$('#introWord span'), navLogo = $('#navLogo'), skip = $('#skip');
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

/* ================= SMOOTH SCROLL (Lenis) + scroll bus ================= */
let lenis = null;
if (!RM && window.Lenis){
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9 });
  (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
}
const scrollSubs = [];
const emitScroll = () => { const y = window.scrollY; scrollSubs.forEach(fn=>fn(y)); };
if (lenis) lenis.on('scroll', emitScroll); else addEventListener('scroll', emitScroll, {passive:true});
addEventListener('resize', emitScroll);
const scrollToEl = (el) => { if (el == null) return; if (lenis) lenis.scrollTo(el, el===0 ? {duration:1.4} : {offset:-72, duration:1.4}); else if (el===0) scrollTo({top:0, behavior: RM?'auto':'smooth'}); else el.scrollIntoView({behavior: RM?'auto':'smooth'}); };
$('#replay').addEventListener('click', ()=>{ if (lenis) lenis.scrollTo(0,{immediate:true}); else scrollTo({top:0}); runIntro(); });
runIntro();

const prog = $('#prog'), navEl = $('header.nav');
scrollSubs.push(y => navEl.classList.toggle('scrolled', y > 40));
scrollSubs.push(y => { const max = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${max>0 ? clamp(y/max,0,1) : 0})`; });

/* ================= HERO: Taiwan islands with real-ish relief ================= */
const canvas = $('#gl'), hero = $('.hero'), heroCopy = $('#heroCopy');
let heroP = 0; // 0 → hero fully in view, 1 → scrolled past
scrollSubs.push(y => {
  heroP = clamp(y / (hero.offsetHeight || 1), 0, 1);
  if (!RM) { heroCopy.style.transform = `translate3d(0,${(y*0.22).toFixed(1)}px,0)`; heroCopy.style.opacity = (1 - heroP*1.3).toFixed(3); }
});
if (window.THREE){
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32,1,.1,100);
  camera.position.set(0,0,22);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const roomMat = new THREE.MeshBasicMaterial({color:0x1D2A3C, side:THREE.BackSide});
  env.add(new THREE.Mesh(new THREE.BoxGeometry(30,30,30), roomMat));
  const panel = (c,w,h,p)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); m.position.set(...p); m.lookAt(0,0,0); env.add(m); };
  panel(0xfff3d6,14,4,[0,12,4]); panel(0xffffff,4,10,[-12,2,6]); panel(0x93A2B5,6,8,[12,-3,2]); panel(0xF0BE6A,10,2,[0,-12,-4]);
  const amb = new THREE.AmbientLight(0x93A2B5,.28); scene.add(amb);
  const key = new THREE.DirectionalLight(0xfff0d0,1.5); key.position.set(-6,8,10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xE5A33D,.6); rim.position.set(8,-4,-6); scene.add(rim);

  const mats = [
    new THREE.MeshStandardMaterial({color:0xE5A33D, metalness:.75, roughness:.3, emissive:0x3a2306, vertexColors:true}), // gold
    new THREE.MeshStandardMaterial({color:0x2A3B55, metalness:.3, roughness:.34, vertexColors:true}),                    // dusk
    new THREE.MeshStandardMaterial({color:0xF3E9D7, metalness:0, roughness:.62, vertexColors:true}),                     // cream
    new THREE.MeshStandardMaterial({color:0xC2652F, metalness:.6, roughness:.35, vertexColors:true}),                    // ember
  ];
  let envRT = null, running = true;
  onTheme(light=>{
    roomMat.color.set(light ? 0xE9E2D4 : 0x1D2A3C);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(env,0.03); scene.environment = envRT.texture;
    amb.intensity = light ? .55 : .28;
    renderer.toneMappingExposure = light ? .95 : 1.05;
    mats[0].color.set(light ? 0xD9962E : 0xE5A33D);
    mats[2].color.set(light ? 0x93A2B5 : 0xF3E9D7);
    mats[3].color.set(light ? 0xB4541E : 0xC2652F);
    if (!running) renderer.render(scene,camera);
  });

  /* --- island geometry: coastline slab + terrain relief --- */
  const TW = [[121.53,25.30],[121.66,25.20],[121.75,25.14],[122.00,25.01],[121.87,24.86],[121.83,24.62],[121.86,24.45],[121.70,24.15],[121.62,23.98],[121.55,23.62],[121.48,23.32],[121.36,23.02],[121.18,22.76],[120.98,22.47],[120.90,22.22],[120.86,21.92],[120.72,21.92],[120.70,22.10],[120.62,22.30],[120.45,22.47],[120.28,22.60],[120.18,22.88],[120.10,23.05],[120.08,23.25],[120.14,23.45],[120.20,23.70],[120.34,24.00],[120.47,24.22],[120.60,24.46],[120.72,24.64],[120.90,24.84],[121.02,25.02],[121.20,25.10],[121.40,25.17]];
  // ridgelines as [lon, lat, metres]; heights are summit-level approximations
  const RIDGES = [
    {w:.17, p:[[121.62,24.72,1800],[121.42,24.46,3000],[121.28,24.22,3400],[121.20,24.00,3300],[121.10,23.75,3300],[120.96,23.47,3952],[120.92,23.20,3200],[120.88,22.90,2800],[120.83,22.55,2000],[120.80,22.20,1100],[120.83,21.98,300]]}, // 中央山脈 + 玉山
    {w:.10, p:[[121.12,24.62,2300],[121.23,24.38,3886],[121.06,24.20,2800],[120.95,24.04,1700]]}, // 雪山山脈
    {w:.08, p:[[120.84,23.62,2400],[120.78,23.35,2400],[120.72,23.05,1500]]},                     // 阿里山山脈
    {w:.05, p:[[121.56,23.96,900],[121.42,23.50,1500],[121.28,23.10,1200],[121.16,22.82,500]]},    // 海岸山脈
    {w:.05, p:[[121.50,25.20,1100],[121.58,25.14,1000]]},                                           // 大屯山群
  ];
  const kLon = Math.cos(23.7*Math.PI/180);
  let minY=1e9,maxY=-1e9,minX=1e9,maxX=-1e9,sx=0,sy=0;
  const pts = TW.map(([lo,la])=>{ const x=lo*kLon, y=la; minY=Math.min(minY,y); maxY=Math.max(maxY,y); minX=Math.min(minX,x); maxX=Math.max(maxX,x); sx+=x; sy+=y; return [x,y]; });
  const cxT = sx/pts.length, cyT = sy/pts.length, H = maxY-minY;
  const N2 = (x,y) => [(x-cxT)/H*2, (y-cyT)/H*2];
  const inside = (x,y) => { let c=false; for (let i=0,j=pts.length-1;i<pts.length;j=i++){ const [xi,yi]=pts[i],[xj,yj]=pts[j]; if (((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; };
  function heightAt(lo, la){
    let h = 0;
    for (const r of RIDGES){
      for (let i=0;i<r.p.length-1;i++){
        const [x1,y1,h1]=r.p[i], [x2,y2,h2]=r.p[i+1];
        const ax=(x1)*kLon, ay=y1, bx=(x2)*kLon, by=y2, px=lo*kLon, py=la;
        const vx=bx-ax, vy=by-ay, t=clamp(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy),0,1);
        const dx=px-(ax+vx*t), dy=py-(ay+vy*t), d2=(dx*dx+dy*dy)/(r.w*r.w);
        h = Math.max(h, (h1+(h2-h1)*t) * Math.exp(-d2));
      }
    }
    return h;
  }
  const small = innerWidth < 700;
  const GX = small ? 30 : 42, GY = small ? 68 : 96, DEPTH = .2, BEV = .05, TOP = DEPTH + BEV, HS = .3/3952; // vertical exaggeration (~30×), enough to read the ranges without warping the outline
  function buildIsland(){
    const shape = new THREE.Shape(pts.map(([x,y])=>new THREE.Vector2(...N2(x,y))));
    let slab = new THREE.ExtrudeGeometry(shape,{depth:DEPTH,bevelEnabled:true,bevelThickness:BEV,bevelSize:.04,bevelSegments:3,curveSegments:2});
    if (slab.index) slab = slab.toNonIndexed();
    // relief grid
    const pos=[], col=[], idx=[], ins=[];
    for (let j=0;j<=GY;j++) for (let i=0;i<=GX;i++){
      const x = minX + (maxX-minX)*i/GX, y = minY + (maxY-minY)*j/GY;
      const inn = inside(x,y), hm = inn ? heightAt(x/kLon, y) : 0;
      const [nx,ny] = N2(x,y);
      pos.push(nx, ny, TOP + .004 + hm*HS); ins.push(inn);
      const s = .78 + .22*Math.min(1, hm/3200); col.push(s,s,s);   // lowlands a touch darker than ridges
    }
    const V = (i,j) => j*(GX+1)+i;
    for (let j=0;j<GY;j++) for (let i=0;i<GX;i++){
      const a=V(i,j), b=V(i+1,j), c=V(i,j+1), d=V(i+1,j+1);
      if (ins[a]&&ins[b]&&ins[d]) idx.push(a,b,d);
      if (ins[a]&&ins[d]&&ins[c]) idx.push(a,d,c);
    }
    let rel = new THREE.BufferGeometry();
    rel.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    rel.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
    rel.setIndex(idx); rel.computeVertexNormals(); rel = rel.toNonIndexed();
    // merge slab + relief
    const sp = slab.getAttribute('position').array, sn = slab.getAttribute('normal').array, rp = rel.getAttribute('position').array, rn = rel.getAttribute('normal').array, rc = rel.getAttribute('color').array;
    const P = new Float32Array(sp.length+rp.length), Nn = new Float32Array(sn.length+rn.length), C = new Float32Array(sp.length+rp.length);
    P.set(sp); P.set(rp, sp.length); Nn.set(sn); Nn.set(rn, sn.length); C.fill(.8, 0, sp.length); C.set(rc, sp.length);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P,3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn,3)); g.setAttribute('color', new THREE.BufferAttribute(C,3));
    g.center(); g.computeBoundingSphere();
    return g;
  }
  const islandGeo = buildIsland();

  const N = small ? 14 : 24;
  const bodies = [];
  for (let i=0;i<N;i++){
    const sc = .6 + Math.random()*.8;
    const mat = i%6===0 ? mats[3] : i%5===0 ? mats[2] : i%2===0 ? mats[0] : mats[1];
    const m = new THREE.Mesh(islandGeo, mat);
    m.scale.setScalar(sc);
    // mostly face the camera so the ridges read, with a little tumble
    m.rotation.set((Math.random()-.5)*.6,(Math.random()-.5)*.6,(Math.random()-.5)*.8);
    scene.add(m);
    const a = Math.random()*Math.PI*2, d = 3+Math.random()*6;
    bodies.push({m,r:sc*.72,p:new THREE.Vector3(Math.cos(a)*d,Math.sin(a)*d*.6,(Math.random()-.5)*2),v:new THREE.Vector3(),w:new THREE.Vector3((Math.random()-.5),(Math.random()-.5),0)});
  }
  const mouse = {p:new THREE.Vector3(99,99,0), prev:new THREE.Vector3(99,99,0), r: small?1.4:1.8, speed:0, active:false};
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0,0,1),0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const base = new THREE.Vector3(), center = new THREE.Vector3();

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w,h,false); camera.aspect = w/h; camera.updateProjectionMatrix();
    base.set(w>760 ? 3.6 : 0, w>760 ? .8 : 2.2, 0);
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

  let energy = 0, last = performance.now();
  const sigVal = $('#sigVal'), sigBar = $('#sigBar');
  const tmp = new THREE.Vector3();
  function step(now){
    const dt = Math.min((now-last)/1000, 1/30); last = now;
    const mv = mouse.p.distanceTo(mouse.prev)/Math.max(dt,1e-3);
    mouse.speed += ((mouse.active?Math.min(mv,40):0) - mouse.speed)*.12;
    mouse.prev.copy(mouse.p);
    // scroll: cluster drifts up and loosens as the hero leaves — the islands trail with inertia
    center.set(base.x - heroP*1.5, base.y + heroP*6.5, 0);
    const k = 2.2 * (1 - heroP*.55);
    camera.position.z += ((22 + heroP*5) - camera.position.z) * .08;
    for (const b of bodies){
      tmp.copy(center).sub(b.p); tmp.z *= 3;
      b.v.addScaledVector(tmp, k*dt);
      b.v.multiplyScalar(Math.pow(.18, dt));
    }
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
      tmp.copy(A.p).sub(mouse.p); tmp.z=0;
      const d = tmp.length(), min = A.r+mouse.r;
      if (d < min && d>1e-4){ tmp.divideScalar(d); A.p.addScaledVector(tmp,(min-d)); A.v.addScaledVector(tmp,(min-d)*18); A.w.x += tmp.y*.4; A.w.y -= tmp.x*.4; }
      else if (mouse.active && d < min+2.2){ A.v.addScaledVector(tmp.normalize(), -1.4*dt*6); }
    }
    for (const b of bodies){
      b.p.addScaledVector(b.v, dt);
      b.w.multiplyScalar(Math.pow(.5,dt));
      b.m.position.copy(b.p);
      // tumble from velocity, but ease back toward facing the camera so the relief stays legible
      b.m.rotation.x += (b.w.x + b.v.y*.25)*dt - b.m.rotation.x*.25*dt;
      b.m.rotation.y += (b.w.y - b.v.x*.25)*dt - b.m.rotation.y*.25*dt;
      b.m.rotation.z += b.w.z*dt;
    }
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
$$('.svc canvas').forEach(cv=>{
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
    if (kind==='explode'){
      const cx=w*.28, cy=h*.55;
      for(let i=0;i<5;i++){
        const off=(i-2)*(6+hover*16);
        ctx.strokeStyle = i===2?GOLD:STEEL; ctx.fillStyle = i===2?GOLD:STEEL;
        ctx.beginPath(); ctx.moveTo(cx-54,cy+off); ctx.lineTo(cx,cy-26+off); ctx.lineTo(cx+54,cy+off); ctx.lineTo(cx,cy+26+off); ctx.closePath(); ctx.globalAlpha=i===2?.15:.06; ctx.fill(); ctx.globalAlpha=1; ctx.stroke();
      }
      ctx.fillStyle=STEEL; ctx.font='500 10px "IBM Plex Mono",monospace'; ctx.fillText(hover>.5?'EXPLODED · 5 PARTS':'ASSEMBLED', w*.55, h*.5);
    } else if (kind==='scroll'){
      const pw=Math.min(90,w*.3), ph=h-16, x=16, y=8, s=(Math.sin(t*1.2)*.5+.5)*(.4+hover*.6);
      ctx.strokeStyle=STEEL; ctx.strokeRect(x,y,pw,ph);
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,pw,ph); ctx.clip();
      for(let i=0;i<6;i++){ const yy=y+10+i*28-s*60; ctx.fillStyle=i===2?GOLD:STEEL; ctx.globalAlpha=i===2?1:.35; ctx.fillRect(x+10,yy,i===2?pw-20:pw*.5,i===2?18:4); ctx.globalAlpha=1; }
      ctx.restore();
      ctx.strokeStyle=GOLD; ctx.beginPath(); ctx.arc(x+pw+60, h/2, 22+s*10, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle=STEEL; ctx.font='500 10px "IBM Plex Mono",monospace'; ctx.fillText('SCROLL '+Math.round(s*100)+'%', x+pw+100, h/2+4);
    } else {
      ctx.strokeStyle=STEEL; ctx.globalAlpha=.4; ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke(); ctx.globalAlpha=1;
      ctx.strokeStyle=GOLD; ctx.beginPath();
      for(let x=0;x<=w;x+=2){ const k=Math.exp(-Math.pow((x/w-.5)*4,2)); const y=h/2 - Math.sin(x*.06 - t*5)*k*(8+hover*30); x?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  draw();
});

/* ================= reveals (only for what starts below the fold) ================= */
if ('IntersectionObserver' in window && !RM){
  const io = new IntersectionObserver(ents=>ents.forEach(en=>{ if (en.isIntersecting){ en.target.classList.remove('pending'); io.unobserve(en.target); } }),{threshold:.12, rootMargin:'0px 0px -6% 0px'});
  $$('.fx,.rvh').forEach((el,i)=>{
    if (el.getBoundingClientRect().top > innerHeight){
      el.classList.add('pending');
      if (el.matches('.works li')) el.style.transitionDelay = (($$('.works li').indexOf(el))*70)+'ms';
      io.observe(el);
    }
  });
}

/* ================= process: scroll-drawn heartbeat + active step ================= */
const proc = $('#process'), steps = $$('.step'), procNum = $('#procNum'), procPath = $('#procPath');
const PL = procPath.getTotalLength(); procPath.style.strokeDasharray = PL; procPath.style.strokeDashoffset = PL;
scrollSubs.push(() => {
  const r = proc.getBoundingClientRect(), mid = innerHeight*.55;
  const p = clamp((mid - r.top) / (r.height - innerHeight*.3), 0, 1);
  procPath.style.strokeDashoffset = (PL*(1-p)).toFixed(1);
  let on = 0; steps.forEach((s,i)=>{ if (s.getBoundingClientRect().top < mid) on = i; });
  steps.forEach((s,i)=>s.classList.toggle('on', i===on || innerWidth<=860));
  procNum.textContent = String(on+1).padStart(2,'0');
});

/* ================= mobile CTA ================= */
const mcta = $('#mcta'), contact = $('#contact');
scrollSubs.push(y => { const inContact = contact.getBoundingClientRect().top < innerHeight; mcta.classList.toggle('on', heroP > .8 && !inContact && $('#caseLayer').hidden); });

/* ================= work peek + case layer ================= */
const peek = $('#peek'), peekArt = peek.querySelector('.art'), peekLbl = peek.querySelector('.lbl');
let px=0, py=0, tx=0, ty=0;
const layer = $('#caseLayer'), caseClose = $('#caseClose');
let caseFrom = null, caseAnim = null;
const rectClip = r => `inset(${Math.max(0,r.top)}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${Math.max(0,r.left)}px round 6px)`;
function openCase(id, fromEl){
  const art = document.getElementById(id); if (!art) return;
  $$('.case').forEach(c=>c.hidden = c!==art);
  caseFrom = fromEl || null;
  layer.hidden = false; layer.scrollTop = 0; peek.classList.remove('on');
  if (lenis) lenis.stop(); document.body.style.overflow = 'hidden';
  if (!RM){
    const from = fromEl ? rectClip(fromEl.getBoundingClientRect()) : 'inset(50% 0 50% 0 round 0px)';
    caseAnim = layer.animate([{clipPath:from},{clipPath:'inset(0px 0px 0px 0px round 0px)'}],{duration:760,easing:'cubic-bezier(.76,0,.24,1)'});
    art.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'none'}],{duration:700,delay:380,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
  }
  caseClose.focus({preventScroll:true});
}
function closeCase(then){
  if (layer.hidden) { then && then(); return; }
  const done = () => { layer.hidden = true; document.body.style.overflow = ''; if (lenis) lenis.start(); if (caseFrom && !then) caseFrom.focus({preventScroll:true}); then && then(); };
  if (RM) return done();
  const to = caseFrom && !then ? rectClip(caseFrom.getBoundingClientRect()) : 'inset(0px 0px 100% 0px round 0px)';
  const a = layer.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)'},{clipPath:to}],{duration:560,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
  a.onfinish = () => { done(); a.cancel(); };
}
caseClose.addEventListener('click', ()=>closeCase());
addEventListener('keydown', e=>{ if (e.key==='Escape' && !layer.hidden) closeCase(); });
$$('.works a').forEach(a=>{
  if (FINE){
    a.addEventListener('pointerenter',()=>{ peekArt.textContent=a.dataset.peek; peek.style.background=a.dataset.bg; peekLbl.textContent=a.dataset.lbl; peek.classList.add('on'); });
    a.addEventListener('pointerleave',()=>peek.classList.remove('on'));
  }
  a.addEventListener('click', e=>{ e.preventDefault(); openCase(a.dataset.case, a); });
});
// in-page links: smooth scroll, close the case first when asked, preselect a service type
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="#"]'); if (!a || a.dataset.case) return;
  const id = a.getAttribute('href').slice(1); const el = id ? document.getElementById(id) : null;
  if (!el && id !== 'top') return;
  e.preventDefault();
  if (a.dataset.type){ const r = document.getElementById(a.dataset.type); if (r) r.checked = true; }
  const go = () => scrollToEl(id==='top' ? 0 : el);
  if (a.hasAttribute('data-close')) closeCase(go); else go();
});
if (/^#case-[a-z]+$/.test(location.hash)) openCase(location.hash.slice(1), null);

/* ================= cursor + magnetic buttons ================= */
const cur = $('#cur'); let cx=innerWidth/2, cy=innerHeight/2, mx=cx, my=cy;
addEventListener('pointermove', e=>{ mx=e.clientX; my=e.clientY; tx=e.clientX+170; ty=e.clientY; });
$$('a,button,summary,.chips label').forEach(el=>{ el.addEventListener('pointerenter',()=>cur.classList.add('big')); el.addEventListener('pointerleave',()=>cur.classList.remove('big')); });
const magnets = $$('.magnet').map(el=>({el,x:0,y:0,tx:0,ty:0}));
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
  magnets.forEach(m=>{
    m.vx = (m.vx||0)*.78 + (m.tx-m.x)*.16; m.vy = (m.vy||0)*.78 + (m.ty-m.y)*.16;
    m.x += m.vx; m.y += m.vy; m.el.style.transform=`translate(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px)`;
  });
  requestAnimationFrame(tick);
})();

/* ================= inquiry form → drafted email ================= */
const T = EN ? {
  need:'Please fill in', name:'name', email:'a valid email', type:'what you need', msg:'the brief',
  subj:(t,w)=>`Quote request | ${t} | ${w}`, lines:['Name','Company / brand','Email','Need','Budget','Materials','Target date','Brief'], none:'—',
  copied:'Copied', sel:'Selected — press ⌘C / Ctrl+C', mailCopied:'Copied kevin@wake.com.tw', mailSel:'Selected — press ⌘C / Ctrl+C to copy'
} : {
  need:'還差：', name:'姓名', email:'正確的 Email', type:'需求類型', msg:'產品與需求',
  subj:(t,w)=>`詢價｜${t}｜${w}`, lines:['姓名','公司／品牌','Email','需求類型','預算範圍','素材','希望交期','產品與需求'], none:'—',
  copied:'已複製', sel:'已選取，按 ⌘C／Ctrl+C 複製', mailCopied:'已複製 kevin@wake.com.tw', mailSel:'已選取，按 ⌘C／Ctrl+C 複製'
};
function copyText(text, selectEl, out, okMsg, selMsg){
  const sel = () => { const r=document.createRange(); r.selectNodeContents(selectEl); const s=getSelection(); s.removeAllRanges(); s.addRange(r); out.textContent = selMsg; };
  try { navigator.clipboard.writeText(text).then(()=>out.textContent = okMsg).catch(sel); } catch(e){ sel(); }
}
const form = $('#inq'), err = $('#inqErr'), outBox = $('#inqOut'), outText = $('#inqText'), outMail = $('#inqMail');
form.addEventListener('submit', e=>{
  e.preventDefault();
  const f = new FormData(form), v = k => (f.get(k)||'').toString().trim();
  const miss = [];
  if (!v('name')) miss.push(T.name);
  if (!$('#f-mail').value || !$('#f-mail').checkValidity()) miss.push(T.email);
  if (!v('type')) miss.push(T.type);
  if (!v('msg')) miss.push(T.msg);
  if (miss.length){ err.textContent = EN ? `${T.need}: ${miss.join(', ')}.` : `${T.need}${miss.join('、')}。`; return; }
  err.textContent = '';
  const vals = [v('name'), v('company')||T.none, v('email'), v('type'), v('budget')||T.none, v('assets')||T.none, v('date')||T.none, v('msg')];
  const body = T.lines.map((l,i)=> i===7 ? `\n${l}:\n${vals[i]}` : `${l}: ${vals[i]}`).join('\n');
  const subject = T.subj(v('type'), v('company')||v('name'));
  outText.textContent = `${EN?'Subject':'主旨'}: ${subject}\n\n${body}`;
  outMail.href = `mailto:kevin@wake.com.tw?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  outBox.hidden = false; scrollToEl(outBox);
});
$('#inqCopy').addEventListener('click', ()=>copyText(outText.textContent, outText, $('#inqCopied'), T.copied, T.sel));
$('#copyBtn').addEventListener('click', ()=>copyText('kevin@wake.com.tw', $('#mail'), $('#copied'), T.mailCopied, T.mailSel));

/* ================= Taipei clock ================= */
const clock = $('#clock');
const fmt = new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
setInterval(()=>clock.textContent=fmt.format(new Date()),1000); clock.textContent=fmt.format(new Date());

emitScroll();
})();
