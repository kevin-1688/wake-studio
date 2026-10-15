// 為你好 — 從七歲到三十歲，每一週都要交給媽媽檢查
// 八關＝人生八個年紀，兩關一章。每關：事件 → 排一週的課後時間 → 媽媽拿紅筆改 → 你回應 → 結算。
// 15 歲會考、18 歲填志願、30 歲除夕是 Boss 關；電量歸零就提早結束。
const PORT=16;            // 設計系作品集門檻（自我）
const TRUTH_TALKS=2;
const RECOVER=15;          // 兩關之間恢復的電量
const CTRL_DRIFT=4;        // 每長大一關，媽媽的控制自然上升      // 除夕要說真心話，之前至少好好談過幾次
const CHAPTERS={1:'第一章・童年',2:'第二章・青春期',3:'第三章・選擇',4:'第四章・長大以後'};
const DAYS=['週一','週二','週三','週四','週五','週六','週日','週日晚'];
const ACTS={
  study:{icon:'📚',name:'讀書',aIcon:'💼',aName:'加班',fx:'成績 +1・電量 −3',aFx:'工作 +1・電量 −3'},
  draw:{icon:'🎨',name:'畫畫',fx:'自我 +1・電量 +1'},
  friend:{icon:'🏀',name:'朋友',aIcon:'🍻',fx:'電量 +4'},
  rest:{icon:'😴',name:'放空',fx:'電量 +5'},
};
const TYPE_SAY={draw:'畫畫的事，等考上再說。',friend:'那些同學會幫你考試嗎？',rest:'年輕人睡什麼覺。'};
const ADULT_SAY={draw:'畫畫當興趣就好，不要想太多。',friend:'少跟那些朋友出去，存點錢。',rest:'週末在家躺著，不如回家。'};

const LEVELS=[
  {age:7,ch:1,name:'才藝班',slots:6,drain:4,expect:3,imposed:{icon:'🎹',name:'鋼琴課'},
    say:'隔壁志明三歲就開始學鋼琴了。',
    goal:'媽媽檢查完，還保住至少 1 格🎨畫畫',check:(s,w)=>w.final.filter(x=>x==='draw').length>=1,
    tip:()=>'媽媽希望你每週至少讀書 3 格。讀書排得越少，她改掉的格子越多——而她最先改的，永遠是畫畫。',
    ticker:'阿姨：我們家志明鋼琴檢定過了 🎹👏👏',
    event:()=>({title:'三張傳單',body:'媽媽拿著三張才藝班傳單：鋼琴、珠心算、兒童美語。「你選一個。或者三個都去，媽媽都可以。」',choices:[
      {t:'「我想學畫畫。」',d:'自我 +2｜關係 −2',f:s=>{s.self+=2;s.rel-=2;return '畫畫班？……好啦，週末可以去。但鋼琴還是要上，媽媽小時候想學都沒得學。'}},
      {t:'「都可以。」',d:'關係 +3｜控制 +5',f:s=>{s.rel+=3;s.ctrl+=5;return '真乖。那就三個都去，媽媽幫你排好了。'}}]})},
  {age:10,ch:1,name:'那兩分呢',slots:6,drain:6,expect:3,imposed:{icon:'🧮',name:'珠心算'},
    say:'志明珠心算已經八級了，你呢？',
    goal:'這週結束時，電量還有 50 以上',check:s=>s.energy>=50,
    tip:s=>`你現在的電量是 ${s.energy}。讀書和媽媽排的課都很耗電，朋友和放空才能充電。`,
    ticker:'媽媽 已傳送貼圖「早安 平安喜樂」｜阿姨：志明珠心算八級了喔',
    event:()=>({title:'98 分',body:'數學考了 98 分，全班最高。你一路跑回家，把考卷拿給媽媽。她看了一眼，說：「那兩分呢？」',choices:[
      {t:'「下次會考一百。」',d:'關係 +2｜控制 +3｜電量 −5',f:s=>{s.rel+=2;s.ctrl+=3;s.energy-=5;return '這才對。粗心就是不認真。'}},
      {t:'「全班只有我 98 耶。」',d:'自我 +1｜關係 −3',f:s=>{s.self+=1;s.rel-=3;return '你跟比你差的比幹嘛？阿姨說志明每次都一百。'}},
      {t:'什麼都不說，回房間',d:'電量 −3｜控制 +3',f:s=>{s.energy-=3;s.ctrl+=3;return '（你聽見她在門外跟爸爸說：「這孩子最近怪怪的。」爸爸說：「聽你媽的。」）'}}]})},
  {age:13,ch:2,name:'第一支手機',slots:7,drain:8,expect:4,imposed:{icon:'📝',name:'補習班'},
    say:'週二週四我幫你報了補習班，老師很有名。',
    goal:'沒被抓包，而且保住至少 2 格自己的時間（畫畫、朋友、放空）',
    check:(s,w)=>!w.caught&&w.final.filter(x=>x!=='study'&&x!=='imp').length>=2,
    tip:()=>`新解鎖：陽奉陰違。媽媽改完以後，你可以嘴上說好、照原本的排——但她控制越高、盯得越緊，越容易被抓包（目前 ${Math.round(catchP()*100)}%）。`,
    ticker:'媽媽：你剛剛在跟誰傳訊息？',
    event:()=>({title:'第一支手機',body:'你終於有了第一支手機。媽媽遞給你的時候說：「密碼要告訴我。我不會亂看，只是不定時檢查一下。」',choices:[
      {t:'把密碼給她',d:'關係 +3｜控制 +6｜之後說謊更容易被抓',f:s=>{s.rel+=3;s.ctrl+=6;s.phone=true;return '媽媽是關心你，又不是要害你。'}},
      {t:'「這是我的隱私。」',d:'自我 +2｜關係 −6｜控制 +2',f:s=>{s.self+=2;s.rel-=6;s.ctrl+=2;return '隱私？你吃我的住我的，跟我講隱私？'}}]})},
  {age:15,ch:2,name:'會考',boss:true,slots:8,drain:14,expect:6,imposed:{icon:'📝',name:'衝刺班'},
    say:'剩一百天，現在不拼什麼時候拼？',
    goal:'會考：成績累積 12 以上',check:s=>s.grade>=12,
    tip:s=>`Boss 關：成績現在累積 ${s.grade}。讀書和媽媽排的課都算成績。這一週特別累，基本消耗是 14。`,
    after:(s,notes)=>{if(s.grade>=12){s.rel+=5;notes.push('🎉 考上第一志願。媽媽把成績單拍照傳到家族群組，後面接了七個讚。')}
      else{s.ctrl+=15;s.rel-=5;notes.push('📉 差幾分，沒上第一志願。阿姨在群組說：「志明上建中了喔～」那天晚上，門縫開得比平常大：控制 +15。')}},
    ticker:'阿姨：志明模擬考全校第三 🙏 大家一起加油',
    event:()=>({title:'倒數一百天',body:'媽媽在你房間天花板的角落裝了一台監視器。「我是怕你太累，看你有沒有在休息啦。」紅色的燈一直亮著。',choices:[
      {t:'「……好。」',d:'控制 +8｜之後說謊更容易被抓',f:s=>{s.ctrl+=8;s.camera=true;return '你看，這樣媽媽上班也放心。'}},
      {t:'拿便利貼把鏡頭貼起來',d:'自我 +2｜關係 −6｜控制 +4',f:s=>{s.self+=2;s.rel-=6;s.ctrl+=4;s.camera=true;s.covered=true;return '（第二天，便利貼旁邊多了一張紙條：「貼了媽媽也知道你在幹嘛。」）'}}]})},
  {age:17,ch:3,name:'選組',slots:7,drain:8,expect:4,imposed:{icon:'🧪',name:'理化家教'},
    say:'理化家教一小時一千二，媽媽都捨得了。',
    goal:`作品集：自我累積 ${PORT} 以上`,check:s=>s.self>=PORT,
    tip:s=>`下一關要填志願。設計系要看作品集：自我 ${s.self}/${PORT}。畫畫一格 +1。`,
    ticker:'媽媽 分享了一篇文章：〈讀文組的十個下場，第七個太真實〉',
    event:()=>({title:'選組單',body:'高一下，選組單要家長簽名。媽媽已經在「第三類組（醫科）」上打了勾，筆還放在旁邊。',choices:[
      {t:'簽下去，選三類',d:'關係 +5｜自我 −2',f:s=>{s.rel+=5;s.self-=2;return '以後你會感謝我的。'}},
      {t:'改成一類，自己準備美術術科',d:'自我 +3｜關係 −8｜控制 +4',f:s=>{s.self+=3;s.rel-=8;s.ctrl+=4;return '讀文組以後要去便利商店打工嗎？……你自己選的，以後不要後悔。'}},
      {t:'選二類，兩邊都不得罪',d:'沒有變化',f:()=>'二類也可以啦，電機也不錯。'}]})},
  {age:18,ch:3,name:'志願卡',boss:true,slots:7,drain:10,expect:4,imposed:{icon:'🏥',name:'診所見習'},
    say:'去舅舅診所看看，你就知道當醫生多好。',
    goal:'志願卡上是你自己選的科系',check:s=>s.path==='self',
    tip:s=>s.path==='self'?'志願送出去了。開學前最後一個暑假，媽媽還是想讓你去舅舅的診所看看。':'志願送出去了。至少，這個暑假還有幾格是你的。',
    ticker:'媽媽：（已傳送圖片）各科系畢業十年平均薪資排行',
    event:s=>({title:'志願卡',body:`放榜了，要填志願。媽媽把一張寫好的單子推給你：醫學系、牙醫系、藥學系、電機系。你的作品集在抽屜裡${s.self>=PORT?'，已經夠格了':`，還差一點（自我 ${s.self}/${PORT}）`}。`,choices:[
      {t:'照媽媽寫的填',d:'關係 +6｜自我 −3',f:s=>{s.path='mom';s.rel+=6;s.self-=3;return '這樣才對。設計系出來能做什麼？畫海報嗎？'}},
      {t:'填設計系，把作品集攤開給她看',need:s=>s.self>=PORT,d:s.self>=PORT?'關係 −8｜控制 −10｜算一次好好談過':`作品集不夠：自我 ${s.self}/${PORT}`,
        f:s=>{s.path='self';s.rel-=8;s.ctrl-=10;s.talks++;return '（她翻你的作品集翻了很久，什麼都沒說，只把那張寫好的單子收回抽屜。）'}},
      {t:'表面照填，送出前偷偷改成設計系',need:s=>s.self>=PORT-4,d:s.self>=PORT-4?'備取上了｜開學那天會被發現：關係 −15、控制 +10':`連備取都不夠：自我 ${s.self}/${PORT-4}`,
        f:s=>{s.path='self';s.rel-=15;s.ctrl+=10;s.lies++;return '（開學那天，她打電話到醫學系辦公室找你。）……你很會嘛。'}}]})},
  {age:25,ch:4,name:'自己的門',adult:true,slots:6,drain:12,expect:3,imposed:{icon:'🍚',name:'回家吃飯'},
    say:'週末回家吃飯。我順便幫你報了公職考試班，穩定最重要。',
    goal:'關係 40 以上，電量也有 40 以上',check:s=>s.rel>=40&&s.energy>=40,
    tip:()=>'下班後的時間是你的了——理論上。媽媽排的「回家吃飯」會加一點關係，但很耗電。',
    ticker:'媽媽：到家了沒？｜媽媽：？｜媽媽：未接來電（3）',
    event:s=>({title:'定位分享',body:'你在台北租了一間小套房，終於有一扇自己的門。搬家第二天，手機跳出通知：「媽媽已開始與你分享位置，並要求你分享位置。」',choices:[
      {t:'開著吧，她會比較安心',d:'關係 +4｜控制 +5',f:s=>{s.rel+=4;s.ctrl+=5;s.location=true;return '這樣多好，媽媽知道你平安。'}},
      {t:'關掉，但約好每週日晚上打電話',d:`關係 ≥ 40 她才聽得進去（目前 ${s.rel}）｜成功：控制 −10、算一次好好談過`,
        f:s=>{if(s.rel>=40){s.ctrl-=10;s.rel+=2;s.talks++;return '……好啦。週日不要忘記喔。'}
          s.rel-=4;s.ctrl+=3;s.location=true;return '你是在躲我嗎？（隔天，她加了你同事的 LINE。）'}},
      {t:'直接關掉，不解釋',d:'自我 +1｜關係 −8',f:s=>{s.self+=1;s.rel-=8;return '（三通未接來電。）'}}]})},
  {age:30,ch:4,name:'除夕',boss:true,adult:true,slots:6,drain:6,expect:2,imposed:{icon:'☕',name:'相親'},
    say:'王阿姨家的孩子人很好，初二見個面而已。',
    goal:'說出真心話',check:s=>s.truth,
    tip:s=>s.truth?'說出口以後，過年這一週好像沒那麼難了。':'過年這一週。至少，還有幾格是你的。',
    ticker:'阿姨：志明下個月第二胎滿月，大家都要來喔 👶🎉',
    event:s=>{const can=s.talks>=TRUTH_TALKS||s.rel>=55;return {title:'除夕',body:'圍爐。阿姨問薪水，舅舅問對象，志明抱著第二胎。媽媽一直沒說話，幫你夾了三次菜。飯後你上閣樓找舊相簿，翻到一本褪色的素描本，封面寫著媽媽的名字。',choices:[
      {t:'把素描本放回去，下樓說「我很好」',d:'沒有變化',f:()=>'（那本素描本，你後來再也沒有提起。）'},
      {t:'拿著素描本下樓，跟她說真心話',need:()=>can,d:can?'關係 +15｜控制 −20':`你們之間還沒有能說真心話的路（要好好談過 ${TRUTH_TALKS} 次，或關係 ≥ 55；目前 ${s.talks} 次、關係 ${s.rel}）`,
        f:s=>{s.truth=true;s.rel+=15;s.ctrl-=20;return '她摸著封面摸了很久。「你外婆說畫畫沒出息，當著我的面撕了一半。」停了一下。「我只是……不想你跟我一樣後悔。我好像用錯方法了。」'}},
      {t:'當著親戚的面翻臉',d:'自我 +2｜關係 −15',f:s=>{s.self+=2;s.rel-=15;return '（「我這輩子沒有一件事是自己決定的！」整桌安靜下來。媽媽低頭，把你碗裡的菜夾回盤子。）'}}]}}},
];
const EPI=[
  {t:'「你在幹嘛！牆壁很難洗耶！」',r:'話一出口，你聽見了媽媽的聲音。'},
  {t:'「我是為你好，先去寫功課。」',r:'原來那四個字，是會遺傳的。'},
  {t:'「這是什麼？可以講給我聽嗎？」',r:'孩子講了二十分鐘。你一句建議都沒有給。'},
];

let S,phase,li,W,brush,epi;
function newGame(){
  S={energy:80,self:3,grade:0,work:0,rel:60,ctrl:40,talks:0,lies:0,caught:0,overTotal:0,
    phone:false,camera:false,covered:false,location:false,path:null,truth:false,burnout:false,stars:{},reply:''};
  li=0;phase='intro';brush='study';epi=null;W=null;
  render();
}
const L=()=>LEVELS[li];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function fix(){S.energy=clamp(S.energy,0,100);S.rel=clamp(S.rel,0,100);S.ctrl=clamp(S.ctrl,0,100);S.self=Math.max(0,S.self)}
const newWeek=()=>({plan:Array(L().slots).fill(null),over:[],final:[],restored:[],secret:[],caught:false,resp:null,mom:'',b4:null,notes:[]});
const actIcon=(k,lv)=>k==='imp'?lv.imposed.icon:(lv.adult&&ACTS[k].aIcon)||ACTS[k].icon;
const actName=(k,lv)=>k==='imp'?lv.imposed.name:(lv.adult&&ACTS[k].aName)||ACTS[k].name;
const talkThr=()=>35+Math.floor(S.ctrl/3);
const monitors=()=>(S.phone?1:0)+(S.camera&&!S.covered?1:0)+(S.location?1:0);
function catchP(){return clamp(0.15+S.ctrl/250+0.15*monitors(),0.05,0.9)}
// 媽媽要改幾格：讀書不夠她期待的差額，加上控制欲本身（每 30 一格）。先改畫畫，再改朋友，最後才改放空。
function overrides(plan){
  const lv=L(),study=plan.filter(x=>x==='study').length;
  const k=Math.max(0,lv.expect-study)+Math.floor(S.ctrl/30);
  const idx=[];['draw','friend','rest'].forEach(t=>plan.forEach((x,i)=>{if(x===t)idx.push(i)}));
  return idx.slice(0,k);
}

function chooseEvent(c){
  S.reply=c.f(S)||'';fix();
  phase='plan';W=newWeek();render();
}
function submitPlan(){
  W.b4={...S};
  W.over=overrides(W.plan);
  if(!W.over.length){S.rel+=2;S.ctrl-=2;fix();W.resp='none';W.final=[...W.plan];W.mom='（她看了一眼。）嗯。';applyWeek();return}
  phase='review';render();
}
function respond(r){
  const lv=L(),k=W.over.length,withImp=W.plan.map((x,i)=>W.over.includes(i)?'imp':x);
  W.resp=r;
  if(r==='obey'){S.rel+=3;S.ctrl+=3;S.self-=1;W.final=withImp;W.mom='這才乖。'}
  else if(r==='talk'){
    if(S.rel>=talkThr()){
      W.restored=W.over.slice(0,Math.ceil(k/2));
      W.final=W.plan.map((x,i)=>W.over.includes(i)&&!W.restored.includes(i)?'imp':x);
      S.ctrl-=5;S.energy-=3;S.talks++;
      W.mom='（她沉默了一下。）……好啦，那幾格你自己安排。';
    }else{S.rel-=6;S.ctrl+=4;W.final=withImp;W.mom='你現在是在跟我頂嘴嗎？我是為你好！'}
  }else if(r==='lie'){
    S.lies++;
    if(Math.random()<catchP()){
      W.caught=true;S.caught++;S.rel-=10;S.ctrl+=12;W.final=withImp;
      W.mom=lv.adult?'你同事說你那天根本沒加班。你以為我不知道？':(S.camera&&!S.covered?'監視器我都有看。你以為我不知道？':'補習班老師打電話來了。你以為我不知道？');
    }else{W.final=[...W.plan];W.secret=[...W.over];W.mom='（她沒發現。那幾格，你過得像自己。）'}
  }
  fix();applyWeek();
}
function applyWeek(){
  const lv=L(),notes=[],cnt={};
  W.final.forEach(k=>cnt[k]=(cnt[k]||0)+1);
  const n=k=>cnt[k]||0;
  if(n('study')){if(lv.adult)S.work+=n('study');else S.grade+=n('study');S.energy-=3*n('study');
    notes.push(`${actIcon('study',lv)} ${actName('study',lv)} ×${n('study')}：${lv.adult?'工作':'成績'} +${n('study')}、電量 −${3*n('study')}`)}
  if(n('imp')){if(lv.adult)S.rel+=n('imp');else S.grade+=n('imp');S.energy-=5*n('imp');S.overTotal+=n('imp');
    notes.push(`${lv.imposed.icon} ${lv.imposed.name} ×${n('imp')}（媽媽排的）：${lv.adult?'關係':'成績'} +${n('imp')}、電量 −${5*n('imp')}`)}
  if(n('draw')){S.self+=n('draw');S.energy+=n('draw');notes.push(`🎨 畫畫 ×${n('draw')}：自我 +${n('draw')}、電量 +${n('draw')}`)}
  if(n('friend')){S.energy+=4*n('friend');notes.push(`${actIcon('friend',lv)} 朋友 ×${n('friend')}：電量 +${4*n('friend')}`)}
  if(n('rest')){S.energy+=5*n('rest');notes.push(`😴 放空 ×${n('rest')}：電量 +${5*n('rest')}`)}
  S.energy-=lv.drain;notes.push(`${lv.adult?'上班':'上學'}本身就很累：電量 −${lv.drain}`);
  fix();
  S.stars[li]=!!lv.check(S,W);
  if(lv.after)lv.after(S,notes);
  fix();
  if(S.energy<=0)S.burnout=true;
  W.notes=notes;phase='result';render();
}
function next(){
  if(S.burnout){phase='end';render();return}
  if(li===LEVELS.length-1){phase='epilogue';render();return}
  li++;S.reply='';
  // 兩關之間隔了好幾年，電量會慢慢回來一些
  const before=S.energy;S.energy=clamp(S.energy+RECOVER,0,100);S.recovered=S.energy-before;
  // 你越大，她越怕管不住你
  S.ctrl=clamp(S.ctrl+CTRL_DRIFT,0,100);
  phase='event';render();
}

// ---------- 畫面 ----------
function renderMeters(){
  const el=document.getElementById('meters');
  if(phase==='intro'){el.innerHTML='';return}
  const lv=L(),bar=(v,cls='')=>`<span class="bar ${cls}"><i style="width:${v}%"></i></span>`;
  el.innerHTML=`<span class="meter">🎂 <b>${lv.age}</b> 歲</span>
  <span class="meter">🔋 <b>${S.energy}</b>${bar(S.energy,S.energy<30?'low':'')}</span>
  <span class="meter">🎨 自我 <b>${S.self}</b></span>
  <span class="meter">${lv.adult?`💼 工作 <b>${S.work}</b>`:`📚 成績 <b>${S.grade}</b>`}</span>
  <span class="meter">❤️ 關係 <b>${S.rel}</b>${bar(S.rel)}</span>
  <span class="meter">👁️ 控制 <b>${S.ctrl}</b>${bar(S.ctrl,'red')}</span>`;
}
function renderMap(){
  const el=document.getElementById('map');
  if(phase==='intro'){el.innerHTML='';return}
  const cur=(phase==='end'||phase==='epilogue')?-1:li;
  el.innerHTML=Object.entries(CHAPTERS).map(([ch,name])=>`<div class="chapter"><div class="ch-name">${name}</div><div class="nodes">${
    LEVELS.map((lv,i)=>[lv,i]).filter(([lv])=>lv.ch==+ch).map(([lv,i])=>{const done=i in S.stars;
      const cls=['node',lv.boss?'boss':'',i===cur?'cur':'',done?(S.stars[i]?'star':'miss'):'',!done&&i!==cur?'future':''].join(' ');
      return `<div class="${cls}" title="${lv.age} 歲・${lv.name}：${lv.goal}"><b>${done?(S.stars[i]?'★':'☆'):(lv.boss?'BOSS':i+1)}</b><span>${lv.age} 歲</span></div>`}).join('')
  }</div></div>`).join('');
}
function renderTicker(){
  const el=document.getElementById('ticker');
  el.innerHTML=phase==='intro'?'<span>家族群組（38）</span>阿姨：恭喜恭喜！寶寶好可愛，以後一定跟志明一樣優秀 👶'
    :phase==='end'||phase==='epilogue'?'<span>家族群組（38）</span>媽媽 已傳送貼圖「平安喜樂」'
    :`<span>家族群組（38）</span>${L().ticker}`;
  el.title=el.textContent;
}

// 固定的偽亂數，讓牆上的畫每次都貼在同樣位置
const JIT=(()=>{let x=11,o=[];for(let i=0;i<64;i++){x=(x*16807)%2147483647;o.push(x/2147483647)}return o})();
const CRAYON=['#e03131','#f08c00','#2f9e44','#1971c2','#9c36b5','#0c8599','#e64980','#fab005'];

function renderScene(){
  const s=S,lv=phase==='intro'?LEVELS[0]:L(),night=phase!=='intro'&&li>=2,adult=!!lv.adult;
  let h=`<rect width="800" height="300" style="fill:var(--wall)"/><rect y="238" width="800" height="62" style="fill:var(--floor)"/><rect y="234" width="800" height="6" style="fill:var(--wall2)"/>`;
  // 窗戶：小時候是白天，國中以後都是熬夜的晚上；長大後窗外是城市
  h+=`<rect x="40" y="30" width="170" height="120" rx="4" style="fill:${night?'var(--night)':'var(--sky)'};stroke:var(--wood)" stroke-width="6"/>`;
  if(night){
    h+=`<circle cx="176" cy="56" r="11" fill="#fff3bf"/><circle cx="181" cy="52" r="10" style="fill:var(--night)"/>`;
    if(adult)[[50,110,22,37],[76,96,18,51],[98,118,26,29],[130,104,20,43],[154,90,24,57],[182,112,22,35]].forEach(([x,y,w,hh],i)=>{
      h+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#2c3554"/>`;
      for(let wy=y+5;wy<y+hh-4;wy+=9)for(let wx=x+4;wx<x+w-3;wx+=7)if(JIT[(wx+wy+i)%64]>.45)h+=`<rect x="${wx}" y="${wy}" width="3" height="4" fill="#ffe066" opacity=".8"/>`});
    else [[60,50],[100,72],[150,100],[80,120]].forEach(([x,y])=>h+=`<circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>`);
  }else h+=`<ellipse cx="90" cy="60" rx="24" ry="9" fill="#fff" opacity=".9"/><ellipse cx="160" cy="110" rx="20" ry="7" fill="#fff" opacity=".8"/>`;
  h+=`<line x1="125" y1="30" x2="125" y2="150" style="stroke:var(--wood)" stroke-width="4"/><line x1="40" y1="90" x2="210" y2="90" style="stroke:var(--wood)" stroke-width="4"/>`;
  // 獎狀牆：成績每 3 點一張
  const awards=Math.min(8,Math.floor(s.grade/3));
  for(let i=0;i<awards;i++){const x=46+(i%4)*41,y=164+Math.floor(i/4)*26;
    h+=`<rect x="${x}" y="${y}" width="36" height="21" style="fill:#fffbe6;stroke:var(--gold)" stroke-width="2"/><line x1="${x+6}" y1="${y+7}" x2="${x+30}" y2="${y+7}" stroke="#c9b37e"/><circle cx="${x+28}" cy="${y+15}" r="3" fill="#e03131"/>`}
  // 牆上的畫：自我每 1 點一張
  const pics=Math.min(32,s.self);
  for(let i=0;i<pics;i++){const c=i%8,r=Math.floor(i/8),x=252+c*38+JIT[i]*6,y=26+r*30+JIT[i+32]*4,rot=(JIT[i]-.5)*14,col=CRAYON[i%8];
    h+=`<g transform="rotate(${rot.toFixed(1)} ${x+15} ${y+12})"><rect x="${x}" y="${y}" width="30" height="24" fill="#fff" stroke="#d9cdb8"/>
    <path d="M${x+4} ${y+18} q6 -${8+JIT[i]*6} 11 -2 t11 -6" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${x+8+JIT[i+1]*12}" cy="${y+8}" r="${2.5+JIT[i+2]*2}" fill="${CRAYON[(i+3)%8]}"/><circle cx="${x+15}" cy="${y+1}" r="2" fill="#e03131"/></g>`}
  // 小孩（坐在書桌後面，身體被桌子擋住一半）
  const sc=lv.age<=10?.78:lv.age<=18?.92:1,tired=s.energy<30;
  h+=`<g transform="translate(400 238) scale(${sc})">
    <rect x="-26" y="-92" width="52" height="60" rx="6" style="fill:var(--wood)" opacity=".55"/>
    <rect x="-19" y="-74" width="38" height="50" rx="12" style="fill:var(--accent)"/>
    <g transform="${tired?'translate(0 10) rotate(18)':''}"><circle cx="0" cy="-92" r="17" style="fill:var(--skin)"/>
    <path d="M-17 -95 q2 -20 17 -19 q16 -1 17 19 q-6 -9 -17 -10 q-11 1 -17 10z" style="fill:var(--hair)"/>
    ${tired?'<path d="M-7 -90 h5 M3 -90 h5" style="stroke:var(--ink)" stroke-width="1.6"/><path d="M-4 -82 q4 -3 8 0" fill="none" style="stroke:var(--ink)" stroke-width="1.5"/>'
      :'<circle cx="-5" cy="-90" r="1.8" style="fill:var(--ink)"/><circle cx="6" cy="-90" r="1.8" style="fill:var(--ink)"/><path d="M-3 -83 q4 2 7 0" fill="none" style="stroke:var(--ink)" stroke-width="1.5"/>'}</g>
  </g>`;
  if(s.energy<20)h+=`<text x="${430}" y="${150}" font-size="18" style="fill:var(--muted)">z z</text>`;
  // 書桌、參考書、檯燈
  h+=`<rect x="270" y="196" width="260" height="10" rx="2" style="fill:var(--wood)"/><rect x="280" y="206" width="8" height="34" style="fill:var(--wood)"/><rect x="512" y="206" width="8" height="34" style="fill:var(--wood)"/>`;
  const books=Math.min(20,adult?Math.floor((s.grade+s.work)/2):s.grade);
  for(let i=0;i<books;i++)h+=`<rect x="${286+(JIT[i]-.5)*6}" y="${190-i*5.5}" width="${48+JIT[i+8]*8}" height="5" fill="${['#c92a2a','#1864ab','#2b8a3e','#e67700','#5f3dc4'][i%5]}"/>`;
  if(night)h+=`<polygon points="492,128 462,196 538,196" fill="#fff3bf" opacity=".18"/>`;
  h+=`<rect x="492" y="190" width="18" height="6" style="fill:var(--ink)"/><line x1="501" y1="190" x2="496" y2="140" style="stroke:var(--ink)" stroke-width="3"/><path d="M482 140 h26 l-6 -14 h-14z" style="fill:var(--ink)"/>`;
  // 手機：未讀訊息數跟著控制；長大後，媽媽的眼睛搬進手機裡
  if(phase!=='intro'&&li>=2){
    const pw=adult?26:16,ph=adult?42:26,px=448,py=196-ph,msgs=Math.round(s.ctrl/(adult?8:15));
    h+=`<g class="${msgs?'buzz':''}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="3" style="fill:var(--ink)"/><rect x="${px+2}" y="${py+3}" width="${pw-4}" height="${ph-7}" fill="#a5d8ff"/>`;
    if(adult&&s.ctrl>=35)h+=`<ellipse cx="${px+pw/2}" cy="${py+ph/2-2}" rx="8" ry="5" fill="#fff"/><circle cx="${px+pw/2}" cy="${py+ph/2-2}" r="3" fill="#222"/>`;
    if(s.location)h+=`<text x="${px+pw/2}" y="${py+ph-6}" text-anchor="middle" font-size="9">📍</text>`;
    if(msgs)h+=`<circle cx="${px+pw}" cy="${py}" r="7" fill="#e03131"/><text x="${px+pw}" y="${py+3.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">${msgs}</text>`;
    h+=`</g>`;
  }
  // 門：控制越高，門縫越大；縫裡有眼睛，再高一點會伸進一支紅筆。長大後是自己的門，關著。
  const gap=adult?0:Math.round(s.ctrl/100*46);
  h+=`<rect x="624" y="44" width="142" height="196" style="fill:var(--wall2)"/><rect x="630" y="50" width="${gap}" height="188" style="fill:var(--gap)"/>
  <rect x="${630+gap}" y="50" width="${130-gap}" height="188" style="fill:var(--door)"/><rect x="${640+gap}" y="64" width="${Math.max(0,110-gap)}" height="70" fill="none" style="stroke:var(--wall2)" stroke-width="3"/>
  <circle cx="${746}" cy="150" r="5" style="fill:var(--gold)"/>`;
  if(!adult&&s.ctrl>=30&&gap>=12)h+=`<g class="eye"><ellipse cx="${630+gap/2}" cy="118" rx="${Math.min(gap/2-1,9)}" ry="5" fill="#fff"/><circle cx="${630+gap/2+1}" cy="118" r="3" fill="#222"/></g>`;
  if(!adult&&s.ctrl>=60)h+=`<g transform="rotate(-8 ${630+gap} 168)"><rect x="${630+gap-4}" y="165" width="26" height="5" rx="1" style="fill:var(--red)"/><path d="M${630+gap+22} 165 l6 2.5 l-6 2.5z" style="fill:var(--red)"/></g>`;
  if(adult)h+=`<text x="695" y="104" text-anchor="middle" font-size="12" style="fill:var(--wall)">我的門</text>`;
  // 監視器
  if(s.camera)h+=`<rect x="580" y="12" width="28" height="15" rx="3" fill="#555"/><circle cx="586" cy="20" r="4" fill="#222"/>${s.covered
    ?'<rect x="579" y="13" width="14" height="14" fill="#ffe066" transform="rotate(-6 586 20)"/>':'<circle class="rec" cx="602" cy="17" r="2.5" fill="#ff2a2a"/>'}`;
  // 年紀月曆
  h+=`<rect x="568" y="60" width="44" height="50" rx="3" fill="#fff" stroke="#d9cdb8"/><rect x="568" y="60" width="44" height="12" rx="3" fill="#e03131"/>
  <text x="590" y="98" text-anchor="middle" font-size="17" font-weight="900" fill="#2b2622">${lv.age}</text><text x="590" y="69" text-anchor="middle" font-size="8" fill="#fff">歲</text>`;
  // 電量越低，房間越暗
  const dim=Math.max(0,(40-s.energy)/40)*.45;
  if(dim>0)h+=`<rect width="800" height="300" fill="#000" opacity="${dim.toFixed(2)}"/>`;
  document.getElementById('scene').innerHTML=h;
}

function goalBox(){const lv=L();return `<div class="goal${lv.boss?' boss':''}">${lv.boss?'<span class="tag">BOSS</span>':''}本關目標：<b>${lv.goal}</b></div>`}
const momLine=t=>t?`<p class="mom${t.startsWith('（')?' aside':''}">${t}</p>`:'';
function slotHTML(k,i,lv,cls='',btn=false){
  const tag=btn?'button':'div',attr=btn?` data-action="slot" data-i="${i}" aria-label="${DAYS[i]}：${k?actName(k,lv):'未排'}"`:'';
  return `<${tag} class="slot${k?' filled':''} ${cls}"${attr}><span class="day">${DAYS[i]}</span><span class="ic">${k?actIcon(k,lv):'＋'}</span><span class="nm">${k?actName(k,lv):'未排'}</span></${tag}>`;
}
function kicker(){const lv=L();return `<div class="kicker">第 ${li+1} 關・${lv.age} 歲・${lv.name}${lv.boss?'・BOSS':''}</div>`}

function renderPanel(){
  const el=document.getElementById('panel');
  if(phase==='intro'){
    el.innerHTML=`<div class="kicker">你出生的那天</div><h2>媽媽說，這一切都是為你好。</h2>
    <p>從 7 歲到 30 歲，一共八關。每一關是你人生裡的一週：先排好${'放學後'}的時間，然後交給媽媽檢查。</p>
    <p>媽媽會拿紅筆改掉她不喜歡的格子。你排的讀書越少、她的<b>👁️ 控制</b>越高，被改掉的就越多。改完以後，你可以<b>聽話</b>、<b>好好溝通</b>，或者等你大一點，<b>陽奉陰違</b>。</p>
    <p>盯好你的<b>🔋 電量</b>。電量歸零，遊戲就提早結束。</p>
    <p>15 歲會考、18 歲填志願、30 歲除夕是 <b>Boss 關</b>。</p>
    <button class="btn" data-action="start">開始長大</button>`;
    return;
  }
  const lv=L();
  if(phase==='event'){
    const ev=lv.event(S);
    el.innerHTML=`${kicker()}${S.recovered?`<p class="tip">${LEVELS[li-1].age} 歲到 ${lv.age} 歲之間，你慢慢恢復了一點：🔋 +${S.recovered}；媽媽也更怕管不住你：👁️ +${CTRL_DRIFT}</p>`:''}${goalBox()}<h2>${ev.title}</h2><p>${ev.body}</p>
    <div class="choices">${ev.choices.map((c,i)=>`<button class="choice" data-action="choice" data-i="${i}" ${c.need&&!c.need(S)?'disabled':''}><b>${c.t}</b><small>${c.d}</small></button>`).join('')}</div>`;
    el._ev=ev;
    return;
  }
  if(phase==='plan'){S.recovered=0;
    const left=W.plan.filter(x=>!x).length,full=!left,pred=full?overrides(W.plan).length:null;
    el.innerHTML=`${kicker()}${goalBox()}${momLine(S.reply)}
    <p class="tip">${lv.tip(S)}</p>
    <h2>這一週的${lv.adult?'下班後':'放學後'}</h2>
    <p class="tip" style="margin:0">先選一種活動，再點格子。</p>
    <div class="palette">${Object.keys(ACTS).map(k=>`<button class="brush" data-action="brush" data-k="${k}" aria-pressed="${brush===k}">${actIcon(k,lv)} ${actName(k,lv)}<small>${lv.adult&&ACTS[k].aFx||ACTS[k].fx}</small></button>`).join('')}</div>
    <div class="week">${W.plan.map((k,i)=>slotHTML(k,i,lv,'',true)).join('')}</div>
    <div class="left">${left?`還有 <b>${left}</b> 格沒排`:'排好了。'}</div>
    <div class="forecast">媽媽的期待：${actName('study',lv)}至少 ${lv.expect} 格。控制 ${S.ctrl}，她本來就會多改 ${Math.floor(S.ctrl/30)} 格。${full?`照這樣排，她大概會改掉 <b>${pred}</b> 格。`:''}</div>
    <button class="btn" data-action="submit" ${full?'':'disabled'}>交給媽媽檢查</button><button class="btn ghost" data-action="clear">清空</button>`;
    return;
  }
  if(phase==='review'){
    const k=W.over.length,first=W.plan[W.over[0]],thr=talkThr(),can=S.rel>=thr;
    const sayType=(lv.adult?ADULT_SAY:TYPE_SAY)[first];
    el.innerHTML=`${kicker()}<h2>媽媽檢查完了</h2>${momLine(lv.say+sayType)}
    <div class="week">${W.plan.map((x,i)=>W.over.includes(i)?slotHTML('imp',i,lv,'over stamp'):slotHTML(x,i,lv)).join('')}</div>
    <p style="margin-top:10px">她用紅筆改掉了 <b>${k}</b> 格，換成「${lv.imposed.icon} ${lv.imposed.name}」。你要怎麼回？</p>
    <div class="choices">
      <button class="choice" data-action="resp" data-r="obey"><b>「好啦。」</b><small>照媽媽改的過這週｜關係 +3｜控制 +3｜自我 −1</small></button>
      <button class="choice" data-action="resp" data-r="talk"><b>「我們可以談談嗎？」</b><small>關係要 ≥ ${thr} 她才聽得進去（目前 ${S.rel}，${can?'<span class="up">聽得進去</span>':'<span class="down">聽不進去</span>'}）｜成功：守住 ${Math.ceil(k/2)} 格、控制 −5、電量 −3、算一次好好談過｜失敗：關係 −6、控制 +4</small></button>
      ${li>=2?`<button class="choice" data-action="resp" data-r="lie"><b>${li===2?'<span class="tag new">新</span>':''}嘴上說好，照原本的排</b><small>被抓包機率 ${Math.round(catchP()*100)}%｜沒被抓：全部照你的｜被抓：關係 −10、控制 +12</small></button>`:''}
    </div>`;
    return;
  }
  if(phase==='result'){
    const b=W.b4,d=(k,inv)=>{const v=S[k]-b[k];return v===0?'±0':`<span class="${(v>0)!==!!inv?'up':'down'}">${v>0?'+':''}${v}</span>`};
    const last=li===LEVELS.length-1;
    el.innerHTML=`<div class="kicker">${lv.age} 歲・這一週過去了</div>
    <div class="goal ${S.stars[li]?'ok':'fail'}">${S.stars[li]?'★ 目標達成':'☆ 目標未達成'}：${lv.goal}</div>
    ${momLine(W.mom)}
    <div class="week">${W.final.map((x,i)=>slotHTML(x,i,lv,W.restored.includes(i)?'restored':W.secret.includes(i)?'secret':x==='imp'?'over':'')).join('')}</div>
    <p style="margin-top:10px">🔋 ${d('energy')}　🎨 ${d('self')}　${lv.adult?`💼 ${d('work')}`:`📚 ${d('grade')}`}　❤️ ${d('rel')}　👁️ ${d('ctrl',true)}</p>
    <ul class="notes">${W.notes.map(n=>`<li>${n}</li>`).join('')}</ul>
    ${S.burnout?'<p class="down">🔋 電量歸零了。</p>':''}
    <button class="btn" data-action="next">${S.burnout?'看結局':last?'五年後……':`長大到 ${LEVELS[li+1].age} 歲`}</button>`;
    return;
  }
  if(phase==='epilogue'){
    el.innerHTML=`<div class="kicker">五年後</div><h2>你的孩子五歲，用蠟筆畫滿了一整面牆。</h2>
    <p>你走過去，張開嘴。第一句話是——</p>
    <div class="choices">${EPI.map((e,i)=>`<button class="choice" data-action="epi" data-i="${i}"><b>${e.t}</b></button>`).join('')}</div>`;
    return;
  }
  if(phase==='end')renderEnd(el);
}

function verdict(){
  if(S.burnout)return['電量耗盡',`${L().age} 歲那年的某個早上，你起不了床。不是懶，是真的動不了。媽媽在門外喊了三次，第四次，她的聲音變了。`];
  const hiSelf=S.self>=18,hiRel=S.rel>=55;
  if(S.truth&&hiSelf)return['兩個人都長大了','你沒有變成她想要的樣子，她也沒有變成你想要的樣子。但除夕那晚以後，她開始把你的作品轉傳到家族群組，後面接七個讚。'];
  if(S.truth)return['晚了一點的真心話','你走了她選的路，不過她終於知道，你曾經想走另一條。那本素描本現在放在你的書架上，旁邊多了一本新的。'];
  if(hiSelf&&hiRel)return['各自安好','你們都過得不錯，只是有些話從來沒說。閣樓上那本素描本，還在原來的位置。'];
  if(hiSelf)return['自由，但很安靜','你畫畫、搬家、過自己的日子。媽媽每天早上傳一張長輩圖，你按一個讚。這是你們現在說話的方式。'];
  if(hiRel)return['別人家的小孩','你成了阿姨口中的「志明」。過年時，有個小孩被拿來跟你比較。你已經不太記得，自己以前喜歡什麼。'];
  return['誰也沒有贏','你沒有變成她想要的樣子，也沒有變成你自己想要的樣子。素描本還在閣樓上。'];
}
function renderEnd(el){
  const [v,desc]=verdict(),stars=Object.values(S.stars).filter(Boolean).length;
  el.innerHTML=`<div class="kicker">${S.burnout?`${L().age} 歲・提早結束`:'三十五歲'}</div>
  <div class="verdict">${v}</div><p>${desc}</p>
  ${epi!=null?`<p>然後你對孩子說：${EPI[epi].t}<br><span style="color:var(--muted)">${EPI[epi].r}</span></p>`:''}
  <div class="stats">
    <div class="stat"><small>🎨 自我</small><div class="num">${S.self}</div></div>
    <div class="stat"><small>❤️ 關係</small><div class="num">${S.rel}</div></div>
    <div class="stat"><small>👁️ 控制</small><div class="num">${S.ctrl}</div></div>
    <div class="stat"><small>好好談過</small><div class="num">${S.talks}</div><small>次</small></div>
    <div class="stat"><small>陽奉陰違</small><div class="num">${S.lies}</div><small>次，被抓 ${S.caught} 次</small></div>
    <div class="stat"><small>被媽媽排掉的時間</small><div class="num">${S.overTotal}</div><small>格</small></div>
  </div>
  <div class="stars-sum">關卡星數 <b>${stars}</b> / ${LEVELS.length}
    <ol>${LEVELS.map((lv,i)=>`<li class="${i in S.stars?(S.stars[i]?'star':'miss'):'skip'}">${i in S.stars?(S.stars[i]?'★':'☆'):'－'} ${lv.age} 歲・${lv.name}<small>${lv.goal}</small></li>`).join('')}</ol></div>
  <p>這個遊戲裡沒有壞人。媽媽的控制，大多來自她自己沒被好好對待過的恐懼；而能讓控制鬆開的，從來不是贏過她，是兩個人都還願意說話。</p>
  <div class="help">如果你在現實中也正承受很大的壓力：衛福部安心專線 <b>1925</b>（依舊愛我），24 小時免付費。</div>
  <button class="btn" data-action="restart">再長大一次</button>`;
}

function render(){renderMeters();renderMap();renderTicker();renderScene();renderPanel();music.update()}

document.getElementById('panel').addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action,top=document.getElementById('panel').getBoundingClientRect().top;
  if(a==='start'){music.start();phase='event';render()}
  else if(a==='choice')chooseEvent(document.getElementById('panel')._ev.choices[+b.dataset.i]);
  else if(a==='brush'){brush=b.dataset.k;render();return}
  else if(a==='slot'){W.plan[+b.dataset.i]=brush;render();return}
  else if(a==='clear'){W.plan.fill(null);render();return}
  else if(a==='submit')submitPlan();
  else if(a==='resp')respond(b.dataset.r);
  else if(a==='next')next();
  else if(a==='epi'){epi=+b.dataset.i;phase='end';render()}
  else if(a==='restart')newGame();
  if(top<0)document.getElementById('panel').scrollIntoView({behavior:'smooth',block:'start'});
});

// ---------- 配樂：八音盒版《給愛麗絲》，加一個節拍器 ----------
// 每個台灣小孩都在鋼琴課彈過它，也每天晚上在垃圾車後面聽到它。
// 節拍器的音量跟著媽媽的控制；電量越低，八音盒越走音。
const FUR=[[76,1],[75,1],[76,1],[75,1],[76,1],[71,1],[74,1],[72,1],[69,2],[0,1],[60,1],[64,1],[69,1],[71,2],[0,1],[64,1],[68,1],[71,1],[72,2],[0,1],[64,1],
  [76,1],[75,1],[76,1],[75,1],[76,1],[71,1],[74,1],[72,1],[69,2],[0,1],[60,1],[64,1],[69,1],[71,2],[0,1],[64,1],[72,1],[71,1],[69,4],[0,4]];
const music={ctx:null,master:null,on:true,timer:null,
  start(){
    if(this.ctx)return;
    try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
    this.master=this.ctx.createGain();this.master.gain.value=1;this.master.connect(this.ctx.destination);
    const m=document.getElementById('mute');m.hidden=false;
    m.addEventListener('click',()=>{this.on=!this.on;this.master.gain.setTargetAtTime(this.on?1:0,this.ctx.currentTime,.05);m.textContent=this.on?'音樂：開':'音樂：關'});
    this.loop();
  },
  loop(){
    const c=this.ctx,T=.17,t0=c.currentTime+.05;
    const detune=S&&S.energy<30?1-(30-S.energy)/30*.03:1,tick=S?S.ctrl/100*.07:0;
    let t=t0,u=0;
    FUR.forEach(([n,d])=>{
      if(n){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=440*Math.pow(2,(n-69)/12)*detune;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.7);
        o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.75)}
      for(let k=0;k<d;k++,u++)if(u%2===0&&tick>.005){const o=c.createOscillator(),g=c.createGain(),tt=t+k*T;o.type='square';o.frequency.value=u%6===0?1800:1400;
        g.gain.setValueAtTime(tick,tt);g.gain.exponentialRampToValueAtTime(.0001,tt+.03);o.connect(g);g.connect(this.master);o.start(tt);o.stop(tt+.04)}
      t+=d*T;
    });
    this.timer=setTimeout(()=>this.loop(),(t-c.currentTime-.15)*1000);
  },
  update(){},
};

newGame();
