# 喵喵與汪汪的 Loop Woof Woof 🐱🐕⚡

互動式視覺音樂玩具。選擇角色後，點擊畫面播放音效，彩虹同心圓同步閃爍，產生由內到外的聲波動畫。

## 功能

- 首頁動態格子選擇角色（黑底、2欄、可滾動，新增角色自動擴展）
- 點擊彩虹圓圈觸發音效 + 光波動畫
- 音效與動畫透過 JSON 時間軸精確同步
- 支援桌面與手機（iOS Chrome / Safari）
- 爬蟲監控：自動偵測掃描行為並記錄，可透過監控頁查看戰情

## 目前角色

| 角色 | 音效 | 狀態 |
|------|------|------|
| 🐱 貓 | loop_meow_meow_loop | 正常 |
| 🐕 狗 | loop_woof_woof_loop | 正常 |
| ⚡ 皮卡丘 | pikachu_loop | 正常 |
| ❓ 問號 | — | 鎖定中 |

## 專案結構

```
woof-woof-project/
├── public/
│   ├── index.html              # 首頁（動態角色格子）
│   ├── animals.json            # 角色資料來源
│   ├── pages/
│   │   ├── game.html           # 遊戲頁（彩虹圓圈動畫）
│   │   ├── app.js              # 核心動畫 + 音效邏輯
│   │   ├── admin.html          # 後台管理頁（不含於 repo）
│   │   └── monitor.html        # 爬蟲監控頁
│   └── assets/
│       ├── images/             # 角色圖片（PNG/JPG）
│       ├── sounds/             # 音效檔（*.mp3，不含於 repo）
│       └── frequencies/        # 音效時間軸 JSON
├── middleware/
│   ├── secureTools.js          # OWASP 防護（id 驗證、safeExecFile）
│   └── crawlerTracker.js       # 爬蟲偵測 middleware + 日誌寫入
├── scripts/
│   └── generate_json.py        # 自動從 MP3 生成 frequencies JSON
├── logs/
│   └── crawler/
│       ├── events.log          # 爬蟲事件紀錄（不含於 repo）
│       └── suspects.json       # 可疑 IP 彙整（不含於 repo）
├── server.js                   # Express 伺服器 + API
├── nginx.conf                  # Nginx 反向代理（/api/ 僅本機可存取）
├── Dockerfile                  # node:20-alpine，非 root 執行
└── docker-compose.yml          # Docker 服務編排（web + nginx）
```

## 執行方式

```bash
docker-compose up --build   # 首次或更新依賴時
docker-compose up           # 一般啟動

# 瀏覽器開啟 http://localhost:3000
```

## 新增角色（透過管理頁）

1. 開啟 `http://localhost:3000/pages/admin.html`
2. 填寫角色 ID、Emoji、顏色，上傳圖片與 MP3
3. 點擊「新增」— 伺服器自動更新 `animals.json` 並執行 MP3 分析

## 手動新增音效

```bash
# 1. 將 *.mp3 放入 public/assets/sounds/
# 2. 執行分析腳本
python3 scripts/generate_json.py public/assets/sounds/yourfile.mp3
# 3. 更新 public/animals.json 中對應角色的 sound 欄位
```

## 爬蟲監控

進入管理頁後點擊「🛡️ 監控歷程」，可查看：
- 各來源（Shodan、Censys、ZoomEye 等）的偵測統計
- 過去 24 小時攻擊頻率曲線圖
- 來源分佈圓餅圖
- 可篩選、分頁的事件列表

紀錄存於 `logs/crawler/`，container 重啟後不遺失（volume 掛載）。

## 安全設計

- **Shell Injection 防護**：上傳 id 格式驗證（`/^[a-z0-9_-]+$/`）+ `execFile`（不走 shell）
- **Path Traversal 防護**：同上 id 驗證，防止目錄穿越
- **API 存取限制**：nginx 限制 `/api/` 僅允許 localhost 與 Docker 內部網路（172.16.0.0/12）
- **非 root 容器**：Dockerfile 以 `woof` 使用者執行，降低容器逃脫風險
- **防護邏輯集中**：OWASP 相關邏輯統一封裝於 `middleware/secureTools.js`

## 技術細節

- **前端**：原生 HTML5 Canvas + `<audio>` 元素（iOS 相容）
- **後端**：Node.js 20 + Express，multer 處理檔案上傳
- **容器**：Docker + Nginx 反向代理（對外 port 3000）
- **音效分析**：Python + librosa（RMS 能量偵測，sweep / outer 分類）
