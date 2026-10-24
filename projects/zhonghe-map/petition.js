// 議員你給我聽好了 — map petition wall.
// Residents drop a pin on the island and leave a request. Rows go into Supabase as
// "pending"; the campaign approves them in the dashboard before they appear here.
// The page provides window.PetitionHost: { startPick(cb), cancelPick(), render(list), focus(p) }.
(function(){
  const API="https://dddrodlxbnwrztxayoce.supabase.co/rest/v1/petitions";
  const KEY="sb_publishable_TF-gRoz7oXvS7qiVDvANBw_jQEipJY1";
  const CATS=["交通","公園綠地","治安","環境衛生","教育","長照福利","其他"];
  const host=window.PetitionHost;
  const $=s=>document.querySelector(s);
  let list=[];

  // ---------- UI shell ----------
  const wrap=document.createElement("div");
  wrap.innerHTML=`
  <div class="pet-banner" id="pet-banner" hidden role="status"><span>在島上點一下，標出你要陳情的位置</span><button type="button" id="pet-cancel">取消</button></div>
  <div class="pet-modal" id="pet-modal" hidden>
    <form class="pet-form" id="pet-form" novalidate>
      <div class="pet-k">議員你給我聽好了</div>
      <h3>你想讓張志豪知道什麼？</h3>
      <label class="pet-f"><span>類別</span><select id="pet-cat" required>${CATS.map(c=>`<option>${c}</option>`).join("")}</select></label>
      <label class="pet-f"><span>陳情內容 <em id="pet-count">0 / 300</em></span><textarea id="pet-body" rows="4" maxlength="300" required placeholder="例如：這個路口晚上很暗，行人過馬路很危險…"></textarea></label>
      <label class="pet-f"><span>暱稱（選填，會公開）</span><input id="pet-nick" maxlength="20" autocomplete="nickname" placeholder="不填就顯示「中和鄉親」"></label>
      <label class="pet-f"><span>聯絡方式（選填，不公開）</span><input id="pet-contact" maxlength="100" autocomplete="off" placeholder="電話或 Email，服務處需要時聯繫你"></label>
      <label class="pet-hp" aria-hidden="true">網站<input id="pet-hp" tabindex="-1" autocomplete="off"></label>
      <label class="pet-agree" id="pet-agree-row" hidden><input type="checkbox" id="pet-agree"> 我同意服務處為處理本次陳情，蒐集並使用我留下的聯絡方式。</label>
      <p class="pet-note">送出後由服務處審核，通過才會出現在地圖上。請勿留下他人個資或不實指控。</p>
      <p class="pet-err" id="pet-err" role="alert"></p>
      <div class="pet-actions"><button type="button" class="pet-btn ghost" id="pet-close">取消</button><button type="submit" class="pet-btn" id="pet-send">送出陳情</button></div>
    </form>
  </div>
  <div class="pet-card" id="pet-card" hidden>
    <button type="button" class="pet-x" id="pet-card-x" aria-label="關閉">×</button>
    <div class="pet-k" id="pet-c-k"></div>
    <p class="pet-c-body" id="pet-c-body"></p>
    <div class="pet-c-meta" id="pet-c-meta"></div>
    <div class="pet-c-reply" id="pet-c-reply" hidden><b>服務處回覆</b><span></span></div>
  </div>
  <div class="pet-toast" id="pet-toast" hidden role="status"></div>`;
  document.body.appendChild(wrap);

  let picked=null;
  function toast(t){const el=$("#pet-toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,4200)}
  function startAdd(){
    $("#pet-card").hidden=true;$("#pet-banner").hidden=false;
    host.startPick((x,y)=>{$("#pet-banner").hidden=true;picked=[x,y];openForm()});
  }
  function openForm(){$("#pet-err").textContent="";$("#pet-modal").hidden=false;setTimeout(()=>$("#pet-body").focus(),50)}
  function closeForm(){$("#pet-modal").hidden=true;picked=null;host.cancelPick&&host.cancelPick()}
  $("#pet-cancel").addEventListener("click",()=>{$("#pet-banner").hidden=true;host.cancelPick&&host.cancelPick()});
  $("#pet-close").addEventListener("click",closeForm);
  $("#pet-modal").addEventListener("click",e=>{if(e.target.id==="pet-modal")closeForm()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#pet-modal").hidden)closeForm();else if(!$("#pet-banner").hidden)$("#pet-cancel").click();else $("#pet-card").hidden=true}});
  $("#pet-body").addEventListener("input",e=>{$("#pet-count").textContent=e.target.value.length+" / 300"});
  $("#pet-contact").addEventListener("input",e=>{$("#pet-agree-row").hidden=!e.target.value.trim()});
  document.querySelectorAll("[data-pet-add]").forEach(b=>b.addEventListener("click",startAdd));

  $("#pet-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const err=$("#pet-err");err.textContent="";
    if($("#pet-hp").value){closeForm();toast("已送出，審核通過後會出現在地圖上。");return}
    const body=$("#pet-body").value.trim(),contact=$("#pet-contact").value.trim();
    if(body.length<5){err.textContent="陳情內容至少要 5 個字。";return}
    if(contact&&!$("#pet-agree").checked){err.textContent="留下聯絡方式的話，請勾選同意服務處使用。";return}
    if(!picked){err.textContent="請先在地圖上選位置。";return}
    const btn=$("#pet-send");btn.disabled=true;btn.textContent="送出中…";
    try{
      const r=await fetch(API,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({x:+picked[0].toFixed(1),y:+picked[1].toFixed(1),category:$("#pet-cat").value,body,nickname:$("#pet-nick").value.trim()||null,contact:contact||null})});
      if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(/太多/.test(j.message||"")?j.message:"送出失敗，請稍後再試。")}
      $("#pet-form").reset();$("#pet-count").textContent="0 / 300";$("#pet-agree-row").hidden=true;
      closeForm();toast("已送出，謝謝你。服務處審核通過後，會出現在地圖上。");
    }catch(ex){err.textContent=ex.message||"送出失敗，請稍後再試。"}
    finally{btn.disabled=false;btn.textContent="送出陳情"}
  });

  // ---------- show approved ----------
  const fmt=d=>{const t=new Date(d);return `${t.getFullYear()}/${t.getMonth()+1}/${t.getDate()}`};
  function show(p){
    $("#pet-c-k").textContent="陳情 · "+p.category;
    $("#pet-c-body").textContent=p.body;
    $("#pet-c-meta").textContent=(p.nickname||"中和鄉親")+" · "+fmt(p.created_at);
    const rp=$("#pet-c-reply");rp.hidden=!p.reply;if(p.reply)rp.querySelector("span").textContent=p.reply;
    $("#pet-card").hidden=false;host.focus&&host.focus(p);
  }
  $("#pet-card-x").addEventListener("click",()=>$("#pet-card").hidden=true);
  function renderList(){
    document.querySelectorAll("[data-pet-list]").forEach(box=>{
      box.textContent="";
      if(!list.length){const e=document.createElement("p");e.className="pet-empty";e.textContent="還沒有公開的陳情。點「我要陳情」，在地圖上標出你的意見。";box.appendChild(e);return}
      list.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="pet-row";
        b.innerHTML=`<span class="pet-cat"></span><span class="pet-t"><b></b><small></small></span>`;
        b.querySelector(".pet-cat").textContent=p.category;b.querySelector("b").textContent=p.body;
        b.querySelector("small").textContent=(p.nickname||"中和鄉親")+" · "+fmt(p.created_at)+(p.reply?" · 已回覆":"");
        b.addEventListener("click",()=>show(p));box.appendChild(b)});
    });
    document.querySelectorAll("[data-pet-count]").forEach(el=>el.textContent=list.length);
  }
  async function load(){
    try{
      const r=await fetch(API+"?select=id,created_at,x,y,category,body,nickname,reply&order=created_at.desc&limit=300",{headers:{apikey:KEY}});
      if(!r.ok)throw 0;list=await r.json();
    }catch(e){list=[]}
    renderList();host.render(list,show);
  }
  window.Petition={reload:load,show};
  load();
})();
