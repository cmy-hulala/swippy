// 執行：node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { splitText, detectLang, cjkCount, wordCount } from "../js/split.js";
import { SAMPLES, sampleCards } from "../js/samples.js";
const T=s=>splitText(s).map(c=>c.text);

test("1 中文基本斷句", ()=>assert.deepEqual(T("光合作用需要陽光。植物會放出氧氣！你知道為什麼嗎？"),["光合作用需要陽光。","植物會放出氧氣！","你知道為什麼嗎？"]));
test("2 英文基本斷句", ()=>assert.deepEqual(T("The cat sat on the mat. Then the dog came in! Did they fight at all?"),["The cat sat on the mat.","Then the dog came in!","Did they fight at all?"]));
test("3 英文縮寫不切", ()=>assert.deepEqual(T("Dr. Smith met Mr. Lee in the U.S. last year. They talked about many things, e.g. memory and sleep."),["Dr. Smith met Mr. Lee in the U.S. last year.","They talked about many things, e.g. memory and sleep."]));
test("4 小數點不切", ()=>assert.deepEqual(T("The value of pi is about 3.14 in most cases. That is good enough here."),["The value of pi is about 3.14 in most cases.","That is good enough here."]));
test("5 網址不切", ()=>assert.deepEqual(T("Read more at https://example.com/a.b?x=1 before class. The quiz is on Friday morning."),["Read more at https://example.com/a.b?x=1 before class.","The quiz is on Friday morning."]));
test("6 結尾引號跟著前一句", ()=>assert.deepEqual(T("兔子大笑說：「你怎麼可能贏我。」烏龜沒有回答，只是慢慢往前爬。"),["兔子大笑說：「你怎麼可能贏我。」","烏龜沒有回答，只是慢慢往前爬。"]));
test("7 英文引號", ()=>assert.deepEqual(T("She said, \"We start at nine.\" Everyone nodded and opened their books."),["She said, \"We start at nine.\"","Everyone nodded and opened their books."]));
test("8 太短併到前一句（中）", ()=>assert.deepEqual(T("「我們來比賽吧。」烏龜說。"),["「我們來比賽吧。」烏龜說。"]));
test("9 太短併到前一句（英）", ()=>assert.deepEqual(T("We tested it twice in the lab. It failed. Then we changed the sample size and tried again."),["We tested it twice in the lab. It failed.","Then we changed the sample size and tried again."]));
test("10 列表每項一張、標題併入下一張", ()=>{
  const c=splitText("# 第一節 重點\n- 需求增加，價格上升\n- 供給增加，價格下降\n1. 先畫圖再算數字");
  assert.deepEqual(c,[{text:"需求增加，價格上升",heading:"第一節 重點"},{text:"供給增加，價格下降"},{text:"1. 先畫圖再算數字"}]);
});
test("11 中文長句在逗號切開", ()=>{
  const s="從前從前有一隻非常非常愛說話的兔子，".repeat(5)+"牠每天都在森林裡到處跟遇到的每一隻動物說自己跑得最快，而且還說就算讓對手先跑一百公尺也一樣會贏，大家都聽膩了。";
  const c=splitText(s);
  assert.ok(c.length>=2); assert.ok(c.every(x=>(x.text.match(/[\u4e00-\u9fff]/g)||[]).length<=120)); assert.equal(c[1].cont,true);
  assert.equal(c.map(x=>x.text).join(""),s);
});
test("12 英文長句在逗號切開", ()=>{
  const s="Working memory is the small mental workspace that holds information for a few seconds, and it is limited, so when a paragraph is long, full of new terms, and has no breaks, many students lose the thread before they reach the end of the sentence, which is frustrating.";
  const c=splitText(s); assert.ok(c.length>=2); assert.ok(c.every(x=>x.text.split(/\s+/).length<=40));
});
test("13 硬換行接回同一段、中英混合", ()=>assert.deepEqual(T("This line is wrapped\nacross two lines in the PDF.\n\n中文段落也會\n被接起來。English after Chinese works too."),["This line is wrapped across two lines in the PDF.","中文段落也會被接起來。","English after Chinese works too."]));
test("14 省略號", ()=>assert.deepEqual(T("他想了很久很久……最後還是決定去考試。I waited... and waited for the bus. It never came to the stop."),["他想了很久很久……","最後還是決定去考試。","I waited... and waited for the bus.","It never came to the stop."]));
test("15 空字串與純符號", ()=>{ assert.deepEqual(splitText(""),[]); assert.deepEqual(splitText("。。。\n---"),[]) });
test("16 語言偵測", ()=>{ assert.equal(detectLang("供給與需求"),"zh"); assert.equal(detectLang("Working memory"),"en") });
test("17 標題併入下一句、文末孤標題仍保留", ()=>{
  const c=splitText("# Week 3\nWorking memory holds several items for a few seconds. It fades quite quickly.\n# 沒有下文的標題");
  assert.equal(c[0].heading,"Week 3");
  assert.equal(c[0].sec,undefined);
  assert.equal(c[1].heading,undefined);
  assert.deepEqual(c.at(-1),{text:"沒有下文的標題",sec:true});
});
test("18 範例第一張不是單獨標題，虛構講義夠長", ()=>{
  for(const s of SAMPLES){
    const cards=sampleCards(s);
    assert.equal(cards[0].sec,undefined,s.id);
    assert.ok(cards[0].plain,s.id);
    assert.ok(cards[0].heading,s.id);
    assert.ok(cards.every(c=>c.sec|| (c.plain&&c.plain.trim())),s.id);
    assert.ok(s.items.filter(x=>x[0]!=="#").every(x=>x[1]&&String(x[1]).trim()),s.id);
  }
  const psych=SAMPLES.find(s=>s.id==="psych-wm");
  const econ=SAMPLES.find(s=>s.id==="econ-sd");
  const psychWords=wordCount(psych.items.filter(x=>x[0]!=="#").map(x=>x[0]).join(" "));
  const econCjk=cjkCount(econ.items.filter(x=>x[0]!=="#").map(x=>x[0]).join(""));
  assert.ok(psychWords>=1200,"psych words "+psychWords);
  assert.ok(econCjk>=2000,"econ cjk "+econCjk);
});
