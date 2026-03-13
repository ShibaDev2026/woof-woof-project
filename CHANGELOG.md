# Changelog

本專案的所有重要版本異動均記錄於此。
格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版號遵循 [Semantic Versioning（語意化版本）](https://semver.org/)。

---

## [v0.5.0] — 2026-03-13

### Refactor（重構）
- 將 `public/` 下的 HTML、JS 移至 `public/pages/`
- 將圖片、音效、頻率 JSON 移至 `public/assets/`
- 更新 `app.js` 中所有絕對路徑參考與 HTML 內的相對連結

### Added（新增）
- `middleware/secureTools.js`：ID 驗證 + `safeExecFile`，防範 Shell Injection / Path Traversal
- `middleware/crawlerTracker.js`：基於 OCP（開放封閉原則）的爬蟲偵測，支援擴充 `CRAWLER_RULES`
- `public/pages/monitor.html`：爬蟲事件儀表板，含圖表、篩選與分頁
- Docker：將 base image 從 `node:14` 升級至 `node:20-alpine`，改以非 root 使用者 `woof` 執行
- nginx：限制 `/api/` 僅允許 localhost 與 Docker bridge 網段（`172.16.0.0/12`）存取
- docker-compose：掛載 `logs/` volume 以持久化爬蟲紀錄
- `scripts/` 目錄：將 `generate_json.py` 移入統一管理

### Changed（修改）
- 更新 README 與 .gitignore 以反映新目錄結構

---

## [v0.4.0] — 2026-03-13

### Added（新增）
- 新增貓咪叫聲音效 `loop_meow_meow_loop`：共 5 段 sweep，前兩段節奏對齊狗叫
- 新增 `public/frequencies/loop_meow_meow_loop.json` 頻率設定檔

### Changed（修改）
- `animals.json`：更新貓咪 `sound` 欄位為 `loop_meow_meow_loop`
- 調整貓掌 SVG 回歸簡潔設計（3 圓 + 橢圓）
- 精修 README：更新動物名單與管理員操作流程
- 精修 CLAUDE_WOOF.md：補齊完整專案技術文件

---

## [v0.3.0] — 2026-03-12

---

## [v0.2.0] — 2026-03-12

### Added（新增）
- 首頁動態載入 `animals.json`，自動建立可捲動的 2 欄動物格列表
- `POST /api/register`：接受圖片 + MP3 上傳，自動執行 `generate_json.py` 更新動物清單
- 以 HTML `<audio>` 元素取代 Web Audio API，修復 iOS Chrome / Safari 音效無法播放問題
- 貓掌 SVG 與狗掌 SVG 外型差異化
- `animals.json` 作為單一資料來源（貓、狗、皮卡丘、鎖定問號格）
- `admin.html` 加入 `.gitignore`，不納入版本控制

### Changed（修改）
- 首頁整體改為黑色背景，使用 flexbox `margin: auto` 實現內容自動置中

---

## [v0.1.0] — 2026-03-12

### Added（新增）
- 互動式視覺音樂玩具初版：點擊彩虹圓圈觸發音效與光波動畫
- 以 Web Audio API 合成音效，頻率設定外部化至 `public/frequencies/loop_woof_woof_loop.json`
- `public/game.html`：遊戲主介面
- `server.js`：Node.js + Express 靜態伺服器
- `main.js`：Electron 桌面版支援
- `Dockerfile` + `docker-compose.yml` + `nginx.conf`：容器化部署設定
- `generate_json.py`：Python 音效分析腳本（自動產生頻率 JSON）
- `scripts/analyze_audio.py`：音訊波形分析工具
- `CLAUDE_WOOF.md`：專案開發說明文件
