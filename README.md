# Swippy — finish long readings one sentence at a time

**Swippy** turns a wall-of-text handout into one-sentence cards that you swipe through one at a time, so students with ADHD can actually reach the end of a long reading.

Built for **AccessED Hacks** (education accessibility). It is a static web app (PWA): no login, no account, no server, no API keys, no tracking. Everything stays in your browser's `localStorage` and it works offline after the first visit.

> Learner we designed for: university students with ADHD who give up on long readings. It may also help readers with dyslexia or anyone who finds dense text overwhelming, but it was not designed or tested specifically for them.

## Changelog

- 2026-11-15: Sample buttons are in the first HTML paint (no jump when the script runs). The status line hides after about 3 seconds; the live-region text stays for screen readers. Action buttons stay on screen at 200% zoom and on small phones. The language button’s `lang` matches the words on it (`English` / `中文`). A heading is context on the next card, not its own card. The two fictional handouts are longer. Service worker cache is `swippy-v2`.

## How to use

1. Open the app and either **pick a sample** (3 included) or **paste your own text** and press **Make cards**.
2. One sentence appears at a time. For each card, choose one of four actions (swipe, keyboard, or button):

| Action | Swipe | Key | Button | Text feedback |
|---|---|---|---|---|
| Understood, next card | right | `→` | Got it → | "Understood" |
| Mark as key point (shown in summary) | left | `←` | ← Key point ★ | "Marked as key point ★" |
| Review later (one more round after the main deck) | up | `↑` | ↑ Later | "Saved for later" |
| Skip | down | `↓` | ↓ Skip | "Skipped" |

3. When the main deck is done, Swippy offers a **Review later** round (you can skip it).
4. The **summary** shows how many cards you read, understood, starred, saved for later and skipped, plus the time spent. It lists your ★ key sentences, which you can **copy** or **download as .txt**. Then choose **Read again** or **Pick another text**.

Progress is saved automatically. Reopen the page and press **Continue** to pick up where you left off.

## Keyboard shortcuts

| Key | What it does |
|---|---|
| `→` `←` `↑` `↓` | Got it / Key point ★ / Later / Skip |
| `Z` (or `Ctrl`/`⌘`+`Z`) | Undo (multiple steps, including "start review" and "read again") |
| `R` or `Space` | Read the card aloud / stop (Web Speech API) |
| `P` | Toggle original ↔ plain-language version (samples only) |
| `?` | Keyboard help dialog |
| `Page Up` / `Page Down` | Scroll inside a long card |
| `Esc` | Close a dialog, stop reading |
| `Tab` / `Shift+Tab` | Move between controls (visible focus ring) |

The whole flow (start, pick a sample, read, summary, copy) works with the keyboard only.

## Accessibility features

- Keyboard, button and swipe alternatives for every action. Every action has a **text confirmation** in a live region, not just colour or animation. Stamps on the card show text labels and symbols (★, →).
- The card is an `aria-live="polite"` region that reads "Card N of M: sentence…". `<html lang>` follows the UI language, and each card gets its own `lang` (`zh-Hant` / `en`).
- Settings (saved locally): 3 text sizes (19 / 24 / 30 px), dark / light / **high-contrast** theme, **reduce motion** (also follows `prefers-reduced-motion`; cards change instantly with no flying or rotation), read each card aloud automatically, and speech rate.
- Zoom is allowed (no `user-scalable=no`), and card text is selectable.
- Native `<dialog>` with focus trapping and `Esc` to close. There is a skip link, and all controls are at least 40–44 px tall.
- Low bandwidth: no external fonts, scripts or CDNs. The whole site is under 120 KB, and a service worker caches it for offline use.
- Privacy: nothing leaves the browser. **Delete my data** on the start screen wipes everything.
- UI in Traditional Chinese (default) and English (button in the header, or open `?lang=en`).

## Samples

1. *Intro to Psychology — Week 3: Working Memory* (English, **fictional**, written for this demo)
2. 《經濟學原理 第 4 週：供給與需求》 (Chinese, **fictional**, written for this demo)
3. Abraham Lincoln, *Gettysburg Address* (1863, Bliss copy, **U.S. public domain**)

Each sample sentence has a **pre-written plain-language version** (`P`), stored in `js/samples.js`. Nothing is generated at runtime. Pasted text has **no** plain-language version, because the app never calls an AI or any API. The UI says so.

## Run locally

It must be served over HTTP, because ES modules and service workers do not work from `file://`:

```bash
cd worldview-web
python -m http.server 8765
# open http://localhost:8765/
```

GitHub Pages: serve the repository root as-is. All paths are relative, so it also works under `/<repo>/`.

### Tests

```bash
node --test tests/split.test.mjs        # sentence-splitter unit tests (zh + en)
cd tests && npm install && npm run e2e  # Playwright + axe-core end-to-end check (needs Chrome/Edge and the server above)
```

The e2e script drives the app without any login: keyboard-only flow, all four actions, undo, plain-language, read-aloud, help dialog, swipe gesture, reload/resume, review-later round, summary copy/download, paste and split, settings, English, offline reload, reduced motion and mobile viewport. It runs axe (WCAG 2.2 AA + best practices) on each screen. Screenshots go to `tests/out/` (git-ignored).

## Sentence splitting rules (`js/split.js`, pure function, no API)

- Splits on `。！？；…` and on `. ! ?` followed by whitespace. Blank lines and line breaks are paragraph boundaries, and hard-wrapped lines are re-joined.
- Does not split on `e.g.` `i.e.` `Dr.` `Mr.` `Mrs.` `etc.` `vs.` `U.S.`, decimals (`3.14`), URLs, or closing quotes (`。」` `."` stay with their sentence).
- Merges very short fragments (Chinese < 6 characters, English < 4 words) into the previous sentence. Re-splits very long ones (Chinese > 120 characters, English > 40 words) at `，` `,` `;` `：` (option "Split very long sentences").
- Each list item (`-` `*` `1.`) becomes its own card. A `#` heading is shown as context on the next card, not as a card of its own. A heading with nothing after it is still a section card.

## Limitations

- Plain-language versions exist only for the 3 samples.
- Splitting is rule-based and can be wrong on unusual punctuation, tables, code or formulas.
- Read-aloud depends on the voices installed in your browser or OS. If speech is unsupported, the button is hidden.
- Progress lives only in this browser, with no sync across devices. Clearing site data deletes it, and only the most recent text is kept.
- Tested by the author with automated tools (axe, Lighthouse, Playwright). It has not yet been tested with screen-reader users or a larger group of students. It is a study aid, not a treatment for ADHD.

## Pre-existing work vs. built during the hackathon (Oct 17 – Nov 20, 2026)

**Pre-existing (before Oct 17, 2026)**
- The author's desktop page `世界觀.html` and the personal "待刪 → 筆記.md" workflow: saving sentences from readings into Markdown files, one sentence per line, then sorting them.

**Built during the hackathon period**
- The author's Android app 「世界觀」 (Capacitor + Firebase, started **Nov 13, 2026**). It has one-card four-direction swiping, a category tree, a long-press wheel, KaTeX and Markdown sync. It is **not** part of this repository and not part of the demo.
- **Swippy (this repository): rewritten from scratch as a static web app starting Nov 15, 2026.** The only ideas carried over from the Android app are the "one card + four-direction swipe" interaction and its fly-out animation and gesture thresholds, re-implemented here without any Firebase code. Everything else is new: the sentence splitter and its tests, the localStorage model, keyboard and button controls, the live regions, settings (text size, themes, reduced motion), read-aloud, plain-language samples, the review-later round, the summary with copy and download, the PWA and offline support, and i18n. The git history in this repository shows the dates.

This repository contains only the Swippy web app. There is no Android code, no Firebase configuration or keys, and none of the author's personal card data.

## AI-assistance disclosure

The code, the sample texts and the plain-language drafts were written with AI coding assistants under the author's direction, and the author reviewed them. The app itself does **not** call any AI or other service at runtime.

## Third-party

No third-party code ships in the app. The tests use `playwright-core` (Apache-2.0) and `@axe-core/playwright` / axe-core (MPL-2.0) as dev dependencies only. The Gettysburg Address is in the public domain.

---

## 中文說明（摘要）

**Swippy**：把讀不下去的長講義切成「一次一句」的卡片，像滑卡一樣一張一張滑完，幫 ADHD 學生把長文讀到最後。純靜態網頁，不用登入、不用 API key、不追蹤；資料只存在瀏覽器的 localStorage，第一次開過之後可以離線使用。

**更新（2026-11-15）**：範例按鈕改寫在 HTML 裡，第一屏不再被腳本撐開；狀態文字約 3 秒後收起，螢幕報讀用的文字還留著；放大到 200% 或小手機時，四個動作鈕留在畫面裡；語言鈕的 `lang` 跟著按鈕上的字（English／中文）；標題併進下一張，不再單獨佔一張卡；兩篇虛構講義加長；離線快取改為 `swippy-v2`。

**怎麼用**：選一篇範例，或貼上自己的文字後按「切成卡片」。每張卡做一個動作：

- 右滑或 `→`：懂了
- 左滑或 `←`：重點 ★
- 上滑或 `↑`：稍後再看
- 下滑或 `↓`：略過

主牌組讀完後會再看一輪「稍後再看」。最後的摘要可以複製或下載重點句（.txt）。

**快捷鍵**：

- `Z`（或 Ctrl/⌘+Z）：復原
- `R`／空白鍵：朗讀
- `P`：原文／白話切換（只有範例有白話版）
- `?`：鍵盤說明
- `Esc`：關閉對話框

**無障礙**：

- 每個動作都有按鈕、鍵盤和文字回饋，卡片內容在 aria-live 區域。
- 字級有 3 段，主題有深色、淺色、高對比三種，可以減少動態（也會跟隨系統設定）。
- 可以縮放畫面，卡片文字可以選取。
- 全站小於 120 KB，不載入任何外部資源。

**限制**：

- 白話版只有範例有。
- 切句可能出錯。
- 朗讀效果依瀏覽器而定。
- 資料只存在本機。
- 目前只做過自動化測試，還沒有真人實測。
- 這是學習輔助工具，不是治療。

**既有與新做**：

- 10/17 前就有：桌面版 `世界觀.html` 和「待刪 → 筆記.md」摘句流程。
- 比賽期間做的：Android app（11/13 起，不在這個 repo）；Swippy 網頁版，11/15 起從頭重寫。

**AI 協助揭露**：程式和範例文字是作者指揮 AI 程式助理寫的，作者看過；執行時不呼叫任何 AI。
