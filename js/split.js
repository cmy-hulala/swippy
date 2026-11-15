/* Swippy 切句：把一段長文切成「一次一句」的卡片。純函式、不呼叫任何 API。
 * 規則（AccessED 企劃 1-5）：
 * - 斷句：中文 。！？；…，英文 . ! ?（後面接空白或換行）；空行與換行是段落切點
 * - 不誤切：e.g. i.e. Dr. Mr. Mrs. etc. vs. U.S.、小數 3.14、網址、結尾引號（。」 ." 跟著前一句）
 * - 太短（中文 < 6 字、英文 < 4 個字）併到前一句；太長（中文 > 120 字、英文 > 40 個字）在 ， , ; ： 處再切
 * - 列表項目（- * • 1.）每項一張；# 標題變成章節卡 {sec:true}
 * 回傳 [{text, sec?, cont?}]；cont=true 表示是上一句被切開的後半段。
 */
const CJK_RE=/[\u3400-\u9fff\uf900-\ufaff]/;
const CJK_G=/[\u3400-\u9fff\uf900-\ufaff]/g;
const ABBR=/(?:^|[\s(（"“])(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|No|Fig|Vol|pp|Inc|Ltd|U\.S|U\.K|a\.m|p\.m|approx|cf)\.$/i;
const CLOSERS="」』”’\"')）】》";
const URL_RE=/\b(?:https?:\/\/|www\.)[^\s<>「」，。]+[^\s<>「」，。.,;:!?)\]]/gi;

export function cjkCount(s){ return (String(s).match(CJK_G)||[]).length }
export function wordCount(s){ return String(s).replace(CJK_G," ").split(/\s+/).filter(w=>/[A-Za-z0-9]/.test(w)).length }
export function detectLang(s){ const c=cjkCount(s), w=wordCount(s); return c>=w ? "zh" : "en" }
function isShort(s){ return CJK_RE.test(s) ? cjkCount(s)<6 && wordCount(s)<2 : wordCount(s)<4 }
function isLong(s){ return CJK_RE.test(s) ? cjkCount(s)>120 : wordCount(s)>40 }
function size(s){ return CJK_RE.test(s) ? cjkCount(s)/120 : wordCount(s)/40 }

function protect(text){
  const slots=[];
  const out=text.replace(URL_RE,m=>{ slots.push(m); return "\u0000"+(slots.length-1)+"\u0001" });
  return {out, restore:s=>s.replace(/\u0000(\d+)\u0001/g,(_m,i)=>slots[+i])};
}

const LIST_RE=/^(?:[-*•‧・+]|\d{1,3}[.)、]|[（(]\d{1,3}[）)])\s+/;
/* 回傳區塊 [{kind:'sec'|'item'|'para', text}] */
function blocks(text){
  const out=[]; let cur=null;
  const flush=()=>{ if(cur&&cur.text.trim()) out.push(cur); cur=null };
  for(const raw of text.split("\n")){
    const line=raw.trim();
    if(!line){ flush(); continue }
    const h=line.match(/^#{1,6}\s+(.+)$/);
    if(h){ flush(); out.push({kind:"sec",text:h[1].replace(/\s*#+$/,"").trim()}); continue }
    if(LIST_RE.test(line)){ flush(); cur={kind:"item",text:line.replace(/^(?:[-*•‧・+])\s+/,"")}; continue }
    if(!cur){ cur={kind:"para",text:line}; continue }
    const a=cur.text.slice(-1), b=line[0];
    cur.text += (CJK_RE.test(a)||CJK_RE.test(b)) ? line : " "+line;
  }
  flush();
  return out;
}

export function sentences(p){
  const out=[]; let start=0;
  const push=end=>{ const s=p.slice(start,end).trim(); if(s) out.push(s); start=end };
  for(let i=0;i<p.length;i++){
    const ch=p[i];
    if(!"。！？!?…；.".includes(ch)) continue;
    let j=i+1;
    while(j<p.length && "。！？!?….".includes(p[j])) j++;
    while(j<p.length && CLOSERS.includes(p[j])) j++;
    if(".!?".includes(ch) && !"。！？…".includes(p[j-1])){
      const next=p.slice(j);
      if(j<p.length && !/^\s/.test(next) && !CJK_RE.test(next[0])){ i=j-1; continue }    // 3.14、U.S.A、e.g.x
      if(ch==="."){
        if(ABBR.test(p.slice(Math.max(0,i-8),i+1))){ i=j-1; continue }
        if(/^\s*[a-z]/.test(next)){ i=j-1; continue }                                      // 小寫開頭：多半不是新句
      }
    }
    push(j); i=j-1;
  }
  push(p.length);
  return out;
}

function chunkLong(s){
  if(!isLong(s)) return [s];
  const pieces=[]; let last=0, m;
  const re=/[，,;；：:]\s*/g;
  while((m=re.exec(s))){ pieces.push(s.slice(last,m.index+m[0].length)); last=m.index+m[0].length }
  pieces.push(s.slice(last));
  // 盡量平均切成 n 段，每段不超過上限
  const n=Math.ceil(size(s)); const target=size(s)/n;
  const out=[]; let cur="";
  for(const pc of pieces){
    if(cur && (size(cur)>=target*0.85 || size(cur+pc)>1)){ out.push(cur.trim()); cur=pc }
    else cur+=pc;
  }
  if(cur.trim()) out.push(cur.trim());
  // 最後一段太短就併回去
  if(out.length>1 && isShort(out[out.length-1])){ const t=out.pop(); out[out.length-1]+=(CJK_RE.test(t[0])?"":" ")+t }
  return out;
}

function joinText(a,b){ return (CJK_RE.test(a.slice(-1))||CJK_RE.test(b[0])) ? a+b : a+" "+b }

export function splitText(text, {chunk=true}={}){
  const {out, restore}=protect(String(text??"").replace(/\r\n?/g,"\n").replace(/\u00a0/g," "));
  const cards=[];
  for(const b of blocks(out)){
    if(b.kind==="sec"){ cards.push({text:restore(b.text), sec:true}); continue }
    let ss=b.kind==="item" ? [b.text] : sentences(b.text);
    // 太短併到前一句（同一段內）；段首太短就併到下一句
    const merged=[];
    for(const s of ss){
      if(merged.length && isShort(s)) merged[merged.length-1]=joinText(merged[merged.length-1],s);
      else merged.push(s);
    }
    if(merged.length>1 && isShort(merged[0])){ const f=merged.shift(); merged[0]=joinText(f,merged[0]) }
    for(const s of merged){
      const parts=chunk?chunkLong(s):[s];
      parts.forEach((pt,k)=>{
        const t=restore(pt).trim();
        if(!t || /^[\s\p{P}\p{S}]*$/u.test(t)) return;
        cards.push(k>0?{text:t,cont:true}:{text:t});
      });
    }
  }
  return cards;
}
