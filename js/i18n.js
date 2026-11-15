/* 介面文字：繁體中文（預設）＋ English。網址加 ?lang=en 可直接開英文版。 */
const D={
zh:{
  htmlLang:"zh-Hant", appTitle:"Swippy｜一次一句，把長文讀完",
  skip:"跳到主要內容", home:"首頁", help:"鍵盤說明", settings:"設定", langBtn:"English", langBtnAria:"Switch to English",
  tagline:"把讀不下去的長文，切成一次一句的卡片，一張一張滑完。",
  privacy:"文字只存在你的瀏覽器（localStorage），不需登入、不會上傳任何資料。",
  resumeH:"繼續上次", resumeBtn:"繼續讀「{t}」", resumeMeta:"還剩 {k} 張・稍後再看 {x} 張",
  samplesH:"選一篇範例", sampleMeta:"{n} 張卡・有白話版",
  pasteH:"貼上自己的文字", pasteLabel:"把講義、文章或筆記貼在這裡", pastePh:"例如：把 PDF 講義的一段複製貼上…",
  chunk:"長句自動再切短", splitBtn:"切成卡片", pasteEmpty:"請先貼上一些文字。", pasteNone:"這段文字切不出句子，換一段試試。",
  pastePlainNote:"白話版只有範例有（貼上的文字不會呼叫任何 AI）。",
  pasted:"我貼上的文字", splitDone:"已切成 {n} 張卡片。",
  clearData:"清除我的資料", clearConfirm:"確定要刪除這台裝置上 Swippy 的所有進度與設定嗎？", cleared:"已清除所有資料。",
  progMain:"第 {n} 張 / 共 {m} 張・剩 {k} 張", progLater:"稍後再看：第 {n} 張 / 共 {m} 張・剩 {k} 張", laterCount:"稍後再看：{x} 張",
  progAria:"閱讀進度",
  stampOk:"懂了", stampStar:"★ 重點", stampLater:"稍後", stampSkip:"略過",
  aOk:"懂了 →", aStar:"← 重點 ★", aLater:"↑ 稍後", aSkip:"↓ 略過", aUndo:"復原 Z", aRead:"🔊 朗讀 R", aStop:"⏹ 停止 R", aPlain:"白話 P", aOrig:"原文 P",
  aOkFull:"讀懂了，下一張（右滑或 →）", aStarFull:"標成重點（左滑或 ←）", aLaterFull:"稍後再看（上滑或 ↑）", aSkipFull:"略過（下滑或 ↓）",
  fOk:"已讀懂", fStar:"已標重點 ★", fLater:"稍後再看", fLaterAgain:"再放到最後", fSkip:"已略過", fUndo:"已復原：{w}", fNoUndo:"沒有可以復原的動作",
  fReading:"朗讀中…", fReadStop:"已停止朗讀", fNoTTS:"這個瀏覽器不支援朗讀。",
  fPlain:"顯示白話版", fOrig:"顯示原文", fNoPlain:"白話版只有範例有；這張是你貼上的文字。",
  cardPos:"第 {n} 張，共 {m} 張：", secLabel:"章節", contLabel:"接上一張", plainBadge:"白話版", origBadge:"原文",
  stageAria:"卡片。方向鍵：→ 懂了、← 重點、↑ 稍後、↓ 略過；Z 復原、R 朗讀、P 白話版、? 說明",
  keysHint:"→ 懂了　← 重點★　↑ 稍後　↓ 略過　Z 復原　R/空白 朗讀　P 白話　? 說明",
  actionsAria:"卡片動作",
  laterH:"主牌組讀完了！", laterP:"還有 {x} 張「稍後再看」，要現在再看一輪嗎？", laterGo:"開始稍後再看", laterSkip:"略過，看摘要",
  doneH:"讀完了！", statRead:"讀完", statOk:"懂了", statStar:"重點", statLater:"稍後再看", statSkip:"略過", statTime:"花了",
  mins:"{m} 分 {s} 秒", starsH:"重點句 ★", noStars:"這次沒有標重點。", copy:"複製重點", copied:"已複製重點句到剪貼簿。", copyFail:"無法複製，請改用下載。",
  download:"下載 .txt", downloaded:"已下載重點句。", again:"再讀一次", another:"換一篇", againDone:"已重新開始這一篇。",
  backToLast:"回到最後一張（Z）",
  settingsH:"顯示與朗讀設定", fontSize:"字級", fs1:"標準", fs2:"大", fs3:"特大",
  theme:"主題", thDark:"深色", thLight:"淺色", thHc:"高對比",
  motion:"減少動態（卡片不飛出、不旋轉）", autoRead:"換卡時自動朗讀", plainDefault:"範例預設顯示白話版", rate:"朗讀速度",
  close:"關閉", saved:"設定已儲存：{w}",
  helpH:"鍵盤與手勢說明",
  helpRows:[["→ 或 右滑","懂了，下一張"],["← 或 左滑","標成重點 ★（會出現在摘要）"],["↑ 或 上滑","稍後再看（主牌組讀完後再看一輪）"],["↓ 或 下滑","略過"],["Z（或 Ctrl/⌘+Z）","復原上一步（可以多步）"],["R 或 空白鍵","朗讀這張／停止"],["P","切換原文／白話版（範例才有）"],["?","打開這個說明"],["Page Up / Page Down","長卡片內文上下捲動"],["Esc","關閉對話框、停止朗讀"]],
  helpFoot:"每個動作都有按鈕，也會用文字告訴你結果。進度自動存在這台裝置。",
  offline:"已可離線使用", offlineNow:"目前離線（仍可使用）",
  undoWhat:{ok:"懂了",star:"重點",later:"稍後再看",skip:"略過",laterRound:"開始稍後再看",skipLater:"略過稍後再看",restart:"再讀一次"},
  txtHeader:"Swippy 重點句 — {t}",
},
en:{
  htmlLang:"en", appTitle:"Swippy — finish long readings one sentence at a time",
  skip:"Skip to main content", home:"Home", help:"Keyboard help", settings:"Settings", langBtn:"中文", langBtnAria:"切換成中文",
  tagline:"Turn a wall of text into one-sentence cards you swipe through, one at a time.",
  privacy:"Your text stays in this browser (localStorage). No login, nothing is uploaded.",
  resumeH:"Continue", resumeBtn:"Continue “{t}”", resumeMeta:"{k} cards left · {x} for later",
  samplesH:"Try a sample", sampleMeta:"{n} cards · plain-language version",
  pasteH:"Paste your own text", pasteLabel:"Paste a handout, article or notes here", pastePh:"e.g. copy a section of a PDF handout…",
  chunk:"Split very long sentences", splitBtn:"Make cards", pasteEmpty:"Please paste some text first.", pasteNone:"No sentences found. Try another text.",
  pastePlainNote:"Plain-language versions exist only for the samples (pasted text is never sent to an AI).",
  pasted:"My pasted text", splitDone:"Made {n} cards.",
  clearData:"Delete my data", clearConfirm:"Delete all Swippy progress and settings on this device?", cleared:"All data deleted.",
  progMain:"Card {n} of {m} · {k} left", progLater:"Review later: card {n} of {m} · {k} left", laterCount:"For later: {x}",
  progAria:"Reading progress",
  stampOk:"Got it", stampStar:"★ Key", stampLater:"Later", stampSkip:"Skip",
  aOk:"Got it →", aStar:"← Key point ★", aLater:"↑ Later", aSkip:"↓ Skip", aUndo:"Undo Z", aRead:"🔊 Read R", aStop:"⏹ Stop R", aPlain:"Plain P", aOrig:"Original P",
  aOkFull:"Understood, next card (swipe right or →)", aStarFull:"Mark as key point (swipe left or ←)", aLaterFull:"Review later (swipe up or ↑)", aSkipFull:"Skip (swipe down or ↓)",
  fOk:"Understood", fStar:"Marked as key point ★", fLater:"Saved for later", fLaterAgain:"Moved to the end", fSkip:"Skipped", fUndo:"Undone: {w}", fNoUndo:"Nothing to undo",
  fReading:"Reading aloud…", fReadStop:"Stopped reading", fNoTTS:"Read-aloud is not supported in this browser.",
  fPlain:"Showing plain-language version", fOrig:"Showing original", fNoPlain:"Plain-language versions exist only for the samples.",
  cardPos:"Card {n} of {m}: ", secLabel:"Section", contLabel:"continued", plainBadge:"Plain language", origBadge:"Original",
  stageAria:"Card. Arrow keys: → got it, ← key point, ↑ later, ↓ skip; Z undo, R read aloud, P plain language, ? help",
  keysHint:"→ Got it   ← Key ★   ↑ Later   ↓ Skip   Z Undo   R/Space Read   P Plain   ? Help",
  actionsAria:"Card actions",
  laterH:"Main deck finished!", laterP:"{x} cards are saved for later. Review them now?", laterGo:"Review later cards", laterSkip:"Skip, show summary",
  doneH:"Finished!", statRead:"Read", statOk:"Got it", statStar:"Key points", statLater:"For later", statSkip:"Skipped", statTime:"Time",
  mins:"{m} min {s} s", starsH:"Key points ★", noStars:"No key points this time.", copy:"Copy key points", copied:"Key points copied to clipboard.", copyFail:"Could not copy. Please download instead.",
  download:"Download .txt", downloaded:"Key points downloaded.", again:"Read again", another:"Pick another text", againDone:"Started this text again.",
  backToLast:"Back to last card (Z)",
  settingsH:"Display & read-aloud", fontSize:"Text size", fs1:"Normal", fs2:"Large", fs3:"Extra large",
  theme:"Theme", thDark:"Dark", thLight:"Light", thHc:"High contrast",
  motion:"Reduce motion (no flying or rotating cards)", autoRead:"Read each new card aloud", plainDefault:"Show plain language by default (samples)", rate:"Speech rate",
  close:"Close", saved:"Setting saved: {w}",
  helpH:"Keyboard & gestures",
  helpRows:[["→ or swipe right","Got it, next card"],["← or swipe left","Mark as key point ★ (shown in summary)"],["↑ or swipe up","Review later (one more round after the main deck)"],["↓ or swipe down","Skip"],["Z (or Ctrl/⌘+Z)","Undo (multiple steps)"],["R or Space","Read this card aloud / stop"],["P","Toggle original / plain language (samples only)"],["?","Open this help"],["Page Up / Page Down","Scroll inside a long card"],["Esc","Close dialogs, stop reading"]],
  helpFoot:"Every action has a button and a text confirmation. Progress is saved on this device.",
  offline:"Ready to work offline", offlineNow:"Offline (still works)",
  undoWhat:{ok:"Got it",star:"Key point",later:"Later",skip:"Skip",laterRound:"Start review",skipLater:"Skip review",restart:"Read again"},
  txtHeader:"Swippy key points — {t}",
}};
let lang="zh";
export function setLang(l){ lang=D[l]?l:"zh" }
export function getLang(){ return lang }
export function t(k,vars){
  let v=D[lang][k]; if(v===undefined) v=D.zh[k]; if(v===undefined) return k;
  if(typeof v==="string" && vars) v=v.replace(/\{(\w+)\}/g,(_m,x)=>vars[x]??"");
  return v;
}
export function applyI18n(root=document){
  root.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.dataset.i18n) });
  root.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.placeholder=t(el.dataset.i18nPh) });
  root.querySelectorAll("[data-i18n-aria]").forEach(el=>{ el.setAttribute("aria-label",t(el.dataset.i18nAria)) });
  root.querySelectorAll("[data-i18n-title]").forEach(el=>{ el.title=t(el.dataset.i18nTitle) });
  const langBtn=root.querySelector("#langBtn");
  // 按鈕上的字是「另一種語言」：英文介面顯示「中文」，中文介面顯示 English。
  if(langBtn) langBtn.lang=lang==="zh"?"en":"zh-Hant";
}
