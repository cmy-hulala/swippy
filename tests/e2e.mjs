// Swippy 端對端檢查：Playwright（系統 Chrome）+ axe-core。
// 用法：先在專案根目錄 `python -m http.server 8765`，再 `cd tests && npm i && npm run e2e`
// 環境變數：BASE（預設 http://localhost:8765/）、CHROME（Chrome 執行檔路徑，可省略）
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const BASE=process.env.BASE||"http://localhost:8765/";
const OUT=new URL("./out/",import.meta.url).pathname; fs.mkdirSync(OUT,{recursive:true});
const results=[]; let failed=0;
const ok=(name,cond,extra="")=>{ results.push(`${cond?"PASS":"FAIL"}  ${name}${extra?"  — "+extra:""}`); if(!cond) failed++ };
const exe=process.env.CHROME||["/usr/bin/google-chrome","C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(p=>fs.existsSync(p));
const browser=await chromium.launch({executablePath:exe,headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:900}});
const page=await ctx.newPage();
await page.addInitScript(()=>{
  window.__cls=0;
  try{
    new PerformanceObserver(list=>{
      for(const e of list.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value;
    }).observe({type:"layout-shift",buffered:true});
  }catch(_){}
});
async function inView(p,sel){
  const vp=p.viewportSize();
  const b=await p.locator(sel).boundingBox();
  const fit=!!b && b.y>=-1 && (b.y+b.height)<=vp.height+1 && b.x>=-1 && (b.x+b.width)<=vp.width+1;
  return {fit,b,vp};
}
const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error") errors.push(m.text()) });
const status=()=>page.locator("#status").textContent();
const prog=()=>page.locator("#progText").textContent();
const cardText=()=>page.locator("#cardText").textContent();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function axe(label){
  const r=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa","best-practice"]).analyze();
  const v=r.violations.map(x=>`${x.id}(${x.impact},${x.nodes.length})`);
  ok(`axe 無違規：${label}`, v.length===0, v.join(", "));
  return r;
}

try{
await page.goto(BASE,{waitUntil:"load"});
await sleep(400);
const cls=await page.evaluate(()=>window.__cls||0);
ok("首頁載入 CLS < 0.1", cls<0.1, cls.toFixed(3));
ok("頁面標題含 Swippy", (await page.title()).includes("Swippy"));
const vp=await page.locator('meta[name=viewport]').getAttribute("content");
ok("viewport 允許縮放", !/user-scalable=no|maximum-scale/.test(vp), vp);
await axe("開始畫面（深色）");
await page.screenshot({path:OUT+"01-home.png",fullPage:true});

// 只用鍵盤：Tab 到第一個範例 → Enter
let found=false;
for(let i=0;i<30;i++){ await page.keyboard.press("Tab"); const s=await page.evaluate(()=>document.activeElement?.dataset?.sample||""); if(s==="psych-wm"){found=true;break} }
ok("純鍵盤 Tab 可以到範例按鈕", found);
await page.keyboard.press("Enter");
await page.waitForSelector("#deck:not([hidden])");
ok("焦點移到卡片區", await page.evaluate(()=>document.activeElement?.id==="stage"));
const focusRing=await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle);
ok("焦點框可見", focusRing!=="none", focusRing);
const total=await page.evaluate(()=>window.__swippy.state.deck.cards.length);
ok("進度文字", (await prog()).includes(`第 1 張 / 共 ${total} 張`), await prog());
ok("第一張是句子而不是單獨標題", (await page.locator("#plainBtn").isVisible()) && ((await page.locator("#cardHeading").textContent())||"").trim().length>0 && !(await page.locator("#cardBadge").textContent()).includes("章節"));
ok("卡片 aria-live=polite", (await page.locator("#cardLive").getAttribute("aria-live"))==="polite");
ok("卡片內含位置說明", (await page.locator("#cardPos").textContent()).includes(`第 1 張，共 ${total} 張`));
await axe("卡片畫面");
await page.screenshot({path:OUT+"02-card.png"});

const first=await cardText();
await page.keyboard.press("ArrowRight"); await sleep(350);
ok("→ 懂了 有文字回饋", (await status()).includes("已讀懂"), await status());
ok("→ 換下一張", (await cardText())!==first);
await page.keyboard.press("ArrowLeft"); await sleep(350);
ok("← 重點 有文字回饋", (await status()).includes("已標重點 ★"), await status());
await page.keyboard.press("ArrowUp"); await sleep(350);
ok("↑ 稍後 有文字回饋", (await status()).includes("稍後再看"), await status());
ok("稍後再看計數", (await page.locator("#laterText").textContent()).includes("1"));
await page.keyboard.press("ArrowDown"); await sleep(350);
ok("↓ 略過 有文字回饋", (await status()).includes("已略過"), await status());
const before=await prog();
await page.keyboard.press("z"); await sleep(150);
ok("Z 復原", (await status()).includes("已復原"), await status()+" / "+await prog());
ok("復原後進度倒退", (await prog())!==before);
await page.keyboard.press("Control+z"); await sleep(150);
ok("Ctrl+Z 也能復原", (await status()).includes("已復原"));
// 白話
const orig=await cardText();
await page.keyboard.press("p"); await sleep(100);
ok("P 切白話版", (await cardText())!==orig && (await status()).includes("白話"), await cardText());
ok("白話按鈕 aria-pressed=true", (await page.locator("#plainBtn").getAttribute("aria-pressed"))==="true");
await page.keyboard.press("p"); await sleep(100);
ok("P 切回原文", (await cardText())===orig);
// 朗讀（headless 可能沒有聲音，只檢查 UI 狀態與回饋）
await page.keyboard.press("r"); await sleep(150);
ok("R 朗讀有回饋", (await status()).includes("朗讀"), await status());
await page.keyboard.press("r"); await sleep(100);
// ? 說明對話框
await page.keyboard.press("?"); await sleep(100);
ok("? 打開說明", await page.locator("#helpDlg").evaluate(d=>d.open));
await axe("說明對話框");
await page.keyboard.press("Escape"); await sleep(100);
ok("Esc 關閉說明", !(await page.locator("#helpDlg").evaluate(d=>d.open)));
// 卡片文字可選取
const sel=await page.locator("#cardText").evaluate(el=>getComputedStyle(el).userSelect||getComputedStyle(el).webkitUserSelect);
ok("卡片文字可選取", sel!=="none", sel);
// 按鈕也能操作
const p1=await prog();
await page.locator(".act.a-ok").click(); await sleep(350);
ok("「懂了 →」按鈕可用", (await prog())!==p1 && (await status()).includes("已讀懂"));
// 滑鼠拖曳＝滑動手勢
const box=await page.locator("#card").boundingBox();
const p2=await prog();
await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();
for(let i=1;i<=10;i++) await page.mouse.move(box.x+box.width/2,box.y+box.height/2+i*20);
await page.mouse.up(); await sleep(400);
ok("下滑手勢＝略過", (await status()).includes("已略過") && (await prog())!==p2, await status());
await page.keyboard.press("ArrowUp"); await sleep(350);
// 重新整理後進度還在
const p3=await prog();
await page.reload({waitUntil:"load"});
ok("重新整理後出現「繼續上次」", await page.locator("#resume").isVisible());
await page.locator("#resumeBtn").click(); await sleep(200);
ok("繼續上次＝同一進度", (await prog())===p3, p3+" vs "+await prog());
// 讀完主牌組 → 稍後再看 → 摘要
for(let i=0;i<120;i++){ const r=await page.evaluate(()=>window.__swippy.state.deck.round); if(r!=="main") break; await page.keyboard.press(i%3===0?"ArrowLeft":"ArrowRight"); await sleep(260) }
ok("主牌組讀完出現稍後再看", await page.locator("#laterGate").isVisible());
await axe("稍後再看入口");
await page.locator("#laterGo").click(); await sleep(150);
ok("進入稍後再看", (await prog()).includes("稍後再看"), await prog());
for(let i=0;i<10;i++){ const r=await page.evaluate(()=>window.__swippy.state.deck.round); if(r!=="later") break; await page.keyboard.press("ArrowRight"); await sleep(260) }
ok("出現摘要", await page.locator("#summary").isVisible());
ok("摘要列出重點句", (await page.locator("#stars li").count())>=5, String(await page.locator("#stars li").count()));
await axe("摘要");
await page.screenshot({path:OUT+"03-summary.png",fullPage:true});
await ctx.grantPermissions(["clipboard-read","clipboard-write"],{origin:new URL(BASE).origin});
await page.locator("#copyBtn").click(); await sleep(200);
ok("複製重點", (await status()).includes("已複製"), await status());
const dl=page.waitForEvent("download"); await page.locator("#dlBtn").click(); const d=await dl;
ok("下載 .txt", d.suggestedFilename()==="swippy-key-points.txt");
// 貼上文字
await page.locator("#anotherBtn").click();
await page.fill("#paste","# 第一節\n供給增加，價格下降。需求增加，價格上升！Dr. Lee said the price rose 3.5 percent. Then it fell again.\n- 條列一的內容\n- 條列二的內容");
await page.locator("#splitBtn").click(); await sleep(200);
const n=await page.evaluate(()=>window.__swippy.state.deck.cards.length);
ok("貼上文字切成卡片（標題併入下一張）", n===6, "cards="+n);
await page.keyboard.press("ArrowRight"); await sleep(300);
await page.keyboard.press("p"); await sleep(100);
ok("貼上文字按 P 會說明沒有白話版", (await status()).includes("白話版只有範例有"), await status());
// 設定：特大字＋高對比＋英文
await page.locator("#setBtn").click(); await sleep(100);
await axe("設定對話框");
await page.locator('input[name=fs][value="3"]').check();
await page.locator('input[name=theme][value="hc"]').check(); await sleep(100);
ok("設定有文字回饋（對話框內）", (await page.locator("#setStatus").textContent()).includes("設定已儲存"), await page.locator("#setStatus").textContent());
await page.keyboard.press("Escape");
ok("字級 30px", (await page.locator("#cardText").evaluate(el=>getComputedStyle(el.parentElement).fontSize))==="30px");
await axe("高對比＋特大字");
await page.screenshot({path:OUT+"04-hc.png"});
ok("中文介面時語言鈕是 English 且 lang=en", (await page.locator("#langBtn").textContent()).trim()==="English" && (await page.locator("#langBtn").getAttribute("lang"))==="en");
await page.locator("#langBtn").click(); await sleep(100);
ok("英文介面", (await page.locator(".act.a-ok").textContent()).includes("Got it") && (await page.evaluate(()=>document.documentElement.lang))==="en");
ok("英文介面時語言鈕是中文且 lang=zh-Hant", (await page.locator("#langBtn").textContent()).trim()==="中文" && (await page.locator("#langBtn").getAttribute("lang"))==="zh-Hant");
await page.locator('#setBtn').click(); await page.locator('input[name=theme][value="light"]').check(); await page.keyboard.press("Escape");
await axe("英文＋淺色");
await page.screenshot({path:OUT+"05-en-light.png"});
// 離線
await page.evaluate(()=>navigator.serviceWorker.ready);
await sleep(500);
await ctx.setOffline(true);
await page.reload({waitUntil:"load"});
ok("離線重新整理仍可開", (await page.title()).includes("Swippy") && await page.locator("#samples button").count()===3);
await ctx.setOffline(false);
// 減少動態
const ctx2=await browser.newContext({reducedMotion:"reduce"}); const p2b=await ctx2.newPage();
await p2b.goto(BASE); await p2b.locator('button[data-sample="gettysburg"]').click();
const tr=await p2b.locator("#card").evaluate(el=>getComputedStyle(el).transitionDuration);
ok("prefers-reduced-motion：沒有動畫", /^0s(, 0s)*$/.test(tr), tr);
await p2b.keyboard.press("ArrowRight");
ok("減少動態時直接換卡", (await p2b.locator("#progText").textContent()).includes("第 2 張"));
// 手機尺寸
const ctx3=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}); const p3b=await ctx3.newPage();
await p3b.goto(BASE); await p3b.locator('button[data-sample="econ-sd"]').click(); await sleep(200);
await p3b.screenshot({path:OUT+"06-mobile.png"});
const r3=await new AxeBuilder({page:p3b}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
ok("axe 無違規：手機卡片畫面", r3.violations.length===0, r3.violations.map(x=>x.id).join(","));
ok("沒有 JS 錯誤", errors.length===0, errors.join(" | "));
// 200% 縮放以 CSS 視窗 640×400 代表（1280×800 的一半）；320×640 代表小手機
async function deckFits(p,label){
  await p.goto(BASE,{waitUntil:"load"});
  await p.locator('button[data-sample="psych-wm"]').click();
  await p.waitForSelector("#deck:not([hidden])");
  await sleep(400);
  const actions=await inView(p,".actions");
  ok(`${label}：四個動作鈕在視窗內`, actions.fit, JSON.stringify({b:actions.b,h:actions.vp.height,w:actions.vp.width}));
  const read=await inView(p,"#readBtn");
  const tts=await p.evaluate(()=>("speechSynthesis" in window)&&typeof SpeechSynthesisUtterance==="function");
  if(tts) ok(`${label}：朗讀鈕在視窗內`, read.fit, JSON.stringify(read.b));
  const status=await p.locator("#status").boundingBox();
  const overlaps=read.b && status && status.width>2 && status.height>2 && read.b.y<status.y+status.height && read.b.y+read.b.height>status.y && read.b.x<status.x+status.width && read.b.x+read.b.width>status.x;
  ok(`${label}：狀態列沒有蓋住朗讀鈕`, !overlaps);
  const wide=await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1);
  ok(`${label}：沒有水平捲動`, wide);
  const ax=await new AxeBuilder({page:p}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa","best-practice"]).analyze();
  ok(`axe 無違規：${label}`, ax.violations.length===0, ax.violations.map(x=>`${x.id}(${x.impact})`).join(", "));
}
const ctxZ=await browser.newContext({viewport:{width:640,height:400}});
const pZ=await ctxZ.newPage();
await deckFits(pZ,"200% 縮放 640×400");
await pZ.keyboard.press("ArrowRight");
await sleep(200);
ok("動作後狀態列有文字", (await pZ.locator("#status").textContent()).includes("已讀懂"));
await sleep(3400);
const quiet=await pZ.locator("#status").evaluate(el=>({
  quiet:el.classList.contains("is-quiet"),
  text:el.textContent||"",
  live:el.getAttribute("aria-live"),
  clipped:getComputedStyle(el).position==="absolute"
}));
ok("約 3 秒後狀態文字視覺收起，live region 仍留著", quiet.quiet && quiet.clipped && quiet.live==="polite" && quiet.text.includes("已讀懂"), JSON.stringify(quiet));
await ctxZ.close();
const ctxN=await browser.newContext({viewport:{width:320,height:640}});
const pN=await ctxN.newPage();
await deckFits(pN,"320×640 小手機");
await ctxN.close();
}catch(e){ ok("測試流程中斷",false,String(e).split("\n")[0]) }
await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length-failed}/${results.length} passed`);
process.exit(failed?1:0);
