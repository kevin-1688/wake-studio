const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];
const BUDGET=10;
const FURNACE_NEED=24;
const FOOD_NEED=6;
const CATS=[
  {k:'fest',name:'🎉 購物節・宣傳',max:10,hint:'聲量立刻上升。市長海報會掛滿全市。'},
  {k:'inc', name:'🏭 焚化爐・垃圾去化',max:5,hint:'減緩垃圾山增長；累積 '+FURNACE_NEED+' 點文山新爐完工。開工前沒人會注意。'},
  {k:'blue',name:'🚇 捷運藍線',max:4,hint:'工程有物理極限，每年最多推進 4 點。'},
  {k:'food',name:'🥬 廚餘・防疫整備',max:3,hint:'平常完全看不出效果。'},
];
const STAGES=[
  [0,'紙上談兵'],[5,'綜合規劃送審'],[11,'中央核定'],[17,'機電開工'],[23,'土建動工'],[30,'高架段架設'],[40,'通車']
];
const HEADLINES={
  2019:'盧秀燕就任台中市長｜首屆台中購物節登場',
  2020:'第二屆台中購物節舉辦',
  2021:'購物節代言費約 220 萬元，議員批代言人鮮少出席',
  2022:'盧秀燕連任台中市長',
  2023:'第五屆台中購物節舉辦',
  2024:'1 月 行政院核定藍線綜合規劃，總經費 1615 億元',
  2025:'6 月 藍線機電開工｜7 月 大里掩埋場暫置 38.5 萬噸｜10 月 梧棲爆發非洲豬瘟',
  2026:'購物節等 3.97 億預算遭委員會凍結｜大里垃圾打包送文山喊卡｜8 月 藍線高架段動工',
};
const EVENTS={
  2019:()=>({title:'文山焚化廠老舊',body:'文山焚化廠已運轉二十多年，處理量一年比一年少。汰舊換新要好幾年，開工前不會有人注意，開工時倒是會有人抗議。',choices:[
    {t:'立刻啟動汰舊換新',d:'焚化爐進度 +4｜鄰避抗議：聲量 −2',f:s=>{s.inc+=4;s.approval-=2}},
    {t:'先修修補補，錢留給新政',d:'聲量 +3',f:s=>{s.approval+=3}}]}),
  2020:()=>({title:'疫情來了，要振興經濟',body:'店家生意一落千丈。幕僚說：購物節抽汽車、抽黃金，媒體一定會報。',choices:[
    {t:'購物節加碼，大獎抽好抽滿',d:'聲量 +6',f:s=>{s.approval+=6}},
    {t:'把錢拿去趕藍線前置作業',d:'藍線進度 +3',f:s=>{s.blue+=3}}]}),
  2021:()=>({title:'藍線綜合規劃要送中央',body:'經費怎麼估、中央跟市府各出多少，報告裡要寫清楚。寫得越清楚，數字越難看。',choices:[
    {t:'先估低一點，比較好過關',d:'藍線進度 +4｜但日後可能追加經費',f:s=>{s.blue+=4;s.lowball=true}},
    {t:'誠實估算，把財源講清楚',d:'藍線進度 +2',f:s=>{s.blue+=2}}]}),
  2022:()=>({title:'選舉年',body:'年底就要投票。幕僚建議再加辦一個鍋烤節，路燈旗印市長照片，「市長代言不用錢」。',choices:[
    {t:'加辦！旗子掛滿每一根路燈',d:'聲量 +6',f:s=>{s.approval+=6;s.festTotal+=3}},
    {t:'不加辦，照原計畫',d:'沒有變化',f:()=>{}}]}),
  2023:s=>({title:'大里掩埋場越堆越高',body:`大里掩埋場原本只是暫置場，現在堆了 ${fmt(s.garbage)} 萬噸。議員帶記者去拍照。`,choices:[
    {t:'跨縣市協調，拜託外縣市焚化廠代燒',d:'垃圾 −4 萬噸｜到處低頭：聲量 −1',f:s=>{s.garbage=Math.max(0,s.garbage-4);s.approval-=1}},
    {t:'對外強調「有進有出」',d:'聲量 +1',f:s=>{s.approval+=1}}]}),
  2024:s=>s.lowball?({title:'藍線經費暴增',body:'當初估太低，中央要求補件，機電標預算一路往上修。',choices:[
    {t:'追加預算硬推',d:'藍線進度 +1｜議會砲轟：聲量 −3',f:s=>{s.blue+=1;s.approval-=3}},
    {t:'縮減規格先求有',d:'藍線進度 −3',f:s=>{s.blue=Math.max(0,s.blue-3)}}]})
    :({title:'藍線審查順利',body:'財源寫得清楚，中央審查沒有卡關。',choices:[
    {t:'繼續推進',d:'藍線進度 +2',f:s=>{s.blue+=2}}]}),
  2025:s=>s.food>=FOOD_NEED?({title:'非洲豬瘟爆發',body:'梧棲養豬場驗出全台首例非洲豬瘟，中央禁止廚餘養豬，每天幾百噸廚餘突然沒地方去。還好你早就備好了去化路線。',choices:[
    {t:'廚餘照計畫直送處理設施',d:'沒有廚餘湖',f:s=>{s.approval+=2}}]})
    :({title:'非洲豬瘟爆發',body:'梧棲養豬場驗出全台首例非洲豬瘟，中央禁止廚餘養豬，每天幾百噸廚餘突然沒地方去。你沒有備案。',choices:[
    {t:'先倒進掩埋場的坑裡，蓋土',d:'出現「廚餘湖」｜網友命名：聲量 −8',f:s=>{s.lake=true;s.approval-=8}},
    {t:'全部塞進焚化爐',d:'一般垃圾被擠出來：垃圾 +4 萬噸｜聲量 −3',f:s=>{s.garbage+=4;s.approval-=3}}]}),
  2026:s=>s.furnace?({title:'最後一年',body:'文山新爐已經在燒了。大里的垃圾一車一車運走。',choices:[
    {t:'加速清運',d:'垃圾 −3 萬噸',f:s=>{s.garbage=Math.max(0,s.garbage-3)}}]})
    :({title:'垃圾打包，要送去哪？',body:`大里的垃圾打包成太空包，原本要運去文山掩埋場暫置，文山居民出來抗議。大里還有 ${fmt(s.garbage)} 萬噸。`,choices:[
    {t:'「庸人自擾」，放在大里就好，等新爐',d:'沒有變化',f:()=>{}},
    {t:'跨縣市去化，自己出面協調',d:'垃圾 −3 萬噸｜聲量 −2',f:s=>{s.garbage=Math.max(0,s.garbage-3);s.approval-=2}}]}),
};

let S,phase,yi,alloc,lastFest,result,lostElection;
function newGame(){
  S={approval:55,garbage:3,inc:0,blue:0,food:0,furnace:false,furnaceYear:null,lake:false,lowball:false,festTotal:0,history:[]};
  yi=0;phase='intro';alloc=blankAlloc();lastFest=0;result=null;lostElection=false;
  render();
}
const blankAlloc=()=>({fest:0,inc:0,blue:0,food:0});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.round(n*10)/10;
const stageIdx=b=>{let i=0;STAGES.forEach((s,j)=>{if(b>=s[0])i=j});return i};
const stageName=b=>STAGES[stageIdx(b)][1];
const year=()=>YEARS[yi];
const used=()=>Object.values(alloc).reduce((a,b)=>a+b,0);

function chooseEvent(c){
  S.stageAtYearStart=stageIdx(S.blue);
  c.f(S);S.approval=clamp(S.approval,0,100);
  phase='budget';alloc=blankAlloc();render();
}

function runYear(){
  const a=alloc,notes=[],b4={approval:S.approval,garbage:S.garbage,blue:S.blue};
  const festGain=a.fest*1.8;
  S.approval+=festGain-6;
  S.festTotal+=a.fest;
  if(a.fest>=6)notes.push('購物節記者會、抽獎、海報、路燈旗，全市都看得到你。');
  else if(a.fest===0)notes.push('今年沒辦購物節，媒體版面被別人搶走。');
  notes.push('市民健忘：聲量自然流失 6。');
  S.inc+=a.inc;
  let growth;
  if(!S.furnace&&S.inc>=FURNACE_NEED){S.furnace=true;S.furnaceYear=year();S.approval+=4;notes.push('🏭 文山新爐完工點火！大里垃圾開始減少。')}
  growth=S.furnace?-8:Math.max(1,6-0.6*a.inc);
  S.garbage=Math.max(0,S.garbage+growth);
  if(!S.furnace)notes.push(`焚化量不足，大里掩埋場又多了 ${fmt(growth)} 萬噸（新爐進度 ${S.inc}/${FURNACE_NEED}）。`);
  const st0=S.stageAtYearStart??stageIdx(S.blue);
  S.blue+=a.blue;
  const st1=stageIdx(S.blue);
  if(st1>st0){S.approval+=2*(st1-st0);notes.push(`🚇 藍線進入「${STAGES[st1][1]}」，剪綵拍照。`)}
  else if(a.blue===0)notes.push('藍線今年原地踏步。');
  S.food+=a.food;
  if(a.food>0&&yi<6)notes.push(`廚餘整備 ${Math.min(S.food,FOOD_NEED)}/${FOOD_NEED}：沒人注意到，也沒人感謝你。`);
  if(S.garbage>=30){S.approval-=3;notes.push('🗑️ 垃圾山登上新聞空拍畫面：聲量 −3。')}
  S.approval=clamp(S.approval,0,100);
  lastFest=a.fest;
  S.history.push({year:year(),...a});
  result={notes,d:{approval:S.approval-b4.approval,garbage:S.garbage-b4.garbage,blue:S.blue-b4.blue}};
  if(year()===2022&&S.approval<45)lostElection=true;
  phase='result';render();
}

function next(){
  if(lostElection||yi===YEARS.length-1){phase='end';render();return}
  yi++;phase='event';render();
}

// ---------- rendering ----------
function renderMeters(){
  const el=document.getElementById('meters');
  if(phase==='intro'){el.innerHTML='';return}
  el.innerHTML=`<span class="meter">📅 <b>${year()}</b> 第 ${yi+1}/8 年</span>
  <span class="meter">📣 聲量 <b>${Math.round(S.approval)}</b><span class="bar"><i style="width:${S.approval}%"></i></span></span>
  <span class="meter">🗑️ 大里 <b>${fmt(S.garbage)}</b> 萬噸</span>
  <span class="meter">🚇 <b>${stageName(S.blue)}</b></span>`;
}
function renderTicker(){
  const el=document.getElementById('ticker');
  el.innerHTML=phase==='intro'?'<span>現實中</span>2018 年 12 月 25 日，台中市長就職'
    :phase==='end'?'<span>現實中</span>2026 年 12 月，八年任期結束'
    :`<span>現實中的 ${year()}</span>${HEADLINES[year()]}`;
  el.title=el.textContent;
}

// fixed pseudo-random points for trash bags
const BAGS=(()=>{let x=7,out=[];const r=()=>(x=(x*16807)%2147483647)/2147483647;
  for(let i=0;i<160;i++){const v=Math.sqrt(r())*0.92;const u=(r()*2-1)*(1-v);out.push([u,1-v,r()])}
  return out.sort((a,b)=>b[1]-a[1])})();
const BLDGS=[[250,34,70],[288,26,95],[318,40,60],[470,30,85],[504,44,120],[552,28,75],[584,36,100],[624,30,66],[660,42,110],[706,30,80],[740,40,95]];

function renderScene(){
  const s=S,fest=phase==='budget'?alloc.fest:(phase==='intro'?0:lastFest);
  let h=`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient></defs>
  <rect width="800" height="360" fill="url(#sky)"/>
  <path d="M0 236 Q110 196 230 220 T470 208 T800 226 V360 H0Z" style="fill:var(--hill)"/>`;
  // swallow
  h+=`<g class="swallow"><path d="M0 60 q10 -8 20 0 q-6 -2 -10 6 q-4 -8 -10 -6z M10 60 l-4 10 l4 -4 l4 4z" style="fill:var(--ink)" opacity=".7"/></g>`;
  // skyline + posters
  const posters=Math.min(BLDGS.length,Math.floor(s.festTotal/4));
  BLDGS.forEach(([x,w,hh],i)=>{
    h+=`<rect x="${x}" y="${292-hh}" width="${w}" height="${hh}" style="fill:${i%2?'var(--bldg)':'var(--bldg2)'}"/>`;
    for(let wy=292-hh+8;wy<284;wy+=12)for(let wx=x+5;wx<x+w-6;wx+=9)h+=`<rect x="${wx}" y="${wy}" width="4" height="5" fill="#fff" opacity=".25"/>`;
    if(i<posters){const px=x+w/2-11,py=292-hh+10;
      h+=`<rect x="${px}" y="${py}" width="22" height="30" rx="2" style="fill:var(--accent)"/><circle cx="${px+11}" cy="${py+11}" r="6" fill="#fff"/><path d="M${px+5} ${py+27} q6 -8 12 0z" fill="#fff"/>`}
  });
  // ground
  h+=`<rect y="290" width="800" height="70" style="fill:var(--ground)"/>`;
  // incinerator
  if(s.furnace){
    h+=`<rect x="370" y="236" width="60" height="56" rx="3" style="fill:var(--bldg2)"/><rect x="410" y="176" width="12" height="62" style="fill:var(--bldg)"/>
    <circle class="puff" cx="416" cy="170" r="7" fill="#fff" opacity=".7"/><circle class="puff" style="animation-delay:1s" cx="420" cy="166" r="6" fill="#fff" opacity=".7"/><circle class="puff" style="animation-delay:2s" cx="412" cy="168" r="6" fill="#fff" opacity=".7"/>
    <text x="400" y="306" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--ink)">文山新爐 ✓</text>`;
  }else{
    const p=Math.min(1,s.inc/FURNACE_NEED);
    h+=`<rect x="370" y="250" width="60" height="42" rx="3" style="fill:var(--bldg)" opacity=".75"/><rect x="380" y="214" width="9" height="38" style="fill:var(--bldg)" opacity=".75"/>
    <line x1="440" y1="292" x2="440" y2="${292-30-70*p}" stroke="#f59f00" stroke-width="3"/><line x1="440" y1="${292-30-70*p}" x2="${400}" y2="${292-30-70*p}" stroke="#f59f00" stroke-width="3"/>
    <rect x="370" y="${292-42*p}" width="${8}" height="${42*p}" fill="#f59f00" opacity=".6"/>
    <text x="400" y="306" text-anchor="middle" font-size="11" style="fill:var(--ink)">文山新爐 ${Math.round(p*100)}%</text>`;
  }
  // garbage mountain
  const g=s.garbage,cx=150,base=292,w=Math.min(290,40+g*4.6),gh=Math.min(200,6+g*3.6);
  if(g>0.2){
    h+=`<path d="M${cx-w/2} ${base} L${cx-w*.28} ${base-gh*.62} L${cx-w*.12} ${base-gh*.9} L${cx+w*.03} ${base-gh} L${cx+w*.2} ${base-gh*.72} L${cx+w*.36} ${base-gh*.35} L${cx+w/2} ${base}Z" style="fill:var(--trash4)"/>`;
    const n=Math.min(BAGS.length,Math.round(g*3.4)),cols=['var(--trash1)','var(--trash2)','var(--trash3)','var(--trash1)'];
    for(let i=0;i<n;i++){const[u,v,r]=BAGS[i];h+=`<circle cx="${cx+u*w/2*.95}" cy="${base-(1-v)*gh*.95}" r="${2.5+r*3}" style="fill:${cols[i%4]}"/>`}
    h+=`<line x1="${cx+w*.03}" y1="${base-gh}" x2="${cx+w*.03}" y2="${base-gh-22}" stroke="var(--ink)" style="stroke:var(--ink)" stroke-width="1.5"/>
    <rect x="${cx+w*.03}" y="${base-gh-22}" width="62" height="16" rx="2" style="fill:var(--bad)"/>
    <text x="${cx+w*.03+31}" y="${base-gh-10}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${fmt(g)} 萬噸</text>`;
  }
  h+=`<text x="${cx}" y="306" text-anchor="middle" font-size="11" style="fill:var(--ink)">大里掩埋場</text>`;
  // food lake
  if(s.lake){
    h+=`<ellipse cx="610" cy="304" rx="96" ry="13" style="fill:var(--lake)"/><ellipse cx="600" cy="302" rx="70" ry="8" style="fill:var(--lake2)"/>`;
    [[560,300],[600,304],[640,299],[620,306],[580,305]].forEach(([x,y],i)=>h+=`<circle class="bubble" style="animation-delay:${i*.4}s" cx="${x}" cy="${y}" r="3" fill="#c0b060" opacity=".8"/>`);
    h+=`<text x="610" y="326" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--ink)">廚餘湖</text>`;
  }
  // blue line
  const L=30,R=770,y=340,p=Math.min(1,s.blue/40),xe=L+(R-L)*p;
  h+=`<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke-width="4" stroke-dasharray="6 6" style="stroke:var(--muted)" opacity=".6"/>`;
  if(p>0)h+=`<line x1="${L}" y1="${y}" x2="${xe}" y2="${y}" stroke-width="6" style="stroke:var(--blue)"/>`;
  STAGES.forEach(([t])=>{const x=L+(R-L)*t/40;h+=`<circle cx="${x}" cy="${y}" r="4.5" style="fill:${s.blue>=t?'var(--blue)':'var(--card)'};stroke:var(--blue)" stroke-width="2"/>`});
  h+=`<g transform="translate(${Math.max(L,xe-34)},${y-17})"><rect width="38" height="13" rx="4" style="fill:var(--blue)"/><rect x="5" y="3" width="6" height="4" fill="#fff"/><rect x="15" y="3" width="6" height="4" fill="#fff"/><rect x="25" y="3" width="6" height="4" fill="#fff"/></g>`;
  h+=`<text x="${R}" y="${y-10}" text-anchor="end" font-size="11" style="fill:var(--ink)">藍線：${stageName(s.blue)}</text>`;
  // festival
  if(fest>0){
    const bw=150+fest*18;
    h+=`<rect x="${400-bw/2}" y="10" width="${bw}" height="${26+fest}" rx="5" style="fill:var(--accent)"/>
    <text x="400" y="${29+fest/2}" text-anchor="middle" font-size="${15+fest}" font-weight="900" style="fill:var(--accent-ink)">🎉 台中購物節 🎉</text>`;
    const spots=[[110,70],[690,64],[230,50],[570,48],[60,120],[750,118],[320,84],[480,86],[170,104],[640,104]];
    const colors=['#ff6b6b','#ffd43b','#69db7c','#4dabf7','#da77f2'];
    for(let i=0;i<fest;i++){const[x,yy]=spots[i];const c=colors[i%5];let rays='';
      for(let k=0;k<12;k++){const ang=k*Math.PI/6;rays+=`<line x1="${x}" y1="${yy}" x2="${x+Math.cos(ang)*24}" y2="${yy+Math.sin(ang)*24}" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`}
      h+=`<g class="fw" style="animation-delay:${(i*0.37)%1.8}s">${rays}</g>`}
  }
  document.getElementById('scene').innerHTML=h;
}

function renderPanel(){
  const el=document.getElementById('panel');
  if(phase==='intro'){
    el.innerHTML=`<div class="kicker">2018 年 12 月 25 日</div><h2>你宣誓就任台中市長。</h2>
    <p>接下來八年，每年有 <b>${BUDGET} 點</b>預算讓你分配。</p>
    <p>有些事，花了錢明天就上新聞；有些事，花了錢要好幾年才看得到；還有些事，要等出事了，大家才發現你沒做。</p>
    <p>2022 年底要選舉。<b>聲量低於 45</b>，你就沒有下一個四年。</p>
    <button class="btn" data-action="start">開始執政</button>`;
    return;
  }
  if(phase==='event'){
    const ev=EVENTS[year()](S);
    el.innerHTML=`<div class="kicker">${year()} 年・市政事件</div><h2>${ev.title}</h2><p>${ev.body}</p>
    <div class="choices">${ev.choices.map((c,i)=>`<button class="choice" data-i="${i}"><b>${c.t}</b><small>${c.d}</small></button>`).join('')}</div>`;
    el.querySelectorAll('.choice').forEach(b=>b.onclick=()=>chooseEvent(ev.choices[+b.dataset.i]));
    return;
  }
  if(phase==='budget'){
    const left=BUDGET-used();
    el.innerHTML=`<div class="kicker">${year()} 年・年度預算</div><h2>這一年的錢要花在哪？</h2>
    <div class="left">剩餘 <b>${left}</b> / ${BUDGET} 點</div>
    <div class="alloc">${CATS.map(c=>`<div class="row"><div class="name">${c.name}</div>
      <div class="stepper"><button data-k="${c.k}" data-d="-1" ${alloc[c.k]<=0?'disabled':''} aria-label="減少">−</button>
      <div class="pips">${Array.from({length:c.max},(_,i)=>`<i class="${i<alloc[c.k]?'on':''}"></i>`).join('')}</div>
      <button data-k="${c.k}" data-d="1" ${alloc[c.k]>=c.max||left<=0?'disabled':''} aria-label="增加">＋</button></div>
      <div class="hint">${c.hint}</div></div>`).join('')}</div>
    <button class="btn" id="go" ${left>0?'disabled':''}>${left>0?`還有 ${left} 點沒分配`:'執行年度預算'}</button>`;
    el.querySelectorAll('.stepper button').forEach(b=>b.onclick=()=>{alloc[b.dataset.k]+=+b.dataset.d;render()});
    el.querySelector('#go').onclick=runYear;
    return;
  }
  if(phase==='result'){
    const d=result.d,sg=(v,inv)=>v===0?'±0':`<span class="${(v>0)!==!!inv?'up':'down'}">${v>0?'+':''}${fmt(v)}</span>`;
    let extra='';
    if(year()===2022)extra=lostElection
      ?`<p class="down">🗳️ 開票結果：聲量只有 ${Math.round(S.approval)}，你落選了。</p>`
      :`<p class="up">🗳️ 開票結果：聲量 ${Math.round(S.approval)}，你連任了。</p>`;
    el.innerHTML=`<div class="kicker">${year()} 年・年終結算</div><h2>這一年過去了</h2>
    <p>聲量 ${sg(d.approval)}　大里垃圾 ${sg(d.garbage,true)} 萬噸　藍線進度 ${sg(d.blue)}</p>
    <ul class="notes">${result.notes.map(n=>`<li>${n}</li>`).join('')}</ul>${extra}
    <button class="btn" data-action="next">${lostElection||yi===YEARS.length-1?'看結局':`進入 ${year()+1} 年`}</button>`;
    return;
  }
  if(phase==='end')renderEnd(el);
}

function score(){
  const garbage=clamp((50-S.garbage)/50,0,1)*30;
  const furnace=S.furnace?15:clamp(S.inc/FURNACE_NEED,0,1)*7;
  const blue=clamp(S.blue/40,0,1)*35;
  const food=S.lake?0:(S.food>=FOOD_NEED?20:10);
  return Math.round(garbage+furnace+blue+food);
}

function verdictOf(){
  const ach=score(),ap=Math.round(S.approval);
  if(lostElection)return['一任市長','你把錢花在看不見的地方，選民也看不見你。繼任者接手了進行到一半的焚化爐和藍線，剪綵的人不會是你。'];
  if(ap>=60&&ach<50)return['購物節之城','你的照片掛滿了全市，垃圾也是。八年來每一年都很熱鬧，卸任那天，垃圾山和藍線的施工圍籬都還在。'];
  if(ap>=60)return['原來可以兼顧','購物節照辦，焚化爐也蓋了。原來這兩件事並不衝突，只是要從第一年就開始。'];
  if(ach>=50)return['默默蓋爐的人','新聞很少報你，但大里的垃圾在變少。這種市長通常不太有名。'];
  return['兩頭空','熱鬧沒辦起來，建設也沒做完。'];
}

function renderEnd(el){
  const ach=score(),ap=Math.round(S.approval);
  const [v,desc]=verdictOf();
  const festPts=S.history.reduce((a,h)=>a+h.fest,0),total=S.history.length*BUDGET;
  el.innerHTML=`<div class="kicker">${lostElection?'2022 年底・任期結束':'2026 年 12 月・八年任期結束'}</div>
  <div class="verdict">${v}</div><p>${desc}</p>
  <div class="scores"><div class="score"><div>📣 聲量</div><div class="num">${ap}</div></div>
  <div class="score"><div>🧱 實績</div><div class="num">${ach}</div><small>垃圾、焚化爐、藍線、廚餘加權</small></div></div>
  <h2 style="margin-top:18px">你 vs. 現實中的台中</h2>
  <table><thead><tr><th></th><th>你的台中</th><th>現實（依新聞報導）</th></tr></thead><tbody>
  <tr><td>購物節</td><td>預算的 ${Math.round(festPts/total*100)}% 給了購物節・宣傳</td><td>2019 年起年年舉辦，第七屆市府宣稱登錄金額 374 億元；2026 年度購物節等 3.97 億元預算遭議會委員會凍結，議員質疑成效灌水、活動變成市長個人宣傳</td></tr>
  <tr><td>大里掩埋場</td><td>${fmt(S.garbage)} 萬噸</td><td>2025 年 7 月暫置 38.5 萬噸，後續報導約 45 萬噸；議員指市府規劃 2042 年才清完</td></tr>
  <tr><td>文山焚化爐</td><td>${S.furnace?`${S.furnaceYear} 年新爐完工`:`進度 ${Math.round(S.inc/FURNACE_NEED*100)}%，未完工`}</td><td>汰舊換新被議員批評在任內「空轉快 8 年」，新爐尚未完工</td></tr>
  <tr><td>廚餘</td><td>${S.lake?'出現廚餘湖':'沒有廚餘湖'}</td><td>2025 年 10 月非洲豬瘟後禁廚餘養豬，市府開放 12 處掩埋場收廚餘，霧峰掩埋場的廚餘坑被網友稱為「廚餘海」「燕圾湖」，市府緊急覆土、後改送焚化爐</td></tr>
  <tr><td>捷運藍線</td><td>${stageName(S.blue)}</td><td>2024 年 1 月核定（1615 億元）；2025 年 6 月機電開工；2026 年 8 月高架段土建動工。高架段目標 2034 年通車，捷工局坦言全線恐延到 2036 年、經費可能再增約 1300 億元</td></tr>
  </tbody></table>
  <details><summary>市府的說法</summary><ul class="notes">
  <li>大里掩埋場「有進有出」，持續與外縣市合作焚化；打包後先暫置大里，等文山新爐完工去化（市長回應打包外運爭議時稱「庸人自擾」）。</li>
  <li>購物節原理如同統一發票，民調顯示市民支持續辦；市長代言「不用錢」。</li>
  <li>霧峰掩埋場廚餘區下方有防水布、每日覆土；廚餘改送焚化廠焚燒發電。</li>
  <li>藍線高架段 2034 年先通車的目標不變，追加經費希望中央協助。</li></ul></details>
  <details class="src"><summary>資料來源</summary><ul>
  <li><a href="https://udn.com/news/story/7325/9279804" target="_blank" rel="noopener">聯合報：台中大里垃圾山打包送文山掩埋場遭抗議喊卡 盧秀燕：庸人自擾</a></li>
  <li><a href="https://udn.com/news/story/7325/9466921" target="_blank" rel="noopener">聯合報：大里垃圾場堆45萬噸垃圾 綠營要求成立環保監督委員會</a></li>
  <li><a href="https://udn.com/news/story/7325/9001428" target="_blank" rel="noopener">聯合報：大里掩埋場垃圾驚人 中市府：焚化爐歲修後可去化</a></li>
  <li><a href="https://www.storm.mg/article/11065861" target="_blank" rel="noopener">風傳媒：台中大里垃圾山爆量難處理 民進黨批盧秀燕</a></li>
  <li><a href="https://newtalk.tw/news/view/2025-11-02/1002255" target="_blank" rel="noopener">新頭殼：霧峰掩埋場廚餘（2025-11-02）</a></li>
  <li><a href="https://newtalk.tw/news/view/2025-11-03/1002362" target="_blank" rel="noopener">新頭殼：台中廚餘去化（2025-11-03）</a></li>
  <li><a href="https://news.pts.org.tw/article/780618" target="_blank" rel="noopener">公視新聞：霧峰掩埋場廚餘</a></li>
  <li><a href="https://www.ctee.com.tw/news/20251204701360-431401" target="_blank" rel="noopener">工商時報：台中購物節預算審查（2025-12-04）</a></li>
  <li><a href="https://www.nownews.com/news/5384354" target="_blank" rel="noopener">NOWnews：購物節代言費爭議（2021）</a></li>
  <li><a href="https://udn.com/news/story/7325/9660275" target="_blank" rel="noopener">聯合報：中捷藍線預算增1300億元…綠批進度控管失靈 盧秀燕：希望中央幫忙</a></li>
  <li><a href="https://news.pts.org.tw/article/825857" target="_blank" rel="noopener">公視新聞：台中捷運藍線進度</a></li>
  </ul></details>
  <button class="btn" data-action="restart">再當一次市長</button>`;
}

// ---------- 配樂（音檔由 godot/tools/gen_music.py 產生，與 Godot 版共用） ----------
// 市政底層一直播；購物節層同時開始、同步循環，音量跟著購物節點數；結局換成結局曲。
// 音檔位置可由 <html data-audio-base="..."> 覆寫（wake.com.tw 上的版本放在 audio/）
const AUDIO_BASE=document.documentElement.dataset.audioBase||'godot/assets/audio/';
const MUSIC=Object.fromEntries(['civic','fest','end_sad','end_warm'].map(k=>[k,AUDIO_BASE+k+'.wav']));
const SAD_ENDINGS=['購物節之城','兩頭空','一任市長'];
const audio={ctx:null,buf:{},ready:false,muted:false,endSrc:null};

// 瀏覽器要求使用者點擊後才能出聲，所以在「開始執政」時才載入
async function initAudio(){
  if(audio.ctx){if(audio.ctx.state==='suspended')audio.ctx.resume();return}
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return;
  const ctx=audio.ctx=new Ctx();
  try{
    const mk=dest=>{const g=ctx.createGain();g.gain.value=0;g.connect(dest);return g};
    audio.master=ctx.createGain();audio.master.connect(ctx.destination);
    audio.layers=mk(audio.master);audio.fest=mk(audio.layers);audio.end=mk(audio.master);
    await Promise.all(Object.entries(MUSIC).map(async([k,url])=>{
      const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);
      audio.buf[k]=await ctx.decodeAudioData(await r.arrayBuffer());
    }));
    const t=ctx.currentTime+0.1;
    [['civic',audio.layers],['fest',audio.fest]].forEach(([k,dest])=>{
      const s=ctx.createBufferSource();s.buffer=audio.buf[k];s.loop=true;s.connect(dest);s.start(t)});
    audio.ready=true;
    document.getElementById('mute').hidden=false;
    syncMusic();
  }catch(e){console.warn('配樂載入失敗，遊戲照常進行：',e)}
}

function syncMusic(){
  if(!audio.ready)return;
  const now=audio.ctx.currentTime,fest=phase==='budget'?alloc.fest:(phase==='intro'?0:lastFest);
  audio.fest.gain.setTargetAtTime(Math.pow(fest/10,0.7),now,0.4);
  if(phase==='end'&&!audio.endSrc){
    const s=audio.endSrc=audio.ctx.createBufferSource();
    s.buffer=audio.buf[SAD_ENDINGS.includes(verdictOf()[0])?'end_sad':'end_warm'];s.loop=true;
    s.connect(audio.end);s.start(now);
    audio.end.gain.setTargetAtTime(1,now,0.6);audio.layers.gain.setTargetAtTime(0,now,0.6);
  }else if(phase!=='end'){
    if(audio.endSrc){audio.end.gain.setTargetAtTime(0,now,0.4);audio.endSrc.stop(now+2);audio.endSrc=null}
    audio.layers.gain.setTargetAtTime(1,now,0.6);
  }
}

function toggleMute(){
  audio.muted=!audio.muted;
  audio.master.gain.setTargetAtTime(audio.muted?0:1,audio.ctx.currentTime,0.05);
  document.getElementById('mute').textContent=audio.muted?'音樂：關':'音樂：開';
}

function render(){renderMeters();renderTicker();renderScene();renderPanel();syncMusic()}

// 不用 onclick 屬性，網站的 CSP 禁止內嵌腳本
document.getElementById('panel').addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');
  if(!b)return;
  if(b.dataset.action==='start'){initAudio();phase='event';render()}
  else if(b.dataset.action==='next')next();
  else if(b.dataset.action==='restart')newGame();
});
document.getElementById('mute').addEventListener('click',toggleMute);
newGame();
