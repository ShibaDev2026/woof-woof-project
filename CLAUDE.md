# CLAUDE_WOOF.md

## 專案用途

**「喵喵與汪汪的Loop Woof Woof」** — 一個互動式視覺音樂玩具。

首頁展示多個動物按鈕（2欄滾動格子），點擊進入各自的遊戲畫面，觸發對應音效與同心圓彩虹動畫。

---

## 專案結構

```
woof-woof-project/
├── server.js                        # Express 靜態伺服器 + 動物註冊 API（port 3000）
├── Jenkinsfile                      # Jenkins CI Pipeline（jenkins-pipeline@v1.2.1）
├── generate_json.py                 # Python librosa 分析 MP3，自動生成 frequencies JSON
├── package.json                     # Node 20，dependencies: express / multer
├── docker-compose.yml               # web（Node）+ nginx（port 3000 對外）
├── nginx.conf
├── .gitignore                       # 排除 sounds/*.mp3、admin.html、woof_track_source
├── public/
│   ├── index.html                   # 首頁：動態 2 欄格子，黑底置中，隱藏彩蛋
│   ├── pages/
│   │   ├── game.html                # 遊戲畫面：Canvas 同心圓動畫
│   │   ├── app.js                   # 遊戲邏輯（動畫 + 音效）
│   │   ├── monitor.html             # 爬蟲事件儀表板
│   │   └── admin.html               # 新增動物管理頁（不上傳 git）
│   ├── assets/
│   │   ├── images/                  # 動物圖片（PNG/JPG）
│   │   ├── sounds/                  # 動物音效 MP3（不上傳 git）
│   │   └── frequencies/             # 音頻分析 JSON（sweep/outer phrase 排程）
│   └── animals.json                 # 動物資料來源（id, emoji, image, sound, 顏色等）
├── middleware/
│   ├── secureTools.js               # ID 驗證 + safeExecFile（防 Shell Injection / Path Traversal）
│   └── crawlerTracker.js            # 爬蟲偵測 middleware
└── woof_track_source/               # GarageBand 原始音樂檔（不上傳 git）
```

---

## 執行方式

```bash
docker-compose up --build   # 重建並啟動
docker-compose up           # 一般啟動
# 瀏覽器開啟 http://localhost:3000
```

---

## 首頁（public/index.html）

- 黑色背景，`.frame` 最大寬 500px，`margin: auto` 水平垂直置中
- `fetch('animals.json')` 動態建立格子，新增動物自動往下增加
- 每個格子有：漸層背景、光暈、跳動動畫、漣漪、符號彈出動畫
- **隱藏彩蛋**：左上角固定 44×44px 透明區域，隨機抽 1–9 次點擊才跳轉 admin
  - 目標 URL 以 XOR 混淆（key `[7,3,9,2,5]`，encoded `[102,103,100,107,107,41,107,125,111,105]`）

---

## animals.json 欄位說明

| 欄位 | 說明 |
|------|------|
| `id` | 唯一識別（英文） |
| `emoji` | 無圖片時顯示的 emoji |
| `image` | 圖片路徑（`/images/xxx.png`）或 null |
| `symbolSvg` | 彈出動畫用 SVG 名稱（目前支援 `catpaw`） |
| `symbolEmoji` | 彈出動畫用 emoji（無 symbolSvg 時） |
| `bgFrom/bgTo` | 格子漸層顏色 |
| `border` | 格子邊框色 |
| `glow1/glow2` | 光暈與符號陰影顏色 |
| `sound` | 音效檔名（對應 `sounds/<sound>.mp3`） |
| `locked` | `true` 時顯示為鎖定狀態 |

---

## 動畫排程（app.js + frequencies/*.json）

- `fetch('animals.json')` 取得 `sound` 欄位 → 載入對應 MP3 與 frequencies JSON
- `buildSchedule(phrases)` 將 phrase 轉成帶 `time/layerIdx/flashDuration/brightness` 的事件陣列
- **sweep**：同一時間段內由內到外閃爍 2 次（聲波感）
- **outer**：在 phrase 中間點快速閃爍最外圈 2 次
- 使用 `<audio>` 元素播放（iOS Chrome/Safari 相容）

---

## 後端 API（server.js）

### POST /api/register
新增或更新動物，接受 `multipart/form-data`：
- 欄位：`id, emoji, symbolEmoji, bgFrom, bgTo, border, glow1, image（檔案）, mp3（檔案）`
- 儲存圖片至 `public/images/`、音效至 `public/sounds/`
- 更新 `public/animals.json`
- 若有 MP3，自動執行 `python3 generate_json.py "<mp3路徑>"`

---

## generate_json.py

```bash
python3 generate_json.py public/sounds/example.mp3
# 輸出：public/frequencies/example.json
# 若 JSON 已存在則跳過
```

- 使用 librosa RMS 能量偵測音段
- 持續 ≥ 0.25s → `sweep`，< 0.25s → `outer`
- **注意**：自動分類後需人工確認節奏是否符合音樂感
  - 短音群組（多個 outer）可手動合併為一個 sweep，讓動畫節奏更自然
  - 範例：貓叫前段 6 個 outer 各自合併成 2 個 sweep，對應「登愣登愣」節奏

---

## 貓掌 SVG（symbolSvg: "catpaw"）

目前為白色簡版：3 個小圓（趾球）+ 1 個大橢圓（掌球）：
```
circle cx=22 cy=28 r=13
circle cx=50 cy=18 r=13
circle cx=78 cy=28 r=13
ellipse cx=50 cy=72 rx=26 ry=22
```
動畫符號尺寸：`min(22vw, 22dvh)`

---

## 目前動物清單

| id | 說明 | 狀態 |
|----|------|------|
| cat | 貓（符號：catpaw SVG，sound: loop_meow_meow_loop） | 正常 |
| dog | 狗（符號：🐾，sound: loop_woof_woof_loop） | 正常 |
| pikachu | 皮卡丘（符號：⚡，sound: pikachu_loop） | 正常 |
| question | 問號 | 鎖定 |

---

## CI/CD（Jenkins）

- **Jenkinsfile**：`@Library('jenkins-pipeline@v1.2.1')` → 自動偵測 Node.js，執行 build / test / archive
- **產出物**：`woof-woof-project-main-{version}-RC-{buildNumber}.zip`，存入 `/Users/surpend/Developer/jenkins_build/woof-woof-project/release/`
- **觸發方式**：手動 Build Now（無 Poll SCM / Webhook）
- **Node 版本**：`package.json engines.node: "20"`，CI 透過 nvm 自動切換

---

## 版本歷程

| 版本 | 說明 |
|------|------|
| v0.6.0 | Jenkins CI pipeline + Electron 移除 |
| v0.5.0 | 目錄重構（pages/assets）+ 安全強化 + 爬蟲監控 |
| v0.4.0 | 貓咪音效新增 |
| v0.3.0 | — |
| v0.2.0 | 動態動物格列表、上傳機制、iOS 音效修復 |
| v0.1.0 | 初版互動式視覺音樂玩具 |

---

## 注意事項

- `public/pages/admin.html` 已加入 `.gitignore`，不會上傳 git
- `public/assets/sounds/*.mp3` 已加入 `.gitignore`，不會上傳 git
- `woof_track_source/` 已加入 `.gitignore`，不會上傳 git
- Docker 使用 nginx 反向代理，對外 port 3000
- iOS 音效需在使用者手勢（touchstart）內直接呼叫 `audio.play()`，不能放在 Promise 內
