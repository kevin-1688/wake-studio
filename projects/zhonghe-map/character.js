// 中和島 — 我的角色 + 街上的小人
// Uses globals from map3d.js: THREE, scene, v3, TOP, inside, clipRuns, GEO, ITEMS, PLACED,
// select, flyTo, VIEWS, camera, controls, stage, addLabel, TICKS, reduceMotion, card.
(function(){
  const $=s=>document.querySelector(s);
  const flatM=c=>new THREE.MeshStandardMaterial({color:c,roughness:.85,flatShading:true});

  // ---------------------------------------------------------------- crowd
  const runs=[];GEO.roads.forEach(r=>{if(r.r>3)return;clipRuns(r.p).forEach(p=>{let L=0;const cum=[0];for(let i=1;i<p.length;i++){L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);cum.push(L)}if(L>40)runs.push({p,cum,L})})});
  const N=Math.min(90,runs.length*3);
  const SHIRTS=[0xe0693a,0x3b7fa8,0xf5f1e8,0x7bb07a,0xe4b363,0xb9573a,0x6f8fa6,0xd8d0c4,0x8b6fb5].map(c=>new THREE.Color(c));
  const SKINS=[0xf1c9a5,0xe0b088,0xc99470,0xf6d6bc].map(c=>new THREE.Color(c));
  const bodyI=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.25,1.45,4.4,6),flatM(0xffffff),N);
  const headI=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.35,0),flatM(0xffffff),N);
  const legI=new THREE.InstancedMesh(new THREE.BoxGeometry(1.9,2.2,1.1),flatM(0x3b4a5a),N);
  bodyI.castShadow=headI.castShadow=true;
  let sd=11;const rnd=()=>{sd=(sd*16807)%2147483647;return (sd-1)/2147483646};
  const walkers=[];
  for(let i=0;i<N;i++){const run=runs[Math.floor(rnd()*runs.length)];walkers.push({run,s:rnd()*run.L,dir:rnd()<.5?1:-1,v:5+rnd()*7,off:(rnd()<.5?-1:1)*(2+rnd()*1.5),ph:rnd()*6,pause:0});
    bodyI.setColorAt(i,SHIRTS[Math.floor(rnd()*SHIRTS.length)]);headI.setColorAt(i,SKINS[Math.floor(rnd()*SKINS.length)])}
  scene.add(bodyI,headI,legI);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1,1,1),P=new THREE.Vector3(),E=new THREE.Euler();
  function at(run,s){let i=1;while(i<run.cum.length-1&&run.cum[i]<s)i++;const a=run.p[i-1],b=run.p[i],seg=(run.cum[i]-run.cum[i-1])||1,t=Math.max(0,Math.min(1,(s-run.cum[i-1])/seg));return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,b[0]-a[0],b[1]-a[1]]}
  const crowd={on:true};
  TICKS.push((dt,t)=>{
    bodyI.visible=headI.visible=legI.visible=crowd.on;if(!crowd.on)return;
    walkers.forEach((w,i)=>{
      if(!reduceMotion){if(w.pause>0)w.pause-=dt;else{w.s+=w.dir*w.v*dt;if(w.s<0||w.s>w.run.L){w.dir*=-1;w.s=Math.max(0,Math.min(w.run.L,w.s));if(rnd()<.3)w.pause=1+rnd()*3}}}
      const [x,y,dx,dy]=at(w.run,w.s);const len=Math.hypot(dx,dy)||1;const nx=-dy/len*w.off,ny=dx/len*w.off;
      const base=v3([x+nx,y+ny],TOP);const moving=w.pause<=0&&!reduceMotion;const bob=moving?Math.abs(Math.sin(t*9+w.ph))*.5:0;
      E.set(0,Math.atan2(dx*w.dir,dy*w.dir),0);Q.setFromEuler(E);
      P.set(base.x,base.y+1.1,base.z);S.set(1,moving?1-Math.abs(Math.sin(t*9+w.ph))*.25:1,1);M.compose(P,Q,S);legI.setMatrixAt(i,M);S.set(1,1,1);
      P.set(base.x,base.y+4.4+bob,base.z);M.compose(P,Q,S);bodyI.setMatrixAt(i,M);
      P.set(base.x,base.y+7.6+bob,base.z);M.compose(P,Q,S);headI.setMatrixAt(i,M);
    });
    bodyI.instanceMatrix.needsUpdate=headI.instanceMatrix.needsUpdate=legI.instanceMatrix.needsUpdate=true;
  });

  // ---------------------------------------------------------------- my character
  const ROLES={
    "中和居民":{shirt:"#e0693a",pants:"#3b4a5a",acc:"無"},
    "上班族":{shirt:"#f7f4ee",pants:"#2b3445",acc:"眼鏡"},
    "通勤族":{shirt:"#4f8fbf",pants:"#3a3f48",acc:"背包"},
    "學生":{shirt:"#f5f1e8",pants:"#2c4a7a",acc:"背包"},
    "家長":{shirt:"#7bb07a",pants:"#4a4a52",acc:"無"},
    "長者":{shirt:"#b9946a",pants:"#5a5248",acc:"帽子",hairColor:"#d9d4cc"},
    "夜市攤商":{shirt:"#d1453b",pants:"#2f2f35",acc:"帽子"},
    "登山客":{shirt:"#3f8f6a",pants:"#5b4b3a",acc:"背包"},
  };
  const HAIRS=["短髮","長髮","馬尾","鮑伯頭","光頭"];
  const HAIRC=["#2b2420","#5a3a26","#8a5a32","#c9a26b","#d9d4cc","#b5452f"];
  const SKINC=["#f6d6bc","#f1c9a5","#e0b088","#c99470","#9c6b4c"];
  const SHIRTC=["#e0693a","#f7f4ee","#4f8fbf","#7bb07a","#e4b363","#d1453b","#8b6fb5","#3f8f6a","#2b2622"];
  const ACCS=["無","眼鏡","帽子","背包"];
  const NAME_MAX=8;
  const KEY="zh-island-character";
  let cfg=null;try{cfg=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
  const fresh=()=>({name:"",role:"中和居民",hair:"短髮",hairColor:HAIRC[0],skin:SKINC[1],...ROLES["中和居民"]});
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};

  let me=null,meLabel=null;const pos={x:0,y:0},path=[];let walking=false,follow=false,onArrive=null,heading=0;
  function build(c){
    const g=new THREE.Group();const m=col=>flatM(new THREE.Color(col));
    const legs=[-0.85,0.85].map(x=>{const pv=new THREE.Group();pv.position.set(x,4.2,0);const l=new THREE.Mesh(new THREE.BoxGeometry(1.4,4.2,1.5),m(c.pants));l.position.y=-2.1;l.castShadow=true;pv.add(l);g.add(pv);return pv});
    const body=new THREE.Mesh(new THREE.BoxGeometry(3.8,4.4,2.3),m(c.shirt));body.position.y=6.4;body.castShadow=true;g.add(body);
    const arms=[-2.45,2.45].map(x=>{const pv=new THREE.Group();pv.position.set(x,8.2,0);const a=new THREE.Mesh(new THREE.BoxGeometry(1.05,3.9,1.1),m(c.shirt));a.position.y=-1.8;a.castShadow=true;const h=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),m(c.skin));h.position.y=-4.1;pv.add(a,h);g.add(pv);return pv});
    const head=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3,1),m(c.skin));head.position.y=11.1;head.castShadow=true;g.add(head);
    const dark=m("#2b2622");[-0.75,0.75].forEach(x=>{const e=new THREE.Mesh(new THREE.BoxGeometry(.38,.6,.2),dark);e.position.set(x,11.4,2.15);g.add(e)});
    const mouth=new THREE.Mesh(new THREE.BoxGeometry(.9,.22,.2),m("#b5452f"));mouth.position.set(0,10.25,2.15);g.add(mouth);
    const hm=m(c.hairColor);
    if(c.hair!=="光頭"){const cap=new THREE.Mesh(new THREE.SphereGeometry(2.45,10,6,0,Math.PI*2,0,Math.PI*.52),hm);cap.position.y=11.35;cap.rotation.x=-.18;cap.castShadow=true;g.add(cap)}
    if(c.hair==="長髮"){const b=new THREE.Mesh(new THREE.BoxGeometry(4.4,4.8,1.3),hm);b.position.set(0,9.9,-1.7);g.add(b)}
    if(c.hair==="馬尾"){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,0),hm);b.position.set(0,11.6,-2.9);g.add(b);const b2=new THREE.Mesh(new THREE.BoxGeometry(.9,2.4,.9),hm);b2.position.set(0,10.2,-3.1);g.add(b2)}
    if(c.hair==="鮑伯頭"){const b=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.75,2.6,10,1,true),hm);b.position.y=10.7;b.material.side=THREE.DoubleSide;g.add(b)}
    if(c.acc==="眼鏡"){const gl=new THREE.Mesh(new THREE.BoxGeometry(3.6,.7,.25),dark);gl.position.set(0,11.45,2.3);g.add(gl)}
    if(c.acc==="帽子"){const br=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,.35,14),m("#e8d9b5"));br.position.y=12.9;const tp=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.4,1.9,14),m("#e8d9b5"));tp.position.y=13.9;br.castShadow=tp.castShadow=true;g.add(br,tp)}
    if(c.acc==="背包"){const bp=new THREE.Mesh(new THREE.BoxGeometry(2.9,3.4,1.4),m("#6d5a48"));bp.position.set(0,6.8,-1.85);bp.castShadow=true;g.add(bp)}
    const ring=new THREE.Mesh(new THREE.RingGeometry(3.6,4.6,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.4;g.add(ring);
    g.userData={legs,arms,body,head};g.scale.setScalar(1.05);return g;
  }
  function placeMe(){
    if(me)scene.remove(me);me=build(cfg);scene.add(me);
    const b=v3([pos.x,pos.y],TOP);me.position.copy(b);me.rotation.y=heading;
    if(!meLabel){meLabel=addLabel("",new THREE.Vector3(),"me");}
    meLabel.el.textContent=cfg.name||"我";
  }
  // spawn near the island's centre on a walkable spot
  function spawn(){const c=[[470,380],[500,420],[430,330],[520,300]].find(p=>inside(p[0],p[1]))||[500,420];pos.x=c[0];pos.y=c[1]}

  function lineInside(a,b){for(let k=1;k<20;k++){const t=k/20;if(!inside(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false}return true}
  function walkTo(x,y,cb){
    path.length=0;const from=[pos.x,pos.y],to=[x,y];
    if(!lineInside(from,to)){const hub=[480,400];if(lineInside(from,hub))path.push(hub)}
    path.push(to);walking=true;onArrive=cb||null;
  }
  const SPEED=48;
  TICKS.push((dt,t)=>{
    if(!me)return;const u=me.userData;
    if(walking&&path.length){
      const [tx,ty]=path[0],dx=tx-pos.x,dy=ty-pos.y,d=Math.hypot(dx,dy),step=SPEED*dt;
      heading=Math.atan2(dx,dy);
      if(d<=step){pos.x=tx;pos.y=ty;path.shift();if(!path.length){walking=false;const cb=onArrive;onArrive=null;cb&&cb()}}
      else{pos.x+=dx/d*step;pos.y+=dy/d*step}
    }
    const prev=me.position.clone();const b=v3([pos.x,pos.y],TOP);me.position.copy(b);
    let dr=heading-me.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));me.rotation.y+=dr*Math.min(1,dt*10);
    const sw=walking&&!reduceMotion?Math.sin(t*11):0;
    u.legs[0].rotation.x=sw*.6;u.legs[1].rotation.x=-sw*.6;u.arms[0].rotation.x=-sw*.55;u.arms[1].rotation.x=sw*.55;
    me.position.y+=walking&&!reduceMotion?Math.abs(Math.sin(t*11))*.6:Math.sin(t*2)*.15;
    meLabel.p.set(me.position.x,me.position.y+19,me.position.z);
    if(follow){const d=me.position.clone().sub(prev);controls.target.add(d);camera.position.add(d);
      const off=me.position.clone().sub(controls.target);off.y=0;if(off.length()>2){const k=Math.min(1,dt*2.5);controls.target.addScaledVector(off,k);camera.position.addScaledVector(off,k)}}
  });

  // ---------------------------------------------------------------- UI
  const ui=document.createElement("div");
  ui.innerHTML=`
  <section class="ch-panel" id="ch-panel" hidden aria-label="我的角色">
    <header><div><div class="ch-k">MY CHARACTER</div><h2>我的角色</h2></div><button type="button" class="ch-x" id="ch-close" aria-label="關閉">×</button></header>
    <div class="ch-body">
      <label class="ch-f"><span>名字</span><input id="ch-name" maxlength="${NAME_MAX}" placeholder="例如：南勢角阿凱" autocomplete="nickname"></label>
      <div class="ch-f"><span>身分</span><div class="ch-chips" id="ch-role"></div><small>切換身分會套用預設衣著與配件，之後都能自己改</small></div>
      <div class="ch-f"><span>髮型</span><div class="ch-chips" id="ch-hair"></div></div>
      <div class="ch-f"><span>髮色</span><div class="ch-sw" id="ch-hairc"></div></div>
      <div class="ch-f"><span>膚色</span><div class="ch-sw" id="ch-skin"></div></div>
      <div class="ch-f"><span>上衣</span><div class="ch-sw" id="ch-shirt"></div></div>
      <div class="ch-f"><span>配件</span><div class="ch-chips" id="ch-acc"></div></div>
    </div>
    <footer><button type="button" class="ch-btn ghost" id="ch-rand">隨機</button><button type="button" class="ch-btn" id="ch-done">完成，開始逛島</button></footer>
  </section>
  <div class="ch-bar" id="ch-bar" hidden>
    <button type="button" class="ch-me" id="ch-edit"><span class="ch-dot"></span><b id="ch-bar-name">我</b><small>編輯</small></button>
    <button type="button" id="ch-tour">▶ 帶我逛政見</button>
    <button type="button" id="ch-follow" aria-pressed="false">跟著我</button>
    <button type="button" id="ch-photo">拍照</button>
    <button type="button" id="ch-crowd" aria-pressed="true">路人</button>
  </div>
  <div class="ch-hint" id="ch-hint" hidden>點島上任何地方，角色就會走過去</div>
  <div class="ch-tour" id="ch-tourbar" hidden><span id="ch-tour-t"></span><button type="button" id="ch-next">下一站 →</button><button type="button" id="ch-stop">結束</button></div>`;
  $(".world").appendChild(ui);

  const chips=(id,opts,key)=>{const box=$(id);box.textContent="";opts.forEach(o=>{const b=document.createElement("button");b.type="button";b.textContent=o;b.setAttribute("aria-pressed",cfg[key]===o);b.addEventListener("click",()=>{if(key==="role"){Object.assign(cfg,{role:o,hairColor:cfg.hairColor,...ROLES[o]});}else cfg[key]=o;refresh()});box.appendChild(b)})};
  const swatches=(id,opts,key)=>{const box=$(id);box.textContent="";opts.forEach(o=>{const b=document.createElement("button");b.type="button";b.style.background=o;b.setAttribute("aria-label",key+" "+o);b.setAttribute("aria-pressed",cfg[key]===o);b.addEventListener("click",()=>{cfg[key]=o;refresh()});box.appendChild(b)})};
  function refresh(){
    chips("#ch-role",Object.keys(ROLES),"role");chips("#ch-hair",HAIRS,"hair");chips("#ch-acc",ACCS,"acc");
    swatches("#ch-hairc",HAIRC,"hairColor");swatches("#ch-skin",SKINC,"skin");swatches("#ch-shirt",SHIRTC,"shirt");
    placeMe();save();
  }
  $("#ch-name").addEventListener("input",e=>{cfg.name=e.target.value.slice(0,NAME_MAX);if(meLabel)meLabel.el.textContent=cfg.name||"我";$("#ch-bar-name").textContent=cfg.name||"我";save()});
  $("#ch-rand").addEventListener("click",()=>{const pick=a=>a[Math.floor(Math.random()*a.length)];const role=pick(Object.keys(ROLES));Object.assign(cfg,{role,...ROLES[role],hair:pick(HAIRS),hairColor:pick(HAIRC),skin:pick(SKINC),shirt:pick(SHIRTC),acc:pick(ACCS)});refresh()});
  function lookAtMe(){const b=me.position;const narrow=stage.clientWidth<600;flyTo(new THREE.Vector3(b.x+70,b.y+(narrow?150:110),b.z+(narrow?170:130)),new THREE.Vector3(b.x,b.y+6,b.z))}
  function openPanel(){
    if(!cfg){cfg=fresh();spawn()}else if(!pos.x)spawn();
    $("#ch-name").value=cfg.name||"";refresh();$("#ch-panel").hidden=false;$("#ch-bar").hidden=true;card.hidden=true;lookAtMe();
  }
  function done(){$("#ch-panel").hidden=true;$("#ch-bar").hidden=false;$("#ch-bar-name").textContent=cfg.name||"我";window.GroundClick=(x,y)=>{if(!tour.on)walkTo(x,y)};
    const h=$("#ch-hint");h.hidden=false;setTimeout(()=>h.hidden=true,4000)}
  $("#v-char").addEventListener("click",openPanel);
  $("#ch-close").addEventListener("click",()=>{if(me)done();else $("#ch-panel").hidden=true});
  $("#ch-done").addEventListener("click",done);
  $("#ch-edit").addEventListener("click",openPanel);
  const fb=$("#ch-follow");fb.addEventListener("click",()=>{follow=!follow;fb.setAttribute("aria-pressed",follow);if(follow)lookAtMe()});
  const cb=$("#ch-crowd");cb.addEventListener("click",()=>{crowd.on=!crowd.on;cb.setAttribute("aria-pressed",crowd.on)});

  // ---------------- tour: walk to each 2026 policy flag
  const stops=ITEMS.filter(i=>i.kind==="plan");
  const tour={on:false,i:0};
  function goStop(){
    const it=stops[tour.i];$("#ch-tour-t").textContent=`行程 ${tour.i+1}/${stops.length}｜走向 ${it.short}…`;
    card.hidden=true;follow=true;fb.setAttribute("aria-pressed","true");
    const [x,y]=PLACED[it.id];const ang=Math.atan2(pos.y-y,pos.x-x);const tx=x+Math.cos(ang)*16,ty=y+Math.sin(ang)*16;
    walkTo(inside(tx,ty)?tx:x,inside(tx,ty)?ty:y,()=>{if(!tour.on)return;follow=false;fb.setAttribute("aria-pressed","false");heading=Math.atan2(x-pos.x,y-pos.y);
      select(it.id);$("#ch-tour-t").textContent=`行程 ${tour.i+1}/${stops.length}｜${it.title}`;$("#ch-next").textContent=tour.i<stops.length-1?"下一站 →":"完成行程"});
  }
  $("#ch-tour").addEventListener("click",()=>{if(!me)return;tour.on=true;tour.i=0;$("#ch-tourbar").hidden=false;$("#ch-bar").hidden=true;$("#ch-next").textContent="下一站 →";goStop()});
  $("#ch-next").addEventListener("click",()=>{if(tour.i<stops.length-1){tour.i++;goStop()}else stopTour()});
  function stopTour(){tour.on=false;path.length=0;walking=false;follow=false;fb.setAttribute("aria-pressed","false");$("#ch-tourbar").hidden=true;$("#ch-bar").hidden=false;card.hidden=true}
  $("#ch-stop").addEventListener("click",stopTour);

  // ---------------- photo: render the current view and save it with a caption
  $("#ch-photo").addEventListener("click",()=>{
    const r=renderer;r.render(scene,camera);const src=r.domElement;
    const w=src.width,h=src.height,band=Math.round(h*.11);
    const c=document.createElement("canvas");c.width=w;c.height=h+band;const x=c.getContext("2d");
    x.drawImage(src,0,0);x.fillStyle="#fbf8f2";x.fillRect(0,h,w,band);
    const fs=Math.round(band*.32);x.fillStyle="#2b2622";x.font=`900 ${fs}px "Noto Sans TC",sans-serif`;x.textBaseline="middle";
    x.fillText(`${cfg.name||"我"} 在中和島`,Math.round(band*.4),h+band*.38);
    x.fillStyle="#e0693a";x.font=`700 ${Math.round(fs*.62)}px "Noto Sans TC",sans-serif`;x.fillText("中和慧更豪｜問政藍圖 · 新北市議員候選人 張志豪",Math.round(band*.4),h+band*.72);
    c.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="zhonghe-island.png";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)},"image/png");
  });

  // restore a saved character
  if(cfg){spawn();placeMe();done();$("#ch-hint").hidden=true}
})();
