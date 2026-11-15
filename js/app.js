/* Swippy：一次一句的閱讀卡片（AccessED Hacks demo）。
 * 單卡＋四方向滑動的手勢與飛出動畫移植自作者的「世界觀」Android app（mobile_app/www/app.js），
 * 其餘（切句、localStorage、鍵盤、按鈕、朗讀、白話版、稍後再看、摘要、PWA）為比賽期間新寫。
 * 不登入、不連任何伺服器、不呼叫任何 API；所有資料只存在 localStorage。 */
import { splitText, detectLang } from "./split.js";
import { SAMPLES, sampleCards } from "./samples.js";
import { t, setLang, getLang, applyI18n } from "./i18n.js";

const $=id=>document.getElementById(id);
const KEY="swippy:v1";
const DIST=90, FLICK=42, FLICK_MS=220, PRESS_MOVE=10, IDLE_CAP=120000;
const root=document.documentElement;
const mqReduce=matchMedia("(prefers-reduced-motion: reduce)");
const hasTTS=("speechSynthesis" in window) && typeof window.SpeechSynthesisUtterance==="function";

/* ---------- 儲存 ---------- */
const defSettings=()=>({lang:"zh",fs:"1",theme:"dark",reduce:null,autoRead:false,plain:false,rate:1,chunk:true});
function load(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY)||"null");
    if(s && s.v===1){
      const deck=validDeck(s.deck)?s.deck:null;
      return {v:1,settings:{...defSettings(),...(s.settings||{})},deck};
    }
  }catch(_){}
  return {v:1,settings:defSettings(),deck:null};
}
function validDeck(d){ return d && Array.isArray(d.cards) && Array.isArray(d.queue) && Array.isArray(d.later) && d.marks && typeof d.marks==="object" }
let S=load();
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(_){ say("localStorage error") } }

/* ---------- 狀態列（live region） ---------- */
let sayTimer=null, hideTimer=null;
const STATUS_HIDE_MS=3000;
function say(msg){
  const el=$("status");
  el.classList.remove("is-quiet");
  el.textContent="";                     // 同一句話再出現也要重新讀出
  clearTimeout(sayTimer);
  clearTimeout(hideTimer);
  const inDlg=$("setDlg").open?$("setStatus"):null;
  if(inDlg) inDlg.textContent="";
  sayTimer=setTimeout(()=>{
    el.textContent=msg;
    if(inDlg) inDlg.textContent=msg;
    // 畫面約 3 秒後收起，文字留在 live region，螢幕報讀不會被清掉。
    hideTimer=setTimeout(()=>el.classList.add("is-quiet"),STATUS_HIDE_MS);
  },30);
}

/* ---------- 設定 ---------- */
const reduceOn=()=>S.settings.reduce===null?mqReduce.matches:!!S.settings.reduce;
function applySettings(){
  const st=S.settings;
  setLang(st.lang);
  root.lang=t("htmlLang");
  root.dataset.theme=st.theme;
  root.dataset.fs=st.fs;
  root.classList.toggle("reduce",reduceOn());
  document.title=t("appTitle");
  document.querySelector('meta[name="theme-color"]').content=st.theme==="light"?"#f6f4ee":st.theme==="hc"?"#000000":"#0f1419";
  applyI18n();
  $("helpRows").innerHTML="";
  for(const [k,v] of t("helpRows")){
    const tr=document.createElement("tr");
    const th=document.createElement("th"); th.scope="row"; th.textContent=k;
    const td=document.createElement("td"); td.textContent=v;
    tr.append(th,td); $("helpRows").append(tr);
  }
  $("chunk").checked=st.chunk!==false;
}
function syncSettingsForm(){
  const st=S.settings;
  document.querySelectorAll('input[name="fs"]').forEach(r=>r.checked=r.value===st.fs);
  document.querySelectorAll('input[name="theme"]').forEach(r=>r.checked=r.value===st.theme);
  $("setMotion").checked=reduceOn();
  $("setAutoRead").checked=!!st.autoRead;
  $("setPlain").checked=!!st.plain;
  $("setRate").value=String(st.rate);
  $("autoReadRow").hidden=!hasTTS; $("rateRow").hidden=!hasTTS;
}
function bindSettings(){
  const label=el=>el.closest("label")?.textContent.trim()||"";
  document.querySelectorAll('input[name="fs"]').forEach(r=>r.addEventListener("change",()=>{ S.settings.fs=r.value; done(label(r)) }));
  document.querySelectorAll('input[name="theme"]').forEach(r=>r.addEventListener("change",()=>{ S.settings.theme=r.value; done(label(r)) }));
  $("setMotion").addEventListener("change",e=>{ S.settings.reduce=e.target.checked; done(label(e.target)+(e.target.checked?" ✓":" ✗")) });
  $("setAutoRead").addEventListener("change",e=>{ S.settings.autoRead=e.target.checked; done(label(e.target)+(e.target.checked?" ✓":" ✗")) });
  $("setPlain").addEventListener("change",e=>{ S.settings.plain=e.target.checked; done(label(e.target)+(e.target.checked?" ✓":" ✗")) });
  $("setRate").addEventListener("change",e=>{ S.settings.rate=+e.target.value||1; done(t("rate")+" "+e.target.value+"×") });
  function done(w){ save(); applySettings(); render(); say(t("saved",{w})) }
}

/* ---------- 牌組 ---------- */
const D=()=>S.deck;
function newDeck({cards,title,sampleId,lang}){
  S.deck={id:Date.now().toString(36),sampleId:sampleId||null,title:title||"",lang,cards,
    round:"main",queue:cards.map((_,i)=>i),later:[],laterEver:[],marks:{},view:{},undo:[],roundSize:cards.length,elapsed:0};
  save();
}
function deckTitle(d){
  if(d.sampleId){ const s=SAMPLES.find(x=>x.id===d.sampleId); if(s) return s.title[getLang()] }
  return d.title||t("pasted");
}
function snapshot(what){
  const d=D();
  d.undo.push({what,round:d.round,queue:[...d.queue],later:[...d.later],laterEver:[...d.laterEver],marks:{...d.marks},roundSize:d.roundSize});
  if(d.undo.length>200) d.undo.shift();
}
function tick(){
  const d=D(); if(!d) return;
  const now=Date.now();
  if(d.lastTs && !document.hidden) d.elapsed+=Math.min(IDLE_CAP,Math.max(0,now-d.lastTs));
  d.lastTs=now;
}
document.addEventListener("visibilitychange",()=>{ if(!D()) return; if(document.hidden){ tick(); D().lastTs=null; save() } else D().lastTs=Date.now() });

const FEED={ok:"fOk",star:"fStar",skip:"fSkip"};
const DIR={ok:"right",star:"left",later:"up",skip:"down"};
let busy=false;
function act(kind){
  const d=D();
  if(busy || !d || (d.round!=="main" && d.round!=="later") || !d.queue.length) return;
  stopSpeak(true);
  snapshot(kind);
  tick();
  const i=d.queue.shift();
  let msg;
  if(kind==="later"){
    if(d.round==="main"){ d.marks[i]="later"; d.later.push(i); if(!d.laterEver.includes(i)) d.laterEver.push(i); msg=t("fLater") }
    else { d.queue.push(i); msg=t("fLaterAgain") }
  }else{ d.marks[i]=kind; msg=t(FEED[kind]) }
  if(!d.queue.length){
    if(d.round==="main" && d.later.length) d.round="gate";
    else d.round="done";
  }
  save();
  say(msg);
  const card=$("card");
  if(reduceOn()){ render(); return }
  busy=true;
  flyOut(card,DIR[kind]);
  setTimeout(()=>{ busy=false; render() },240);
}
function undo(){
  const d=D();
  if(busy) return;
  if(!d || !d.undo.length){ say(t("fNoUndo")); return }
  stopSpeak(true);
  const u=d.undo.pop();
  Object.assign(d,{round:u.round,queue:u.queue,later:u.later,laterEver:u.laterEver,marks:u.marks,roundSize:u.roundSize});
  save(); render();
  const w=t("undoWhat")[u.what]||u.what;
  say(t("fUndo",{w}));
}
function startLater(){
  const d=D(); if(!d||d.round!=="gate") return;
  snapshot("laterRound");
  d.round="later"; d.queue=[...d.later]; d.later=[]; d.roundSize=d.queue.length;
  save(); render(); focusStage();
  say(t("laterGo"));
}
function skipLater(){
  const d=D(); if(!d||d.round!=="gate") return;
  snapshot("skipLater"); d.round="done"; save(); render();
  say(t("laterSkip"));
}
function restart(){
  const d=D(); if(!d) return;
  snapshot("restart");
  Object.assign(d,{round:"main",queue:d.cards.map((_,i)=>i),later:[],laterEver:[],marks:{},roundSize:d.cards.length,elapsed:0,lastTs:Date.now()});
  save(); render(); focusStage();
  say(t("againDone"));
}

/* ---------- 畫面 ---------- */
function showView(v){
  $("home").hidden=v!=="home";
  $("deck").hidden=v!=="deck";
  document.body.classList.toggle("deck-open",v==="deck");
}
let view="home";
function render(){
  if(view==="deck" && D()) renderDeck(); else { view="home"; renderHome() }
  showView(view);
}
function renderHome(){
  const d=D();
  const r=$("resume");
  if(d && d.round!=="done"){
    r.hidden=false;
    $("resumeBtn").textContent=t("resumeBtn",{t:deckTitle(d)});
    $("resumeMeta").textContent=t("resumeMeta",{k:d.round==="gate"?0:d.queue.length,x:d.round==="main"?d.later.length:(d.round==="gate"?d.later.length:0)});
  }else r.hidden=true;
  const ul=$("samples");
  let buttons=[...ul.querySelectorAll("button[data-sample]")];
  const same=buttons.length===SAMPLES.length && buttons.every((b,i)=>b.dataset.sample===SAMPLES[i].id);
  if(!same){
    ul.replaceChildren();
    for(const s of SAMPLES){
      const li=document.createElement("li");
      const b=document.createElement("button"); b.type="button"; b.dataset.sample=s.id;
      const a=document.createElement("span"); a.className="t";
      const m=document.createElement("span"); m.className="m";
      b.append(a,m); li.append(b); ul.append(li);
    }
    buttons=[...ul.querySelectorAll("button[data-sample]")];
  }
  const labelLang=getLang()==="zh"?"zh-Hant":"en";
  buttons.forEach((b,i)=>{
    const s=SAMPLES[i];
    const n=s.items.filter(x=>x[0]!=="#").length;
    const a=b.querySelector(".t");
    a.textContent=s.title[getLang()];
    a.lang=labelLang;
    b.querySelector(".m").textContent=t("sampleMeta",{n})+"・"+s.note[getLang()];
  });
}
function renderDeck(){
  const d=D();
  $("deckTitle").textContent=deckTitle(d);
  const card=$("card"), gate=$("laterGate"), sum=$("summary");
  card.hidden=!(d.round==="main"||d.round==="later");
  gate.hidden=d.round!=="gate";
  sum.hidden=d.round!=="done";
  const total=d.round==="later"?d.roundSize:d.cards.length;
  const k=(d.round==="main"||d.round==="later")?d.queue.length:0;
  const n=Math.min(total,total-k+1);
  $("progText").textContent=d.round==="later"?t("progLater",{n,m:total,k}):t("progMain",{n:d.round==="main"?n:total,m:total,k});
  $("laterText").textContent=(d.round==="main"||d.round==="gate")?t("laterCount",{x:d.later.length}):"";
  $("progBar").max=Math.max(1,total); $("progBar").value=total-k;
  document.querySelectorAll(".actions .act[data-act]").forEach(b=>b.hidden=card.hidden);
  $("keysHint").hidden=card.hidden;
  $("undoBtn").classList.toggle("solo",card.hidden);
  if(!card.hidden) paintCard(n,total);
  else if(d.round==="gate") $("laterP").textContent=t("laterP",{x:d.later.length});
  else renderSummary();
}
function paintCard(n,m){
  const d=D(), i=d.queue[0], c=d.cards[i];
  const card=$("card");
  card.style.transition="none"; card.style.transform=""; card.style.opacity="";
  stamps(card,null,0);
  void card.offsetWidth; card.style.transition="";
  card.classList.toggle("sec",!!c.sec);
  const plainOn=!!c.plain && (d.view[i]??S.settings.plain);
  const text=plainOn?c.plain:c.text;
  $("cardPos").textContent=t("cardPos",{n,m});
  const hd=$("cardHeading");
  hd.textContent=c.heading||"";
  if(c.heading) hd.lang=detectLang(c.heading)==="zh"?"zh-Hant":"en";
  else hd.removeAttribute("lang");
  const tx=$("cardText");
  tx.textContent=text;
  tx.lang=detectLang(text)==="zh"?"zh-Hant":"en";
  const badge=[];
  if(c.sec) badge.push(t("secLabel"));
  else if(c.plain) badge.push(plainOn?t("plainBadge"):t("origBadge"));
  if(c.cont) badge.push(t("contLabel"));
  $("cardBadge").textContent=badge.join("・");
  const pb=$("plainBtn");
  pb.textContent=plainOn?t("aOrig"):t("aPlain");
  pb.setAttribute("aria-pressed",String(plainOn));
  pb.setAttribute("aria-disabled",String(!c.plain));
  pb.title=c.plain?"":t("fNoPlain");
  pb.hidden=!!c.sec;
  const rb=$("readBtn");
  rb.hidden=!hasTTS;
  rb.textContent=speaking?t("aStop"):t("aRead");
  rb.setAttribute("aria-pressed",String(speaking));
  $("cardLive").scrollTop=0;
  if(!D().lastTs) D().lastTs=Date.now();
  if(S.settings.autoRead && hasTTS) setTimeout(()=>{ if(view==="deck"&&!$("card").hidden) speakCard() },350);
}
function starIdx(){ const d=D(); return d.cards.map((_,i)=>i).filter(i=>d.marks[i]==="star") }
function renderSummary(){
  const d=D(); tick(); save();
  const cnt=k=>Object.entries(d.marks).filter(([i,v])=>v===k && !d.cards[i].sec).length;
  const read=d.cards.filter((c,i)=>!c.sec && d.marks[i] && d.marks[i]!=="later").length;
  const secs=Math.round(d.elapsed/1000);
  const stats=[["statRead",read],["statOk",cnt("ok")],["statStar",cnt("star")],["statLater",d.laterEver.filter(i=>!d.cards[i].sec).length],["statSkip",cnt("skip")],["statTime",t("mins",{m:Math.floor(secs/60),s:secs%60})]];
  const dl=$("stats"); dl.innerHTML="";
  for(const [k,v] of stats){ const w=document.createElement("div"); const dt=document.createElement("dt"); dt.textContent=t(k); const dd=document.createElement("dd"); dd.textContent=v; w.append(dt,dd); dl.append(w) }
  const ol=$("stars"); ol.innerHTML="";
  const idx=starIdx();
  if(!idx.length){ const li=document.createElement("li"); li.textContent=t("noStars"); li.style.listStyle="none"; ol.append(li) }
  for(const i of idx){ const li=document.createElement("li"); li.textContent=d.cards[i].text; li.lang=detectLang(d.cards[i].text)==="zh"?"zh-Hant":"en"; ol.append(li) }
  $("copyBtn").disabled=!idx.length; $("dlBtn").disabled=!idx.length;
}
function starsText(){
  const d=D();
  return t("txtHeader",{t:deckTitle(d)})+"\n\n"+starIdx().map(i=>"★ "+d.cards[i].text).join("\n")+"\n";
}
async function copyStars(){
  const txt=starsText();
  try{ await navigator.clipboard.writeText(txt); say(t("copied")); return }catch(_){}
  try{
    const ta=document.createElement("textarea"); ta.value=txt; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.opacity="0";
    document.body.append(ta); ta.select(); const ok=document.execCommand("copy"); ta.remove();
    say(ok?t("copied"):t("copyFail"));
  }catch(_){ say(t("copyFail")) }
}
function downloadStars(){
  const blob=new Blob([starsText()],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="swippy-key-points.txt";
  document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  say(t("downloaded"));
}
function focusStage(){ requestAnimationFrame(()=>{ const d=D(); if(!d) return;
  if(d.round==="gate") $("laterH").focus(); else if(d.round==="done") $("doneH").focus(); else $("stage").focus() }) }
function openDeck(){ view="deck"; render(); focusStage() }
function goHome(){ stopSpeak(true); view="home"; render(); $("main").focus() }

/* ---------- 白話版 ---------- */
function togglePlain(){
  const d=D(); if(!d||$("card").hidden) return;
  const i=d.queue[0], c=d.cards[i];
  if(!c.plain){ say(t("fNoPlain")); return }
  const on=!(d.view[i]??S.settings.plain);
  d.view[i]=on; save(); stopSpeak(true); renderDeck();
  say(on?t("fPlain"):t("fOrig"));
}

/* ---------- 朗讀 ---------- */
let speaking=false;
function setSpeaking(v){ speaking=v; const rb=$("readBtn"); if(rb){ rb.textContent=v?t("aStop"):t("aRead"); rb.setAttribute("aria-pressed",String(v)) } }
function pickVoice(lang){
  const vs=speechSynthesis.getVoices()||[];
  if(lang==="zh") return vs.find(v=>/zh[-_]TW/i.test(v.lang))||vs.find(v=>/zh[-_](HK|Hant)/i.test(v.lang))||vs.find(v=>/^zh/i.test(v.lang))||null;
  return vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;
}
function speakCard(){
  if(!hasTTS){ say(t("fNoTTS")); return }
  const body=$("cardText").textContent;
  const head=$("cardHeading").textContent.trim();
  const text=head?head+"\n"+body:body;
  if(!text) return;
  speechSynthesis.cancel();
  const lang=detectLang(body||text);
  const u=new SpeechSynthesisUtterance(text);
  u.lang=lang==="zh"?"zh-TW":"en-US"; u.rate=S.settings.rate||1;
  const v=pickVoice(lang); if(v) u.voice=v;
  u.onend=()=>setSpeaking(false); u.onerror=()=>setSpeaking(false);
  setSpeaking(true);
  speechSynthesis.speak(u);
  say(t("fReading"));
}
function stopSpeak(silent){
  if(!hasTTS) return;
  if(speaking||speechSynthesis.speaking) speechSynthesis.cancel();
  if(speaking){ setSpeaking(false); if(!silent) say(t("fReadStop")) }
}
function toggleRead(){ if(speaking) stopSpeak(false); else speakCard() }
if(hasTTS) speechSynthesis.addEventListener?.("voiceschanged",()=>{});

/* ---------- 手勢（移植自世界觀 app：單卡四方向滑動＋長句先捲動） ---------- */
let g=null;
function stamps(el,kind,a){ for(const k of ["right","left","down","up"]) el.querySelector(".stamp.s-"+k).style.opacity=(k===kind?a:0) }
function springBack(el){ el.style.transform=""; stamps(el,null,0) }
function flyOut(el,kind){
  const W=window.innerWidth, H=window.innerHeight;
  const tr={right:`translate3d(${W*1.2}px,0,0) rotate(16deg)`,left:`translate3d(${-W*1.2}px,0,0) rotate(-16deg)`,down:`translate3d(0,${H}px,0)`,up:`translate3d(0,${-H}px,0)`}[kind];
  el.style.transform=tr; el.style.opacity="0"; stamps(el,kind,1);
}
function onDown(e){
  const d=D();
  if(busy||!d||$("card").hidden||e.button>0) return;
  if(e.target.closest("button,a,input,select,textarea")) return;
  g={id:e.pointerId,x0:e.clientX,y0:e.clientY,lx:e.clientX,ly:e.clientY,t:performance.now(),axis:null,dx:0,dy:0,moved:false,body:$("cardLive")};
}
function onMove(e){
  if(!g||e.pointerId!==g.id) return;
  const el=$("card");
  const dx=e.clientX-g.x0, dy=e.clientY-g.y0;
  if(!g.moved && Math.hypot(dx,dy)>PRESS_MOVE){
    g.moved=true;
    try{ el.setPointerCapture(e.pointerId) }catch(_){}
    window.getSelection()?.removeAllRanges();
    el.style.transition="none";
  }
  if(!g.moved) return;
  e.preventDefault();
  if(!g.axis && Math.hypot(dx,dy)>12) g.axis=Math.abs(dx)>=Math.abs(dy)?"x":"y";
  if(g.axis==="x"){
    g.dx=dx;
    el.style.transform=reduceOn()?"":`translate3d(${dx}px,0,0) rotate(${dx/28}deg)`;
    stamps(el,dx>0?"right":"left",Math.min(1,Math.abs(dx)/110));
  }else if(g.axis==="y"){
    const step=e.clientY-g.ly, b=g.body;
    if(b && g.dy===0 && b.scrollHeight>b.clientHeight+2){
      const canUp=b.scrollTop>0, canDown=b.scrollTop+b.clientHeight<b.scrollHeight-1;
      if((step<0&&canDown)||(step>0&&canUp)){ b.scrollTop-=step; g.ly=e.clientY; g.lx=e.clientX; g.y0=e.clientY; return }
    }
    g.dy=e.clientY-g.y0;
    el.style.transform=reduceOn()?"":`translate3d(0,${g.dy}px,0)`;
    stamps(el,g.dy>0?"down":"up",Math.min(1,Math.abs(g.dy)/110));
  }
  g.lx=e.clientX; g.ly=e.clientY;
}
function onUp(e){
  if(!g||e.pointerId!==g.id) return;
  const s=g; g=null;
  const el=$("card"); el.style.transition="";
  if(!s.moved) return;
  const fast=performance.now()-s.t<FLICK_MS;
  if(s.axis==="x" && (Math.abs(s.dx)>DIST||(Math.abs(s.dx)>FLICK&&fast))) return act(s.dx>0?"ok":"star");
  if(s.axis==="y" && (Math.abs(s.dy)>DIST||(Math.abs(s.dy)>FLICK&&fast))) return act(s.dy>0?"skip":"later");
  springBack(el);
}
function onCancel(){ if(!g) return; g=null; const el=$("card"); el.style.transition=""; springBack(el) }

/* ---------- 鍵盤 ---------- */
function onKey(e){
  if(document.querySelector("dialog[open]")) return;            // 對話框自己處理（Esc 關閉）
  const tgt=e.target;
  const typing=tgt.closest && tgt.closest("input,textarea,select,[contenteditable='true']");
  if(e.key==="Escape"){ stopSpeak(false); return }
  if(typing) return;
  if(e.altKey) return;
  const k=e.key;
  if((e.ctrlKey||e.metaKey) && (k==="z"||k==="Z")){ if(view==="deck"){ e.preventDefault(); undo() } return }
  if(e.ctrlKey||e.metaKey) return;
  if(k==="?"){ e.preventDefault(); openDialog("helpDlg"); return }
  if(view!=="deck") return;
  const onBtn=tgt.closest && tgt.closest("button,a,summary");
  const map={ArrowRight:"ok",ArrowLeft:"star",ArrowUp:"later",ArrowDown:"skip"};
  if(map[k]){ e.preventDefault(); act(map[k]); return }
  if(k==="z"||k==="Z"){ e.preventDefault(); undo(); return }
  if(k==="PageDown"||k==="PageUp"){ const b=$("cardLive"); if(b.scrollHeight>b.clientHeight){ e.preventDefault(); b.scrollBy(0,(k==="PageDown"?1:-1)*b.clientHeight*0.8) } return }
  if(k==="p"||k==="P"){ e.preventDefault(); togglePlain(); return }
  if(k==="r"||k==="R"||(k===" "&&!onBtn)){ if(!$("card").hidden){ e.preventDefault(); toggleRead() } return }
  if(k==="Enter" && D()?.round==="gate" && !onBtn){ e.preventDefault(); startLater() }
}

/* ---------- 對話框 ---------- */
function openDialog(id){ const dl=$(id); if(id==="setDlg") syncSettingsForm(); if(!dl.open) dl.showModal() }

/* ---------- 開始 ---------- */
function startSample(id){
  const s=SAMPLES.find(x=>x.id===id); if(!s) return;
  stopSpeak(true);
  newDeck({cards:sampleCards(s),sampleId:s.id,lang:s.lang});
  openDeck();
  say(t("splitDone",{n:D().cards.length}));
}
function startPaste(){
  const raw=$("paste").value;
  if(!raw.trim()){ say(t("pasteEmpty")); $("paste").focus(); return }
  const cards=splitText(raw,{chunk:$("chunk").checked});
  if(!cards.length){ say(t("pasteNone")); return }
  const first=cards.find(c=>!c.sec)||cards[0];
  const title=(first.text.length>30?first.text.slice(0,30)+"…":first.text);
  newDeck({cards,title,lang:detectLang(raw)});
  openDeck();
  say(t("splitDone",{n:cards.length})+" "+t("pastePlainNote"));
}
function clearData(){
  if(!confirm(t("clearConfirm"))) return;
  stopSpeak(true);
  try{ localStorage.removeItem(KEY) }catch(_){}
  const lang=S.settings.lang;
  S={v:1,settings:{...defSettings(),lang},deck:null};
  $("paste").value="";
  applySettings(); view="home"; render();
  say(t("cleared"));
}

function boot(){
  const qs=new URLSearchParams(location.search);
  if(qs.get("lang")==="en"||qs.get("lang")==="zh"){ S.settings.lang=qs.get("lang") }
  applySettings(); bindSettings();
  mqReduce.addEventListener?.("change",()=>applySettings());
  $("homeBtn").addEventListener("click",goHome);
  $("homeLink").addEventListener("click",e=>{ e.preventDefault(); goHome() });
  $("helpBtn").addEventListener("click",()=>openDialog("helpDlg"));
  $("setBtn").addEventListener("click",()=>openDialog("setDlg"));
  $("langBtn").addEventListener("click",()=>{ S.settings.lang=getLang()==="zh"?"en":"zh"; save(); applySettings(); render(); say(getLang()==="zh"?"已切換成中文":"Switched to English") });
  $("samples").addEventListener("click",e=>{ const b=e.target.closest("button[data-sample]"); if(b) startSample(b.dataset.sample) });
  $("splitBtn").addEventListener("click",startPaste);
  $("chunk").addEventListener("change",e=>{ S.settings.chunk=e.target.checked; save() });
  $("resumeBtn").addEventListener("click",()=>{ openDeck(); say(t("resumeH")) });
  $("clearBtn").addEventListener("click",clearData);
  document.querySelectorAll(".actions .act[data-act]").forEach(b=>b.addEventListener("click",()=>act(b.dataset.act)));
  $("undoBtn").addEventListener("click",undo);
  $("plainBtn").addEventListener("click",togglePlain);
  $("readBtn").addEventListener("click",toggleRead);
  $("laterGo").addEventListener("click",startLater);
  $("laterSkip").addEventListener("click",skipLater);
  $("copyBtn").addEventListener("click",copyStars);
  $("dlBtn").addEventListener("click",downloadStars);
  $("againBtn").addEventListener("click",restart);
  $("anotherBtn").addEventListener("click",goHome);
  const card=$("card");
  card.addEventListener("pointerdown",onDown);
  card.addEventListener("pointermove",onMove);
  card.addEventListener("pointerup",onUp);
  card.addEventListener("pointercancel",onCancel);
  document.addEventListener("keydown",onKey);
  const net=$("net");
  const upd=()=>{ if(!navigator.onLine){ net.hidden=false; net.textContent=t("offlineNow") } };
  addEventListener("offline",upd); addEventListener("online",()=>{ net.hidden=true }); upd();
  render();
  document.documentElement.classList.remove("i18n-pending");
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    navigator.serviceWorker.register("./sw.js").then(()=>navigator.serviceWorker.ready).then(()=>{
      if(navigator.onLine){ net.hidden=false; net.textContent=t("offline"); setTimeout(()=>{ if(navigator.onLine) net.hidden=true },6000) }
    }).catch(()=>{});
  }
  window.__swippy={get state(){ return S }};   // 給自動化測試讀狀態用（唯讀）
}
boot();
