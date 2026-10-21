# 為你好 — 2D 探索型關卡原型（Godot 4）

《為你好》（WAKE-015）改編成「有地圖」的 2D 探索遊戲的可玩原型。
三關的房間、走道、樓梯位置，直接沿用課堂發表簡報裡的三張關卡地圖。

畫面是灰盒（graybox）：用色塊畫房間和角色，重點是驗證地圖、視線、躲藏和節奏，不是美術。

## 怎麼開

1. 安裝 [Godot 4.3](https://godotengine.org/download) 以上（標準版即可，不需要 .NET 版）。
2. 打開 Godot → Import → 選這個資料夾裡的 `project.godot`。
3. 按 F5（或右上角的 ▶）開始。

## 操作

| 按鍵 | 動作 |
|---|---|
| ← → 或 A D | 走路 |
| ↑ ↓ 或 W S | 站在樓梯旁上下樓；站在家具旁按 ↓ 躲起來，按任何方向鍵出來 |
| E 或空白鍵 | 互動：假裝讀書、好好談、上桌 |
| Enter | 翻下一張說明卡 |
| R | 重來這一關 |
| 1 / 2 / 3 | 直接跳到第 1／2／3 關（發表時示範用） |

## 三關

| 關卡 | 要做的事 | 新機制 | 優勢點 |
|---|---|---|---|
| LV.1 7 歲・才藝班 | 從玄關走回二樓房間拿蠟筆盒 | 走、爬樓梯、躲；廚房門縫的視線一閃一閃 | ④ 樓梯轉角 |
| LV.2 15 歲・會考 | 在書桌假裝讀書 → 溜去巷口畫室拿畫 → 巡房倒數結束前回書桌 | 陽奉陰違（假裝讀書）、媽媽巡房、監視器、阿姨的窗戶 | ① 房門口 |
| LV.3 30 歲・除夕 | 拿到閣樓的素描本、跟親戚好好談過兩次，再到餐桌說真心話 | 親戚追問（扣電量）、好好談、單向捷徑 | ⑤ 二樓走廊 |

- **控制**：被抓包一次 +10～12，會跨關保留。控制越高，媽媽的視線越長（原作「控制越高、門縫開得越大」）。
- **優勢點**：站上去鏡頭會拉遠，整個家一覽無遺；沒去過的房間平常是「？」。
- **結局**：拿著素描本、好好談過兩次 → 說出真心話；沒拿素描本就上桌（要按兩次 E 確認）→「我很好」結局。兩段結局文字取自原作。

## 檔案

```
project.godot            專案設定（1280×720，相容性渲染器，之後可以匯出網頁版）
scenes/main.tscn         主場景
scripts/main.gd          流程（標題、說明卡、結算、結局）和畫面上方的數值列
scripts/level.gd         一關的地圖、玩家、視線、互動和繪圖
scripts/level_data.gd    三關的資料：房間座標、樓梯、躲藏點、物件、視線時間、台詞
tests/smoke_test.gd      檢查每關的樓梯、物件都接在地板上，起點走得到目標
tests/playthrough_test.gd 自動玩家：用模擬按鍵把三關打到真心話結局
tools/subset_font.py     重新裁切中文字型（改了台詞之後用）
assets/fonts/            Noto Sans TC 子集字型（SIL Open Font License，見 OFL.txt）
```

要調整難度，改 `scripts/level_data.gd` 就好，例如視線亮／暗的秒數（`on`／`off`）、巡房倒數（`timer`）、媽媽巡邏的速度（`speed`）。

## 網頁版

`export_presets.cfg` 已經設好 Web 匯出（不開多執行緒，所以一般靜態網站、itch.io 都能直接放，不需要特殊的伺服器標頭）。

1. Godot 選單 Editor → Manage Export Templates → Download（第一次要裝匯出範本）。
2. Project → Export → 選「Web」→ Export Project，輸出到 `export/web/`。
   或用指令：`godot --headless --path . --export-release "Web" export/web/index.html`
3. 本機試玩要開一個簡單的伺服器（直接雙擊 index.html 不行）：
   `python3 -m http.server -d export/web 8000`，再打開 http://localhost:8000

放上 itch.io：把 `export/web/` 裡的檔案壓成 zip 上傳，類型選 HTML，勾「This file will be played in the browser」。

要放到 wake.com.tw：網站的 Content-Security-Policy 目前不允許行內 script 和 WebAssembly，要先在 `vercel.json` 幫遊戲路徑放寬（加上 `'unsafe-inline'` 和 `'wasm-unsafe-eval'`）。另外 `index.wasm` 約 35 MB，進 git 前要考慮 repo 大小。

`export/` 已列在 `.gitignore`，匯出的檔案不會被提交。

## 測試

```bash
godot --headless --path . --import            # 第一次先匯入資源
godot --headless --path . --script res://tests/smoke_test.gd
godot --headless --path . --script res://tests/playthrough_test.gd
```

兩個都會印出 `PASSED`。自動玩家第 2 關走的是上路（翻陽台）；下路（穿過客廳躲媽媽）只有手動試過畫面，沒有自動測試。

## 改了台詞之後

字型只包含遊戲裡用到的字（約 560 字），新增的中文字會顯示成方塊。重新裁切：

```bash
pip install fonttools
# 從 Google Fonts 下載完整的 Noto Sans TC 可變字型（NotoSansTC[wght].ttf）
python3 tools/subset_font.py 路徑/NotoSansTC[wght].ttf
```

## 還沒做的

- 音效與音樂（原作的八音盒版《給愛麗絲》、跟著控制變大聲的節拍器）
- 原作的另外五關（10、13、17、18、25 歲）
- 美術：目前角色和家具都是色塊
