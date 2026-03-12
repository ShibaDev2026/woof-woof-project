# CLAUDE_WOOF.md

## 專案用途

**「喵喵與汪汪的Loop Woof Woof」** — 一個互動式視覺音樂玩具。

畫面顯示一個黑色背景上的彩虹同心圓，**點擊畫面**會：
1. 播放 `loop_woof_woof_loop.mp3`（汪汪叫聲循環音效）
2. 彩色圓環依序閃爍（亮度提升再恢復），產生向外擴散的光波動畫
3. 音效結束或動畫完成後，顏色重置為初始狀態

## 視覺設計

- 500×500 Canvas，置中於黑色全螢幕背景
- 8 層彩虹色同心圓（紅 → 橙 → 黃 → 綠 → 藍 → 深藍 → 紫 → 粉紅）
- 每層之間有黑色間隔，中心有黑色實心圓
- 點擊時每層依序亮起，循環 2 次（`loop = 2`）

## 專案結構

```
woof/
├── main.js                          # Electron 主程序
├── server.js                        # Express 靜態伺服器（port 3000）
├── public/
│   ├── index.html                   # 前端主頁（Canvas 容器）
│   ├── test.js                      # 核心互動邏輯（繪圖 + 動畫 + 音效）
│   └── loop_woof_woof_loop.mp3      # 汪汪叫聲音效
├── woof_track_source/
│   └── loop_woof_woof_loop.band     # GarageBand 音樂原始檔
├── Dockerfile                       # Node 14 容器（執行 server.js）
├── docker-compose.yml               # 對外 port 3000，掛載本地目錄
├── woof-darwin-arm64                # macOS ARM64 Electron 打包執行檔
└── package.json                     # electron 29 + express 4
```

## 兩種執行方式

| 方式 | 指令 | 說明 |
|------|------|------|
| Electron 桌面 | `npm start` | 開啟原生視窗，直接載入 `index.html` |
| Docker 網頁 | `docker-compose up` | 瀏覽器開啟 `http://localhost:3000` |

## 核心邏輯（test.js）

- `drawLayers()` — 從外到內依序繪製彩色層與黑色間隔
- `adjustBrightness(color, delta)` — 調整 HEX 色碼亮度
- `canvas click` 事件 — 觸發音效播放 + setTimeout 動畫序列
- `audio.onended` — 音效結束後重置顏色

## 注意事項

- Electron 的 `nodeIntegration: true` 已開啟，如擴充功能需留意 XSS 風險
- `resizeCanvas()` 函式目前為空殼，Canvas 尺寸固定為 500×500
- Docker 部署使用 Node 14（較舊版本）
