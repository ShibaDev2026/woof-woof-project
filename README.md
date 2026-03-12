# 喵喵與汪汪的 Loop Woof Woof 🐱🐕⚡

互動式視覺音樂玩具。選擇角色後，點擊畫面播放音效，彩虹同心圓同步閃爍，產生由內到外的聲波動畫。

## 功能

- 首頁動態格子選擇角色（黑底、2欄、可滾動，新增角色自動擴展）
- 點擊彩虹圓圈觸發音效 + 光波動畫
- 音效與動畫透過 JSON 時間軸精確同步
- 支援桌面與手機（iOS Chrome / Safari）
- 隱藏管理彩蛋：點擊左上角特定次數可進入後台

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
│   ├── index.html          # 首頁（動態角色格子）
│   ├── game.html           # 遊戲頁（彩虹圓圈動畫）
│   ├── app.js              # 核心動畫 + 音效邏輯
│   ├── animals.json        # 角色資料來源
│   ├── images/             # 角色圖片（PNG/JPG）
│   ├── sounds/             # 音效檔（*.mp3，不含於 repo）
│   └── frequencies/        # 音效時間軸 JSON
├── generate_json.py        # 自動從 MP3 生成 frequencies JSON
├── server.js               # Express 靜態伺服器 + /api/register
├── nginx.conf              # Nginx 反向代理設定
└── docker-compose.yml      # Docker 服務編排（web + nginx）
```

## 執行方式

```bash
docker-compose up --build   # 首次或更新依賴時
docker-compose up           # 一般啟動

# 瀏覽器開啟 http://localhost:3000
```

## 新增角色（透過管理頁）

1. 開啟 `http://localhost:3000/admin.html`
2. 填寫角色 ID、顏色、上傳圖片與 MP3
3. 點擊「新增」— 伺服器自動更新 `animals.json` 並執行 MP3 分析

## 手動新增音效

```bash
# 1. 將 *.mp3 放入 public/sounds/
# 2. 執行分析腳本
python3 generate_json.py public/sounds/yourfile.mp3
# 3. 更新 public/animals.json 中對應角色的 sound 欄位
```

## 技術細節

- **前端**：原生 HTML5 Canvas + `<audio>` 元素（iOS 相容）
- **後端**：Node.js + Express，multer 處理檔案上傳
- **容器**：Docker + Nginx 反向代理（對外 port 3000）
- **音效分析**：Python + librosa（RMS 能量偵測，sweep / outer 分類）
