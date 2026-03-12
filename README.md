# 喵喵與汪汪的 Loop Woof Woof 🐱🐕⚡

互動式視覺音樂玩具。選擇角色後，點擊畫面播放音效，彩虹同心圓同步閃爍，產生由內到外的聲波動畫。

## 功能

- 首頁 2×2 格子選擇角色（貓、狗、皮卡丘、待解鎖）
- 點擊彩虹圓圈觸發音效 + 光波動畫
- 音效與動畫透過 JSON 時間軸精確同步
- 支援桌面與手機（iOS / Android）

## 專案結構

```
woof-woof-project/
├── public/
│   ├── index.html          # 首頁（角色選擇）
│   ├── game.html           # 遊戲頁（彩虹圓圈）
│   ├── app.js              # 核心動畫 + 音效邏輯
│   ├── sounds/             # 音效檔（*.mp3，不含於 repo）
│   └── frequencies/        # 音效時間軸 JSON
├── generate_json.py        # 自動從 MP3 生成 frequencies JSON
├── server.js               # Express 靜態伺服器（port 3000）
├── nginx.conf              # Nginx 反向代理設定
├── docker-compose.yml      # Docker 服務編排（web + nginx）
├── Dockerfile              # Node 14 容器
└── main.js                 # Electron 主程序
```

## 執行方式

### Docker（推薦）

```bash
docker-compose up
```

開啟 `http://localhost:3000`

### Electron 桌面

```bash
npm install
npm start
```

## 新增角色音效

1. 將 `*.mp3` 放入 `public/sounds/`
2. 執行分析腳本自動生成 JSON：
   ```bash
   python3 generate_json.py public/sounds/yourfile.mp3
   ```
3. 在 `public/app.js` 的 `charMap` 新增對應角色
4. 在 `public/index.html` 新增格子

## 技術細節

- **前端**：原生 HTML5 Canvas + Web Audio API（`<audio>` 元素）
- **後端**：Node.js + Express 靜態服務
- **容器**：Docker + Nginx 反向代理
- **音效分析**：Python + librosa（RMS 能量偵測音段）
